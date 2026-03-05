import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function callEnrichmentFunction(body: Record<string, unknown>) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase env vars");
  }
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-enrichment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Edge function error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.SITEMAP_API_KEY;
  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
  const forceRefresh = url.searchParams.get("force") === "1";

  try {
    const result = await callEnrichmentFunction({
      job_type: "project_live_intelligence",
      offset,
      force_refresh: forceRefresh,
    });
    return NextResponse.json({ ok: true, result, executedAt: new Date().toISOString() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
