import { NextResponse } from "next/server";
import { getAdminAuth, getServiceClient } from "../../utils";

const extractProfileUpdates = (updates: Record<string, any>) => {
  const fields = [
    "name",
    "email",
    "phone",
    "bio",
    "specialization",
    "profile_image",
    "service_areas",
    "whatsapp",
    "linkedin",
    "instagram",
    "profile_completed",
  ];

  return fields.reduce<Record<string, any>>((acc, key) => {
    if (updates[key] !== undefined) {
      acc[key] = updates[key];
    }
    return acc;
  }, {});
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
    const profileUpdates = extractProfileUpdates(updates || {});

    const { error: profileError } = await adminClient
      .from("agents_profile")
      .update(profileUpdates)
      .eq("agent_id", id);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const registryUpdates: Record<string, any> = {};
    if (typeof updates?.name === "string") registryUpdates.name = updates.name;
    if (typeof updates?.email === "string") registryUpdates.email = updates.email;
    if (typeof updates?.phone === "string") registryUpdates.phone = updates.phone;

    if (Object.keys(registryUpdates).length) {
      const { error: registryError } = await adminClient
        .from("raw_agents")
        .update(registryUpdates)
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
