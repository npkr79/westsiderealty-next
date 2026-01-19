import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const resolveAdminRole = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { authorized: false, user: null };
  }

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const resolvedRole =
    roleData?.role || (user.email === "npkr79@gmail.com" ? "owner" : null);

  const isAdmin =
    resolvedRole === "owner" ||
    resolvedRole === "dev_admin" ||
    resolvedRole === "office_admin" ||
    resolvedRole === "admin";

  return { authorized: isAdmin, user };
};

export async function GET() {
  try {
    const authCheck = await resolveAdminRole();
    if (!authCheck.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);

    await adminClient
      .from("leads")
      .update({ assigned_to: "Owner / Office Admin" })
      .is("assigned_to", null);

    const [leadsRes, agentsRes] = await Promise.all([
      adminClient.from("leads").select("*").order("created_at", { ascending: false }),
      adminClient
        .from("raw_agents")
        .select("id, name, is_active")
        .order("name", { ascending: true }),
    ]);

    if (leadsRes.error) {
      return NextResponse.json({ error: leadsRes.error.message }, { status: 500 });
    }
    if (agentsRes.error) {
      return NextResponse.json({ error: agentsRes.error.message }, { status: 500 });
    }

    const agents = (agentsRes.data || []).map((agent: any) => ({
      ...agent,
      active: agent.is_active,
    }));

    return NextResponse.json({
      leads: leadsRes.data || [],
      agents,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}
