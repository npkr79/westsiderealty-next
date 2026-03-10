import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const getAdminAuth = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { authorized: false, isOwner: false, role: null, user: null };
  }

  const { data: roleData } = await supabase
    .from("crm_users")
    .select("id, crm_roles(name)")
    .eq("id", user.id)
    .maybeSingle();

  const crmRoles = (roleData as any)?.crm_roles;
  const resolvedRoleName: string | null = Array.isArray(crmRoles)
    ? (crmRoles[0]?.name ?? null)
    : (crmRoles?.name ?? null);

  const resolvedRole =
    resolvedRoleName || (user.email === "npkr79@gmail.com" ? "owner" : null);

  const isOwner = resolvedRole === "owner";
  const isAdmin =
    resolvedRole === "owner" ||
    resolvedRole === "dev_admin" ||
    resolvedRole === "office_admin" ||
    resolvedRole === "admin";

  return { authorized: isAdmin, isOwner, role: resolvedRole, user };
};

export const getServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    const missing = [
      !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(`Server misconfiguration: missing ${missing}`);
  }
  return createAdminClient(supabaseUrl, serviceRoleKey);
};
