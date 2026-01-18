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
      .from("hyderabad_properties")
      .select(
        "id, title, location, micro_market, price, price_display, bhk_config, area_sqft, status, property_type, project_name, developer_name, main_image_url, updated_at"
      )
      .order("updated_at", { ascending: false })
      .limit(50);

    if (query) {
      request = request.or(
        `title.ilike.%${query}%,location.ilike.%${query}%,micro_market.ilike.%${query}%`
      );
    }

    const { data, error } = await request;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ properties: data || [] });
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
    const adminClient = getServiceClient();
    const payload = Array.isArray(body?.items) ? body.items : [body];

    const { error } = await adminClient.from("hyderabad_properties").insert(payload);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}
