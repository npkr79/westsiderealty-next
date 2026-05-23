/**
 * Stage A — Opinion-Post Fitness Brief
 *
 * For each candidate news article, asks Claude Sonnet to produce a structured
 * JSON "brief" that lets the human editor quickly decide:
 *   - Is this worth writing a founder-voice post about?
 *   - What angle is non-obvious?
 *   - What's the POV Westside Realty should take?
 *
 * Output is saved to news_articles.brief (jsonb).
 * If JSON parse fails after one retry, article is flagged is_quarantined=true
 * so it can be reviewed manually rather than silently dropped.
 */

import Anthropic from "@anthropic-ai/sdk";
import { SupabaseClient } from "@supabase/supabase-js";
import convictionMap from "@/config/conviction-map.json";
import type { NewsArticle } from "./newsToSocialService";

// ── Types ─────────────────────────────────────────────────────────────────────

export type FitnessLevel = "STRONG" | "WORKABLE" | "THIN" | "SKIP";

export interface FitnessBrief {
  fitness: FitnessLevel;
  thesis: string;             // The ONE claim the founder post should make (≤30 words)
  data_hooks: string[];       // 2-4 concrete numbers/facts pulled from the article
  non_obvious_read: string;   // The angle most commentators will miss (≤25 words)
  conviction_match: string;   // Which conviction-map theme this best fits (or "none")
  saturation: "LOW" | "MEDIUM" | "HIGH"; // How many outlets covered this same story
  weakness: string;           // The strongest objection to this thesis (≤20 words)
  flags: string[];            // e.g. ["stale_data", "single_source", "paywalled"]
}

// ── Conviction map summary (injected into prompt) ─────────────────────────────

const CONVICTION_THEMES: string[] = [
  // Hyderabad
  "gcc_expansion", "metro_phase2", "orr_corridors", "hyderabad_it_demand",
  "telangana_policy", "pharma_city_industrial",
  // Goa
  "nri_investment", "goa_property_law", "fema_repatriation", "tourism_policy",
  "goa_luxury_villa", "coastal_regulation_zone",
  // National
  "rbi_rate_policy", "rera_amendments", "fdi_real_estate", "nri_investment_india",
  "luxury_market_trends", "reit_performance", "gcc_india_expansion",
  "india_office_absorption", "residential_sales_data",
];

// ── Prompt ────────────────────────────────────────────────────────────────────

function buildBriefPrompt(article: NewsArticle): string {
  const body = article.full_text && article.full_text.trim().length > 200
    ? article.full_text.slice(0, 5000)
    : (article.ai_summary ?? article.summary ?? "");

  return `You are a senior editorial strategist for Westside Realty, a national premium real estate advisory firm.

Your job is to produce a concise OPINION-POST FITNESS BRIEF for the article below.
The brief guides a founder in deciding whether and how to write a 120-180 word opinion post.

WESTSIDE REALTY CONVICTION THEMES (map this article to one if it fits):
${CONVICTION_THEMES.join(", ")}

ARTICLE:
Headline: ${article.headline}
Source: ${article.source_name}
Category: ${article.category}
Cities: ${article.cities?.join(", ") || "national"}
Tags: ${article.ai_tags?.join(", ") || ""}
Editorial override: ${article.editorial_override ? "YES — high-signal despite negative framing" : "no"}

Article body (may be partial):
${body}

---

Produce ONLY a valid JSON object with this exact schema:
{
  "fitness": "STRONG" | "WORKABLE" | "THIN" | "SKIP",
  "thesis": "<The ONE claim the founder post should make. ≤30 words. Must be an opinion, not a summary.>",
  "data_hooks": ["<concrete number or fact from the article>", ...],
  "non_obvious_read": "<The angle most commentators will miss. ≤25 words.>",
  "conviction_match": "<one theme from the list above, or 'none'>",
  "saturation": "LOW" | "MEDIUM" | "HIGH",
  "weakness": "<Strongest objection to the thesis. ≤20 words.>",
  "flags": ["<optional: stale_data | single_source | paywalled | disputed | too_regional | too_local>"]
}

FITNESS GUIDE:
- STRONG: Clear structural insight, concrete data, non-obvious angle. Worth a founder post immediately.
- WORKABLE: Interesting angle but needs framing. Brief should clarify what to emphasise.
- THIN: Mostly news summary, no strong POV available, or data too thin to support a claim.
- SKIP: Commodity coverage, purely negative without editorial value, or no actionable insight.

Respond with ONLY the JSON object. No markdown, no explanation.`;
}

// ── LLM call with retry ───────────────────────────────────────────────────────

async function callBriefModel(client: Anthropic, prompt: string): Promise<FitnessBrief | null> {
  const resp = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = resp.content[0]?.type === "text" ? resp.content[0].text : "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]) as FitnessBrief;
  } catch {
    return null;
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generates and saves a Fitness Brief for a single article.
 * Retries once on JSON parse failure. Marks is_quarantined=true on second failure.
 *
 * Returns the brief on success, null if quarantined.
 */
export async function generateFitnessBrief(
  supabase: SupabaseClient,
  article: NewsArticle
): Promise<FitnessBrief | null> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const prompt = buildBriefPrompt(article);

  let brief = await callBriefModel(client, prompt);

  if (!brief) {
    console.warn("[FitnessBrief] Attempt 1 failed JSON parse for article", article.id, "— retrying");
    brief = await callBriefModel(client, prompt);
  }

  if (!brief) {
    // Both attempts failed — quarantine
    console.error("[FitnessBrief] Both attempts failed for article", article.id, "— quarantining");
    await supabase
      .from("news_articles")
      .update({ is_quarantined: true })
      .eq("id", article.id);
    return null;
  }

  // Validate fitness level
  const validFitness: FitnessLevel[] = ["STRONG", "WORKABLE", "THIN", "SKIP"];
  if (!validFitness.includes(brief.fitness)) {
    brief.fitness = "THIN";
  }

  // Save to DB
  const { error } = await supabase
    .from("news_articles")
    .update({ brief })
    .eq("id", article.id);

  if (error) {
    console.error("[FitnessBrief] DB write failed for article", article.id, error.message);
  }

  return brief;
}

/**
 * Runs fitness briefs for a batch of articles in parallel.
 * Best-effort — failures are logged and quarantined but don't block the cron.
 */
export async function generateBriefsBatch(
  supabase: SupabaseClient,
  articles: NewsArticle[]
): Promise<Map<string, FitnessBrief>> {
  const results = await Promise.allSettled(
    articles.map((a) => generateFitnessBrief(supabase, a).then((b) => ({ id: a.id, brief: b })))
  );

  const map = new Map<string, FitnessBrief>();
  for (const r of results) {
    if (r.status === "fulfilled" && r.value.brief) {
      map.set(r.value.id, r.value.brief);
    }
  }
  return map;
}

// Re-export for convenience
export { convictionMap };
