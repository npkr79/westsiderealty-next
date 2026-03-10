import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";

const PAGES_TO_CHECK = [
  "/",
  "/about",
  "/contact",
  "/services",
  "/projects",
  "/developers",
  "/blog",
  "/insights",
  "/commercial-investments",
  "/kokapet-gandipet-luxury-villas",
  "/apartment-intelligence",
  "/villa-intelligence",
  "/residential-intelligence",
  "/sell-property",
  "/buying-requirement",
  "/hyderabad/buy",
  "/hyderabad/properties",
  "/hyderabad/shares",
  "/hyderabad/landowner-investor-share-flats",
];

const SITE_URL = "https://www.westsiderealty.in";
const SLOW_THRESHOLD_MS = 3000;

// Vercel cron jobs can't send custom headers, so allow requests from
// the Vercel cron system (identified by x-vercel-cron header) in addition
// to the admin secret header.
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

  return {
    url,
    status_code,
    response_time_ms: Date.now() - start,
    checked_at: new Date().toISOString(),
    is_broken: status_code === 0 || status_code >= 400,
  };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check all pages concurrently (10 at a time)
  const results: Awaited<ReturnType<typeof checkUrl>>[] = [];
  const batchSize = 10;
  for (let i = 0; i < PAGES_TO_CHECK.length; i += batchSize) {
    const batch = PAGES_TO_CHECK.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(checkUrl));
    results.push(...batchResults);
  }

  const broken = results.filter((r) => r.is_broken);
  const slow = results.filter((r) => !r.is_broken && r.response_time_ms > SLOW_THRESHOLD_MS);
  const healthy = results.filter((r) => !r.is_broken && r.response_time_ms <= SLOW_THRESHOLD_MS);

  // Save to Supabase
  const supabase = createServiceClient();
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

  return NextResponse.json({
    total: results.length,
    broken: broken.map((r) => ({ url: r.url, status_code: r.status_code })),
    slow: slow.map((r) => ({ url: r.url, response_time_ms: r.response_time_ms })),
    healthy: healthy.map((r) => r.url),
    saved_report_id: report?.id ?? null,
  });
}
