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
      .from("crm_users")
      .select("id, full_name, phone, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (query) {
      request = request.or(
        `full_name.ilike.%${query}%,phone.ilike.%${query}%`
      );
    }

    const { data, error } = await request;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // agents_profile-specific fields (bio, specialization, etc.) no longer exist on crm_users
    const profiles = (data || []).map((profile: any) => ({
      id: profile.id,
      name: profile.full_name,
      phone: profile.phone,
      is_active: profile.is_active,
      created_at: profile.created_at,
      email: null,
      specialization: null,
      bio: null,
      whatsapp: null,
      linkedin: null,
      instagram: null,
      profile_image: null,
      service_areas: null,
      profile_completed: null,
      category: null,
    }));

    return NextResponse.json({ profiles });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}
