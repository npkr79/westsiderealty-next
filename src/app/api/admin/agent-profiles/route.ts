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
      .from("agents_profile")
      .select(
        "agent_id, name, email, phone, bio, specialization, profile_image, service_areas, whatsapp, linkedin, instagram, profile_completed, created_at, raw_agents(category, is_active)"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (query) {
      request = request.or(
        `name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`
      );
    }

    const { data, error } = await request;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const profiles = (data || []).map((profile: any) => ({
      ...profile,
      id: profile.agent_id,
      category: profile.raw_agents?.category || null,
      is_active: profile.raw_agents?.is_active ?? null,
    }));

    return NextResponse.json({ profiles });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}
