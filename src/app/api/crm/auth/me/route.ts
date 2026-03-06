import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { createClient } from "@/lib/supabase/server";
import { mapRoleNameToCrmRole, getDashboardPathForRole } from "@/lib/crm/roles";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  const serviceClient = createServiceClient();
  const { data: crmUser } = await serviceClient
    .from("crm_users")
    .select("id, full_name, role_id, is_active, crm_roles(name)")
    .eq("id", user.id)
    .maybeSingle();
  if (!crmUser) {
    return NextResponse.json({ error: "not_provisioned" }, { status: 403 });
  }
  if (!crmUser.is_active) {
    return NextResponse.json({ error: "inactive" }, { status: 403 });
  }
  const rolesRaw = crmUser.crm_roles as { name: string } | Array<{ name: string }> | null;
  const roleName = Array.isArray(rolesRaw) ? (rolesRaw[0]?.name ?? null) : (rolesRaw?.name ?? null);
  const role = mapRoleNameToCrmRole(roleName);
  if (!role) {
    return NextResponse.json({ error: "invalid_role" }, { status: 403 });
  }
  const dashboardPath = getDashboardPathForRole(role);
  return NextResponse.json({
    id: crmUser.id,
    full_name: crmUser.full_name,
    role,
    dashboardPath,
  });
}
