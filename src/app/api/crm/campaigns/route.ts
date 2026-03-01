import { NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { createServiceClient } from "@/lib/supabase/serviceClient";

const fallbackCampaigns = [
  "website_organic",
  "meta_leads",
  "google_ads_search",
  "landing_page",
  "manual_upload",
];

export async function GET() {
  try {
    const session = await getCrmSessionResult();
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("crm_campaigns")
      .select("id,name,is_active")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error || !data) {
      return NextResponse.json({
        success: true,
        campaigns: fallbackCampaigns.map((name) => ({ id: name, name })),
        source: "fallback",
      });
    }

    return NextResponse.json({
      success: true,
      campaigns: data.map((item) => ({ id: String(item.id), name: String(item.name) })),
      source: "database",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected campaigns fetch error." },
      { status: 500 }
    );
  }
}
