import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "../utils";

const resolveAdminRole = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { authorized: false, isOwner: false, user: null };
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

  return {
    authorized: resolvedRole === "owner",
    isOwner: resolvedRole === "owner",
    user,
  };
};

export async function POST(req: Request) {
  try {
    const authCheck = await resolveAdminRole();
    if (!authCheck.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email, password, phone, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const adminClient = getServiceClient();
    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { phone },
    });

    if (createError || !userData.user) {
      return NextResponse.json({ error: createError?.message || "Failed to create user" }, { status: 500 });
    }

    // Insert into crm_users — role_id must be set separately via crm_roles lookup
    // Note: email has no column on crm_users (it lives in auth.users only)
    const { error: roleError } = await adminClient.from("crm_users").insert({
      id: userData.user.id,
      full_name: email, // placeholder; update via admin after creation
      phone: phone || null,
      is_active: true,
    });

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}
