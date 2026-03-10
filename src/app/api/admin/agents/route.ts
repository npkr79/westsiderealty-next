import { NextResponse } from "next/server";
import { getAdminAuth, getServiceClient } from "../utils";
import { AGENT_CATEGORIES, isValidAgentCategory } from "@/constants/agentCategories";

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
      .from("crm_users")
      .select("id, full_name, phone, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (query) {
      request = request.or(
        `full_name.ilike.%${query}%,phone.ilike.%${query}%`
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
    const { name, email, phone, category } = body || {};
    if (!name || !email || !phone || !category) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!isValidAgentCategory(category)) {
      return NextResponse.json(
        { success: false, error: "Invalid agent category selected" },
        { status: 400 }
      );
    }

    const adminClient = getServiceClient();
    const defaultPassword = "Welcome@123";

    const { data: existingAgent, error: existingError } = await adminClient
      .from("crm_users")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message, step: "crm_users_lookup" },
        { status: 500 }
      );
    }

    if (existingAgent?.id) {
      return NextResponse.json(
        { success: false, error: "Agent with this phone number already exists" },
        { status: 409 }
      );
    }

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
        return NextResponse.json(
          { success: false, error: "Agent with this email already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: createError?.message || "Failed to create user", step: "create_user" },
        { status: 500 }
      );
    }

    // Insert into crm_users (no email or category columns — category needs separate role mapping)
    const { error: agentError } = await adminClient
      .from("crm_users")
      .insert({
        id: userId,
        full_name: name,
        phone,
        is_active: true,
      });
    if (agentError) {
      return NextResponse.json({ error: agentError.message, step: "crm_users_insert" }, { status: 500 });
    }

    // Note: role_id must be set separately via crm_roles lookup if needed

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
      agent: { id: userId, name, email, phone, category },
      tempPassword: defaultPassword,
      categories: AGENT_CATEGORIES,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}
