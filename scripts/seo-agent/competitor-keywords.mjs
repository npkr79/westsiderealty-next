/**
 * Competitor Keywords — westsiderealty.in
 *
 * Finds keyword opportunities where we rank poorly (pos 11–50) or don't
 * appear at all, using two complementary strategies:
 *
 * Strategy A — GSC-based (always runs):
 *   Pull queries with position 11–50 and 100+ impressions, score by
 *   opportunity gap, classify by page template, upsert top 200 into
 *   the seo_keyword_gaps Supabase table.
 *
 * Strategy B — SerpAPI (only if SERPAPI_KEY is set):
 *   Check 30 target Hyderabad real-estate keywords, find competitors
 *   ranking in top 3, flag gaps where we don't appear in top 10,
 *   and enrich existing seo_keyword_gaps records with competitor_urls.
 *
 * Required env vars:
 *   SUPABASE_URL               — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY  — Service role key (bypasses RLS)
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY / GOOGLE_SITE_URL
 *                              — passed through to gsc-client
 * Optional:
 *   SERPAPI_KEY                — enables Strategy B
 */

import { createClient } from "@supabase/supabase-js";
import { querySearchAnalytics, daysAgo } from "./gsc-client.mjs";

// ─── Supabase ─────────────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "[competitor-keywords] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key);
}

// ─── URL / template classifier ───────────────────────────────────────────────

function classifyUrl(absoluteUrl) {
  const path = absoluteUrl.replace(/^https?:\/\/[^/]+/, "");

  if (/\/projects\/[^/]+/.test(path)) return "project-detail";
  if (/\/micro-markets/.test(path)) return "micro-market";
  if (/^\/[a-z-]+\/[^/]+$/.test(path)) return "micro-market"; // /{city}/{market}
  if (/^\/blog\//.test(path)) return "blog-article";
  if (/^\/[a-z-]+$/.test(path)) return "city-hub";
  return "general";
}

function recommendedAction(template, keyword) {
  switch (template) {
    case "project-detail":
      return `Add keyword to title/H1 of project page — check if project data matches intent`;
    case "micro-market":
      return `Update micro-market page title and first paragraph to include this keyword`;
    case "blog-article":
      return `Create or update blog post targeting this keyword`;
    case "city-hub":
      return `Add this keyword to city hub page meta and H2 sections`;
    default:
      return `Review page relevance for "${keyword}" and improve title/meta description`;
  }
}

// ─── Strategy A — GSC-based opportunities ────────────────────────────────────

async function runGscStrategy() {
  const endDate = daysAgo(3);
  const startDate = daysAgo(93); // 90-day window (GSC lags 3 days)

  console.error(
    `[competitor-keywords] GSC: fetching query+page data ${startDate} → ${endDate}...`
  );

  let data;
  try {
    data = await querySearchAnalytics({
      startDate,
      endDate,
      dimensions: ["query", "page"],
      rowLimit: 5000,
      dataState: "final",
    });
  } catch (err) {
    console.error("[competitor-keywords] GSC fetch failed:", err.message);
    return [];
  }

  const rows = data.rows || [];
  console.error(`[competitor-keywords] GSC returned ${rows.length} rows`);

  // Filter: position 11–50, 100+ impressions
  const opportunities = rows
    .filter((row) => {
      const pos = row.position || 0;
      const imp = row.impressions || 0;
      return pos >= 11 && pos <= 50 && imp >= 100;
    })
    .map((row) => {
      const keyword = row.keys[0];
      const ourUrl = row.keys[1];
      const position = row.position;
      const impressions = row.impressions;
      const clicks = row.clicks || 0;
      const ctr = row.ctr || 0;

      // Higher position gap and more impressions = bigger opportunity
      const opportunityScore = impressions * (position - 1) / 10;

      const template = classifyUrl(ourUrl);

      return {
        keyword,
        our_position: parseFloat(position.toFixed(1)),
        our_url: ourUrl,
        impressions,
        clicks,
        ctr: parseFloat(ctr.toFixed(4)),
        opportunity_score: parseFloat(opportunityScore.toFixed(1)),
        recommended_template: template,
        recommended_action: recommendedAction(template, keyword),
      };
    })
    .sort((a, b) => b.opportunity_score - a.opportunity_score)
    .slice(0, 200);

  console.error(
    `[competitor-keywords] GSC: ${opportunities.length} opportunities after filtering`
  );
  return opportunities;
}

// ─── Strategy B — SerpAPI competitor check ───────────────────────────────────

const TARGET_KEYWORDS = [
  "luxury flats in kokapet hyderabad",
  "3bhk apartments hyderabad",
  "rera approved projects hyderabad",
  "investment property hyderabad",
  "flats near financial district hyderabad",
  "ready to move flats hyderabad",
  "new projects in kondapur",
  "apartments in narsingi",
  "property in gachibowli under 1 crore",
  "2bhk flats in hyderabad under 70 lakhs",
  "new residential projects hyderabad 2024",
  "flats in tellapur hyderabad",
  "premium apartments in hyderabad",
  "buy apartment in manikonda",
  "flats near hitech city hyderabad",
  "gated community flats hyderabad",
  "affordable housing hyderabad",
  "plots in hyderabad outskirts",
  "new launch projects in financial district",
  "under construction flats hyderabad",
  "remax westside realty hyderabad",
  "flats in puppalaguda hyderabad",
  "apartments in mokila hyderabad",
  "property investment kokapet",
  "flats in raidurg hyderabad",
  "west hyderabad real estate",
  "best localities to buy flat in hyderabad",
  "flats near outer ring road hyderabad",
  "new projects in nallagandla",
  "hyderabad real estate 2024",
];

const OUR_DOMAIN = "westsiderealty.in";

async function runSerpApiStrategy(serpApiKey) {
  console.error(
    `[competitor-keywords] SerpAPI: checking ${TARGET_KEYWORDS.length} target keywords...`
  );

  const results = [];

  for (const keyword of TARGET_KEYWORDS) {
    try {
      const params = new URLSearchParams({
        q: keyword,
        location: "Hyderabad,Telangana,India",
        gl: "in",
        hl: "en",
        api_key: serpApiKey,
        num: "10",
      });

      const res = await fetch(
        `https://serpapi.com/search.json?${params.toString()}`
      );

      if (!res.ok) {
        console.error(
          `[competitor-keywords] SerpAPI error for "${keyword}": HTTP ${res.status}`
        );
        continue;
      }

      const data = await res.json();
      const organic = data.organic_results || [];

      // Check if we appear in top 10
      const ourResult = organic.find((r) =>
        (r.link || "").includes(OUR_DOMAIN)
      );
      const ourPosition = ourResult
        ? organic.indexOf(ourResult) + 1
        : null;

      // Top-3 competitor domains (excluding us)
      const competitorUrls = organic
        .slice(0, 3)
        .filter((r) => !(r.link || "").includes(OUR_DOMAIN))
        .map((r) => ({ position: organic.indexOf(r) + 1, url: r.link || "" }));

      results.push({
        keyword,
        our_position_serp: ourPosition,
        we_appear_in_top10: ourPosition !== null,
        competitor_urls: competitorUrls,
        high_priority: ourPosition === null,
      });

      console.error(
        `[competitor-keywords] "${keyword}" → ${
          ourPosition ? `we're at #${ourPosition}` : "NOT in top 10"
        }, top competitors: ${competitorUrls
          .map((c) => new URL(c.url).hostname)
          .join(", ")}`
      );
    } catch (err) {
      console.error(
        `[competitor-keywords] SerpAPI failed for "${keyword}": ${err.message}`
      );
    }

    // Rate-limit: SerpAPI free tier allows ~1 req/sec
    await new Promise((r) => setTimeout(r, 1100));
  }

  console.error(
    `[competitor-keywords] SerpAPI: processed ${results.length} keywords, ` +
      `${results.filter((r) => r.high_priority).length} high-priority gaps`
  );
  return results;
}

// ─── Supabase upsert ──────────────────────────────────────────────────────────

async function upsertOpportunities(supabase, opportunities) {
  if (opportunities.length === 0) return 0;

  const now = new Date().toISOString();
  const rows = opportunities.map((op) => ({
    keyword: op.keyword,
    our_position: op.our_position,
    our_url: op.our_url,
    impressions: op.impressions,
    clicks: op.clicks,
    ctr: op.ctr,
    opportunity_score: op.opportunity_score,
    recommended_template: op.recommended_template,
    recommended_action: op.recommended_action,
    competitor_urls: op.competitor_urls || null,
    last_updated_at: now,
    first_seen_at: now, // only applied on insert via onConflict ignore below
  }));

  // Upsert in batches of 50 to stay within Supabase payload limits
  const BATCH = 50;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error, count } = await supabase
      .from("seo_keyword_gaps")
      .upsert(batch, {
        onConflict: "keyword",
        ignoreDuplicates: false, // merge all fields on conflict
        count: "exact",
      });

    if (error) {
      console.error(
        `[competitor-keywords] Supabase upsert error (batch ${i / BATCH + 1}):`,
        error.message
      );
    } else {
      upserted += count || batch.length;
    }
  }

  return upserted;
}

async function enrichWithCompetitors(supabase, serpResults) {
  let enriched = 0;
  for (const result of serpResults) {
    if (!result.competitor_urls || result.competitor_urls.length === 0) continue;

    const { error } = await supabase
      .from("seo_keyword_gaps")
      .update({
        competitor_urls: result.competitor_urls,
        last_updated_at: new Date().toISOString(),
      })
      .eq("keyword", result.keyword);

    if (error) {
      console.error(
        `[competitor-keywords] Could not enrich "${result.keyword}":`,
        error.message
      );
    } else {
      enriched++;
    }
  }
  return enriched;
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Run competitor keyword analysis (Strategy A always, Strategy B if SERPAPI_KEY set).
 *
 * @returns {Promise<{
 *   gscOpportunities: number,
 *   serpApiKeywords: number,
 *   totalGaps: number,
 *   topOpportunities: Array
 * }>}
 */
export async function runCompetitorKeywords() {
  const supabase = getSupabase();
  const serpApiKey = process.env.SERPAPI_KEY || "";

  // ── Strategy A ──────────────────────────────────────────────────────────────
  const gscOpportunities = await runGscStrategy();
  const upsertedCount = await upsertOpportunities(supabase, gscOpportunities);
  console.error(
    `[competitor-keywords] Upserted ${upsertedCount} rows into seo_keyword_gaps`
  );

  // ── Strategy B ──────────────────────────────────────────────────────────────
  let serpResults = [];
  let enrichedCount = 0;

  if (serpApiKey) {
    serpResults = await runSerpApiStrategy(serpApiKey);

    // Insert high-priority gaps (keywords we don't rank for at all)
    const missingKeywords = serpResults.filter((r) => r.high_priority);
    if (missingKeywords.length > 0) {
      const missingRows = missingKeywords.map((r) => ({
        keyword: r.keyword,
        our_position: null,
        our_url: null,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        opportunity_score: 999, // high priority sentinel
        recommended_template: "general",
        recommended_action: `We don't appear in top 10 for this keyword — create targeted content`,
        competitor_urls: r.competitor_urls,
      }));
      await upsertOpportunities(supabase, missingRows);
    }

    // Enrich existing rows with competitor data
    enrichedCount = await enrichWithCompetitors(supabase, serpResults);
    console.error(
      `[competitor-keywords] Enriched ${enrichedCount} records with competitor URLs`
    );
  } else {
    console.error(
      "[competitor-keywords] SERPAPI_KEY not set — skipping Strategy B"
    );
  }

  const topOpportunities = gscOpportunities.slice(0, 10).map((op) => ({
    keyword: op.keyword,
    our_url: op.our_url,
    our_position: op.our_position,
    impressions: op.impressions,
    opportunity_score: op.opportunity_score,
    recommended_template: op.recommended_template,
    recommended_action: op.recommended_action,
  }));

  return {
    gscOpportunities: gscOpportunities.length,
    serpApiKeywords: serpResults.length,
    totalGaps: gscOpportunities.length + serpResults.filter((r) => r.high_priority).length,
    topOpportunities,
  };
}
