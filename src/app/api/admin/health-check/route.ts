import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";

const STATIC_PAGES = [
  "/",
  "/about",
  "/contact",
  "/projects",
  "/developers",
  "/blog",
  "/sell-property",
  "/buying-requirement",
  "/hyderabad/buy",
];

const SITE_URL = "https://www.westsiderealty.in";
const SLOW_THRESHOLD_MS = 4000;
// Sample sizes per page type — keeps check under Vercel's 30s default timeout
const SAMPLE_MICRO_MARKETS = 5;
const SAMPLE_PROJECTS = 5;
const SAMPLE_DEVELOPERS = 3;

function isAuthorized(request: NextRequest): boolean {
  const adminSecret = request.headers.get("x-admin-secret");
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  return adminSecret === process.env.ADMIN_SECRET || isVercelCron;
}

async function checkUrl(path: string): Promise<{
  url: string;
  status_code: number;
  response_time_ms: number;
  checked_at: string;
  is_broken: boolean;
  page_type: string;
}> {
  const url = `${SITE_URL}${path}`;
  const start = Date.now();
  let status_code = 0;

  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    status_code = res.status;
  } catch {
    status_code = 0;
  }

  const segment = path.split("/").filter(Boolean)[1] ?? path;
  const page_type = path === "/" ? "home"
    : path.includes("/projects/") ? "project"
    : path.startsWith("/developers/") ? "developer"
    : path.match(/^\/[^/]+\/[^/]+$/) && !path.includes("/projects") ? "micro_market"
    : "static";

  return {
    url,
    status_code,
    response_time_ms: Date.now() - start,
    checked_at: new Date().toISOString(),
    is_broken: status_code === 0 || status_code >= 400,
    page_type,
  };
}

async function buildDynamicPages(supabase: ReturnType<typeof createServiceClient>): Promise<string[]> {
  const pages: string[] = [];

  // Micro-market pages — sample across all cities
  const { data: markets } = await supabase
    .from("micro_market_page_cache_v2")
    .select("city_id, url_slug, cities!inner(url_slug)")
    .not("url_slug", "is", null)
    .limit(100);

  if (markets?.length) {
    // Shuffle and pick sample
    const shuffled = [...markets].sort(() => Math.random() - 0.5).slice(0, SAMPLE_MICRO_MARKETS);
    for (const m of shuffled) {
      const citySlug = (m.cities as { url_slug: string } | null)?.url_slug;
      if (citySlug && m.url_slug) pages.push(`/${citySlug}/${m.url_slug}`);
    }
  }

  // Project pages
  const { data: projects } = await supabase
    .from("projects")
    .select("url_slug, city_slug")
    .not("url_slug", "is", null)
    .not("city_slug", "is", null)
    .eq("is_published", true)
    .limit(50);

  if (projects?.length) {
    const shuffled = [...projects].sort(() => Math.random() - 0.5).slice(0, SAMPLE_PROJECTS);
    for (const p of shuffled) {
      if (p.city_slug && p.url_slug) pages.push(`/${p.city_slug}/projects/${p.url_slug}`);
    }
  }

  // Developer pages
  const { data: developers } = await supabase
    .from("developer_brands")
    .select("url_slug")
    .not("url_slug", "is", null)
    .limit(30);

  if (developers?.length) {
    const shuffled = [...developers].sort(() => Math.random() - 0.5).slice(0, SAMPLE_DEVELOPERS);
    for (const d of shuffled) {
      if (d.url_slug) pages.push(`/developers/${d.url_slug}`);
    }
  }

  return pages;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Build page list: static + dynamic sample
  const dynamicPages = await buildDynamicPages(supabase);
  const allPages = [...STATIC_PAGES, ...dynamicPages];

  // Check all pages concurrently in batches of 10
  const results: Awaited<ReturnType<typeof checkUrl>>[] = [];
  const batchSize = 10;
  for (let i = 0; i < allPages.length; i += batchSize) {
    const batch = allPages.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(checkUrl));
    results.push(...batchResults);
  }

  const broken = results.filter((r) => r.is_broken);
  const slow = results.filter((r) => !r.is_broken && r.response_time_ms > SLOW_THRESHOLD_MS);
  const healthy = results.filter((r) => !r.is_broken && r.response_time_ms <= SLOW_THRESHOLD_MS);

  // Cleanup old webhook dedup records (older than 24h)
  await supabase
    .from("crm_webhook_dedup")
    .delete()
    .lt("created_at", new Date(Date.now() - 86400000).toISOString());

  // Save report
  const { data: report, error } = await supabase
    .from("site_health_reports")
    .insert({
      total_pages: results.length,
      broken_count: broken.length,
      results,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[health-check] Failed to save report:", error);
  }

  // Log broken pages so they appear in Vercel function logs
  if (broken.length > 0) {
    console.error("[health-check] BROKEN PAGES:", broken.map((r) => `${r.status_code} ${r.url}`).join(", "));
  }

  return NextResponse.json({
    total: results.length,
    broken: broken.map((r) => ({ url: r.url, status_code: r.status_code, page_type: r.page_type })),
    slow: slow.map((r) => ({ url: r.url, response_time_ms: r.response_time_ms, page_type: r.page_type })),
    healthy_count: healthy.length,
    saved_report_id: report?.id ?? null,
    checked_at: new Date().toISOString(),
  });
}
