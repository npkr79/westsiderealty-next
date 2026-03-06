import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import type { CrmRole, CrmUser } from "@/lib/crm/types";
import { getDashboardPathForRole, mapRoleNameToCrmRole } from "@/lib/crm/roles";
import { CRM_TEST_ADMIN_COOKIE, isCrmTestLoginEnabled } from "@/lib/crm/test-login";

type CrmUserJoinRow = {
  id: string;
  full_name: string | null;
  is_active: boolean | null;
  crm_roles: { name: string } | Array<{ name: string }> | null;
};

const getRoleNameFromJoin = (row: CrmUserJoinRow): string | null => {
  if (!row.crm_roles) return null;
  if (Array.isArray(row.crm_roles)) return row.crm_roles[0]?.name ?? null;
  return row.crm_roles.name ?? null;
};

export type CrmSessionStatus = "ok" | "not_authenticated" | "not_provisioned" | "inactive" | "invalid_role";

export interface CrmSessionResult {
  status: CrmSessionStatus;
  user: CrmUser | null;
}

export async function getCrmSessionResult(): Promise<CrmSessionResult> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const testCookieEnabled = isCrmTestLoginEnabled && session?.access_token ? false : isCrmTestLoginEnabled;
  if (testCookieEnabled) {
    const {
      data: { user: cookieUser },
    } = await supabase.auth.getUser();
    if (!cookieUser) {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      if (cookieStore.get(CRM_TEST_ADMIN_COOKIE)?.value === "1") {
        return {
          status: "ok",
          user: {
            id: "dev-test-admin",
            email: "test-admin@local",
            full_name: "Test Admin",
            role: "admin",
            is_active: true,
            role_name: "admin",
          },
        };
      }
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "not_authenticated", user: null };

  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient
    .from("crm_users")
    .select("id, full_name, is_active, crm_roles(name)")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return { status: "not_provisioned", user: null };
  if (!data.is_active) return { status: "inactive", user: null };

  const row = data as CrmUserJoinRow;
  const roleName = getRoleNameFromJoin(row);
  const mappedRole = mapRoleNameToCrmRole(roleName);
  if (!mappedRole) return { status: "invalid_role", user: null };

  return {
    status: "ok",
    user: {
      id: String(row.id),
      email: String(user.email ?? ""),
      full_name: row.full_name ?? null,
      role: mappedRole,
      is_active: true,
      role_name: roleName,
    },
  };
}

export async function getCrmSessionUser(): Promise<CrmUser | null> {
  const result = await getCrmSessionResult();
  return result.user;
}

export async function requireCrmUser(allowedRoles?: CrmRole[]): Promise<CrmUser> {
  const session = await getCrmSessionResult();
  if (!session.user) {
    redirect("/crm/login");
  }
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
    redirect(getDashboardPathForRole(session.user.role));
  }
  return session.user;
}

