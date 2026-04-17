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
