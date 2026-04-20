/**
 * Content Scorer — westsiderealty.in
 *
 * Scores SEO content quality for all projects and micro-markets using a
 * rule-based system (runs for all records), then calls Claude to generate
 * specific improvement suggestions for the lowest-scoring entities.
 *
 * Scoring:
 *   Projects (0–100):
 *     has_hero_image   15pts — hero_image_url present
 *     has_description  15pts — description > 150 chars
 *     has_price        15pts — price_min > 0
 *     has_rera         15pts — rera_id present
 *     has_amenities    15pts — amenities_json has 3+ items or string > 50 chars
 *     has_gallery      10pts — gallery_images_json has 3+ items
 *     keyword_in_name  15pts — project_name contains micro_market_name or city_slug
 *
 *   Micro-markets (0–100):
 *     has_hero_hook    20pts — hero_hook > 20 chars
 *     has_description  20pts — description > 200 chars
 *     has_price_data   20pts — price_per_sqft_min > 0
 *     has_appreciation 20pts — annual_appreciation_min present
 *     has_hero_image   20pts — hero_image_url present
 *
 * Claude suggestions (claude-haiku-4-5-20251001) run only for the 10
 * lowest-scoring projects and 5 lowest-scoring micro-markets with score < 50.
 * Falls back to a template suggestion when ANTHROPIC_API_KEY is not set.
 *
 * Results upserted to: seo_content_scores (entity_type, entity_slug, week_start)
 *
 * Required env vars:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ANTHROPIC_API_KEY  (optional — Claude suggestions disabled when absent)
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

// ─── Supabase client ──────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "[content-scorer] WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set"
    );
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Week helper (Monday of current ISO week) ─────────────────────────────────

function currentWeekStart() {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

// ─── Scoring helpers ──────────────────────────────────────────────────────────

function isEmpty(val) {
  return val === null || val === undefined || String(val).trim() === "";
}

function parseJsonArray(val) {
  if (Array.isArray(val)) return val;
  if (!val || typeof val !== "string") return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function scoreProject(project) {
  const breakdown = {};
  const missing = [];

  if (!isEmpty(project.hero_image_url)) {
    breakdown.has_hero_image = 15;
  } else {
    breakdown.has_hero_image = 0;
    missing.push("hero_image");
  }

  const descLen = (project.long_description_html || "").trim().length;
  if (descLen > 150) {
    breakdown.has_description = 15;
  } else {
    breakdown.has_description = 0;
    missing.push(descLen === 0 ? "description" : "description_too_short");
  }

  if (project.min_price && project.min_price > 0) {
    breakdown.has_price = 15;
  } else {
    breakdown.has_price = 0;
    missing.push("price");
  }

  if (!isEmpty(project.rera_id)) {
    breakdown.has_rera = 15;
  } else {
    breakdown.has_rera = 0;
    missing.push("rera_id");
  }

  const amenitiesArr = parseJsonArray(project.amenities_json);
  const amenitiesOk =
    amenitiesArr.length >= 3 ||
    (typeof project.amenities_json === "string" &&
      project.amenities_json.trim().length > 50);
  if (amenitiesOk) {
    breakdown.has_amenities = 15;
  } else {
    breakdown.has_amenities = 0;
    missing.push("amenities");
  }

  const galleryArr = parseJsonArray(project.gallery_images_json);
  if (galleryArr.length >= 3) {
    breakdown.has_gallery = 10;
  } else {
    breakdown.has_gallery = 0;
    missing.push("gallery_images");
  }

  const nameLower = (project.project_name || "").toLowerCase();
  const hasKeyword = nameLower.includes("hyderabad") || nameLower.includes("hyd");
  if (hasKeyword) {
    breakdown.keyword_in_name = 15;
  } else {
    breakdown.keyword_in_name = 0;
    missing.push("location_keyword_in_name");
  }

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { score, breakdown, missing };
}

function scoreMicroMarket(mm) {
  const breakdown = {};
  const missing = [];

  const hookLen = (mm.hero_hook || "").trim().length;
  if (hookLen > 20) {
    breakdown.has_hero_hook = 20;
  } else {
    breakdown.has_hero_hook = 0;
    missing.push("hero_hook");
  }

  const descLen = (mm.growth_story || "").trim().length;
  if (descLen > 200) {
    breakdown.has_description = 20;
  } else {
    breakdown.has_description = 0;
    missing.push(descLen === 0 ? "description" : "description_too_short");
  }

  if (mm.price_per_sqft_min && mm.price_per_sqft_min > 0) {
    breakdown.has_price_data = 20;
  } else {
    breakdown.has_price_data = 0;
    missing.push("price_per_sqft");
  }

  if (mm.annual_appreciation_min !== null && mm.annual_appreciation_min !== undefined) {
    breakdown.has_appreciation = 20;
  } else {
    breakdown.has_appreciation = 0;
    missing.push("annual_appreciation");
  }

  if (!isEmpty(mm.hero_image_url)) {
    breakdown.has_hero_image = 20;
  } else {
    breakdown.has_hero_image = 0;
    missing.push("hero_image");
  }

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { score, breakdown, missing };
}

// ─── Claude suggestions ───────────────────────────────────────────────────────

function templateProjectSuggestion(project, missingFields) {
  const top = missingFields[0] || "content";
  const fieldMap = {
    hero_image: `Upload a high-quality hero image for ${project.project_name} showing the exterior or amenities to improve click-through rates from search results.`,
    description: `Write a 200+ word description for ${project.project_name} that includes the location (${project.micro_market_name}, ${project.city_slug}), key amenities, and target buyer profile to improve ranking for long-tail queries.`,
    description_too_short: `Expand the description for ${project.project_name} to 200+ words — include nearby landmarks, connectivity details, and lifestyle benefits to rank for location-based searches in ${project.micro_market_name}.`,
    price: `Add pricing information (price_min/price_max) for ${project.project_name} — pages with price data rank higher for "flats under X budget" searches.`,
    rera_id: `Add the RERA registration number for ${project.project_name} — RERA queries like "${project.project_name} RERA number" are high-intent searches with low competition.`,
    amenities: `List at least 5 specific amenities for ${project.project_name} (e.g. clubhouse sq ft, pool type, gym equipment) — detailed amenity content captures "projects with X" keyword queries.`,
    gallery_images: `Add 3+ gallery images for ${project.project_name} — pages with image galleries have lower bounce rates and better engagement signals for Google ranking.`,
    location_keyword_in_name: `Consider renaming the project slug or adding the micro-market name (${project.micro_market_name}) to the page title/H1 for ${project.project_name} to improve local keyword relevance.`,
  };
  return fieldMap[top] || `Improve content completeness for ${project.project_name}: missing ${missingFields.join(", ")}.`;
}

function templateMicroMarketSuggestion(mm, missingFields) {
  const top = missingFields[0] || "content";
  const fieldMap = {
    hero_hook: `Write a compelling 1-line hero hook for ${mm.micro_market_name} that highlights its primary buyer appeal (e.g. "Hyderabad's fastest-appreciating IT corridor") — this appears in SERP descriptions and improves CTR.`,
    description: `Write a 300+ word description for ${mm.micro_market_name} covering property prices, connectivity, schools, employment hubs, and upcoming infrastructure to rank for "${mm.micro_market_name} real estate" queries.`,
    description_too_short: `Expand the ${mm.micro_market_name} page description to 300+ words with neighbourhood details, price trends, and buyer profile to improve topical authority for local SEO.`,
    price_per_sqft: `Add current price per sqft data for ${mm.micro_market_name} — "property price in ${mm.micro_market_name}" is a high-volume query and pages without price data rarely rank for it.`,
    annual_appreciation: `Add annual appreciation data for ${mm.micro_market_name} — investor-focused queries like "${mm.micro_market_name} appreciation rate" have high purchase intent and low competition.`,
    hero_image: `Add a hero image for the ${mm.micro_market_name} page showing the area, skyline, or a prominent project — image-rich pages have 40%+ lower bounce rates in mobile search.`,
  };
  return fieldMap[top] || `Improve content completeness for ${mm.micro_market_name}: missing ${missingFields.join(", ")}.`;
}

async function getClaudeSuggestion(anthropic, entityType, entity, missingFields) {
  if (entityType === "project") {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `You are an SEO expert for Indian real estate. Given this project data, suggest ONE specific improvement to boost search ranking. Be concrete and actionable in 1-2 sentences.

Project: ${entity.project_name}
Location: ${entity.micro_market_name}, ${entity.city_slug}
Missing: ${missingFields.join(", ")}
Current description: "${(entity.description || "").slice(0, 100)}"

Suggest improvement:`,
        },
      ],
    });
    return message.content[0].text.trim();
  } else {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `You are an SEO expert for Indian real estate. Given this micro-market page data, suggest ONE specific improvement to boost search ranking. Be concrete and actionable in 1-2 sentences.

Micro-market: ${entity.micro_market_name}
City: ${entity.city_slug}
Missing: ${missingFields.join(", ")}
Current description: "${(entity.description || "").slice(0, 100)}"

Suggest improvement:`,
        },
      ],
    });
    return message.content[0].text.trim();
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Score content quality for all projects and micro-markets.
 * Generates Claude improvement suggestions for the 10 lowest-scoring projects
 * and 5 lowest-scoring micro-markets (score < 50).
 * Upserts all scores to seo_content_scores.
 *
 * @returns {{
 *   projectsScored: number,
 *   microMarketsScored: number,
 *   avgProjectScore: number,
 *   avgMicroMarketScore: number,
 *   lowScoreProjects: number,
 *   lowScoreMicroMarkets: number,
 *   claudeSuggestionsGenerated: number,
 *   topIssues: Array<{entity_type, entity_slug, entity_name, score, missing_fields, claude_suggestion}>,
 *   summary: string
 * }}
 */
export async function runContentScorer() {
  const empty = {
    projectsScored: 0,
    microMarketsScored: 0,
    avgProjectScore: 0,
    avgMicroMarketScore: 0,
    lowScoreProjects: 0,
    lowScoreMicroMarkets: 0,
    claudeSuggestionsGenerated: 0,
    topIssues: [],
    summary: "Supabase client unavailable — skipped",
  };

  const supabase = getSupabase();
  if (!supabase) return empty;

  const weekStart = currentWeekStart();
  console.error(`[content-scorer] Week start: ${weekStart}`);

  // ── 1. Fetch data ────────────────────────────────────────────────────────────

  const [projectsRes, mmRes] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "id, url_slug, project_name, long_description_html, amenities_json, gallery_images_json, hero_image_url, rera_id, min_price, max_price"
      )
      .limit(100),

    supabase
      .from("micro_markets")
      .select(
        "id, url_slug, micro_market_name, growth_story, hero_hook, price_per_sqft_min, price_per_sqft_max, annual_appreciation_min, hero_image_url"
      )
      .limit(100),
  ]);

  if (projectsRes.error) {
    console.error("[content-scorer] Projects fetch error:", projectsRes.error.message);
  }
  if (mmRes.error) {
    console.error("[content-scorer] Micro-markets fetch error:", mmRes.error.message);
  }

  const projects = projectsRes.data || [];
  const microMarkets = mmRes.data || [];

  console.error(
    `[content-scorer] Loaded ${projects.length} projects, ${microMarkets.length} micro-markets`
  );

  // ── 2. Score all entities ────────────────────────────────────────────────────

  const scoredProjects = projects.map((p) => {
    const { score, breakdown, missing } = scoreProject(p);
    return {
      entity: p,
      entity_type: "project",
      entity_slug: p.url_slug,
      entity_name: p.project_name,
      city_slug: "hyderabad",
      score,
      score_breakdown: breakdown,
      missing_fields: missing,
      claude_suggestion: null,
    };
  });

  const scoredMMs = microMarkets.map((mm) => {
    const { score, breakdown, missing } = scoreMicroMarket(mm);
    return {
      entity: mm,
      entity_type: "micro_market",
      entity_slug: mm.url_slug,
      entity_name: mm.micro_market_name,
      city_slug: "hyderabad",
      score,
      score_breakdown: breakdown,
      missing_fields: missing,
      claude_suggestion: null,
    };
  });

  // ── 3. Claude suggestions for lowest scorers ─────────────────────────────────

  const apiKey = process.env.ANTHROPIC_API_KEY;
  let anthropic = null;
  if (apiKey) {
    anthropic = new Anthropic({ apiKey });
  } else {
    console.error("[content-scorer] ANTHROPIC_API_KEY not set — using template suggestions");
  }

  const lowProjects = scoredProjects
    .filter((p) => p.score < 50)
    .sort((a, b) => a.score - b.score)
    .slice(0, 10);

  const lowMMs = scoredMMs
    .filter((mm) => mm.score < 50)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  let claudeSuggestionsGenerated = 0;

  for (const item of lowProjects) {
    try {
      if (anthropic) {
        item.claude_suggestion = await getClaudeSuggestion(
          anthropic,
          "project",
          item.entity,
          item.missing_fields
        );
        claudeSuggestionsGenerated++;
      } else {
        item.claude_suggestion = templateProjectSuggestion(item.entity, item.missing_fields);
      }
    } catch (err) {
      console.error(`[content-scorer] Claude error for project ${item.entity_slug}:`, err.message);
      item.claude_suggestion = templateProjectSuggestion(item.entity, item.missing_fields);
    }
  }

  for (const item of lowMMs) {
    try {
      if (anthropic) {
        item.claude_suggestion = await getClaudeSuggestion(
          anthropic,
          "micro_market",
          item.entity,
          item.missing_fields
        );
        claudeSuggestionsGenerated++;
      } else {
        item.claude_suggestion = templateMicroMarketSuggestion(item.entity, item.missing_fields);
      }
    } catch (err) {
      console.error(`[content-scorer] Claude error for micro-market ${item.entity_slug}:`, err.message);
      item.claude_suggestion = templateMicroMarketSuggestion(item.entity, item.missing_fields);
    }
  }

  // ── 4. Upsert all scores ─────────────────────────────────────────────────────

  const allScored = [...scoredProjects, ...scoredMMs];
  const rows = allScored.map((item) => ({
    entity_type: item.entity_type,
    entity_slug: item.entity_slug,
    entity_name: item.entity_name,
    city_slug: item.city_slug,
    score: item.score,
    score_breakdown: item.score_breakdown,
    missing_fields: item.missing_fields,
    claude_suggestion: item.claude_suggestion,
    week_start: weekStart,
    updated_at: new Date().toISOString(),
  }));

  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from("seo_content_scores").upsert(chunk, {
      onConflict: "entity_type,entity_slug,week_start",
      ignoreDuplicates: false,
    });
    if (error) {
      console.error(`[content-scorer] Upsert error (chunk ${i / CHUNK + 1}):`, error.message);
    }
  }

  // ── 5. Compute summary stats ─────────────────────────────────────────────────

  const avgProjectScore =
    scoredProjects.length > 0
      ? Math.round(
          scoredProjects.reduce((s, p) => s + p.score, 0) / scoredProjects.length
        )
      : 0;

  const avgMMScore =
    scoredMMs.length > 0
      ? Math.round(scoredMMs.reduce((s, mm) => s + mm.score, 0) / scoredMMs.length)
      : 0;

  const lowScoreProjects = scoredProjects.filter((p) => p.score < 50).length;
  const lowScoreMicroMarkets = scoredMMs.filter((mm) => mm.score < 50).length;

  const topIssues = [...lowProjects, ...lowMMs]
    .sort((a, b) => a.score - b.score)
    .map(({ entity_type, entity_slug, entity_name, score, missing_fields, claude_suggestion }) => ({
      entity_type,
      entity_slug,
      entity_name,
      score,
      missing_fields,
      claude_suggestion,
    }));

  const summary =
    `Scored ${scoredProjects.length} projects (avg ${avgProjectScore}/100, ${lowScoreProjects} below 50) ` +
    `and ${scoredMMs.length} micro-markets (avg ${avgMMScore}/100, ${lowScoreMicroMarkets} below 50). ` +
    `${claudeSuggestionsGenerated} Claude suggestions generated.`;

  console.error(`[content-scorer] ${summary}`);

  return {
    projectsScored: scoredProjects.length,
    microMarketsScored: scoredMMs.length,
    avgProjectScore,
    avgMicroMarketScore: avgMMScore,
    lowScoreProjects,
    lowScoreMicroMarkets,
    claudeSuggestionsGenerated,
    topIssues,
    summary,
  };
}
