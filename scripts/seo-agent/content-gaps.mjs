/**
 * Content Gaps — westsiderealty.in
 *
 * Identifies content opportunities across four dimensions:
 *
 *   Part 1 — Quick Wins (rank 11–20, 300+ impressions):
 *     Pages one push from page 1 — grouped by template with estimated
 *     click uplift if we moved to position 5.
 *
 *   Part 2 — Thin Content / CTR Drag (rank < 10, CTR < 1.5%, 500+ impressions):
 *     Pages ranking well but with titles/descriptions that repel clicks.
 *
 *   Part 3 — Missing Locality Pages:
 *     Queries with locality intent that have 200+ impressions but no
 *     matching /{citySlug}/{localitySlug} page on the site.
 *
 *   Part 4 — Declining Pages:
 *     Pages that dropped > 3 positions on average comparing the last
 *     30 days vs the preceding 31–90 day window.
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY / GOOGLE_SITE_URL
 */

import {
  querySearchAnalytics,
  getPagePerformance,
  getQueriesForPage,
  daysAgo,
} from "./gsc-client.mjs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SITE_ORIGIN = "https://www.westsiderealty.in";

function stripOrigin(absoluteUrl) {
  return absoluteUrl.replace(SITE_ORIGIN, "");
}

function classifyUrl(absoluteUrl) {
  const path = stripOrigin(absoluteUrl);
  if (path === "" || path === "/") return "homepage";
  if (/\/projects\/[^/]+/.test(path)) return "project-detail";
  if (/\/micro-markets/.test(path)) return "micro-markets-hub";
  if (/^\/[a-z-]+\/[^/]+\/[^/]+$/.test(path)) return "micro-market-category";
  if (/^\/[a-z-]+\/[^/]+$/.test(path)) return "micro-market";
  if (/^\/[a-z-]+$/.test(path)) return "city-hub";
  if (/^\/blog\//.test(path)) return "blog-article";
  if (/^\/developers\//.test(path)) return "developer-profile";
  return "other";
}

// Estimated CTR at position 5 (conservative benchmark)
const CTR_AT_POS_5 = 0.065;

function estimatedClickGain(impressions, currentPosition, currentCtr) {
  const currentClicks = impressions * currentCtr;
  const projectedClicks = impressions * CTR_AT_POS_5;
  return Math.max(0, Math.round(projectedClicks - currentClicks));
}

// Rate-limit helper for sequential GSC per-page calls
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Part 1 — Quick Wins (rank 11–20) ────────────────────────────────────────

async function getQuickWins(startDate, endDate) {
  console.error("[content-gaps] Part 1: fetching page-level data for quick wins...");

  let data;
  try {
    data = await getPagePerformance(startDate, endDate, 2000);
  } catch (err) {
    console.error("[content-gaps] Part 1 GSC error:", err.message);
    return [];
  }

  const rows = data.rows || [];

  // Filter: position 11–20, 300+ impressions
  const candidates = rows.filter((row) => {
    const pos = row.position || 0;
    const imp = row.impressions || 0;
    return pos >= 11 && pos <= 20 && imp >= 300;
  });

  console.error(
    `[content-gaps] Part 1: ${candidates.length} candidate quick-win pages`
  );

  // Group by template
  const byTemplate = {};
  for (const row of candidates) {
    const url = row.keys[0];
    const template = classifyUrl(url);
    if (!byTemplate[template]) byTemplate[template] = [];
    byTemplate[template].push(row);
  }

  // For each group, build enriched page entries
  const quickWinPages = candidates
    .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
    .slice(0, 15)
    .map((row) => {
      const url = row.keys[0];
      const impressions = row.impressions || 0;
      const clicks = row.clicks || 0;
      const ctr = row.ctr || 0;
      const position = row.position || 0;
      return {
        url,
        path: stripOrigin(url),
        template: classifyUrl(url),
        impressions,
        clicks,
        ctr: parseFloat(ctr.toFixed(4)),
        position: parseFloat(position.toFixed(1)),
        estimatedClickGainToPos5: estimatedClickGain(impressions, position, ctr),
        topQueries: [], // populated below
      };
    });

  // Fetch top 3 queries per page
  console.error(
    `[content-gaps] Part 1: fetching top queries for ${quickWinPages.length} pages...`
  );
  for (const page of quickWinPages) {
    try {
      const qData = await getQueriesForPage(page.url, startDate, endDate, 3);
      page.topQueries = (qData.rows || []).map((r) => ({
        query: r.keys[0],
        impressions: r.impressions,
        clicks: r.clicks,
        position: parseFloat((r.position || 0).toFixed(1)),
      }));
    } catch (err) {
      console.error(
        `[content-gaps] Could not fetch queries for ${page.url}: ${err.message}`
      );
      page.topQueries = [];
    }
    await sleep(500);
  }

  // Template-level summary
  const templateSummary = {};
  for (const [template, rows] of Object.entries(byTemplate)) {
    const totalImpressions = rows.reduce((s, r) => s + (r.impressions || 0), 0);
    const avgPosition =
      rows.reduce((s, r) => s + (r.position || 0), 0) / rows.length;
    templateSummary[template] = {
      pageCount: rows.length,
      totalImpressions,
      avgPosition: parseFloat(avgPosition.toFixed(1)),
      estimatedTotalClickGain: rows.reduce(
        (s, r) =>
          s + estimatedClickGain(r.impressions || 0, r.position || 20, r.ctr || 0),
        0
      ),
    };
  }

  console.error(
    `[content-gaps] Part 1: ${quickWinPages.length} quick-win pages returned`
  );
  return { pages: quickWinPages, templateSummary };
}

// ─── Part 2 — Thin Content / CTR Drag ────────────────────────────────────────

async function getCtrOpportunities(startDate, endDate) {
  console.error("[content-gaps] Part 2: detecting thin content / CTR drag...");

  let data;
  try {
    data = await getPagePerformance(startDate, endDate, 2000);
  } catch (err) {
    console.error("[content-gaps] Part 2 GSC error:", err.message);
    return [];
  }

  const rows = data.rows || [];

  // position < 10, CTR < 1.5%, 500+ impressions
  const ctrDrag = rows
    .filter((row) => {
      const pos = row.position || 100;
      const ctr = row.ctr || 0;
      const imp = row.impressions || 0;
      return pos < 10 && ctr < 0.015 && imp >= 500;
    })
    .map((row) => {
      const url = row.keys[0];
      const impressions = row.impressions || 0;
      const clicks = row.clicks || 0;
      const ctr = row.ctr || 0;
      const position = row.position || 0;
      // Potential clicks if CTR improved to 2%
      const potentialClicks = Math.round(impressions * 0.02 - clicks);
      return {
        url,
        path: stripOrigin(url),
        template: classifyUrl(url),
        impressions,
        clicks,
        ctr: parseFloat(ctr.toFixed(4)),
        position: parseFloat(position.toFixed(1)),
        potentialClicksAt2PctCtr: Math.max(0, potentialClicks),
        issue: "CTR optimization priority",
        suggestion:
          "Rewrite title tag and meta description — page ranks well but isn't attracting clicks",
      };
    })
    .sort((a, b) => b.potentialClicksAt2PctCtr - a.potentialClicksAt2PctCtr);

  console.error(
    `[content-gaps] Part 2: ${ctrDrag.length} CTR-drag pages identified`
  );
  return ctrDrag;
}

// ─── Part 3 — Missing Locality Pages ─────────────────────────────────────────

// Patterns for extracting locality from real-estate queries
const LOCALITY_PATTERNS = [
  /\bflats?\s+in\s+([a-z][a-z\s-]{2,}?)(?:\s+hyderabad|\s*$)/i,
  /\bapartments?\s+(?:in\s+)?([a-z][a-z\s-]{2,}?)(?:\s+hyderabad|\s*$)/i,
  /\bproperty\s+in\s+([a-z][a-z\s-]{2,}?)(?:\s+hyderabad|\s*$)/i,
  /\bprojects?\s+in\s+([a-z][a-z\s-]{2,}?)(?:\s+hyderabad|\s*$)/i,
  /\bhomes?\s+in\s+([a-z][a-z\s-]{2,}?)(?:\s+hyderabad|\s*$)/i,
  /\bplots?\s+in\s+([a-z][a-z\s-]{2,}?)(?:\s+hyderabad|\s*$)/i,
  /\b([a-z][a-z\s-]{2,}?)\s+hyderabad\s+(?:flats?|apartments?|property)/i,
  /\bnew\s+projects?\s+in\s+([a-z][a-z\s-]{2,}?)(?:\s*$)/i,
];

const STOP_WORDS = new Set([
  "hyderabad", "telangana", "india", "for", "sale", "buy", "rent", "near",
  "under", "above", "below", "best", "top", "cheap", "affordable", "luxury",
  "premium", "new", "ready", "rera", "approved", "gated", "community",
]);

function extractLocality(query) {
  for (const pattern of LOCALITY_PATTERNS) {
    const match = query.match(pattern);
    if (match) {
      const raw = match[1].trim().toLowerCase();
      // Filter out stop words and very short matches
      if (raw.length < 3) continue;
      const parts = raw.split(/\s+/).filter((p) => !STOP_WORDS.has(p));
      if (parts.length === 0) continue;
      return parts.join("-").replace(/[^a-z0-9-]/g, "");
    }
  }
  return null;
}

function localityToPath(citySlug, localitySlug) {
  return `/${citySlug}/${localitySlug}`;
}

async function getMissingLocalityPages(startDate, endDate) {
  console.error("[content-gaps] Part 3: finding missing locality pages...");

  // Pull all query+page data so we know which pages exist
  let allData;
  try {
    allData = await querySearchAnalytics({
      startDate,
      endDate,
      dimensions: ["query", "page"],
      rowLimit: 5000,
      dataState: "final",
    });
  } catch (err) {
    console.error("[content-gaps] Part 3 GSC error:", err.message);
    return [];
  }

  const rows = allData.rows || [];

  // Build a set of all page paths the site has (as seen in GSC)
  const existingPaths = new Set(
    rows.map((r) => stripOrigin(r.keys[1]).toLowerCase())
  );

  // Tally impressions per extracted locality
  const localityImpressions = {};
  const localityQueries = {};

  for (const row of rows) {
    const query = (row.keys[0] || "").toLowerCase();
    const impressions = row.impressions || 0;
    if (impressions < 10) continue; // skip very low-impression queries early

    const locality = extractLocality(query);
    if (!locality) continue;

    localityImpressions[locality] = (localityImpressions[locality] || 0) + impressions;
    if (!localityQueries[locality]) localityQueries[locality] = [];
    localityQueries[locality].push({ query: row.keys[0], impressions });
  }

  // Determine the city slug (heuristic: most common city prefix in GSC pages)
  const citySlug = "hyderabad"; // primary market

  // Flag localities with 200+ impressions but no matching page
  const missing = [];
  for (const [locality, totalImpressions] of Object.entries(localityImpressions)) {
    if (totalImpressions < 200) continue;

    const expectedPath = localityToPath(citySlug, locality);
    const hasPage =
      existingPaths.has(expectedPath) ||
      existingPaths.has(expectedPath + "/");

    if (!hasPage) {
      const topQueries = (localityQueries[locality] || [])
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 5);

      missing.push({
        locality,
        expectedPath,
        suggestedUrl: `${SITE_ORIGIN}${expectedPath}`,
        totalImpressions,
        topQueries,
        recommendation: `Create micro-market page for ${locality} — ${totalImpressions} impressions with no landing page`,
      });
    }
  }

  missing.sort((a, b) => b.totalImpressions - a.totalImpressions);

  console.error(
    `[content-gaps] Part 3: ${missing.length} missing locality pages found`
  );
  return missing;
}

// ─── Part 4 — Declining Pages ─────────────────────────────────────────────────

async function getDecliningPages() {
  console.error("[content-gaps] Part 4: detecting position declines...");

  // Current period: last 0–30 days (with GSC 3-day lag)
  const currentEnd = daysAgo(3);
  const currentStart = daysAgo(33);

  // Comparison period: 31–90 days ago
  const prevEnd = daysAgo(34);
  const prevStart = daysAgo(93);

  let currentData, prevData;
  try {
    [currentData, prevData] = await Promise.all([
      getPagePerformance(currentStart, currentEnd, 2000),
      getPagePerformance(prevStart, prevEnd, 2000),
    ]);
  } catch (err) {
    console.error("[content-gaps] Part 4 GSC error:", err.message);
    return [];
  }

  const toMap = (rows) => {
    const m = new Map();
    for (const row of rows || []) {
      m.set(row.keys[0], {
        position: row.position || 0,
        impressions: row.impressions || 0,
        clicks: row.clicks || 0,
        ctr: row.ctr || 0,
      });
    }
    return m;
  };

  const currentMap = toMap(currentData.rows);
  const prevMap = toMap(prevData.rows);

  const declining = [];

  for (const [url, curr] of currentMap.entries()) {
    const prev = prevMap.get(url);
    if (!prev) continue; // page didn't exist or had no impressions in prior period

    const positionDrop = curr.position - prev.position; // positive = rank got worse
    if (positionDrop <= 3) continue; // only flag drops > 3 positions
    if (curr.impressions < 100) continue; // ignore very low-traffic pages

    declining.push({
      url,
      path: stripOrigin(url),
      template: classifyUrl(url),
      currentPosition: parseFloat(curr.position.toFixed(1)),
      previousPosition: parseFloat(prev.position.toFixed(1)),
      positionDrop: parseFloat(positionDrop.toFixed(1)),
      currentImpressions: curr.impressions,
      previousImpressions: prev.impressions,
      impressionChange: curr.impressions - prev.impressions,
      recommendation: `Position dropped ${positionDrop.toFixed(1)} places — review content freshness, internal links, and page speed`,
    });
  }

  declining.sort((a, b) => b.positionDrop - a.positionDrop);

  console.error(
    `[content-gaps] Part 4: ${declining.length} declining pages identified`
  );
  return declining;
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Run the full content gaps analysis.
 *
 * @returns {Promise<{
 *   quickWins: { pages: Array, templateSummary: Object },
 *   ctrOpportunities: Array,
 *   missingPages: Array,
 *   decliningPages: Array,
 *   summary: { totalQuickWins: number, totalMissing: number, totalDeclining: number }
 * }>}
 */
export async function runContentGaps() {
  // Shared date window for Parts 1–3
  const endDate = daysAgo(3);
  const startDate = daysAgo(93);

  console.error(
    `[content-gaps] Running full content gap analysis ${startDate} → ${endDate}...`
  );

  // Parts 1 and 2 share the same date window and can use the same underlying call,
  // but we run them independently so each has clear error handling.
  const [quickWinsResult, ctrOpportunities, missingPages, decliningPages] =
    await Promise.allSettled([
      getQuickWins(startDate, endDate),
      getCtrOpportunities(startDate, endDate),
      getMissingLocalityPages(startDate, endDate),
      getDecliningPages(),
    ]);

  const quickWins =
    quickWinsResult.status === "fulfilled"
      ? quickWinsResult.value
      : { pages: [], templateSummary: {} };

  const ctrOps =
    ctrOpportunities.status === "fulfilled" ? ctrOpportunities.value : [];

  const missing =
    missingPages.status === "fulfilled" ? missingPages.value : [];

  const declining =
    decliningPages.status === "fulfilled" ? decliningPages.value : [];

  if (quickWinsResult.status === "rejected") {
    console.error("[content-gaps] Part 1 failed:", quickWinsResult.reason?.message);
  }
  if (ctrOpportunities.status === "rejected") {
    console.error("[content-gaps] Part 2 failed:", ctrOpportunities.reason?.message);
  }
  if (missingPages.status === "rejected") {
    console.error("[content-gaps] Part 3 failed:", missingPages.reason?.message);
  }
  if (decliningPages.status === "rejected") {
    console.error("[content-gaps] Part 4 failed:", decliningPages.reason?.message);
  }

  const summary = {
    totalQuickWins: quickWins.pages?.length || 0,
    totalCtrOpportunities: ctrOps.length,
    totalMissing: missing.length,
    totalDeclining: declining.length,
  };

  console.error(
    `[content-gaps] Done. Quick wins: ${summary.totalQuickWins}, ` +
      `CTR drag: ${summary.totalCtrOpportunities}, ` +
      `Missing pages: ${summary.totalMissing}, ` +
      `Declining: ${summary.totalDeclining}`
  );

  return {
    quickWins,
    ctrOpportunities: ctrOps,
    missingPages: missing,
    decliningPages: declining,
    summary,
  };
}
