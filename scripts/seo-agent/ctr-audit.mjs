/**
 * CTR Audit — westsiderealty.in
 *
 * Pulls 28-day GSC data and identifies pages where CTR is significantly
 * below what their average position should achieve.
 *
 * Priority score = impressions × max(0, EXPECTED_CTR(position) − actual_ctr)
 * This catches pages that are:
 *   - Highly visible (many impressions) but not converting to clicks
 *   - Ranking reasonably well but underperforming vs position benchmarks
 *
 * Also pulls the top queries for each priority page so the meta optimizer
 * can write titles/descriptions that include the actual search terms people use.
 */

import {
  getPagePerformance,
  getQueriesForPage,
  getTopQueries,
  daysAgo,
} from "./gsc-client.mjs";

// CTR benchmarks by average position (SmartInsights / Ahrefs data)
// These are conservative to avoid over-flagging
const POSITION_CTR_BENCHMARKS = [
  { maxPos: 1,  expectedCtr: 0.28 },
  { maxPos: 2,  expectedCtr: 0.15 },
  { maxPos: 3,  expectedCtr: 0.11 },
  { maxPos: 4,  expectedCtr: 0.08 },
  { maxPos: 5,  expectedCtr: 0.065 },
  { maxPos: 6,  expectedCtr: 0.053 },
  { maxPos: 7,  expectedCtr: 0.043 },
  { maxPos: 8,  expectedCtr: 0.037 },
  { maxPos: 9,  expectedCtr: 0.032 },
  { maxPos: 10, expectedCtr: 0.028 },
  { maxPos: 15, expectedCtr: 0.016 },
  { maxPos: 20, expectedCtr: 0.010 },
  { maxPos: 30, expectedCtr: 0.005 },
  { maxPos: Infinity, expectedCtr: 0.002 },
];

function expectedCtrForPosition(position) {
  for (const benchmark of POSITION_CTR_BENCHMARKS) {
    if (position <= benchmark.maxPos) return benchmark.expectedCtr;
  }
  return 0.002;
}

// Only surface pages where the CTR gap is meaningful
const MIN_IMPRESSIONS = 200;     // ignore low-traffic pages
const MIN_CTR_GAP = 0.005;       // must be at least 0.5% below expected
const MAX_POSITION = 30;          // ignore pages buried past page 3
const TOP_N_PAGES = 25;           // how many priority pages to return
const QUERIES_PER_PAGE = 15;      // how many top queries to fetch per page

/**
 * URL → page template classifier for westsiderealty.in
 * Returns a template identifier + relative path.
 */
export function classifyUrl(absoluteUrl) {
  const url = absoluteUrl.replace("https://www.westsiderealty.in", "");

  if (url === "" || url === "/") return { template: "homepage", path: "/" };
  if (/^\/hyderabad\/buy\/[^/]+$/.test(url)) return { template: "property-listing", path: url };
  if (/^\/hyderabad\/projects\/[^/]+$/.test(url)) return { template: "project-detail", path: url };
  if (/^\/[a-z-]+\/projects\/[^/]+$/.test(url)) return { template: "project-detail", path: url };
  if (/^\/[a-z-]+\/projects$/.test(url)) return { template: "city-projects-index", path: url };
  if (/^\/[a-z-]+\/micro-markets$/.test(url)) return { template: "micro-markets-hub", path: url };
  if (/^\/[a-z-]+\/[^/]+\/[^/]+$/.test(url)) return { template: "micro-market-category", path: url };
  if (/^\/[a-z-]+\/[^/]+$/.test(url)) return { template: "micro-market", path: url };
  if (/^\/[a-z-]+$/.test(url)) return { template: "city-hub", path: url };
  if (/^\/homes\/[^/]+$/.test(url)) return { template: "smart-link", path: url };
  if (/^\/blog\/[^/]+$/.test(url)) return { template: "blog-article", path: url };
  if (/^\/insights\/[^/]+$/.test(url)) return { template: "insight-article", path: url };
  if (/^\/developers\/[^/]+$/.test(url)) return { template: "developer-profile", path: url };
  if (/^\/portfolio(\/[^/]+)?$/.test(url)) return { template: "portfolio", path: url };

  return { template: "other", path: url };
}

/**
 * Run the CTR audit over the last 28 days.
 *
 * @param {{ fetchQueriesPerPage?: boolean }} options
 * @returns {Promise<CtrAuditResult>}
 */
export async function runCtrAudit({ fetchQueriesPerPage = true } = {}) {
  const endDate = daysAgo(3);    // GSC data lags 3 days
  const startDate = daysAgo(31); // 28-day window

  console.error(`[ctr-audit] Fetching page performance ${startDate} → ${endDate}...`);

  let pageData;
  try {
    pageData = await getPagePerformance(startDate, endDate, 1000);
  } catch (err) {
    console.error("[ctr-audit] Failed to fetch GSC data:", err.message);
    return { error: err.message, priorityPages: [], siteMetrics: null, templateBreakdown: {} };
  }

  const rows = pageData.rows || [];
  console.error(`[ctr-audit] Got ${rows.length} pages from GSC`);

  // ── Site-level summary ────────────────────────────────────────────────────
  const siteMetrics = rows.reduce(
    (acc, row) => ({
      totalClicks: acc.totalClicks + (row.clicks || 0),
      totalImpressions: acc.totalImpressions + (row.impressions || 0),
    }),
    { totalClicks: 0, totalImpressions: 0 }
  );
  siteMetrics.siteCtr =
    siteMetrics.totalImpressions > 0
      ? siteMetrics.totalClicks / siteMetrics.totalImpressions
      : 0;

  console.error(
    `[ctr-audit] Site: ${siteMetrics.totalClicks} clicks / ${siteMetrics.totalImpressions} impressions ` +
    `(${(siteMetrics.siteCtr * 100).toFixed(2)}% CTR)`
  );

  // ── Compute priority score per page ──────────────────────────────────────
  const scored = rows
    .filter((row) => {
      const impressions = row.impressions || 0;
      const position = row.position || 100;
      return impressions >= MIN_IMPRESSIONS && position <= MAX_POSITION;
    })
    .map((row) => {
      const impressions = row.impressions || 0;
      const clicks = row.clicks || 0;
      const ctr = row.ctr || 0;
      const position = row.position || 100;
      const expected = expectedCtrForPosition(position);
      const ctrGap = expected - ctr;
      const priorityScore = ctrGap > MIN_CTR_GAP ? impressions * ctrGap : 0;

      return {
        url: row.keys[0],
        impressions,
        clicks,
        ctr: parseFloat(ctr.toFixed(4)),
        position: parseFloat(position.toFixed(1)),
        expectedCtr: expected,
        ctrGap: parseFloat(ctrGap.toFixed(4)),
        priorityScore: parseFloat(priorityScore.toFixed(1)),
        ...classifyUrl(row.keys[0]),
      };
    })
    .filter((p) => p.priorityScore > 0)
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, TOP_N_PAGES);

  // ── Template breakdown (aggregate CTR gap by template type) ──────────────
  const templateBreakdown = {};
  for (const row of rows) {
    const { template } = classifyUrl(row.keys[0]);
    if (!templateBreakdown[template]) {
      templateBreakdown[template] = {
        pageCount: 0,
        totalImpressions: 0,
        totalClicks: 0,
        avgCtr: 0,
        avgExpectedCtr: 0,
      };
    }
    const t = templateBreakdown[template];
    t.pageCount++;
    t.totalImpressions += row.impressions || 0;
    t.totalClicks += row.clicks || 0;
  }
  for (const [, t] of Object.entries(templateBreakdown)) {
    t.avgCtr = t.totalImpressions > 0 ? t.totalClicks / t.totalImpressions : 0;
    t.avgCtr = parseFloat(t.avgCtr.toFixed(4));
  }

  // ── Fetch top queries per priority page ──────────────────────────────────
  if (fetchQueriesPerPage && scored.length > 0) {
    console.error(`[ctr-audit] Fetching top queries for ${scored.length} priority pages...`);

    for (const page of scored) {
      try {
        const queryData = await getQueriesForPage(page.url, startDate, endDate, QUERIES_PER_PAGE);
        page.topQueries = (queryData.rows || []).map((r) => ({
          query: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: parseFloat((r.ctr || 0).toFixed(4)),
          position: parseFloat((r.position || 0).toFixed(1)),
        }));
        console.error(`  [ctr-audit] ${page.url} → ${page.topQueries.length} queries`);
      } catch (err) {
        console.error(`  [ctr-audit] Could not fetch queries for ${page.url}: ${err.message}`);
        page.topQueries = [];
      }

      // Avoid hitting rate limits (GSC allows ~1 req/sec on free accounts)
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // ── Also pull site-level top queries for context ──────────────────────────
  let topSiteQueries = [];
  try {
    const topQData = await getTopQueries(startDate, endDate, 50);
    topSiteQueries = (topQData.rows || []).map((r) => ({
      query: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: parseFloat((r.ctr || 0).toFixed(4)),
      position: parseFloat((r.position || 0).toFixed(1)),
    }));
  } catch (err) {
    console.error("[ctr-audit] Could not fetch top site queries:", err.message);
  }

  console.error(`[ctr-audit] Done. ${scored.length} priority pages identified.`);

  return {
    dateRange: { startDate, endDate },
    siteMetrics,
    templateBreakdown,
    topSiteQueries,
    priorityPages: scored,
  };
}
