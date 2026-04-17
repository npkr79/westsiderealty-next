/**
 * Keyword Difficulty — westsiderealty.in
 *
 * Scores keyword difficulty 0–100 by analysing who dominates the top 10
 * organic results for each keyword. Pulls up to 25 unscored keywords from
 * seo_keyword_gaps (difficulty_score IS NULL or 0), runs SerpAPI, and
 * writes difficulty_score, difficulty_label, and top10_competitors back.
 *
 * Scoring weights:
 *   Big aggregators (99acres, magicbricks, housing.com, squareyards,
 *     nobroker, commonfloor, proptiger): +8 pts each (max 56)
 *   News/media (ndtv, timesofindia, economictimes, thehindu): +5 pts each
 *   Government (.gov.in, rera.telangana.gov.in): +10 pts each
 *   Local brands (prestige, godrej, brigade, sobha): +4 pts each
 *   We appear in top 10: −10 pts
 *   Cap at 100.
 *
 * Labels:
 *   0–35  → LOW    (achievable in 2–4 weeks)
 *   36–65 → MEDIUM (achievable in 1–3 months)
 *   66+   → HIGH   (6+ months)
 *
 * Required env vars:
 *   SERPAPI_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

const OUR_DOMAIN = "westsiderealty.in";

const AGGREGATOR_DOMAINS = [
  "99acres.com",
  "magicbricks.com",
  "housing.com",
  "squareyards.com",
  "nobroker.in",
  "commonfloor.com",
  "proptiger.com",
];

const NEWS_DOMAINS = [
  "ndtv.com",
  "timesofindia.com",
  "economictimes.com",
  "thehindu.com",
];

const GOVT_PATTERNS = [".gov.in", "rera.telangana.gov.in"];

const LOCAL_BRAND_DOMAINS = [
  "prestigeconstructions.com",
  "godrejproperties.com",
  "brigadegroup.com",
  "sobha.com",
];

// ─── Supabase ─────────────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "[keyword-difficulty] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key);
}

// ─── Difficulty scorer ────────────────────────────────────────────────────────

function scoreDifficulty(organic) {
  let score = 0;
  let weAppear = false;

  for (const result of organic) {
    const link = (result.link || "").toLowerCase();
    const displayedLink = (result.displayed_link || "").toLowerCase();

    let domain = "";
    try {
      domain = new URL(link).hostname.replace(/^www\./, "");
    } catch {
      domain = displayedLink;
    }

    if (domain.includes(OUR_DOMAIN)) {
      weAppear = true;
      continue;
    }

    if (AGGREGATOR_DOMAINS.some((d) => domain.includes(d))) {
      score += 8;
    } else if (NEWS_DOMAINS.some((d) => domain.includes(d))) {
      score += 5;
    } else if (GOVT_PATTERNS.some((p) => domain.includes(p))) {
      score += 10;
    } else if (LOCAL_BRAND_DOMAINS.some((d) => domain.includes(d))) {
      score += 4;
    }
  }

  if (weAppear) score -= 10;
  return Math.max(0, Math.min(100, score));
}

function difficultyLabel(score) {
  if (score <= 35) return "LOW";
  if (score <= 65) return "MEDIUM";
  return "HIGH";
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Score keyword difficulty for up to 25 unscored keywords in seo_keyword_gaps.
 *
 * @returns {Promise<{
 *   keywordsScored: number,
 *   lowDifficulty: number,
 *   mediumDifficulty: number,
 *   highDifficulty: number,
 *   quickWinKeywords: Array<{keyword: string, our_position: number, difficulty_label: string, opportunity_score: number}>,
 *   summary: string
 * }>}
 */
export async function runKeywordDifficulty() {
  const serpApiKey = process.env.SERPAPI_KEY;
  if (!serpApiKey) {
    throw new Error("[keyword-difficulty] Missing SERPAPI_KEY");
  }

  const supabase = getSupabase();

  // Pull up to 25 unscored keywords
  const { data: keywords, error: fetchErr } = await supabase
    .from("seo_keyword_gaps")
    .select("keyword, our_position, opportunity_score")
    .or("difficulty_score.is.null,difficulty_score.eq.0")
    .order("opportunity_score", { ascending: false })
    .limit(25);

  if (fetchErr) {
    throw new Error(`[keyword-difficulty] Failed to fetch keywords: ${fetchErr.message}`);
  }
  if (!keywords || keywords.length === 0) {
    console.error("[keyword-difficulty] No unscored keywords found in seo_keyword_gaps");
    return {
      keywordsScored: 0,
      lowDifficulty: 0,
      mediumDifficulty: 0,
      highDifficulty: 0,
      quickWinKeywords: [],
      summary: "No unscored keywords to process.",
    };
  }

  console.error(`[keyword-difficulty] Scoring difficulty for ${keywords.length} keywords...`);

  let lowCount = 0;
  let mediumCount = 0;
  let highCount = 0;
  const quickWinKeywords = [];

  for (let i = 0; i < keywords.length; i++) {
    const { keyword, our_position, opportunity_score } = keywords[i];

    if (i > 0) {
      await new Promise((r) => setTimeout(r, 1100));
    }

    let organic = [];
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
        console.error(`[keyword-difficulty] HTTP ${res.status} for "${keyword}"`);
        continue;
      }
      const data = await res.json();
      organic = data.organic_results || [];
    } catch (err) {
      console.error(`[keyword-difficulty] SerpAPI failed for "${keyword}": ${err.message}`);
      continue;
    }

    const score = scoreDifficulty(organic);
    const label = difficultyLabel(score);

    // Top 3 competitor domains (excluding us)
    const top3Competitors = organic
      .filter((r) => !(r.link || "").includes(OUR_DOMAIN))
      .slice(0, 3)
      .map((r) => {
        try {
          return new URL(r.link || "").hostname.replace(/^www\./, "");
        } catch {
          return r.displayed_link || "";
        }
      })
      .filter(Boolean);

    console.error(
      `[keyword-difficulty] "${keyword}" → score:${score} label:${label} top:${top3Competitors.join(", ")}`
    );

    const { error: updateErr } = await supabase
      .from("seo_keyword_gaps")
      .update({
        difficulty_score: score,
        difficulty_label: label,
        top10_competitors: top3Competitors,
      })
      .eq("keyword", keyword);

    if (updateErr) {
      console.error(
        `[keyword-difficulty] Failed to update "${keyword}": ${updateErr.message}`
      );
    }

    if (label === "LOW") lowCount++;
    else if (label === "MEDIUM") mediumCount++;
    else highCount++;

    // Quick wins: LOW difficulty + position 11-30
    if (label === "LOW" && our_position != null && our_position >= 11 && our_position <= 30) {
      quickWinKeywords.push({
        keyword,
        our_position,
        difficulty_label: label,
        opportunity_score,
      });
    }
  }

  const keywordsScored = lowCount + mediumCount + highCount;

  const summary =
    `Scored ${keywordsScored} keywords: ` +
    `${lowCount} LOW, ${mediumCount} MEDIUM, ${highCount} HIGH difficulty. ` +
    `Quick wins (LOW + pos 11–30): ${quickWinKeywords.length}.`;

  console.error(`[keyword-difficulty] ${summary}`);

  return {
    keywordsScored,
    lowDifficulty: lowCount,
    mediumDifficulty: mediumCount,
    highDifficulty: highCount,
    quickWinKeywords,
    summary,
  };
}
