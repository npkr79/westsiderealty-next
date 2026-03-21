import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";

const CONCURRENCY = 3;
const TIMEOUT_MS = 5_000;
const DEFAULT_LIMIT = 150;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.westsiderealty.in";

const isAuthorized = (request: NextRequest): boolean => {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return authHeader === `Bearer ${secret}`;
};

interface UrlEntry {
  type: "developer" | "market" | "project";
  slug: string;
  url: string;
}

interface CheckResult extends UrlEntry {
  http_status: number;
  is_broken: boolean;
  response_time_ms: number;
  error_message: string | null;
}

async function checkUrl(entry: UrlEntry): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(entry.url, {
      method: "HEAD",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const response_time_ms = Date.now() - start;
    return {
      ...entry,
      http_status: res.status,
      is_broken: res.status >= 400,
      response_time_ms,
      error_message: null,
    };
  } catch (err) {
    return {
      ...entry,
      http_status: 0,
      is_broken: true,
      response_time_ms: Date.now() - start,
      error_message: err instanceof Error ? err.message : "Network error",
    };
  }
}

async function checkInBatches(entries: UrlEntry[]): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    const batch = entries.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(checkUrl));
    results.push(...batchResults);
  }
  return results;
}

async function fetchAllSlugs(supabase: ReturnType<typeof createServiceClient>, baseUrl: string): Promise<UrlEntry[]> {
  const [developersRes, marketsRes, projectsRes] = await Promise.all([
    supabase.from("developer_brands").select("url_slug").not("url_slug", "is", null),
    supabase.from("micro_markets").select("url_slug, city_slug").not("url_slug", "is", null),
    supabase
      .from("listing_project_detail_enriched_mv")
      .select("url_slug, city_slug")
      .not("url_slug", "is", null)
      .not("city_slug", "is", null),
  ]);

  if (developersRes.error) console.error("[link-checker] developer_brands error:", developersRes.error.message);
  if (marketsRes.error) console.error("[link-checker] micro_markets error:", marketsRes.error.message);
  if (projectsRes.error) console.error("[link-checker] listing_project_detail_enriched_mv error:", projectsRes.error.message);

  const entries: UrlEntry[] = [];

  for (const row of developersRes.data ?? []) {
    if (row.url_slug) {
      entries.push({ type: "developer", slug: row.url_slug, url: `${baseUrl}/developers/${row.url_slug}` });
    }
  }

  for (const row of marketsRes.data ?? []) {
    if (row.url_slug && row.city_slug) {
      entries.push({ type: "market", slug: row.url_slug, url: `${baseUrl}/${row.city_slug}/${row.url_slug}` });
    }
  }

  // Deduplicate projects by url_slug (MV may have multiple rows per project)
  const seenSlugs = new Set<string>();
  for (const row of projectsRes.data ?? []) {
    if (row.url_slug && row.city_slug && !seenSlugs.has(row.url_slug)) {
      seenSlugs.add(row.url_slug);
      entries.push({ type: "project", slug: row.url_slug, url: `${baseUrl}/${row.city_slug}/projects/${row.url_slug}` });
    }
  }

  return entries;
}

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}

async function handler(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    const run_id = new Date().toISOString();
    const { searchParams } = request.nextUrl;
    const baseUrl = searchParams.get("base_url") ?? SITE_URL;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10), 200);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    console.log("[link-checker] fetching slugs...");
    const allEntries = await fetchAllSlugs(supabase, baseUrl);

    const isManualOffset = searchParams.has("offset");
    const effectiveOffset = isManualOffset
      ? offset
      : (() => {
          const start = new Date(new Date().getFullYear(), 0, 0).getTime();
          const dayOfYear = Math.floor((Date.now() - start) / 86_400_000);
          return (dayOfYear * limit) % Math.max(allEntries.length, 1);
        })();
    const entries = allEntries.slice(effectiveOffset, effectiveOffset + limit);
    console.log(`[link-checker] total=${allEntries.length} limit=${limit} effectiveOffset=${effectiveOffset} — checking ${entries.length} URLs against ${baseUrl}`);
    const results = await checkInBatches(entries);
    console.log(`[link-checker] checks complete — ${results.filter(r => r.is_broken).length} broken`);

    const rows = results.map((r) => ({
      run_id,
      url_type: r.type,
      slug: r.slug,
      full_url: r.url,
      http_status: r.http_status,
      is_broken: r.is_broken,
      response_time_ms: r.response_time_ms,
      error_message: r.error_message,
    }));

    const { error: insertError } = await supabase.from("link_health_log").insert(rows);
    if (insertError) {
      console.error("[link-checker] insert error:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const broken = results.filter((r) => r.is_broken);

    return NextResponse.json({
      run_id,
      effective_offset: effectiveOffset,
      limit,
      checked: results.length,
      total_available: allEntries.length,
      has_more: effectiveOffset + limit < allEntries.length,
      next_offset: effectiveOffset + limit < allEntries.length ? effectiveOffset + limit : null,
      broken_count: broken.length,
      broken: broken.map((r) => ({ type: r.type, slug: r.slug, status: r.http_status, url: r.url })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Link checker failed" },
      { status: 500 }
    );
  }
}
