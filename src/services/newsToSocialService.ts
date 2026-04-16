import { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import { areSameStory } from "@/services/newsScraperService";

// ---------------------------------------------------------------------------
// Cloudinary config (call once at module level)
// ---------------------------------------------------------------------------

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  analytics: false,
});

const LOGO_URL =
  "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/REMAX%20WR%20Logo%20with%20no%20background.jpg";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string | null;
  ai_summary: string | null;
  ai_tags: string[];
  category: string;
  sub_category: string | null;
  cities: string[];
  relevance_score: number;
  sentiment: string | null;
  source_name: string;
  source_url: string;
  image_url: string | null;
  search_query_type?: string | null;
}

export interface PlatformCaption {
  platform: "LinkedIn" | "Instagram" | "Facebook" | "X";
  caption: string;
  hashtags: string[];
}

export interface NewsPostResult {
  article_id: string;
  headline: string;
  captions: PlatformCaption[];
  image_url: string;
  post_ids: string[];
}

// ---------------------------------------------------------------------------
// Pick top unprocessed articles
// ---------------------------------------------------------------------------

export async function pickTopArticles(
  supabase: SupabaseClient,
  count = 4
): Promise<NewsArticle[]> {
  const SELECT =
    "id, headline, summary, ai_summary, ai_tags, category, sub_category, cities, relevance_score, sentiment, source_name, source_url, image_url, search_query_type";

  // Pull a larger pool — positive sentiment only, high relevance, never processed
  const { data, error } = await supabase
    .from("news_articles")
    .select(SELECT)
    .eq("is_processed", false)
    .eq("is_rejected", false)
    .eq("social_post_count", 0)   // hard stop: never regenerate if posts were already made
    .neq("sentiment", "negative")
    .gte("relevance_score", 7.5)
    .order("relevance_score", { ascending: false })
    .limit(40); // Larger pool so we have room after dedup

  if (error) throw new Error(`pickTopArticles failed: ${error.message}`);
  const rawPool = (data ?? []) as NewsArticle[];

  // ── Load article IDs that already have social posts (any status incl. rejected) ──
  // Guards against: is_processed manually reset, wipe scenarios, partial runs.
  const { data: existingPostArticles } = await supabase
    .from("social_posts")
    .select("news_article_id")
    .not("news_article_id", "is", null);
  const articleIdsWithPosts = new Set(
    ((existingPostArticles ?? []) as { news_article_id: string }[]).map((r) => r.news_article_id)
  );

  // ── Load recently processed article headlines (last 30 days) ──────────────
  // Two sources: is_processed=true articles + social_posts captions.
  // This catches the same story arriving from a different URL/source next day.
  const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [processedRes, socialPostsRes] = await Promise.all([
    supabase
      .from("news_articles")
      .select("headline")
      .eq("is_processed", true)
      .gte("processed_at", cutoff30d),
    supabase
      .from("social_posts")
      .select("news_articles(headline)")
      .gte("created_at", cutoff30d)
      .not("news_article_id", "is", null),
  ]);

  const processedHeadlines: string[] = [
    ...((processedRes.data ?? []) as { headline: string }[]).map((r) => r.headline),
    ...((socialPostsRes.data ?? []) as { news_articles: { headline: string } | null }[])
      .map((r) => r.news_articles?.headline)
      .filter(Boolean) as string[],
  ];
  // Deduplicate the headline list itself
  const uniqueProcessedHeadlines = [...new Set(processedHeadlines)];

  // ── Filter pool: remove articles that already have social posts OR are the same story ──
  const deduped = rawPool.filter((article) => {
    // Hard block: article already had posts generated (any status — includes rejected/approved)
    if (articleIdsWithPosts.has(article.id)) return false;
    // Semantic dedup: same story as a recently processed article (different URL/source)
    const isDuplicateOfProcessed = uniqueProcessedHeadlines.some((ph) =>
      areSameStory(article.headline, ph)
    );
    return !isDuplicateOfProcessed;
  });

  // ── Within-pool dedup: remove near-duplicate stories from the candidate pool ──
  // (e.g. 3 different sources all covered Delhi-Dehradun expressway)
  const uniquePool: NewsArticle[] = [];
  for (const article of deduped) {
    const alreadyHaveSameStory = uniquePool.some((a) =>
      areSameStory(article.headline, a.headline)
    );
    if (!alreadyHaveSameStory) {
      uniquePool.push(article);
    }
    // else: skip this article — same story already represented by a higher-scored one
  }

  // ── Pick top articles with city diversity ─────────────────────────────────
  const picked: NewsArticle[] = [];
  const used = new Set<string>();

  // Reserve 1 slot each for Hyderabad and Goa.
  // Prefer articles from dedicated Serper city queries first (search_query_type),
  // fall back to articles where Claude tagged the city.
  for (const city of ["hyderabad", "goa"]) {
    const fromCityQuery = uniquePool.find(
      (a) => !used.has(a.id) && a.search_query_type === city
    );
    const fromCityTag = uniquePool.find(
      (a) => !used.has(a.id) && a.cities?.includes(city)
    );
    const match = fromCityQuery ?? fromCityTag;
    if (match) {
      picked.push(match);
      used.add(match.id);
    }
  }

  // Fill remaining slots with top-scored articles not already picked
  for (const article of uniquePool) {
    if (picked.length >= count) break;
    if (!used.has(article.id)) {
      picked.push(article);
      used.add(article.id);
    }
  }

  return picked;
}

// ---------------------------------------------------------------------------
// Generate platform captions (all 4 in one Sonnet call)
// ---------------------------------------------------------------------------

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateCaptions(
  article: NewsArticle
): Promise<PlatformCaption[]> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const context = [
    `Headline: ${article.headline}`,
    article.ai_summary ? `AI Summary: ${article.ai_summary}` : "",
    article.summary ? `Source Summary: ${article.summary}` : "",
    `Category: ${article.category}`,
    article.cities.length ? `Cities: ${article.cities.join(", ")}` : "",
    article.ai_tags.length ? `Tags: ${article.ai_tags.join(", ")}` : "",
    `Source: ${article.source_name}`,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `You are a social media content writer for REMAX Westside Realty, a premium real estate agency in Hyderabad, India.
Your role is to share real estate news in a clear, factual, and professional way — informing followers without making unverified claims about price growth, investment returns, or market outcomes.

TONE RULES:
- Report the event as it happened — facts only, no speculation presented as certainty
- You may reference well-known general market principles (e.g. "infrastructure projects have historically influenced surrounding property demand") but NEVER confirm or assure specific future outcomes for a specific location
- NEVER say: "early movers will benefit", "prices will surge", "this creates premium opportunities", "demand is rising here", "now is the time to invest"
- DO say: "historically, such developments have influenced surrounding demand", "analysts generally note that...", "this may be worth watching for buyers tracking this corridor"
- Keep energy in the writing through the significance of the news itself — not through hype or manufactured urgency
- NEVER use direct sales CTAs: "Contact us", "Book a consultation", "Call now", "DM us to invest"
- The brand signature is the only CTA needed`;

  const userPrompt = `Generate social media captions for all 4 platforms for this real estate news article:

${context}

RULES per platform:
- LinkedIn: 250-400 chars, state the key fact clearly, add brief context on what this type of development generally means for surrounding areas (as a market observation, not a promise), 3-4 hashtags, NO emojis, end with "— REMAX Westside Realty"
- Instagram: 180-280 chars, lead with the key fact, add one general market observation using hedged language, emoji-rich (use 🏛️🏙️📋🔍📊🏗️ etc. — no rocket/fire emojis unless genuinely warranted), 8-10 hashtags, end with "— REMAX Westside Realty"
- Facebook: 220-360 chars, explain the news event conversationally, add one general observation about how similar developments have historically played out — presented as context, not prediction, 5-6 hashtags, end with "— REMAX Westside Realty"
- X: 220-380 chars, factual and concise — state what happened and why it is noteworthy for those tracking the market, 3-4 hashtags, NO emojis, end with "— REMAX Westside Realty"

FACT-FIRST FORMULA: [What happened, exactly] → [Why it is significant as a fact] → [General market context using hedged language — "historically...", "analysts generally note...", "may be worth watching"]

SIGNATURE FORMATTING — critical:
- The signature must be on its own paragraph separated by a blank line
- In the caption JSON value, put \\n\\n before the signature
- Example: "Full caption with market insight and momentum.\\n\\n— REMAX Westside Realty"

FORMATTING — use **double asterisks** to mark text that should appear bold (applies to ALL platforms):
- Wrap the opening news headline/key fact sentence in **double asterisks**
  Example: **Hyderabad home sales hit 9,541 units in Q1 2026 — prices up 9% YoY** 🏙️📈 The rest of the body.
- Wrap the closing signature: **— REMAX Westside Realty**
- Body/explanation sentences: plain text, no asterisks

Return ONLY valid JSON array (no markdown):
[
  {
    "platform": "LinkedIn",
    "caption": "...",
    "hashtags": ["without # symbol"]
  },
  {
    "platform": "Instagram",
    "caption": "...",
    "hashtags": ["array"]
  },
  {
    "platform": "Facebook",
    "caption": "...",
    "hashtags": ["array"]
  },
  {
    "platform": "X",
    "caption": "...",
    "hashtags": ["3-4 hashtags"]
  }
]`;

  // Retry up to 3 times with exponential backoff for overload errors
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (res.status === 529 || res.status === 429) {
      // Overloaded or rate-limited — wait and retry
      const waitMs = attempt * 8000;
      console.log(`[generateCaptions] Attempt ${attempt} overloaded, retrying in ${waitMs}ms...`);
      if (attempt < 3) { await sleep(waitMs); continue; }
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Claude caption error: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    const raw: string = data.content?.[0]?.text ?? "";
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    return JSON.parse(cleaned) as PlatformCaption[];
  }

  throw new Error("Claude caption generation failed after 3 attempts (overloaded)");
}

// ---------------------------------------------------------------------------
// Entity logo library — maps keywords found in headline/tags → Supabase asset URL
// Add logos to the `brand-assets/logos/` bucket to activate them.
// ---------------------------------------------------------------------------

const ENTITY_LOGO_MAP: Array<{ keywords: string[]; url: string }> = [
  {
    keywords: ["hmda", "hyderabad metropolitan development authority"],
    url: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/logos/hmda.png",
  },
  {
    keywords: ["nhai", "national highways authority", "national highway"],
    url: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/logos/nhai.png",
  },
  {
    keywords: ["indian railways", "railway ministry", "rail vikas"],
    url: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/logos/indian-railways.png",
  },
  {
    keywords: ["credai", "confederation of real estate"],
    url: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/logos/credai.png",
  },
  {
    keywords: ["rera", "real estate regulatory authority"],
    url: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/logos/rera.png",
  },
  {
    keywords: ["rbi", "reserve bank of india"],
    url: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/logos/rbi.png",
  },
  {
    keywords: ["naredco", "national real estate development council"],
    url: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/logos/naredco.png",
  },
];

/** Returns the logo URL for the first entity found in article text, or null. */
function detectEntityLogoUrl(article: NewsArticle): string | null {
  const text = `${article.headline} ${(article.ai_tags ?? []).join(" ")} ${article.ai_summary ?? ""}`.toLowerCase();
  for (const entry of ENTITY_LOGO_MAP) {
    if (entry.keywords.some((kw) => text.includes(kw))) {
      return entry.url;
    }
  }
  return null;
}

/** Tries to fetch a logo buffer; returns null silently if unavailable (logo not uploaded yet). */
async function fetchLogoBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Key stat extractor — pulls the most impressive number from the headline
// ---------------------------------------------------------------------------

function extractKeyStat(headline: string): string | null {
  const patterns: RegExp[] = [
    /₹[\d,]+(?:\.\d+)?\s*(?:crore|lakh|cr|L)?/i,
    /[\d,.]+\s*(?:crore|lakh)\s*(?:rupees?|deal)?/i,
    /[\d.]+\s*(?:hours?|hrs?)/i,
    /[\d,]+\s*%(?:\s*(?:jump|surge|rise|growth|up|YoY|QoQ))?/i,
    /[\d,]+\s*(?:units?|homes?|flats?|apartments?)/i,
    /[\d]+-year\s+(?:high|record|low)/i,
    /[\d,.]+\s*(?:km|sq\.?\s*(?:ft|m|km|yd)|acres?)/i,
    /[\d,]+\s*(?:mn|million|bn|billion)/i,
  ];
  for (const re of patterns) {
    const m = headline.match(re);
    if (m) return m[0].trim();
  }
  return null;
}

// ---------------------------------------------------------------------------
// Claude Haiku — builds a vivid, story-specific image prompt
// ---------------------------------------------------------------------------

/** Category fallback in case Haiku call fails */
function buildFallbackImagePrompt(article: NewsArticle): string {
  const categoryVisuals: Record<string, string> = {
    infrastructure: "Aerial view of a modern Indian elevated expressway cutting through a dense green landscape, sharp midday light, blue sky with scattered clouds, photorealistic, no haze.",
    policy: "Indian government building facade with clean white architecture, sharp daylight, Indian tricolor flag visible, professional and authoritative atmosphere.",
    market: "Modern glass-facade residential towers under a bright blue sky, sharp architectural photography style, clean daylight, no orange tones.",
    corporate: "Gleaming glass office towers in an Indian business district, cool morning light, reflective facades, busy ground-level street scene below, photorealistic.",
    regulatory: "Clean modern law office interior, neutral daylight through large windows, documents and bookshelves, no people, professional.",
    investment: "Aerial view of a premium gated community under construction, concrete frames and cranes, clear afternoon light, showing scale and progress.",
    launch: "Architectural render of a luxury apartment complex — clean white and grey facades, manicured landscaping, swimming pool, sharp bright daylight, no filters.",
  };
  const base = categoryVisuals[article.category] ?? "Modern Indian city skyline, sharp blue-sky daylight, glass towers, photorealistic wide angle.";
  const cityCtx = article.cities.length && !article.cities.includes("national")
    ? ` Style evokes ${article.cities[0]} — specific local character.`
    : "";
  return `Social media background image. ${base}${cityCtx} NO text, NO human faces, NO logos. Bottom 35% must be dark/shadowed for text overlay. Square 1:1 format.`;
}

async function buildContextualImagePrompt(article: NewsArticle): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) return buildFallbackImagePrompt(article);

  const keyStat = extractKeyStat(article.headline);
  const headlineClean = article.headline.replace(/\*\*/g, "").trim();

  const context = [
    `Headline: ${headlineClean}`,
    article.ai_summary ? `Summary: ${article.ai_summary}` : "",
    article.summary ? `Source summary: ${article.summary}` : "",
    `Category: ${article.category}`,
    article.cities.length ? `Cities mentioned: ${article.cities.join(", ")}` : "",
    article.ai_tags.length ? `Tags: ${article.ai_tags.join(", ")}` : "",
  ].filter(Boolean).join("\n");

  const prompt = `You are a visual art director for a premium Indian real estate brand's social media.

Write a prompt for gpt-image-1 to generate a BACKGROUND SCENE ONLY — NO TEXT in the image at all.
The headline will be composited separately in post-production.

ARTICLE:
${context}

SCENE RULES — be specific to THIS story:
- GCC/office leasing → gleaming tech campus aerial, workers visible (no faces), glass buildings
- Infrastructure/road/metro → aerial of the actual route, construction machinery, cranes
- Coastal/Goa → actual beach, palm trees, coastal villas, sea visible — NO urban towers
- Developer launch → towers under construction, cranes, scale and ambition
- Government/affordable housing → colony-style buildings, NOT luxury towers
- Hyderabad residential → match the actual story (colony = colony, tech park = tech park)

STRICT RULES:
- NO TEXT anywhere in the image — no headlines, no numbers, no words
- Top-right corner must stay clean (leave ~180x80px clear for logo)
- Bottom 35% should have a natural dark-to-light gradient (dark at bottom) for text contrast
- NO brand logos in the scene
- NO faces
- NO golden hour / amber sky — use bright daylight or cool morning light
- Output ONLY the image generation prompt, no explanation`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return buildFallbackImagePrompt(article);
    const data = await res.json();
    const scenePrompt: string = data.content?.[0]?.text?.trim() ?? "";
    if (!scenePrompt) return buildFallbackImagePrompt(article);

    console.log("[NewsToSocial] Sonnet scene prompt:", scenePrompt.slice(0, 150));
    return scenePrompt;
  } catch (err) {
    console.warn("[NewsToSocial] Sonnet prompt generation failed, using fallback:", err);
    return buildFallbackImagePrompt(article);
  }
}

// ---------------------------------------------------------------------------
// Try to use the article's own source image as base (best quality, no AI cost)
// ---------------------------------------------------------------------------

async function fetchSourceImageBuffer(imageUrl: string): Promise<Buffer | null> {
  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;
    const ab = await res.arrayBuffer();
    const buf = Buffer.from(ab);
    // Resize + crop to 1024×1024 square
    return await sharp(buf)
      .resize(1024, 1024, { fit: "cover", position: "centre" })
      .jpeg({ quality: 92 })
      .toBuffer();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Image text overlay via Cloudinary URL transformation
// ---------------------------------------------------------------------------

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// Cloudinary text overlay encoding.
// Commas break Cloudinary transformation param parsing even when %2C encoded.
// Fix: strip thousands-separator commas from numbers (₹3,400 → ₹3400),
// replace any remaining commas with " - ", then URL-encode the rest.
function encodeCloudinaryText(text: string): string {
  const processed = text
    .replace(/(\d),(\d)/g, "$1$2")  // thousands separators: 3,400 → 3400
    .replace(/,/g, " - ");           // other commas → " - "

  return processed
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code > 127) return encodeURIComponent(char); // ₹ etc.
      switch (char) {
        case "%": return "%25";
        case " ": return "%20";
        case "/": return "%2F";
        case "?": return "%3F";
        case "#": return "%23";
        case "&": return "%26";
        case "+": return "%2B";
        case "$": return "%24";
        default:  return char;
      }
    })
    .join("");
}

/**
 * Apply Cloudinary text overlays:
 * - "PHOTO: AI GENERATED" (or "SOURCE IMAGE") label top-left
 * - Large gold key-stat callout upper-centre (if present)
 * - Yellow headline text anchored bottom
 */
function applyCloudinaryTextOverlay(
  cloudinaryUrl: string,
  headline: string,
  keyStat: string | null,
  isSourceImage: boolean,
): string {
  const decoded = decodeHtmlEntities(headline).slice(0, 120);
  const encoded = encodeCloudinaryText(decoded);

  const [before, after] = cloudinaryUrl.split("/upload/");
  if (!before || !after) return cloudinaryUrl;

  const layers: string[] = [];

  // 1. Top-left label
  const photoLabel = isSourceImage ? "SOURCE%20IMAGE" : "PHOTO%3A%20AI%20GENERATED";
  layers.push([
    `l_text:Arial_22_bold:${photoLabel}`,
    "co_rgb:FFFFFF",
    "g_north_west",
    "x_20",
    "y_20",
  ].join(","));

  // 2. Key stat — large gold text, upper-centre (only if short enough to render cleanly)
  if (keyStat) {
    const encodedStat = encodeCloudinaryText(decodeHtmlEntities(keyStat).slice(0, 40));
    layers.push([
      `l_text:Arial_100_bold:${encodedStat}`,
      "co_rgb:FFD700",
      "g_north",
      "y_120",
      "w_900",
      "c_fit",
    ].join(","));
    // Sub-label under the stat in white
    layers.push([
      "l_text:Arial_32_bold:KEY%20MARKET%20SIGNAL",
      "co_rgb:FFFFFF",
      "g_north",
      "y_250",
    ].join(","));
  }

  // 3. Headline text — yellow, bottom (dark background is baked in via Sharp gradient)
  layers.push([
    `l_text:Arial_54_bold:${encoded}`,
    "co_rgb:FFD700",
    "g_south_west",
    "x_36",
    "y_44",
    "w_952",
    "c_fit",
  ].join(","));

  return `${before}/upload/${layers.join("/")}/${after}`;
}

// Build a dark-to-transparent gradient strip using raw RGBA pixels.
// No SVG / librsvg needed — pure Node.js math, works on every Vercel runtime.
async function buildGradientStripBuffer(): Promise<Buffer> {
  const W = 1024;
  const H = 260; // just enough to cover the text area at the bottom
  const raw = Buffer.alloc(W * H * 4); // RGBA

  for (let y = 0; y < H; y++) {
    // Alpha ramps from 0 (top) to ~200 (~78% of 255) at the bottom
    const alpha = Math.round((y / (H - 1)) * 200);
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      raw[i] = 0;       // R
      raw[i + 1] = 0;   // G
      raw[i + 2] = 0;   // B
      raw[i + 3] = alpha;
    }
  }

  return sharp(raw, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toBuffer();
}

// Build a semi-transparent dark top-band for stat readability (top 30% of image).
async function buildTopBandBuffer(): Promise<Buffer> {
  const W = 1024;
  const H = 300;
  const raw = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    // Alpha ramps from 160 (top) to 0 (bottom) — dark at top, transparent toward middle
    const alpha = Math.round(((H - 1 - y) / (H - 1)) * 160);
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      raw[i] = 0; raw[i + 1] = 0; raw[i + 2] = 0;
      raw[i + 3] = alpha;
    }
  }
  return sharp(raw, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toBuffer();
}

// ---------------------------------------------------------------------------
// SVG text overlay — renders headline directly, no AI text rendering
// ---------------------------------------------------------------------------

function buildHeadlineOverlay(headline: string): Buffer {
  const W = 1024;
  const PADDING = 40;
  const MAX_TEXT_WIDTH = W - PADDING * 2;

  // Pick font size based on headline length
  const words = headline.split(/\s+/);
  const fontSize = words.length <= 5 ? 64 : words.length <= 9 ? 54 : words.length <= 13 ? 44 : 36;
  const lineHeight = Math.round(fontSize * 1.25);

  // Word-wrap into lines
  const avgCharWidth = fontSize * 0.58;
  const charsPerLine = Math.floor(MAX_TEXT_WIDTH / avgCharWidth);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length <= charsPerLine) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  const textBlockHeight = lines.length * lineHeight;
  const gradientHeight = textBlockHeight + 80; // padding above + below text
  const gradientTop = W - gradientHeight;
  const textStartY = gradientTop + 40; // 40px padding from gradient top

  // Build SVG text elements — escape XML special chars
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const textEls = lines
    .map((line, i) => {
      const y = textStartY + i * lineHeight + fontSize;
      return `<text x="${PADDING}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" paint-order="stroke" stroke="black" stroke-width="3" stroke-linejoin="round">${escape(line)}</text>`;
    })
    .join("\n");

  const svg = `<svg width="${W}" height="${W}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="black" stop-opacity="0"/>
      <stop offset="100%" stop-color="black" stop-opacity="0.82"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${gradientTop}" width="${W}" height="${gradientHeight}" fill="url(#g)"/>
  ${textEls}
</svg>`;

  return Buffer.from(svg);
}

// ---------------------------------------------------------------------------
// Generate and upload image
// ---------------------------------------------------------------------------

export async function generateImage(article: NewsArticle): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) throw new Error("OPENAI_API_KEY not configured");

  const entityLogoUrl = detectEntityLogoUrl(article);

  // ── Step 1: Sonnet writes the scene prompt (includes headline text in image) ─
  console.log("[NewsToSocial] Building image prompt via Sonnet...");
  const imagePrompt = await buildContextualImagePrompt(article);
  console.log("[NewsToSocial] Generating AI image for:", article.headline.slice(0, 60));

  // ── Step 2: Generate image with gpt-image-1 ──────────────────────────────
  const imageRes = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
      quality: "medium",
      output_format: "jpeg",
    }),
  });

  if (!imageRes.ok) {
    const errText = await imageRes.text();
    throw new Error(`gpt-image-1 error: ${errText.slice(0, 200)}`);
  }

  const imageData = await imageRes.json();
  const base64Image: string = imageData.data?.[0]?.b64_json;
  if (!base64Image) throw new Error("gpt-image-1 returned no image data");
  const rawImageBuffer = Buffer.from(base64Image, "base64");

  // ── Step 3: Composite REMAX logo (top-right) + optional entity logo ───────
  console.log("[NewsToSocial] Compositing logo...");
  const [logoBuffer, entityLogoBuffer] = await Promise.all([
    fetch(LOGO_URL).then((r) => r.arrayBuffer()).then((ab) => Buffer.from(ab)),
    entityLogoUrl ? fetchLogoBuffer(entityLogoUrl) : Promise.resolve(null),
  ]);

  const logoResized = await sharp(logoBuffer)
    .resize(160, null, { fit: "inside" })
    .toBuffer();
  const logoWidth = (await sharp(logoResized).metadata()).width ?? 160;

  const compositeInputs: sharp.OverlayOptions[] = [
    { input: logoResized, top: 20, left: 1024 - logoWidth - 20 },
  ];

  if (entityLogoBuffer) {
    const entityLogoResized = await sharp(entityLogoBuffer)
      .resize(120, 60, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    compositeInputs.push({ input: entityLogoResized, top: 20, left: 20 });
    console.log("[NewsToSocial] Entity logo composited:", entityLogoUrl!.split("/").pop());
  }

  // Add dark gradient strip at bottom (pure pixel math — no fonts, works on Vercel)
  // This gives the Cloudinary text overlay a dark background to sit on.
  const gradientBuffer = await buildGradientStripBuffer();
  compositeInputs.unshift({ input: gradientBuffer, top: 1024 - 260, left: 0 });

  // Composite: background + gradient + logos
  const compositedBuffer = await sharp(rawImageBuffer)
    .resize(1024, 1024, { fit: "cover", position: "centre" })
    .composite(compositeInputs)
    .jpeg({ quality: 92 })
    .toBuffer();

  // ── Step 4: Upload to Cloudinary ──────────────────────────────────────────
  console.log("[NewsToSocial] Uploading to Cloudinary...");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uploadResult = await new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `news-posts/${article.id}`,
        public_id: "main",
        overwrite: true,
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(compositedBuffer);
  });

  // ── Step 5: Apply text overlays via Cloudinary URL transforms ────────────
  // Cloudinary renders text server-side with proper fonts — no system font needed.
  const headlineClean = article.headline.replace(/\*\*/g, "").trim();
  const keyStat = extractKeyStat(headlineClean);
  const finalUrl = applyCloudinaryTextOverlay(
    uploadResult.secure_url,
    headlineClean,
    keyStat,
    false,
  );

  console.log("[NewsToSocial] Image ready:", finalUrl);
  return finalUrl;
}

// ---------------------------------------------------------------------------
// Insert social_posts rows + mark article processed
// ---------------------------------------------------------------------------

// Returns today at 7pm IST (13:30 UTC) as ISO string
function todayAt7pmIST(): string {
  const now = new Date();
  const scheduled = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 13, 30, 0)
  );
  // If it's already past 1:30pm UTC, schedule for tomorrow
  if (now.getTime() > scheduled.getTime()) {
    scheduled.setUTCDate(scheduled.getUTCDate() + 1);
  }
  return scheduled.toISOString();
}

export async function createSocialPosts(
  supabase: SupabaseClient,
  article: NewsArticle,
  captions: PlatformCaption[],
  imageUrl: string
): Promise<string[]> {
  const scheduledAt = todayAt7pmIST();
  const now = new Date().toISOString();

  // FB/Instagram: pending_review → user approves → scheduled → auto-published
  // X/LinkedIn: manual_ready → user copies and posts manually
  const AUTO_PLATFORMS = ["Facebook", "Instagram"];
  const rows = captions.map((c) => ({
    content_idea: article.headline,
    caption: c.caption,
    hashtags: c.hashtags,
    image_url: imageUrl,
    platform: c.platform,
    content_type: "post",
    status: AUTO_PLATFORMS.includes(c.platform) ? "pending_review" : "manual_ready",
    post_category: "news",
    news_article_id: article.id,
    scheduled_at: AUTO_PLATFORMS.includes(c.platform) ? scheduledAt : null,
    updated_at: now,
  }));

  const { data: inserted, error } = await supabase
    .from("social_posts")
    .insert(rows)
    .select("id");

  if (error) throw new Error(`createSocialPosts insert failed: ${error.message}`);

  const postIds = (inserted ?? []).map((r: { id: string }) => r.id);

  // Mark article as processed
  await supabase
    .from("news_articles")
    .update({
      is_processed: true,
      processed_at: now,
      social_post_count: captions.length,
      updated_at: now,
    })
    .eq("id", article.id);

  return postIds;
}

// ---------------------------------------------------------------------------
// Process a single article end-to-end
// ---------------------------------------------------------------------------

export async function processArticle(
  supabase: SupabaseClient,
  article: NewsArticle
): Promise<NewsPostResult> {
  const [captions, imageUrl] = await Promise.all([
    generateCaptions(article),
    generateImage(article),
  ]);

  const postIds = await createSocialPosts(supabase, article, captions, imageUrl);

  return {
    article_id: article.id,
    headline: article.headline,
    captions,
    image_url: imageUrl,
    post_ids: postIds,
  };
}
