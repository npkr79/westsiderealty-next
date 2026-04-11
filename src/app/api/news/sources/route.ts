import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// GET /api/news/sources — list all sources
// ---------------------------------------------------------------------------

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("news_sources")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sources: data ?? [] });
}

// ---------------------------------------------------------------------------
// POST /api/news/sources — add a new source
// Body: { name, url, source_type?, category? }
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { name, url, source_type = "rss", category } = body;

    if (!name || !url) {
      return NextResponse.json({ error: "name and url are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("news_sources")
      .insert({ name, url, source_type, category, is_active: true })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, source: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/news/sources — toggle active status or update a source
// Body: { id, is_active?, name?, url?, category? }
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { id, is_active, name, url, category } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing source id" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof is_active === "boolean") updates.is_active = is_active;
    if (name) updates.name = name;
    if (url) updates.url = url;
    if (category !== undefined) updates.category = category;

    const { data, error } = await supabase
      .from("news_sources")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, source: data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
