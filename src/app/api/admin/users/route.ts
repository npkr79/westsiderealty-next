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
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const resolvedRole =
    roleData?.role || (user.email === "npkr79@gmail.com" ? "owner" : null);

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

    const { error: roleError } = await adminClient.from("user_roles").insert({
      user_id: userData.user.id,
      role,
      email,
      phone: phone || null,
    });

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}
