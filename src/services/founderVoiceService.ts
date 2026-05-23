/**
 * Stage B — Founder-Voice Post Writer
 *
 * Takes a Stage A Fitness Brief (already saved in news_articles.brief) plus
 * an optional REVIEWER_NOTE from the human editor, and produces a
 * 120-180 word opinion-led social post in the founder's voice.
 *
 * Framework: Trigger → Interpretation → Structural Trend → POV → Disconfirmation
 *
 * The post is:
 *  - Saved to social_posts (platform=LinkedIn, content_type=post, status=manual_ready)
 *  - Returned to the API caller for immediate display in the CRM
 */

import Anthropic from "@anthropic-ai/sdk";
import { SupabaseClient } from "@supabase/supabase-js";
import type { FitnessBrief } from "./fitnessBriefService";
import type { NewsArticle } from "./newsToSocialService";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FounderPostResult {
  post_text: string;       // The finished 120-180 word opinion post
  social_post_id: string;  // ID of the saved social_posts row
}

// ── Prompt ────────────────────────────────────────────────────────────────────

function buildFounderPrompt(
  article: NewsArticle,
  brief: FitnessBrief,
  reviewerNote: string
): string {
  return `You write opinion posts for a senior real estate advisor in India — national market scope, known for a clear, non-hype POV.

ARTICLE CONTEXT:
Headline: ${article.headline}
Source: ${article.source_name}
Cities: ${article.cities?.join(", ") || "national"}
Data hooks from article: ${brief.data_hooks.join(" | ")}

EDITORIAL BRIEF:
Thesis: ${brief.thesis}
Non-obvious angle: ${brief.non_obvious_read}
Conviction theme: ${brief.conviction_match}
Key weakness to address: ${brief.weakness}
${reviewerNote ? `\nEDITOR NOTE: ${reviewerNote}` : ""}

WRITE a 120-180 word founder-voice opinion post using this EXACT 5-part structure:

1. TRIGGER (1-2 sentences): Lead with a specific fact, number, or event from the article. No "I think" — state it plainly.
2. INTERPRETATION (1-2 sentences): What does this data point actually mean? Not what the headline says — what's really happening.
3. STRUCTURAL TREND (2-3 sentences): Zoom out. How does this fit a longer pattern most people haven't noticed yet? Use the data hooks.
4. POV (2-3 sentences): State your position clearly. It should be contestable — if everyone agrees, it's not a POV.
5. DISCONFIRMATION (1-2 sentences): Name the scenario where you'd be wrong. This is what separates analysis from cheerleading.

TONE RULES:
- No emojis
- No "I believe" or "I think" — just state positions
- No sales language or CTAs
- No hyperbole ("unprecedented", "game-changer", "explosive")
- Use plain declarative sentences — no subordinate clause nesting
- Numbers in the post must come directly from the article data hooks
- End with a question OR a provocation — not a summary

OUTPUT: Return ONLY the post text. No labels, no structure markers, no explanation.`;
}

// ── LLM call ─────────────────────────────────────────────────────────────────

async function callFounderModel(
  client: Anthropic,
  prompt: string
): Promise<string> {
  const resp = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const text = resp.content[0]?.type === "text" ? resp.content[0].text.trim() : "";
  if (!text || text.length < 50) {
    throw new Error("Founder voice model returned empty or too-short output");
  }
  return text;
}

// ── Save to social_posts ──────────────────────────────────────────────────────

async function saveFounderPost(
  supabase: SupabaseClient,
  article: NewsArticle,
  postText: string
): Promise<string> {
  const { data, error } = await supabase
    .from("social_posts")
    .insert({
      content_idea: article.headline,
      caption: postText,
      platform: "LinkedIn",
      content_type: "post",
      topic_type: "founder_voice",
      post_category: "news",
      status: "manual_ready",
      news_article_id: article.id,
      hashtags: ["RealEstate", "India", "PropTech"],
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to save founder post: ${error?.message ?? "no data"}`);
  }

  return data.id as string;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Runs Stage B for a single article + brief.
 * Caller must have already verified fitness is STRONG or WORKABLE.
 */
export async function generateFounderPost(
  supabase: SupabaseClient,
  article: NewsArticle,
  brief: FitnessBrief,
  reviewerNote = ""
): Promise<FounderPostResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const prompt = buildFounderPrompt(article, brief, reviewerNote.trim());

  let postText: string;
  try {
    postText = await callFounderModel(client, prompt);
  } catch (err) {
    // Retry once
    console.warn("[FounderVoice] Attempt 1 failed, retrying:", err instanceof Error ? err.message : err);
    postText = await callFounderModel(client, prompt);
  }

  const socialPostId = await saveFounderPost(supabase, article, postText);

  console.log("[FounderVoice] Generated post for article", article.id, "→ social_post", socialPostId);

  return { post_text: postText, social_post_id: socialPostId };
}
