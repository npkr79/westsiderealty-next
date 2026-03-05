#!/usr/bin/env tsx
/**
 * Pre-launch link health checker.
 * Fetches all developer, market, and project slugs from Supabase
 * and checks them against a local (or any) base URL.
 *
 * Usage:
 *   npm run check:links
 *   BASE_URL=http://localhost:3000 npm run check:links
 *
 * Saves results to link_health_log table.
 */

import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE ??
  process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const CONCURRENCY = 10;
const TIMEOUT_MS = 15_000;

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
      redirect: "follow",
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
  } catch (err: unknown) {
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
    // Progress indicator
    const done = Math.min(i + CONCURRENCY, entries.length);
    process.stdout.write(`\r  Checked ${done}/${entries.length}...`);
  }
  process.stdout.write("\n");
  return results;
}

async function fetchAllEntries(): Promise<UrlEntry[]> {
  const [developersRes, marketsRes, projectsRes] = await Promise.all([
    supabase.from("developer_brands").select("url_slug").not("url_slug", "is", null),
    supabase.from("micro_markets").select("url_slug, city_slug").not("url_slug", "is", null),
    supabase
      .from("listing_project_detail_enriched_mv")
      .select("url_slug, city_slug")
      .not("url_slug", "is", null)
      .not("city_slug", "is", null),
  ]);

  if (developersRes.error) console.error("  DB error (developer_brands):", developersRes.error.message);
  if (marketsRes.error) console.error("  DB error (micro_markets):", marketsRes.error.message);
  if (projectsRes.error) console.error("  DB error (listing_project_detail_enriched_mv):", projectsRes.error.message);

  const entries: UrlEntry[] = [];

  for (const row of developersRes.data ?? []) {
    if (row.url_slug) {
      entries.push({ type: "developer", slug: row.url_slug, url: `${BASE_URL}/developers/${row.url_slug}` });
    }
  }

  for (const row of marketsRes.data ?? []) {
    if (row.url_slug && row.city_slug) {
      entries.push({ type: "market", slug: row.url_slug, url: `${BASE_URL}/${row.city_slug}/${row.url_slug}` });
    }
  }

  // Deduplicate projects by slug (MV may have multiple rows per project)
  const seen = new Set<string>();
  for (const row of projectsRes.data ?? []) {
    if (row.url_slug && row.city_slug && !seen.has(row.url_slug)) {
      seen.add(row.url_slug);
      entries.push({ type: "project", slug: row.url_slug, url: `${BASE_URL}/${row.city_slug}/projects/${row.url_slug}` });
    }
  }

  return entries;
}

async function saveResults(run_id: string, results: CheckResult[]) {
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

  // Insert in batches of 200 to stay under Supabase limits
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from("link_health_log").insert(rows.slice(i, i + 200));
    if (error) console.error("  DB insert error:", error.message);
  }
}

async function main() {
  console.log("Link Health Checker");
  console.log("=".repeat(50));
  console.log(`Base URL : ${BASE_URL}`);
  console.log(`Supabase : ${SUPABASE_URL}`);
  console.log("");

  console.log("Fetching slugs from database...");
  const entries = await fetchAllEntries();

  const byType = entries.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`  Developers : ${byType.developer ?? 0}`);
  console.log(`  Markets    : ${byType.market ?? 0}`);
  console.log(`  Projects   : ${byType.project ?? 0}`);
  console.log(`  Total      : ${entries.length}`);
  console.log("");

  console.log(`Checking all URLs (${CONCURRENCY} concurrent)...`);
  const results = await checkInBatches(entries);

  const broken = results.filter((r) => r.is_broken);
  const ok = results.filter((r) => !r.is_broken);

  console.log("");
  console.log("=".repeat(50));
  console.log(`Total   : ${results.length}`);
  console.log(`OK      : ${ok.length}`);
  console.log(`Broken  : ${broken.length}`);

  if (broken.length > 0) {
    console.log("");
    console.log("BROKEN LINKS:");
    console.log("-".repeat(50));
    for (const r of broken) {
      const status = r.http_status === 0 ? "TIMEOUT" : `HTTP ${r.http_status}`;
      console.log(`  [${r.type.padEnd(9)}] ${status.padEnd(10)} ${r.url}`);
      if (r.error_message) console.log(`             ${r.error_message}`);
    }
  } else {
    console.log("");
    console.log("All links are healthy!");
  }

  // Save to DB
  console.log("");
  const run_id = new Date().toISOString();
  console.log(`Saving results to link_health_log (run_id: ${run_id})...`);
  await saveResults(run_id, results);
  console.log("Done. View results at /dashboard/admin/link-health");

  process.exit(broken.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
