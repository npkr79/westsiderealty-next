import { NextResponse } from "next/server";
import { getAdminAuth, getServiceClient } from "../utils";

export async function GET(req: Request) {
  try {
    const auth = await getAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const query = url.searchParams.get("q")?.trim() || "";
    const adminClient = getServiceClient();

    let request = adminClient
      .from("agents")
      .select("id, name, email, phone, specialization, active, profile_completed, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (query) {
      request = request.or(
        `name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`
      );
    }

    const { data, error } = await request;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ agents: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, specialization } = body || {};
    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const adminClient = getServiceClient();
    const defaultPassword = "Welcome@123";

    const { data: userData, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: { name, phone },
      });

    if (createError || !userData.user) {
      return NextResponse.json({ error: createError?.message || "Failed to create user" }, { status: 500 });
    }

    const userId = userData.user.id;

    const { error: agentError } = await adminClient.from("agents").insert({
      id: userId,
      name,
      email,
      phone,
      specialization: specialization || null,
      active: true,
      profile_completed: false,
    });
    if (agentError) {
      return NextResponse.json({ error: agentError.message }, { status: 500 });
    }

    const { error: roleError } = await adminClient.from("user_roles").insert({
      user_id: userId,
      role: "agent",
      email,
      phone,
    });
    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 500 });
    }

    await adminClient.rpc("create_hashed_phone_auth", {
      agent_id: userId,
      phone_number: phone,
      plain_password: defaultPassword,
    });

    return NextResponse.json({
      success: true,
      agent: { id: userId, name, email, phone, specialization: specialization || null },
      tempPassword: defaultPassword,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}
