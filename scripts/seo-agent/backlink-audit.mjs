/**
 * Backlink Audit — westsiderealty.in
 *
 * Free backlink proxy using SerpAPI site: and mention queries.
 * No paid backlink API required.
 *
 * What it does:
 *   1. Count our indexed pages via site:westsiderealty.in
 *   2. Brand mention search: "westsiderealty.in" -site:westsiderealty.in
 *   3. Competitor indexed page counts (5 domains) for content scale comparison
 *   4. Internal linkable asset count from Supabase (active projects + micro_markets)
 *
 * Required env vars:
 *   SERPAPI_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

const OUR_DOMAIN = "westsiderealty.in";

const COMPETITOR_QUERIES = [
  "99acres.com/hyderabad",
  "squareyards.com/hyderabad",
  "magicbricks.com/property-for-sale/hyderabad",
  "housing.com/in/buy/hyderabad",
  "nobroker.in/property/sale/hyderabad-city",
];

// ─── Supabase ─────────────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "[backlink-audit] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key);
}

// ─── Week helper ──────────────────────────────────────────────────────────────

function getMondayOfCurrentWeek() {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  return monday.toISOString().slice(0, 10);
}

// ─── SerpAPI helper ───────────────────────────────────────────────────────────

async function serpSearch(query, serpApiKey) {
  const params = new URLSearchParams({
    q: query,
    location: "Hyderabad,Telangana,India",
    gl: "in",
    hl: "en",
    api_key: serpApiKey,
    num: "10",
  });
  const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Step 1: Our indexed pages ────────────────────────────────────────────────

async function getOurIndexedPages(serpApiKey) {
  try {
    const data = await serpSearch(`site:${OUR_DOMAIN}`, serpApiKey);
    const total = data.search_information?.total_results ?? 0;
    console.error(`[backlink-audit] Our indexed pages: ${total}`);
    return total;
  } catch (err) {
    console.error(`[backlink-audit] Failed to get our indexed pages: ${err.message}`);
    return 0;
  }
}

// ─── Step 2: Brand mentions ───────────────────────────────────────────────────

async function getBrandMentions(serpApiKey) {
  try {
    const data = await serpSearch(
      `"${OUR_DOMAIN}" -site:${OUR_DOMAIN}`,
      serpApiKey
    );
    const organic = data.organic_results || [];
    const domains = organic.map((r) => {
      try {
        return new URL(r.link || "").hostname.replace(/^www\./, "");
      } catch {
        return r.displayed_link || "";
      }
    }).filter(Boolean);

    console.error(
      `[backlink-audit] Brand mentions: ${organic.length}, domains: ${domains.join(", ")}`
    );
    return { count: organic.length, domains };
  } catch (err) {
    console.error(`[backlink-audit] Failed to get brand mentions: ${err.message}`);
    return { count: 0, domains: [] };
  }
}

// ─── Step 3: Competitor indexed pages ─────────────────────────────────────────

async function getCompetitorScale(serpApiKey) {
  const results = [];

  for (const query of COMPETITOR_QUERIES) {
    await new Promise((r) => setTimeout(r, 1100));
    try {
      const data = await serpSearch(`site:${query}`, serpApiKey);
      const total = data.search_information?.total_results ?? 0;
      console.error(`[backlink-audit] site:${query} → ${total} pages`);
      results.push({ domain: query, indexedPages: total });
    } catch (err) {
      console.error(`[backlink-audit] Failed for site:${query}: ${err.message}`);
      results.push({ domain: query, indexedPages: 0 });
    }
  }

  return results;
}

// ─── Step 4: Linkable assets from Supabase ────────────────────────────────────

async function getLinkableAssets(supabase) {
  try {
    const [projectsRes, marketsRes] = await Promise.all([
      supabase
        .from("listing_project_detail_enriched_mv")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("micro_markets")
        .select("*", { count: "exact", head: true }),
    ]);

    const projectCount = projectsRes.count ?? 0;
    const marketCount = marketsRes.count ?? 0;
    const total = projectCount + marketCount;

    console.error(
      `[backlink-audit] Linkable assets: ${projectCount} projects + ${marketCount} micro-markets = ${total}`
    );
    return total;
  } catch (err) {
    console.error(`[backlink-audit] Failed to count linkable assets: ${err.message}`);
    return 0;
  }
}

// ─── Supabase upsert ──────────────────────────────────────────────────────────

async function upsertMetrics(supabase, metrics) {
  const weekStart = getMondayOfCurrentWeek();
  const { error } = await supabase.from("seo_backlink_metrics").upsert(
    {
      week_start: weekStart,
      our_indexed_pages: metrics.ourIndexedPages,
      brand_mentions: metrics.brandMentions,
      brand_mention_domains: metrics.topMentioningDomains,
      competitor_scale: metrics.competitorScale,
      total_linkable_assets: metrics.linkableAssets,
    },
    { onConflict: "week_start" }
  );

  if (error) {
    console.error(`[backlink-audit] Supabase upsert error: ${error.message}`);
  } else {
    console.error(`[backlink-audit] Upserted metrics for week_start=${weekStart}`);
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Run the backlink audit using SerpAPI site: and mention queries.
 *
 * @returns {Promise<{
 *   ourIndexedPages: number,
 *   brandMentions: number,
 *   topMentioningDomains: string[],
 *   competitorScale: Array<{domain: string, indexedPages: number}>,
 *   linkableAssets: number,
 *   summary: string
 * }>}
 */
export async function runBacklinkAudit() {
  const serpApiKey = process.env.SERPAPI_KEY;
  if (!serpApiKey) {
    throw new Error("[backlink-audit] Missing SERPAPI_KEY");
  }

  const supabase = getSupabase();

  // Step 1: our indexed pages
  const ourIndexedPages = await getOurIndexedPages(serpApiKey);

  // Step 2: brand mentions (with rate limit delay)
  await new Promise((r) => setTimeout(r, 1100));
  const { count: brandMentions, domains: topMentioningDomains } =
    await getBrandMentions(serpApiKey);

  // Step 3: competitor scale (delays inside)
  const competitorScale = await getCompetitorScale(serpApiKey);

  // Step 4: linkable assets (Supabase, no rate limit needed)
  const linkableAssets = await getLinkableAssets(supabase);

  const largestCompetitor = competitorScale.reduce(
    (max, c) => (c.indexedPages > max.indexedPages ? c : max),
    { domain: "none", indexedPages: 0 }
  );

  const summary =
    `We have ${ourIndexedPages} indexed pages and ${brandMentions} brand mentions. ` +
    `Largest competitor (${largestCompetitor.domain}) has ${largestCompetitor.indexedPages} indexed pages. ` +
    `We have ${linkableAssets} linkable assets (projects + micro-markets).`;

  console.error(`[backlink-audit] ${summary}`);

  const result = {
    ourIndexedPages,
    brandMentions,
    topMentioningDomains,
    competitorScale,
    linkableAssets,
    summary,
  };

  await upsertMetrics(supabase, result);

  return result;
}
