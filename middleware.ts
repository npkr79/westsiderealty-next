import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CrmRole } from "@/lib/crm/types";
import { getDashboardPathForRole, mapRoleNameToCrmRole } from "@/lib/crm/roles";
import { CRM_TEST_ADMIN_COOKIE, isCrmTestLoginEnabled } from "@/lib/crm/test-login";

const rolePathMap: Record<string, CrmRole> = {
  "/dashboard/admin": "admin",
  "/dashboard/sales": "sales_head",
  "/dashboard/team": "team_lead",
  "/dashboard/agent": "agent",
  "/dashboard/marketing": "marketing",
  "/dashboard/partner": "channel_partner",
  "/dashboard/analytics": "analyst",
};

const protectedPrefixes = ["/dashboard", "/leads", "/pipeline", "/routing", "/tasks", "/whatsapp", "/crm/whatsapp", "/crm/automation-monitor", "/crm/revenue-dashboard", "/journeys", "/settings"];

const isProtectedPath = (pathname: string): boolean =>
  protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const getRequiredRoleForPath = (pathname: string): CrmRole | null => {
  for (const [prefix, role] of Object.entries(rolePathMap)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return role;
    }
  }
  return null;
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;
  const isProtected = isProtectedPath(pathname);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasTestAdminCookie = isCrmTestLoginEnabled && request.cookies.get(CRM_TEST_ADMIN_COOKIE)?.value === "1";
  const activeRole: CrmRole | null = hasTestAdminCookie ? "admin" : null;

  if (!isProtected) {
    return response;
  }

  if (!user && !activeRole) {
    const loginUrl = new URL("/crm/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  let resolvedRole = activeRole;
  if (!resolvedRole && user) {
    const crmUser = await supabase
      .from("crm_users")
      .select("id, is_active, crm_roles(name)")
      .eq("id", user.id)
      .maybeSingle();

    if (crmUser.error || !crmUser.data) {
      const loginUrl = new URL("/crm/login", request.url);
      loginUrl.searchParams.set("error", "not_authorized");
      return NextResponse.redirect(loginUrl);
    }
    if (!crmUser.data.is_active) {
      const loginUrl = new URL("/crm/login", request.url);
      loginUrl.searchParams.set("error", "inactive_user");
      return NextResponse.redirect(loginUrl);
    }

    const roleName = Array.isArray(crmUser.data.crm_roles) ? crmUser.data.crm_roles[0]?.name : crmUser.data.crm_roles?.name;
    const role = mapRoleNameToCrmRole(roleName);
    if (!role) {
      const loginUrl = new URL("/crm/login", request.url);
      loginUrl.searchParams.set("error", "invalid_role");
      return NextResponse.redirect(loginUrl);
    }
    resolvedRole = role;
  }

  const requiredRole = getRequiredRoleForPath(pathname);
  if (requiredRole && resolvedRole && resolvedRole !== requiredRole) {
    return NextResponse.redirect(new URL(getDashboardPathForRole(resolvedRole), request.url));
  }

  return response;
}

export const config = {
  matcher: ["/crm/:path*", "/dashboard/:path*", "/leads/:path*", "/pipeline/:path*", "/routing/:path*", "/tasks/:path*", "/whatsapp/:path*", "/journeys/:path*", "/settings/:path*"],
};

