/**
 * SERP Features — westsiderealty.in
 *
 * Tracks which SERP features appear for our top keyword opportunities and
 * whether we own any of them. Pulls top 30 keywords by opportunity_score
 * from seo_keyword_gaps, runs SerpAPI for each, detects featured snippets,
 * PAA boxes, local packs, image packs, and our organic position.
 *
 * Required env vars:
 *   SERPAPI_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

const OUR_DOMAIN = "westsiderealty.in";

// ─── Supabase ─────────────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "[serp-features] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
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

// ─── Opportunity classifier ───────────────────────────────────────────────────

function classifyOpportunity({ hasFeaturedSnippet, weOwnFeaturedSnippet, hasPAA, ourPosition, hasLocalPack, weInTop3 }) {
  if (hasFeaturedSnippet && !weOwnFeaturedSnippet) return "steal-featured-snippet";
  if (hasPAA && (ourPosition == null || ourPosition > 5)) return "target-paa";
  if (hasLocalPack) return "optimize-local-pack";
  if (!weInTop3) return "improve-organic";
  return "maintain";
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Run SERP features detection for top 30 keywords by opportunity score.
 *
 * @returns {Promise<{
 *   keywordsChecked: number,
 *   featuredSnippetOpportunities: number,
 *   paaOpportunities: number,
 *   localPackPresence: number,
 *   weOwnSnippets: number,
 *   topOpportunities: Array<{keyword: string, opportunity: string, top_competitor: string}>,
 *   summary: string
 * }>}
 */
export async function runSerpFeatures() {
  const serpApiKey = process.env.SERPAPI_KEY;
  if (!serpApiKey) {
    throw new Error("[serp-features] Missing SERPAPI_KEY");
  }

  const supabase = getSupabase();

  // Pull top 30 keywords by opportunity_score
  const { data: keywords, error: fetchErr } = await supabase
    .from("seo_keyword_gaps")
    .select("keyword")
    .order("opportunity_score", { ascending: false })
    .limit(30);

  if (fetchErr) {
    throw new Error(`[serp-features] Failed to fetch keywords: ${fetchErr.message}`);
  }
  if (!keywords || keywords.length === 0) {
    console.error("[serp-features] No keywords found in seo_keyword_gaps");
    return {
      keywordsChecked: 0,
      featuredSnippetOpportunities: 0,
      paaOpportunities: 0,
      localPackPresence: 0,
      weOwnSnippets: 0,
      topOpportunities: [],
      summary: "No keywords to check.",
    };
  }

  console.error(`[serp-features] Checking ${keywords.length} keywords for SERP features...`);

  const weekStart = getMondayOfCurrentWeek();
  const upsertRows = [];

  let featuredSnippetOpportunities = 0;
  let paaOpportunities = 0;
  let localPackPresence = 0;
  let weOwnSnippets = 0;

  for (let i = 0; i < keywords.length; i++) {
    const keyword = keywords[i].keyword;

    if (i > 0) {
      await new Promise((r) => setTimeout(r, 1100));
    }

    let data;
    try {
      const params = new URLSearchParams({
        q: keyword,
        location: "Hyderabad,Telangana,India",
        gl: "in",
        hl: "en",
        api_key: serpApiKey,
        num: "10",
      });
      const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
      if (!res.ok) {
        console.error(`[serp-features] HTTP ${res.status} for "${keyword}"`);
        continue;
      }
      data = await res.json();
    } catch (err) {
      console.error(`[serp-features] SerpAPI failed for "${keyword}": ${err.message}`);
      continue;
    }

    const organic = data.organic_results || [];

    const hasFeaturedSnippet = Boolean(data.featured_snippet);
    const weOwnFeaturedSnippet =
      hasFeaturedSnippet &&
      (data.featured_snippet?.link || "").includes(OUR_DOMAIN);

    const hasAnswerBox = Boolean(data.answer_box);
    const hasPAA = Boolean(data.people_also_ask);
    const paaCount = hasPAA ? (data.people_also_ask || []).length : 0;
    const hasLocalPack = Boolean(data.local_results);
    const hasImagePack = Boolean(data.inline_images);

    const ourResult = organic.find((r) => (r.link || "").includes(OUR_DOMAIN));
    const ourOrgaicPosition = ourResult ? organic.indexOf(ourResult) + 1 : null;
    const weInTop3 = ourOrgaicPosition != null && ourOrgaicPosition <= 3;

    const topCompetitor = organic[0]?.displayed_link || null;

    const opportunity = classifyOpportunity({
      hasFeaturedSnippet,
      weOwnFeaturedSnippet,
      hasPAA,
      ourPosition: ourOrgaicPosition,
      hasLocalPack,
      weInTop3,
    });

    if (hasFeaturedSnippet && !weOwnFeaturedSnippet) featuredSnippetOpportunities++;
    if (hasPAA && (ourOrgaicPosition == null || ourOrgaicPosition > 5)) paaOpportunities++;
    if (hasLocalPack) localPackPresence++;
    if (weOwnFeaturedSnippet) weOwnSnippets++;

    console.error(
      `[serp-features] "${keyword}" → snippet:${hasFeaturedSnippet} paa:${hasPAA} local:${hasLocalPack} ourPos:${ourOrgaicPosition ?? "—"} opp:${opportunity}`
    );

    upsertRows.push({
      week_start: weekStart,
      keyword,
      has_featured_snippet: hasFeaturedSnippet,
      we_own_featured_snippet: weOwnFeaturedSnippet,
      has_people_also_ask: hasPAA,
      paa_count: paaCount,
      has_local_pack: hasLocalPack,
      has_image_pack: hasImagePack,
      has_answer_box: hasAnswerBox,
      we_in_top3: weInTop3,
      our_organic_position: ourOrgaicPosition,
      top_competitor: topCompetitor,
      opportunity,
    });
  }

  // Upsert all rows
  if (upsertRows.length > 0) {
    const { error: upsertErr } = await supabase
      .from("seo_serp_features")
      .upsert(upsertRows, { onConflict: "week_start,keyword" });

    if (upsertErr) {
      console.error(`[serp-features] Supabase upsert error: ${upsertErr.message}`);
    } else {
      console.error(`[serp-features] Upserted ${upsertRows.length} rows for week_start=${weekStart}`);
    }
  }

  const topOpportunities = upsertRows
    .filter((r) => r.opportunity !== "maintain")
    .slice(0, 10)
    .map((r) => ({
      keyword: r.keyword,
      opportunity: r.opportunity,
      top_competitor: r.top_competitor,
    }));

  const summary =
    `Checked ${upsertRows.length} keywords. ` +
    `Featured snippet opportunities: ${featuredSnippetOpportunities}, ` +
    `PAA opportunities: ${paaOpportunities}, ` +
    `local pack present: ${localPackPresence}, ` +
    `snippets we own: ${weOwnSnippets}.`;

  console.error(`[serp-features] ${summary}`);

  return {
    keywordsChecked: upsertRows.length,
    featuredSnippetOpportunities,
    paaOpportunities,
    localPackPresence,
    weOwnSnippets,
    topOpportunities,
    summary,
  };
}
