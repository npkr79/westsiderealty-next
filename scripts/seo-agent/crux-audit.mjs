/**
 * CrUX Audit — westsiderealty.in
 *
 * Uses the Chrome User Experience Report (CrUX) API to collect real-user
 * Core Web Vitals for all project and micro-market pages. CrUX data reflects
 * actual Chrome user measurements — not synthetic lab results.
 *
 * Metrics collected (p75 values, PHONE form factor):
 *   LCP  — Largest Contentful Paint    (good ≤2500ms, poor >4000ms)
 *   INP  — Interaction to Next Paint   (good ≤200ms,  poor >500ms)
 *   CLS  — Cumulative Layout Shift     (good ≤0.1,    poor >0.25)
 *   FCP  — First Contentful Paint      (good ≤1800ms)
 *   TTFB — Time to First Byte          (good ≤800ms)
 *
 * URLs with insufficient real-user traffic are skipped gracefully (CrUX 404).
 * Rate limit: 500ms between requests (~100 req/100s quota).
 *
 * Results upserted to: seo_crux_metrics (url, form_factor, week_start)
 *
 * Required env vars:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   PAGESPEED_API_KEY   (same key works for CrUX API)
 *   GOOGLE_SITE_URL     (optional — defaults to https://www.westsiderealty.in)
 */

import { createClient } from "@supabase/supabase-js";

const SITE_BASE =
  process.env.GOOGLE_SITE_URL || "https://www.westsiderealty.in";

const CRUX_ENDPOINT =
  "https://chromeuxreport.googleapis.com/v1/records:queryRecord";

// ─── Supabase client ──────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "[crux-audit] WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set"
    );
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Week helper (Monday of current ISO week) ─────────────────────────────────

function currentWeekStart() {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

// ─── Rate-limit sleep ─────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── CrUX thresholds ──────────────────────────────────────────────────────────

function lcpStatus(p75) {
  if (p75 === null || p75 === undefined) return null;
  if (p75 <= 2500) return "good";
  if (p75 <= 4000) return "needs_improvement";
  return "poor";
}

function inpStatus(p75) {
  if (p75 === null || p75 === undefined) return null;
  if (p75 <= 200) return "good";
  if (p75 <= 500) return "needs_improvement";
  return "poor";
}

function clsStatus(p75) {
  if (p75 === null || p75 === undefined) return null;
  if (p75 <= 0.1) return "good";
  if (p75 <= 0.25) return "needs_improvement";
  return "poor";
}

function fcpStatus(p75) {
  if (p75 === null || p75 === undefined) return null;
  if (p75 <= 1800) return "good";
  if (p75 <= 3000) return "needs_improvement";
  return "poor";
}

function ttfbStatus(p75) {
  if (p75 === null || p75 === undefined) return null;
  if (p75 <= 800) return "good";
  if (p75 <= 1800) return "needs_improvement";
  return "poor";
}

function overallStatus(statuses) {
  const present = statuses.filter(Boolean);
  if (present.length === 0) return null;
  if (present.some((s) => s === "poor")) return "poor";
  if (present.some((s) => s === "needs_improvement")) return "needs_improvement";
  return "good";
}

// ─── CrUX API call ────────────────────────────────────────────────────────────

async function queryCrux(url, apiKey) {
  const body = {
    url,
    formFactor: "PHONE",
    metrics: [
      "largest_contentful_paint",
      "cumulative_layout_shift",
      "interaction_to_next_paint",
      "first_contentful_paint",
      "experimental_time_to_first_byte",
    ],
  };

  const response = await fetch(`${CRUX_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (response.status === 404) return null;

  const json = await response.json();

  if (json.error) {
    if (json.error.status === "NOT_FOUND") return null;
    console.error(`[crux-audit] CrUX API error for ${url}:`, json.error.message);
    return null;
  }

  return json;
}

function extractMetrics(cruxData) {
  const metrics = cruxData?.record?.metrics || {};

  const lcp = metrics.largest_contentful_paint?.percentiles?.p75 ?? null;
  const inp = metrics.interaction_to_next_paint?.percentiles?.p75 ?? null;
  const clsRaw = metrics.cumulative_layout_shift?.percentiles?.p75 ?? null;
  const cls = clsRaw !== null ? parseFloat(clsRaw) : null;
  const fcp = metrics.first_contentful_paint?.percentiles?.p75 ?? null;
  const ttfb = metrics.experimental_time_to_first_byte?.percentiles?.p75 ?? null;

  return {
    lcp_p75: lcp !== null ? Math.round(lcp) : null,
    lcp_status: lcpStatus(lcp),
    inp_p75: inp !== null ? Math.round(inp) : null,
    inp_status: inpStatus(inp),
    cls_p75: cls,
    cls_status: clsStatus(cls),
    fcp_p75: fcp !== null ? Math.round(fcp) : null,
    fcp_status: fcpStatus(fcp),
    ttfb_p75: ttfb !== null ? Math.round(ttfb) : null,
    ttfb_status: ttfbStatus(ttfb),
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Query CrUX for all project and micro-market pages and upsert results.
 *
 * @returns {{
 *   urlsChecked: number,
 *   urlsWithData: number,
 *   urlsGood: number,
 *   urlsNeedsImprovement: number,
 *   urlsPoor: number,
 *   worstPages: Array<{url, lcp_p75, inp_p75, cls_p75, overall_status}>,
 *   summary: string
 * }}
 */
export async function runCruxAudit() {
  const empty = {
    urlsChecked: 0,
    urlsWithData: 0,
    urlsGood: 0,
    urlsNeedsImprovement: 0,
    urlsPoor: 0,
    worstPages: [],
    summary: "Supabase client or PAGESPEED_API_KEY unavailable — skipped",
  };

  const supabase = getSupabase();
  if (!supabase) return empty;

  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) {
    console.error("[crux-audit] PAGESPEED_API_KEY not set — skipping");
    return empty;
  }

  const weekStart = currentWeekStart();
  console.error(`[crux-audit] Week start: ${weekStart}`);

  // ── 1. Fetch slugs ────────────────────────────────────────────────────────────

  const [projectsRes, mmRes] = await Promise.all([
    supabase
      .from("projects")
      .select("url_slug")
      .not("url_slug", "is", null)
      .limit(200),

    supabase
      .from("micro_markets")
      .select("url_slug")
      .not("url_slug", "is", null)
      .limit(50),
  ]);

  if (projectsRes.error) {
    console.error("[crux-audit] Projects fetch error:", projectsRes.error.message);
  }
  if (mmRes.error) {
    console.error("[crux-audit] Micro-markets fetch error:", mmRes.error.message);
  }

  const projects = projectsRes.data || [];
  const microMarkets = mmRes.data || [];

  const urlEntries = [
    ...projects
      .filter((p) => p.url_slug)
      .map((p) => ({
        url: `${SITE_BASE}/hyderabad/projects/${p.url_slug}`,
        entity_type: "project",
        entity_slug: p.url_slug,
        city_slug: "hyderabad",
      })),
    ...microMarkets
      .filter((mm) => mm.url_slug)
      .map((mm) => ({
        url: `${SITE_BASE}/hyderabad/${mm.url_slug}`,
        entity_type: "micro_market",
        entity_slug: mm.url_slug,
        city_slug: "hyderabad",
      })),
  ];

  console.error(`[crux-audit] Checking ${urlEntries.length} URLs via CrUX API...`);

  // ── 2. Query CrUX for each URL ────────────────────────────────────────────────

  const results = [];

  for (let i = 0; i < urlEntries.length; i++) {
    const entry = urlEntries[i];

    if (i > 0) await sleep(500);

    let cruxData = null;
    try {
      cruxData = await queryCrux(entry.url, apiKey);
    } catch (err) {
      console.error(`[crux-audit] Fetch error for ${entry.url}:`, err.message);
    }

    if (!cruxData) {
      continue;
    }

    const m = extractMetrics(cruxData);
    const overall = overallStatus([
      m.lcp_status,
      m.inp_status,
      m.cls_status,
      m.fcp_status,
      m.ttfb_status,
    ]);

    results.push({
      ...entry,
      ...m,
      overall_status: overall,
    });

    if ((i + 1) % 20 === 0) {
      console.error(`[crux-audit] Progress: ${i + 1}/${urlEntries.length} checked, ${results.length} with data`);
    }
  }

  console.error(
    `[crux-audit] CrUX data found for ${results.length} of ${urlEntries.length} URLs`
  );

  // ── 3. Upsert to Supabase ─────────────────────────────────────────────────────

  if (results.length > 0) {
    const rows = results.map((r) => ({
      url: r.url,
      entity_type: r.entity_type,
      entity_slug: r.entity_slug,
      city_slug: r.city_slug,
      form_factor: "PHONE",
      lcp_p75: r.lcp_p75,
      lcp_status: r.lcp_status,
      inp_p75: r.inp_p75,
      inp_status: r.inp_status,
      cls_p75: r.cls_p75,
      cls_status: r.cls_status,
      fcp_p75: r.fcp_p75,
      fcp_status: r.fcp_status,
      ttfb_p75: r.ttfb_p75,
      ttfb_status: r.ttfb_status,
      overall_status: r.overall_status,
      week_start: weekStart,
      recorded_at: new Date().toISOString(),
    }));

    const CHUNK = 200;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const { error } = await supabase.from("seo_crux_metrics").upsert(chunk, {
        onConflict: "url,form_factor,week_start",
        ignoreDuplicates: false,
      });
      if (error) {
        console.error(`[crux-audit] Upsert error (chunk ${i / CHUNK + 1}):`, error.message);
      }
    }
  }

  // ── 4. Summary stats ──────────────────────────────────────────────────────────

  const urlsGood = results.filter((r) => r.overall_status === "good").length;
  const urlsNeedsImprovement = results.filter(
    (r) => r.overall_status === "needs_improvement"
  ).length;
  const urlsPoor = results.filter((r) => r.overall_status === "poor").length;

  const worstPages = results
    .filter((r) => r.overall_status === "poor" || r.overall_status === "needs_improvement")
    .sort((a, b) => {
      const scoreFn = (r) => {
        let s = 0;
        if (r.lcp_status === "poor") s += 3;
        else if (r.lcp_status === "needs_improvement") s += 1;
        if (r.inp_status === "poor") s += 3;
        else if (r.inp_status === "needs_improvement") s += 1;
        if (r.cls_status === "poor") s += 2;
        else if (r.cls_status === "needs_improvement") s += 1;
        return s;
      };
      return scoreFn(b) - scoreFn(a);
    })
    .slice(0, 10)
    .map(({ url, lcp_p75, inp_p75, cls_p75, overall_status }) => ({
      url,
      lcp_p75,
      inp_p75,
      cls_p75,
      overall_status,
    }));

  const summary =
    `Checked ${urlEntries.length} URLs, ${results.length} had CrUX data. ` +
    `Good: ${urlsGood}, Needs improvement: ${urlsNeedsImprovement}, Poor: ${urlsPoor}.`;

  console.error(`[crux-audit] ${summary}`);

  return {
    urlsChecked: urlEntries.length,
    urlsWithData: results.length,
    urlsGood,
    urlsNeedsImprovement,
    urlsPoor,
    worstPages,
    summary,
  };
}
