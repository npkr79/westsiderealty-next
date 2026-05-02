/**
 * CTR Trends — westsiderealty.in
 *
 * Stores weekly GSC performance snapshots and surfaces week-over-week drops
 * in CTR or ranking position.
 *
 * Each snapshot row captures current metrics plus prev_ fields sourced from
 * the matching record 4 weeks prior — giving a like-for-like week-on-week
 * comparison without needing a join at query time.
 *
 * Tables used:
 *   seo_weekly_metrics  — week_start DATE, page_url TEXT, template TEXT,
 *                         impressions INT, clicks INT, ctr NUMERIC, position NUMERIC,
 *                         prev_impressions INT, prev_clicks INT, prev_ctr NUMERIC,
 *                         prev_position NUMERIC
 *                         UNIQUE(week_start, page_url)
 *
 * Usage:
 *   import { storeCtrSnapshot, getCtrTrends } from './ctr-trends.mjs';
 *
 *   // Store this week's snapshot (call after runCtrAudit)
 *   const stored = await storeCtrSnapshot(pageData, classifyUrl);
 *
 *   // Get pages that dropped significantly this week
 *   const drops = await getCtrTrends('2026-04-13');
 *
 * Required env vars:
 *   SUPABASE_URL            (= NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { classifyUrl } from "./ctr-audit.mjs";

// ─── Supabase client ──────────────────────────────────────────────────────────

function makeClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "[ctr-trends] WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — returning empty result"
    );
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Return the ISO Monday (YYYY-MM-DD) of the week containing `date`.
 * getDay() returns 0=Sun … 6=Sat; we want Monday=0 offset.
 */
function isoMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Mon
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Return the ISO Monday that is `weeks` weeks before `weekStart`.
 * `weekStart` must be a YYYY-MM-DD string for a Monday.
 */
function weeksBefore(weekStart, weeks) {
  const d = new Date(weekStart + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - weeks * 7);
  return d.toISOString().slice(0, 10);
}

// ─── storeCtrSnapshot ─────────────────────────────────────────────────────────

/**
 * Store a weekly snapshot of GSC page-level metrics.
 *
 * @param {Array<{ url: string, impressions: number, clicks: number, ctr: number, position: number, template?: string }>} pageData
 *   Array of page metrics — typically the full list returned by ctr-audit.mjs's
 *   `runCtrAudit()` (or any source that produces {url, impressions, clicks, ctr, position}).
 *
 * @param {function(string): { template: string, path: string }} [templateClassifierFn]
 *   Optional override for URL classifier. Defaults to `classifyUrl` from ctr-audit.mjs.
 *
 * @returns {Promise<number>} Number of rows stored/updated.
 */
export async function storeCtrSnapshot(pageData, templateClassifierFn) {
  const supabase = makeClient();
  if (!supabase) return 0;

  if (!Array.isArray(pageData) || pageData.length === 0) {
    console.error("[ctr-trends] No page data provided — nothing to store");
    return 0;
  }

  const classifier = typeof templateClassifierFn === "function" ? templateClassifierFn : classifyUrl;

  const currentWeek = isoMonday();
  const priorWeek = weeksBefore(currentWeek, 4);

  console.error(
    `[ctr-trends] Storing snapshot for week ${currentWeek} (comparing to ${priorWeek})`
  );

  // Fetch the baseline week (4 weeks ago) for all URLs in one query
  const urls = pageData.map((p) => p.url);

  const { data: priorRows, error: priorError } = await supabase
    .from("seo_weekly_metrics")
    .select("page_url, impressions, clicks, ctr, position")
    .eq("week_start", priorWeek)
    .in("page_url", urls);

  if (priorError) {
    console.error("[ctr-trends] Failed to fetch prior-week data:", priorError.message);
  }

  // Build lookup map: url → prior row
  const priorMap = new Map();
  for (const row of priorRows || []) {
    priorMap.set(row.page_url, row);
  }

  // Build upsert rows
  const rows = pageData.map((page) => {
    const { template } = classifier(page.url);
    const prior = priorMap.get(page.url) || null;

    return {
      week_start: currentWeek,
      page_url: page.url,
      template: page.template || template,
      impressions: Math.round(page.impressions ?? 0),
      clicks: Math.round(page.clicks ?? 0),
      ctr: page.ctr ?? 0,
      position: page.position ?? null,
      prev_impressions: prior ? Math.round(prior.impressions) : null,
      prev_clicks: prior ? Math.round(prior.clicks) : null,
      prev_ctr: prior ? prior.ctr : null,
      prev_position: prior ? prior.position : null,
    };
  });

  // Upsert in chunks of 500
  const CHUNK = 500;
  let stored = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);

    const { error } = await supabase.from("seo_weekly_metrics").upsert(chunk, {
      onConflict: "week_start,page_url",
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`[ctr-trends] Upsert error (chunk ${i / CHUNK + 1}):`, error.message);
    } else {
      stored += chunk.length;
    }
  }

  console.error(`[ctr-trends] Stored/updated ${stored} of ${rows.length} row(s) for week ${currentWeek}`);
  return stored;
}

// ─── getCtrTrends ─────────────────────────────────────────────────────────────

/**
 * Return pages that dropped significantly in CTR or position for the given week.
 *
 * A page is included if:
 *   - CTR dropped more than 0.5 percentage points vs the baseline week, OR
 *   - Average position dropped (got worse / higher number) by more than 2 spots
 *
 * Results are sorted by magnitude of combined drop and capped at top 20.
 *
 * @param {string} weekStart  ISO date string (YYYY-MM-DD) for the Monday of the week to analyse.
 *                            Defaults to the current ISO week Monday.
 *
 * @returns {Promise<Array<{
 *   pageUrl: string,
 *   template: string,
 *   weekStart: string,
 *   impressions: number,
 *   clicks: number,
 *   ctr: number,
 *   position: number | null,
 *   prevCtr: number,
 *   prevPosition: number | null,
 *   ctrDelta: number,       // negative = CTR fell
 *   positionDelta: number | null, // positive = position got worse
 *   dropScore: number,      // combined severity score for sorting
 * }>}>
 */
export async function getCtrTrends(weekStart) {
  const supabase = makeClient();
  if (!supabase) return [];

  const targetWeek = weekStart || isoMonday();

  console.error(`[ctr-trends] Fetching CTR trends for week ${targetWeek}`);

  const { data, error } = await supabase
    .from("seo_weekly_metrics")
    .select(
      "page_url, template, week_start, impressions, clicks, ctr, position, prev_impressions, prev_clicks, prev_ctr, prev_position"
    )
    .eq("week_start", targetWeek)
    .not("prev_ctr", "is", null); // only rows with a prior baseline

  if (error) {
    console.error("[ctr-trends] Query error:", error.message);
    return [];
  }

  if (!data || data.length === 0) {
    console.error("[ctr-trends] No rows found for week", targetWeek);
    return [];
  }

  // Filter: CTR drop > 0.5pp OR position drop > 2 spots
  const CTR_THRESHOLD = 0.005;    // 0.5 percentage points
  const POS_THRESHOLD = 2;        // 2 position spots worse

  const drops = data
    .map((row) => {
      const ctrDelta = row.ctr - row.prev_ctr;               // negative = fell
      const positionDelta =
        row.position !== null && row.prev_position !== null
          ? row.position - row.prev_position                 // positive = worse
          : null;

      // Combined severity: weight CTR delta more heavily (×20 to bring to same scale as position)
      const ctrScore = ctrDelta < 0 ? Math.abs(ctrDelta) * 20 : 0;
      const posScore = positionDelta !== null && positionDelta > 0 ? positionDelta : 0;
      const dropScore = ctrScore + posScore;

      return {
        pageUrl: row.page_url,
        template: row.template,
        weekStart: row.week_start,
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: row.ctr,
        position: row.position,
        prevCtr: row.prev_ctr,
        prevPosition: row.prev_position,
        ctrDelta,
        positionDelta,
        dropScore,
      };
    })
    .filter((row) => {
      const ctrDropped = row.ctrDelta < -CTR_THRESHOLD;
      const posDropped = row.positionDelta !== null && row.positionDelta > POS_THRESHOLD;
      return ctrDropped || posDropped;
    })
    .sort((a, b) => b.dropScore - a.dropScore)
    .slice(0, 20);

  console.error(
    `[ctr-trends] Found ${drops.length} page(s) with meaningful CTR/position drops for week ${targetWeek}`
  );

  return drops;
}

// ─── getZeroImpressionAlerts ──────────────────────────────────────────────────

/**
 * Find pages that previously had ≥ minPrevImpressions but now have exactly 0.
 * The existing getCtrTrends() misses these because it filters on prev_ctr NOT NULL
 * and a page at 0 impressions produces no CTR to compare.
 *
 * Returns { pages: [...], byTemplate: { templateName: { count, lostImpressions, pages } } }
 */
export async function getZeroImpressionAlerts(weekStart, minPrevImpressions = 100) {
  const supabase = makeClient();
  if (!supabase) return { pages: [], byTemplate: {} };

  const targetWeek = weekStart || isoMonday();

  const { data, error } = await supabase
    .from("seo_weekly_metrics")
    .select("page_url, template, prev_impressions, prev_clicks, prev_position, prev_ctr")
    .eq("week_start", targetWeek)
    .eq("impressions", 0)
    .gte("prev_impressions", minPrevImpressions);

  if (error) {
    console.error("[ctr-trends] Zero-impression alert query error:", error.message);
    return { pages: [], byTemplate: {} };
  }

  const pages = (data || [])
    .map(row => ({
      pageUrl: row.page_url,
      template: row.template,
      prevImpressions: row.prev_impressions,
      prevClicks: row.prev_clicks,
      prevPosition: row.prev_position,
      prevCtr: row.prev_ctr,
    }))
    .sort((a, b) => b.prevImpressions - a.prevImpressions);

  const byTemplate = {};
  for (const p of pages) {
    if (!byTemplate[p.template]) {
      byTemplate[p.template] = { count: 0, lostImpressions: 0, pages: [] };
    }
    byTemplate[p.template].count++;
    byTemplate[p.template].lostImpressions += p.prevImpressions;
    byTemplate[p.template].pages.push(p);
  }

  console.error(`[ctr-trends] Zero-impression alert: ${pages.length} page(s) dropped to 0`);
  return { pages, byTemplate };
}

// ─── getTemplateHealthSummary ─────────────────────────────────────────────────

/**
 * Aggregate this week's seo_weekly_metrics by template and compute week-over-week
 * impression/click/CTR/position deltas. Flags templates that lost >alertThreshold
 * of their impressions (default 25%, or 10% for watchlisted templates).
 *
 * @param {string}   weekStart       - ISO Monday date (defaults to current week)
 * @param {string[]} watchlistTemplates - templates with tighter 10% threshold
 */
export async function getTemplateHealthSummary(weekStart, watchlistTemplates = []) {
  const supabase = makeClient();
  if (!supabase) return [];

  const targetWeek = weekStart || isoMonday();

  const { data, error } = await supabase
    .from("seo_weekly_metrics")
    .select(
      "template, impressions, clicks, position, prev_impressions, prev_clicks, prev_position"
    )
    .eq("week_start", targetWeek);

  if (error) {
    console.error("[ctr-trends] Template health query error:", error.message);
    return [];
  }

  const groups = {};
  for (const row of data || []) {
    const t = row.template || "other";
    if (!groups[t]) {
      groups[t] = {
        template: t,
        pageCount: 0,
        newPageCount: 0,
        impressions: 0,
        clicks: 0,
        prevImpressions: 0,
        prevClicks: 0,
        positions: [],
        prevPositions: [],
      };
    }
    const g = groups[t];
    g.pageCount++;
    g.impressions += row.impressions || 0;
    g.clicks += row.clicks || 0;
    if (row.prev_impressions == null) {
      g.newPageCount++;
    } else {
      g.prevImpressions += row.prev_impressions || 0;
      g.prevClicks += row.prev_clicks || 0;
    }
    if (row.position != null) g.positions.push(row.position);
    if (row.prev_position != null) g.prevPositions.push(row.prev_position);
  }

  const watchSet = new Set(watchlistTemplates);

  return Object.values(groups)
    .map(g => {
      const impDelta =
        g.prevImpressions > 0
          ? (g.impressions - g.prevImpressions) / g.prevImpressions
          : null;
      const ctr = g.impressions > 0 ? g.clicks / g.impressions : 0;
      const prevCtr = g.prevImpressions > 0 ? g.prevClicks / g.prevImpressions : 0;
      const avgPos =
        g.positions.length > 0
          ? g.positions.reduce((a, b) => a + b, 0) / g.positions.length
          : null;
      const prevAvgPos =
        g.prevPositions.length > 0
          ? g.prevPositions.reduce((a, b) => a + b, 0) / g.prevPositions.length
          : null;
      const threshold = watchSet.has(g.template) ? 0.10 : 0.25;
      const alert = impDelta !== null && impDelta < -threshold;

      return {
        template: g.template,
        pageCount: g.pageCount,
        newPageCount: g.newPageCount,
        impressions: g.impressions,
        prevImpressions: g.prevImpressions,
        impDelta,
        clicks: g.clicks,
        prevClicks: g.prevClicks,
        ctr,
        prevCtr,
        avgPosition: avgPos,
        prevAvgPosition: prevAvgPos,
        onWatchlist: watchSet.has(g.template),
        alert,
      };
    })
    .sort((a, b) => b.impressions - a.impressions);
}

// ─── getPage1Crossings ────────────────────────────────────────────────────────

/**
 * Pages that were on page 1 (avg position ≤ 10) and are now on page 2+ (> 10).
 * Far more impactful than a 2-spot drift within page 1 — typically cuts impressions 70%+.
 * Also catches page-2 → page-3 crossings (position 20 → > 20).
 */
export async function getPage1Crossings(weekStart) {
  const supabase = makeClient();
  if (!supabase) return { page1: [], page2: [] };

  const targetWeek = weekStart || isoMonday();

  // Page 1 → page 2 crossings
  const { data: p1Data, error: p1Err } = await supabase
    .from("seo_weekly_metrics")
    .select(
      "page_url, template, impressions, clicks, position, prev_impressions, prev_position"
    )
    .eq("week_start", targetWeek)
    .lte("prev_position", 10)
    .gt("position", 10)
    .gte("prev_impressions", 50);

  // Page 2 → page 3 crossings
  const { data: p2Data, error: p2Err } = await supabase
    .from("seo_weekly_metrics")
    .select(
      "page_url, template, impressions, clicks, position, prev_impressions, prev_position"
    )
    .eq("week_start", targetWeek)
    .lte("prev_position", 20)
    .gt("position", 20)
    .gte("prev_impressions", 50);

  if (p1Err) console.error("[ctr-trends] Page-1 crossing query error:", p1Err.message);
  if (p2Err) console.error("[ctr-trends] Page-2 crossing query error:", p2Err.message);

  const mapRow = row => ({
    pageUrl: row.page_url,
    template: row.template,
    impressions: row.impressions,
    prevImpressions: row.prev_impressions,
    impDelta: row.prev_impressions > 0
      ? (row.impressions - row.prev_impressions) / row.prev_impressions
      : null,
    position: row.position,
    prevPosition: row.prev_position,
    positionDelta: row.position - row.prev_position,
  });

  const page1 = (p1Data || []).map(mapRow).sort((a, b) => b.prevImpressions - a.prevImpressions);
  const page2 = (p2Data || []).map(mapRow).sort((a, b) => b.prevImpressions - a.prevImpressions);

  console.error(`[ctr-trends] Page crossings: ${page1.length} fell off page 1, ${page2.length} fell off page 2`);
  return { page1, page2 };
}

// ─── getNewVsEstablished ──────────────────────────────────────────────────────

/**
 * Split this week's metrics into "established" pages (have prior snapshot data)
 * and "new" pages (first time appearing). Without this split, a wave of new
 * page indexing masks decay in established rankings.
 */
export async function getNewVsEstablished(weekStart) {
  const supabase = makeClient();
  if (!supabase) return null;

  const targetWeek = weekStart || isoMonday();

  const { data, error } = await supabase
    .from("seo_weekly_metrics")
    .select("impressions, clicks, prev_impressions, prev_clicks")
    .eq("week_start", targetWeek);

  if (error) {
    console.error("[ctr-trends] New vs established query error:", error.message);
    return null;
  }

  const est = { pages: 0, impressions: 0, clicks: 0, prevImpressions: 0, prevClicks: 0 };
  const fresh = { pages: 0, impressions: 0, clicks: 0 };

  for (const row of data || []) {
    if (row.prev_impressions == null) {
      fresh.pages++;
      fresh.impressions += row.impressions || 0;
      fresh.clicks += row.clicks || 0;
    } else {
      est.pages++;
      est.impressions += row.impressions || 0;
      est.clicks += row.clicks || 0;
      est.prevImpressions += row.prev_impressions || 0;
      est.prevClicks += row.prev_clicks || 0;
    }
  }

  const estImpDelta =
    est.prevImpressions > 0
      ? (est.impressions - est.prevImpressions) / est.prevImpressions
      : null;

  return {
    established: {
      pages: est.pages,
      impressions: est.impressions,
      prevImpressions: est.prevImpressions,
      impDelta: estImpDelta,
      clicks: est.clicks,
      prevClicks: est.prevClicks,
      ctr: est.impressions > 0 ? est.clicks / est.impressions : 0,
      prevCtr: est.prevImpressions > 0 ? est.prevClicks / est.prevImpressions : 0,
    },
    newPages: {
      pages: fresh.pages,
      impressions: fresh.impressions,
      clicks: fresh.clicks,
      ctr: fresh.impressions > 0 ? fresh.clicks / fresh.impressions : 0,
    },
  };
}

// ─── getDivergenceAlerts ──────────────────────────────────────────────────────

/**
 * Templates where impressions grew faster than clicks by more than 30pp.
 * This flags "junk impression" templates — pages appearing in search but not
 * earning clicks (thin programmatic pages, low-quality AI articles, etc.).
 * Computed from templateSummary (output of getTemplateHealthSummary).
 *
 * @param {Array} templateSummary - output of getTemplateHealthSummary()
 */
export function getDivergenceAlerts(templateSummary) {
  const DIVERGENCE_THRESHOLD = 0.30;

  if (!Array.isArray(templateSummary)) return [];

  return templateSummary
    .filter(t => {
      if (t.prevImpressions < 200 || t.impDelta == null) return false;
      if (t.prevClicks === 0) return t.impDelta > DIVERGENCE_THRESHOLD;
      const clickDelta = (t.clicks - t.prevClicks) / t.prevClicks;
      return t.impDelta - clickDelta > DIVERGENCE_THRESHOLD;
    })
    .map(t => {
      const clickDelta =
        t.prevClicks > 0 ? (t.clicks - t.prevClicks) / t.prevClicks : null;
      return {
        template: t.template,
        pageCount: t.pageCount,
        impressions: t.impressions,
        prevImpressions: t.prevImpressions,
        impDelta: t.impDelta,
        clicks: t.clicks,
        prevClicks: t.prevClicks,
        clickDelta,
        divergence: clickDelta != null ? t.impDelta - clickDelta : t.impDelta,
        ctr: t.ctr,
        prevCtr: t.prevCtr,
      };
    })
    .sort((a, b) => b.divergence - a.divergence);
}
