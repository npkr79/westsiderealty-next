/**
 * Position Tracker — westsiderealty.in
 *
 * Tracks weekly GSC keyword positions for 100 target Hyderabad real estate keywords.
 * Stores results in Supabase `seo_keyword_rankings` table, then compares week-over-week
 * to surface drops, improvements, and keywords with no GSC data.
 *
 * Required env vars:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY
 *   GOOGLE_SITE_URL (optional — defaults to https://www.westsiderealty.in)
 *
 * Table schema:
 *   seo_keyword_rankings (
 *     week_start DATE,
 *     keyword    TEXT,
 *     position   NUMERIC,
 *     impressions INT,
 *     clicks     INT,
 *     ctr        NUMERIC,
 *     url        TEXT,
 *     template   TEXT,
 *     UNIQUE(week_start, keyword)
 *   )
 */

import { createClient } from "@supabase/supabase-js";
import { querySearchAnalytics, daysAgo } from "./gsc-client.mjs";

// ─── 100 Target keywords ──────────────────────────────────────────────────────

const TARGET_KEYWORDS = [
  // Brand
  "remax westside realty",
  "westside realty hyderabad",

  // City-level
  "luxury flats hyderabad",
  "apartments hyderabad",
  "property in hyderabad",
  "new projects hyderabad",
  "rera approved projects hyderabad",
  "ready to move apartments hyderabad",
  "under construction apartments hyderabad",
  "buy flat in hyderabad",
  "residential projects hyderabad",
  "new launch projects hyderabad",
  "best residential projects hyderabad",

  // Investment
  "investment property hyderabad",
  "high return real estate hyderabad",
  "real estate investment hyderabad 2025",
  "best areas to invest hyderabad",
  "property investment hyderabad 2025",
  "best investment properties hyderabad",

  // Kokapet corridor (high-priority)
  "flats in kokapet",
  "luxury apartments kokapet",
  "projects in kokapet hyderabad",
  "kokapet real estate",
  "3bhk kokapet",
  "2bhk kokapet",
  "price per sqft kokapet",
  "kokapet apartments price",
  "new projects kokapet 2025",
  "upcoming projects kokapet 2025",

  // Financial District corridor
  "flats near financial district",
  "apartments near financial district hyderabad",
  "gachibowli apartments",
  "projects in gachibowli",
  "kondapur flats",
  "flats in gachibowli hyderabad",
  "luxury apartments financial district hyderabad",
  "2bhk gachibowli",
  "3bhk gachibowli",

  // Narsingi / Puppalaguda
  "flats in narsingi",
  "apartments narsingi hyderabad",
  "puppalaguda projects",
  "projects near outer ring road hyderabad",
  "narsingi real estate",
  "puppalaguda apartments hyderabad",

  // Other micro-markets
  "apartments in miyapur",
  "flats in bachupally",
  "manikonda apartments",
  "tellapur projects",
  "osman nagar flats",
  "rajendranagar flats",
  "flats in kukatpally",
  "apartments in kompally",
  "nizampet apartments",
  "hafeezpet flats hyderabad",
  "mokila projects hyderabad",
  "shankarpally flats",
  "adibatla apartments",

  // Developer searches
  "prestige projects hyderabad",
  "aparna constructions hyderabad",
  "my home hyderabad projects",
  "ramky group hyderabad",
  "sumadhura hyderabad projects",
  "incor group hyderabad",
  "the address developers hyderabad",
  "sattva group hyderabad",
  "provident housing hyderabad",
  "godrej properties hyderabad",

  // Property types
  "3bhk apartments hyderabad under 1 crore",
  "2bhk flats hyderabad under 70 lakhs",
  "luxury villas hyderabad",
  "gated community apartments hyderabad",
  "high rise apartments hyderabad",
  "studio apartments hyderabad",
  "4bhk luxury apartments hyderabad",
  "duplex apartments hyderabad",
  "penthouse hyderabad for sale",
  "villa plots hyderabad",

  // Goa
  "property in goa",
  "villa in goa",
  "flats in goa for sale",
  "north goa property",
  "luxury villas goa",
  "apartments in panaji",
  "goa beachfront property",

  // Commercial
  "commercial property hyderabad",
  "pre-leased property hyderabad",
  "office space hyderabad",
  "retail space hyderabad",

  // Long-tail buyer intent
  "best 3bhk project in hyderabad 2025",
  "affordable 2bhk hyderabad 2025",
  "possession 2025 apartments hyderabad",
  "possession 2026 apartments hyderabad",
  "rera registered projects hyderabad 2025",
  "low maintenance gated community hyderabad",
  "vaastu compliant flats hyderabad",
  "semi-furnished apartments hyderabad for sale",
  "west facing flats hyderabad",
  "hyderabad apartments with swimming pool",
  "child friendly apartment hyderabad",
  "hyderabad property price trends 2025",
];

// Verify we have 100 keywords
if (TARGET_KEYWORDS.length !== 100) {
  console.error(
    `[position-tracker] WARNING: Expected 100 target keywords, got ${TARGET_KEYWORDS.length}`
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "[position-tracker] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
    );
  }
  return createClient(url, key);
}

/**
 * Returns the Monday of the current ISO week as YYYY-MM-DD.
 */
function getMondayOfCurrentWeek() {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  return monday.toISOString().slice(0, 10);
}

/**
 * Returns the Monday of the previous ISO week as YYYY-MM-DD.
 */
function getMondayOfPreviousWeek() {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff - 7);
  return monday.toISOString().slice(0, 10);
}

/**
 * Infer the page template from a URL path.
 */
function inferTemplate(url) {
  if (!url) return "other";
  try {
    const pathname = new URL(url).pathname;
    if (pathname === "/" || pathname === "") return "homepage";
    if (pathname.includes("/projects/")) return "project-detail";
    if (pathname.includes("/micro-markets")) return "micro-market-hub";
    if (pathname.includes("/developers/")) return "developer-profile";
    if (pathname.includes("/blog/")) return "blog-article";
    if (pathname.includes("/insights/")) return "insight-article";
    if (pathname.includes("/opportunities")) return "opportunities";
    // /{citySlug}/{microMarketSlug} — two path segments
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 1) return "city-hub";
    if (parts.length === 2) return "micro-market";
    return "other";
  } catch {
    return "other";
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Run the position tracker.
 *
 * 1. Fetches GSC search analytics for the last 7 days (all queries, rowLimit 5000)
 * 2. Matches each target keyword (case-insensitive exact match)
 * 3. Upserts into seo_keyword_rankings for the current week
 * 4. Compares to previous week to find drops and improvements
 * 5. Returns structured result
 *
 * @returns {{
 *   keywordsTracked: number,
 *   keywordsFound: number,
 *   drops: Array<{keyword: string, previousPosition: number, currentPosition: number, delta: number}>,
 *   improvements: Array<{keyword: string, previousPosition: number, currentPosition: number, delta: number}>,
 *   notRanking: string[]
 * }}
 */
export async function runPositionTracker() {
  const result = {
    keywordsTracked: TARGET_KEYWORDS.length,
    keywordsFound: 0,
    drops: [],
    improvements: [],
    notRanking: [],
  };

  // ── 1. Fetch GSC data ─────────────────────────────────────────────────────

  const endDate = daysAgo(3); // GSC has ~3 day data lag
  const startDate = daysAgo(9); // ~7 days of data ending at endDate

  let gscRows = [];
  try {
    console.error(
      `[position-tracker] Fetching GSC data from ${startDate} to ${endDate} (rowLimit 5000)...`
    );
    const response = await querySearchAnalytics({
      startDate,
      endDate,
      dimensions: ["query", "page"],
      rowLimit: 5000,
      dataState: "final",
    });
    gscRows = response.rows || [];
    console.error(`[position-tracker] GSC returned ${gscRows.length} rows`);
  } catch (err) {
    console.error("[position-tracker] Failed to fetch GSC data:", err.message);
    // Return early — no point continuing without GSC data
    return result;
  }

  // Build a map: lowercase keyword → best-position row
  // (GSC may return multiple rows for the same query if we requested page dimension)
  const gscByKeyword = new Map();
  for (const row of gscRows) {
    // row.keys = [query, page]
    const query = (row.keys?.[0] || "").toLowerCase().trim();
    if (!query) continue;

    if (!gscByKeyword.has(query)) {
      gscByKeyword.set(query, {
        position: row.position,
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: row.ctr,
        url: row.keys?.[1] || null,
      });
    } else {
      // Keep the row with the best (lowest) position
      const existing = gscByKeyword.get(query);
      if (row.position < existing.position) {
        gscByKeyword.set(query, {
          position: row.position,
          impressions: existing.impressions + (row.impressions || 0),
          clicks: existing.clicks + (row.clicks || 0),
          ctr: row.ctr,
          url: row.keys?.[1] || existing.url,
        });
      } else {
        // Still accumulate impressions/clicks
        existing.impressions += row.impressions || 0;
        existing.clicks += row.clicks || 0;
      }
    }
  }

  // ── 2. Match target keywords ──────────────────────────────────────────────

  const weekStart = getMondayOfCurrentWeek();
  const upsertRows = [];
  const notRanking = [];

  for (const keyword of TARGET_KEYWORDS) {
    const normalised = keyword.toLowerCase().trim();
    const gscData = gscByKeyword.get(normalised);

    if (gscData) {
      result.keywordsFound++;
      upsertRows.push({
        week_start: weekStart,
        keyword: normalised,
        position: Math.round(gscData.position * 10) / 10, // 1 decimal
        impressions: gscData.impressions || 0,
        clicks: gscData.clicks || 0,
        ctr: Math.round((gscData.ctr || 0) * 10000) / 10000, // 4 decimal places
        url: gscData.url || null,
        template: inferTemplate(gscData.url),
      });
    } else {
      notRanking.push(normalised);
    }
  }

  result.notRanking = notRanking;
  console.error(
    `[position-tracker] Matched ${result.keywordsFound}/${TARGET_KEYWORDS.length} keywords. ` +
    `Not ranking: ${notRanking.length}`
  );

  // ── 3. Upsert into Supabase ───────────────────────────────────────────────

  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    console.error("[position-tracker] Failed to initialise Supabase:", err.message);
    return result;
  }

  if (upsertRows.length > 0) {
    try {
      const { error: upsertErr } = await supabase
        .from("seo_keyword_rankings")
        .upsert(upsertRows, { onConflict: "week_start,keyword" });

      if (upsertErr) {
        console.error("[position-tracker] Upsert error:", upsertErr.message);
      } else {
        console.error(
          `[position-tracker] Upserted ${upsertRows.length} rows for week_start=${weekStart}`
        );
      }
    } catch (err) {
      console.error("[position-tracker] Unexpected error during upsert:", err.message);
    }
  }

  // ── 4. Compare to previous week ───────────────────────────────────────────

  const prevWeekStart = getMondayOfPreviousWeek();
  console.error(
    `[position-tracker] Fetching previous week data (week_start=${prevWeekStart})...`
  );

  let prevRows = [];
  try {
    const { data, error: fetchErr } = await supabase
      .from("seo_keyword_rankings")
      .select("keyword, position")
      .eq("week_start", prevWeekStart)
      .in(
        "keyword",
        TARGET_KEYWORDS.map((k) => k.toLowerCase().trim())
      );

    if (fetchErr) {
      console.error("[position-tracker] Error fetching previous week data:", fetchErr.message);
    } else {
      prevRows = data || [];
      console.error(`[position-tracker] Previous week rows: ${prevRows.length}`);
    }
  } catch (err) {
    console.error("[position-tracker] Unexpected error fetching previous week:", err.message);
  }

  // Build a map of previous positions
  const prevByKeyword = new Map();
  for (const row of prevRows) {
    prevByKeyword.set(row.keyword, row.position);
  }

  // Compare current week upsertRows to previous
  const DROP_THRESHOLD = 3; // positions dropped to qualify as an alert

  for (const row of upsertRows) {
    const prevPos = prevByKeyword.get(row.keyword);
    if (prevPos == null) continue; // no previous data — skip comparison

    const delta = row.position - prevPos; // positive = dropped (worse), negative = improved

    if (delta > DROP_THRESHOLD) {
      result.drops.push({
        keyword: row.keyword,
        previousPosition: prevPos,
        currentPosition: row.position,
        delta: Math.round(delta * 10) / 10,
      });
    } else if (delta < -DROP_THRESHOLD) {
      result.improvements.push({
        keyword: row.keyword,
        previousPosition: prevPos,
        currentPosition: row.position,
        delta: Math.round(delta * 10) / 10, // negative means improved
      });
    }
  }

  // Sort drops worst-first (largest delta = biggest drop)
  result.drops.sort((a, b) => b.delta - a.delta);
  // Sort improvements best-first (most negative delta = biggest gain)
  result.improvements.sort((a, b) => a.delta - b.delta);

  console.error(
    `[position-tracker] Drops (>${DROP_THRESHOLD} pos): ${result.drops.length}, ` +
    `Improvements (>${DROP_THRESHOLD} pos): ${result.improvements.length}`
  );

  if (result.drops.length > 0) {
    console.error("[position-tracker] Top drops:");
    for (const d of result.drops.slice(0, 5)) {
      console.error(
        `  "${d.keyword}": pos ${d.previousPosition} → ${d.currentPosition} (+${d.delta})`
      );
    }
  }

  if (result.improvements.length > 0) {
    console.error("[position-tracker] Top improvements:");
    for (const d of result.improvements.slice(0, 5)) {
      console.error(
        `  "${d.keyword}": pos ${d.previousPosition} → ${d.currentPosition} (${d.delta})`
      );
    }
  }

  return result;
}
