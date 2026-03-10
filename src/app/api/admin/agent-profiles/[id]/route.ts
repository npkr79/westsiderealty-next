import { NextResponse } from "next/server";
import { getAdminAuth, getServiceClient } from "../../utils";

const extractCrmUserUpdates = (updates: Record<string, any>) => {
  // Only fields that exist on crm_users: id, full_name, phone, role_id, is_active, created_at, whatsapp_number
  const payload: Record<string, any> = {};
  if (typeof updates.name === "string") payload.full_name = updates.name;
  if (typeof updates.phone === "string") payload.phone = updates.phone;
  if (typeof updates.is_active === "boolean") payload.is_active = updates.is_active;
  // email, bio, specialization, profile_image, service_areas, linkedin, instagram, profile_completed
  // do NOT exist on crm_users — silently dropped
  return payload;
};

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
    const crmUserUpdates = extractCrmUserUpdates(updates || {});

    if (Object.keys(crmUserUpdates).length) {
      const { error: registryError } = await adminClient
        .from("crm_users")
        .update(crmUserUpdates)
        .eq("id", id);

      if (registryError) {
        return NextResponse.json({ error: registryError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}
