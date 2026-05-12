import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";

// ---------------------------------------------------------------------------
// GET /api/news/articles
// Query params: page, limit, category, city, min_score, processed, search
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const category = searchParams.get("category");
  const city = searchParams.get("city");
  const minScore = parseFloat(searchParams.get("min_score") ?? "0");
  const processed = searchParams.get("processed"); // "true" | "false" | null
  const search = searchParams.get("search");
  const rejected = searchParams.get("rejected"); // "true" | "false" | null

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("news_articles")
    .select(
      "id, source_name, source_url, headline, summary, ai_summary, image_url, published_at, category, sub_category, cities, relevance_score, ai_tags, is_processed, is_rejected, social_post_count, scraped_at, created_at",
      { count: "exact" }
    )
    .order("scraped_at", { ascending: false })
    .range(from, to);

  if (category) query = query.eq("category", category);
  if (city) query = query.contains("cities", [city]);
  if (minScore > 0) query = query.gte("relevance_score", minScore);
  if (processed === "true") query = query.eq("is_processed", true);
  if (processed === "false") query = query.eq("is_processed", false);
  if (rejected === "true") query = query.eq("is_rejected", true);
  if (rejected === "false") query = query.eq("is_rejected", false);
  if (search) query = query.ilike("headline", `%${search}%`);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    articles: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}

// ---------------------------------------------------------------------------
// PATCH /api/news/articles — update a single article (reject, mark processed)
// Body: { id, is_rejected?, is_processed? }
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  const supabase = createServiceClient();

  try {
    const body = await request.json();
    const { id, is_rejected, is_processed } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing article id" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof is_rejected === "boolean") updates.is_rejected = is_rejected;
    if (typeof is_processed === "boolean") updates.is_processed = is_processed;

    const { data, error } = await supabase
      .from("news_articles")
      .update(updates)
      .eq("id", id)
      .select("id, headline, is_rejected, is_processed")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, article: data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
