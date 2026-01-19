import { NextResponse } from "next/server";
import { getAdminAuth, getServiceClient } from "../../utils";
import { isValidAgentCategory } from "@/constants/agentCategories";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = await req.json();
    const adminClient = getServiceClient();
    const { is_active, category, name, email, phone } = updates || {};
    const payload: Record<string, any> = {};
    if (typeof is_active === "boolean") payload.is_active = is_active;
    if (typeof category === "string") {
      if (!isValidAgentCategory(category)) {
        return NextResponse.json(
          { success: false, error: "Invalid agent category selected" },
          { status: 400 }
        );
      }
      payload.category = category;
    }
    if (typeof name === "string") payload.name = name;
    if (typeof email === "string") payload.email = email;
    if (typeof phone === "string") payload.phone = phone;

    const { error } = await adminClient.from("raw_agents").update(payload).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAdminAuth();
    if (!auth.authorized || !auth.isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = getServiceClient();
    await adminClient.from("raw_agents").delete().eq("id", id);
    await adminClient.from("user_roles").delete().eq("user_id", id);
    await adminClient.auth.admin.deleteUser(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}
