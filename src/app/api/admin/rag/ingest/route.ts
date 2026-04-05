import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServiceClient } from "@/lib/supabase/serviceClient";

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

// ─── Request shape ────────────────────────────────────────────────────────────

interface IngestSource {
  source_name: string;
  source_type: string;
  credibility_tier: number;
  asset_classes: string[];
  cities_covered: string[];
  published_date?: string;
  data_period_start?: string;
  data_period_end?: string;
  metadata: Record<string, unknown>;
  storage_path?: string;
  source_url?: string;
}

interface IngestChunk {
  chunk_index: number;
  city: string;
  asset_class: string;
  market_slugs?: string[];
  content_type?: string;
  content: string;
}

interface IngestBody {
  source_id?: string;
  source: IngestSource;
  chunks: IngestChunk[];
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Step 1 — Auth
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 2 — Parse body
  let body: IngestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { source_id, source, chunks } = body;

  if (!source || !chunks || !Array.isArray(chunks)) {
    return NextResponse.json({ error: "Body must include source and chunks array" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Step 3 — Upsert rag_sources
  let resolvedSourceId: string;

  if (source_id) {
    // UPDATE existing row
    const { error: updateError } = await supabase
      .from("rag_sources")
      .update({
        source_name: source.source_name,
        source_type: source.source_type,
        credibility_tier: source.credibility_tier,
        asset_classes: source.asset_classes,
        cities_covered: source.cities_covered,
        published_date: source.published_date ?? null,
        data_period_start: source.data_period_start ?? null,
        data_period_end: source.data_period_end ?? null,
        metadata: source.metadata,
        storage_path: source.storage_path ?? null,
        source_url: source.source_url ?? null,
        total_chunks: chunks.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", source_id);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update rag_sources: ${updateError.message}` },
        { status: 500 }
      );
    }

    resolvedSourceId = source_id;
  } else {
    // INSERT new row
    const { data: insertedSource, error: insertError } = await supabase
      .from("rag_sources")
      .insert({
        source_name: source.source_name,
        source_type: source.source_type,
        credibility_tier: source.credibility_tier,
        asset_classes: source.asset_classes,
        cities_covered: source.cities_covered,
        published_date: source.published_date ?? null,
        data_period_start: source.data_period_start ?? null,
        data_period_end: source.data_period_end ?? null,
        metadata: source.metadata,
        storage_path: source.storage_path ?? null,
        source_url: source.source_url ?? null,
        total_chunks: chunks.length,
      })
      .select("id")
      .single();

    if (insertError || !insertedSource) {
      return NextResponse.json(
        { error: `Failed to insert into rag_sources: ${insertError?.message ?? "no id returned"}` },
        { status: 500 }
      );
    }

    resolvedSourceId = insertedSource.id as string;
  }

  // Step 4 — Delete existing chunks for this source (clean re-ingest)
  const { error: deleteError } = await supabase
    .from("rag_chunks")
    .delete()
    .eq("source_id", resolvedSourceId);

  if (deleteError) {
    return NextResponse.json(
      { error: `Failed to delete existing rag_chunks: ${deleteError.message}` },
      { status: 500 }
    );
  }

  // Step 5 — Embed in batches of 10
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const BATCH_SIZE = 10;

  const allRows: Array<{
    source_id: string;
    chunk_index: number;
    city: string;
    asset_class: string;
    market_slugs: string[] | null;
    content_type: string;
    content: string;
    content_tokens: number;
    embedding: number[];
  }> = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    let embeddingRes: Awaited<ReturnType<typeof openai.embeddings.create>>;
    try {
      embeddingRes = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: batch.map((c) => c.content),
        dimensions: 1536,
      });
    } catch (embErr) {
      return NextResponse.json(
        {
          error: `OpenAI embedding failed for batch starting at index ${i}: ${
            embErr instanceof Error ? embErr.message : String(embErr)
          }`,
        },
        { status: 500 }
      );
    }

    // Step 6 — Build rows for this batch
    for (let j = 0; j < batch.length; j++) {
      const chunk = batch[j];
      const embedding = embeddingRes.data[j].embedding;

      allRows.push({
        source_id: resolvedSourceId,
        chunk_index: chunk.chunk_index,
        city: chunk.city,
        asset_class: chunk.asset_class,
        market_slugs: chunk.market_slugs ?? null,
        content_type: chunk.content_type ?? "narrative",
        content: chunk.content,
        content_tokens: Math.ceil(chunk.content.length / 4),
        embedding,
      });
    }
  }

  // Insert all rows
  const { error: chunkInsertError } = await supabase.from("rag_chunks").insert(allRows);

  if (chunkInsertError) {
    return NextResponse.json(
      { error: `Failed to insert rag_chunks: ${chunkInsertError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ source_id: resolvedSourceId, inserted: allRows.length });
}
