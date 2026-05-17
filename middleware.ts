import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CrmRole } from "@/lib/crm/types";
import { getDashboardPathForRole, mapRoleNameToCrmRole } from "@/lib/crm/roles";
import { CRM_TEST_ADMIN_COOKIE, isCrmTestLoginEnabled } from "@/lib/crm/test-login";

// Role is cached in a short-lived cookie to avoid a DB round-trip on every request
const ROLE_COOKIE = "crm_cached_role";
const ROLE_COOKIE_TTL = 5 * 60; // 5 minutes
const VALID_ROLES: CrmRole[] = ["admin", "sales_head", "team_lead", "agent", "marketing", "channel_partner", "analyst"];

const rolePathMap: Record<string, CrmRole> = {
  "/dashboard/admin": "admin",
  "/dashboard/sales": "sales_head",
  "/dashboard/team": "team_lead",
  "/dashboard/agent": "agent",
  "/dashboard/marketing": "marketing",
  "/dashboard/partner": "channel_partner",
  "/dashboard/analytics": "analyst",
};

const protectedPrefixes = ["/dashboard", "/leads", "/pipeline", "/routing", "/tasks", "/whatsapp", "/crm/whatsapp", "/crm/automation-monitor", "/crm/revenue-dashboard", "/journeys", "/settings", "/social"];

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

  // Use getSession() instead of getUser() in middleware — getUser() makes an external
  // HTTP call to Supabase on every request which can exceed Vercel Edge's ~1.5s timeout.
  // getSession() decodes the JWT from the cookie locally with no network round-trip.
  // Route handlers and server components should still call getUser() for full verification.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

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
    // Check cached role cookie to skip the DB query on repeat visits
    const cachedRole = request.cookies.get(ROLE_COOKIE)?.value as CrmRole | undefined;
    if (cachedRole && VALID_ROLES.includes(cachedRole)) {
      resolvedRole = cachedRole;
    } else {
      // Cache miss — fetch role from DB and store in cookie
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

      // Cache the resolved role for 5 minutes to skip this query on future requests
      response.cookies.set(ROLE_COOKIE, resolvedRole, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: ROLE_COOKIE_TTL,
        path: "/",
      });
    }
  }

  const requiredRole = getRequiredRoleForPath(pathname);
  if (requiredRole && resolvedRole && resolvedRole !== requiredRole) {
    return NextResponse.redirect(new URL(getDashboardPathForRole(resolvedRole), request.url));
  }

  // Additional route-level role restrictions
  const roleRestrictedRoutes: Record<string, CrmRole[]> = {
    '/settings': ['admin'],
    '/routing': ['admin', 'sales_head', 'team_lead'],
    '/journeys': ['admin', 'sales_head', 'team_lead'],
    '/crm/automation-monitor': ['admin', 'sales_head'],
    '/crm/revenue-dashboard': ['admin', 'sales_head'],
    '/dashboard/admin/link-health': ['admin'],
    '/dashboard/admin/seo': ['admin'],
    '/social': ['admin'],
  };

  for (const [route, allowedRoles] of Object.entries(roleRestrictedRoutes)) {
    if (pathname.startsWith(route) && resolvedRole && !allowedRoles.includes(resolvedRole)) {
      return NextResponse.redirect(new URL(getDashboardPathForRole(resolvedRole), request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/crm/:path*", "/dashboard/:path*", "/leads/:path*", "/pipeline/:path*", "/routing/:path*", "/tasks/:path*", "/whatsapp/:path*", "/journeys/:path*", "/settings/:path*", "/social/:path*", "/social"],
};

