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

    let userId: string | null = null;
    const { data: userData, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: { name, phone },
      });

    if (userData?.user?.id) {
      userId = userData.user.id;
    }

    if (!userId) {
      const message = createError?.message || "";
      if (message.toLowerCase().includes("already")) {
        const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        if (listError) {
          return NextResponse.json(
            { error: listError.message, step: "list_users" },
            { status: 500 }
          );
        }
        const existing = usersData?.users?.find((user) => user.email === email);
        if (!existing) {
          return NextResponse.json(
            { error: "User already exists but cannot be resolved", step: "find_existing_user" },
            { status: 500 }
          );
        }
        userId = existing.id;
      } else {
        return NextResponse.json(
          { error: createError?.message || "Failed to create user", step: "create_user" },
          { status: 500 }
        );
      }
    }

    const { error: agentError } = await adminClient
      .from("agents")
      .upsert(
        {
          id: userId,
          name,
          email,
          phone,
          specialization: specialization || null,
          active: true,
          profile_completed: false,
        },
        { onConflict: "id" }
      );
    if (agentError) {
      return NextResponse.json({ error: agentError.message, step: "agents_upsert" }, { status: 500 });
    }

    const { error: roleError } = await adminClient
      .from("user_roles")
      .upsert(
        {
          user_id: userId,
          role: "agent",
          email,
          phone,
        },
        { onConflict: "user_id" }
      );
    if (roleError) {
      return NextResponse.json({ error: roleError.message, step: "user_roles_upsert" }, { status: 500 });
    }

    const { error: phoneAuthError } = await adminClient.rpc("create_hashed_phone_auth", {
      agent_id: userId,
      phone_number: phone,
      plain_password: defaultPassword,
    });
    if (phoneAuthError) {
      return NextResponse.json(
        { success: true, warning: phoneAuthError.message, step: "phone_auth" },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: { id: userId, name, email, phone, specialization: specialization || null },
      tempPassword: defaultPassword,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}
