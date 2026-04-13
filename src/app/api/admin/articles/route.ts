import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") ?? "draft";

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("generated_articles")
    .select(
      "id, slug, city, micro_market, seo_headline, meta_description, body, target_persona, drip_placement, status, published_at, created_at, image_url, source_articles"
    )
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ articles: data ?? [] });
}
