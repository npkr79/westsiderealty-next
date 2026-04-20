import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { getCrmSessionResult } from "@/lib/crm/auth";

export async function POST(request: NextRequest) {
  const session = await getCrmSessionResult();
  if (!session.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { city, micro_market, seo_headline, meta_description, article_body, whatsapp_summary, target_persona, drip_placement } = body;

  if (!city || !seo_headline || !article_body) {
    return NextResponse.json({ error: "city, seo_headline and body are required" }, { status: 400 });
  }

  const slug = seo_headline
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("generated_articles")
    .insert({
      city,
      micro_market: micro_market ?? "",
      seo_headline: seo_headline.slice(0, 60),
      meta_description: (meta_description ?? "").slice(0, 155),
      body: article_body,
      slug,
      whatsapp_summary: (whatsapp_summary ?? "").slice(0, 160),
      target_persona: target_persona ?? "",
      drip_placement: drip_placement ?? "Day-7",
      status: "draft",
      week_start: now.split("T")[0],
      created_at: now,
      updated_at: now,
    })
    .select("id, slug, seo_headline")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, article: data });
}

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
