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

  // Pull a larger pool — positive sentiment only, high relevance
  const { data, error } = await supabase
    .from("news_articles")
    .select(SELECT)
    .eq("is_processed", false)
    .eq("is_rejected", false)
    .neq("sentiment", "negative")
    .gte("relevance_score", 7.5)
    .order("relevance_score", { ascending: false })
    .limit(40); // Larger pool so we have room after dedup

  if (error) throw new Error(`pickTopArticles failed: ${error.message}`);
  const rawPool = (data ?? []) as NewsArticle[];

  // ── Load recently processed article headlines (last 30 days) ──────────────
  // These are the stories already turned into social posts — never re-post them.
  const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentProcessed } = await supabase
    .from("news_articles")
    .select("headline")
    .eq("is_processed", true)
    .gte("processed_at", cutoff30d);
  const processedHeadlines: string[] = (recentProcessed ?? []).map(
    (r: { headline: string }) => r.headline
  );

  // ── Filter pool: remove articles that are the same story as any processed article ──
  const deduped = rawPool.filter((article) => {
    const isDuplicateOfProcessed = processedHeadlines.some((ph) =>
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
Your role is to amplify exciting real estate market news in a way that creates FOMO (fear of missing out) and market confidence — making readers feel they need to be paying attention to the market RIGHT NOW.

TONE RULES:
- Lead with the most impressive number, record, or milestone from the news — make it pop
- Connect the news to why this matters for buyers and investors ("this means demand is rising", "early movers in this corridor will benefit most")
- Create a sense of market momentum — the market is moving, people are buying, investors are acting
- Write with energy and conviction, like a sharp market insider sharing an unmissable signal
- NEVER be alarmist, never predict crashes, never use fear negatively
- NEVER use direct sales CTAs: "Contact us", "Book a consultation", "Call now", "DM us to invest"
- The brand signature is the only soft CTA needed
- Use power words: record, surge, milestone, boom, soaring, historic, accelerating, outperforming`;

  const userPrompt = `Generate social media captions for all 4 platforms for this real estate news article:

${context}

RULES per platform:
- LinkedIn: 250-400 chars, lead with the headline stat/milestone, explain the market signal it sends, professional FOMO tone, 3-4 hashtags, NO emojis, end with "— REMAX Westside Realty"
- Instagram: 180-280 chars, lead with the wow-factor number or fact, connect to buyer opportunity, emoji-rich (use 🔥📈🏙️🚀💡📊 etc.), 8-10 hashtags, end with "— REMAX Westside Realty"
- Facebook: 220-360 chars, conversational but exciting — explain what's happening and why now is the moment to be paying attention, 5-6 hashtags, end with "— REMAX Westside Realty"
- X: 220-380 chars, punchy market take — drop the number, explain the implication fast, 3-4 hashtags, NO emojis, end with "— REMAX Westside Realty"

FOMO FORMULA: [Impressive stat or record] → [What it signals about the market] → [Why this matters for buyers/investors now]

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

  const context = [
    `Headline: ${article.headline}`,
    article.ai_summary ? `Summary: ${article.ai_summary}` : "",
    article.summary ? `Source summary: ${article.summary}` : "",
    `Category: ${article.category}`,
    article.cities.length ? `Cities mentioned: ${article.cities.join(", ")}` : "",
    article.ai_tags.length ? `Tags: ${article.ai_tags.join(", ")}` : "",
  ].filter(Boolean).join("\n");

  const prompt = `You are a visual art director for a premium Indian real estate brand creating social media posts.

Analyze this news article and write a story-specific image generation prompt for gpt-image-1.

${context}

LIGHTING RULES — pick ONE that fits the story, never default to golden hour or warm tones:
- Infrastructure/expressway: bright midday sun, aerial perspective, sharp shadows, vivid blue sky
- Developer/sales news: clean cool morning light, architectural photography style, glass and steel
- GCC/corporate: blue-hour or cool morning, city skyline, glass reflections, business energy
- Government/policy: flat neutral daylight, official building facades, crisp and authoritative
- Goa/coastal: soft bright coastal light, sea visible, natural greens and blues
- Hyderabad: specific to the corridor — Kokapet glass towers, ORR flyover, or tech campus feel

Your prompt must:
1. Be SPECIFIC to this exact story — describe the actual subject, not a generic scene
2. For infrastructure stories: show the specific route or structure (e.g., wide-angle of a massive cable-stayed bridge over a river, or a six-lane expressway cutting through farmland)
3. For sales/revenue stories: scale and ambition — towers under construction, cranes, buyers walking through a show flat (no faces)
4. For GCC/corporate stories: a gleaming tech campus or business district, not generic towers
5. For Goa stories: coastal villas, beach, palm trees, natural light — no urban feel
6. Specify exact camera angle, lens feel (wide-angle / telephoto / aerial drone)
7. Each prompt must feel visually DIFFERENT from a real estate skyline shot

STRICT RULES:
- NEVER use: golden hour, amber sky, warm tones, aspirational, wealth-aspirational
- NO real human faces or likenesses
- NO logos of any organizations — composited separately
- Bottom 35% must be dark/shadowed for text overlay
- Output ONLY the prompt text, no preamble
- Max 200 words`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-20250514",
        max_tokens: 450,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return buildFallbackImagePrompt(article);
    const data = await res.json();
    const scenePrompt: string = data.content?.[0]?.text?.trim() ?? "";
    if (!scenePrompt) return buildFallbackImagePrompt(article);

    console.log("[NewsToSocial] Haiku scene prompt:", scenePrompt.slice(0, 120));
    return scenePrompt + "\n\nStyle: Magazine-quality, cinematic, premium real estate brand. Square 1:1 format. NO watermarks, NO brand logos.";
  } catch (err) {
    console.warn("[NewsToSocial] Haiku prompt generation failed, using fallback:", err);
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

  // 3. Headline text — yellow, bottom
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
  const H = 440; // height of the gradient zone at the bottom
  const raw = Buffer.alloc(W * H * 4); // RGBA

  for (let y = 0; y < H; y++) {
    // Alpha ramps from 0 (top) to ~210 (~82% of 255) at the bottom
    const alpha = Math.round((y / (H - 1)) * 210);
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
// Generate and upload image
// ---------------------------------------------------------------------------

export async function generateImage(article: NewsArticle): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) throw new Error("OPENAI_API_KEY not configured");

  const keyStat = extractKeyStat(article.headline);
  const entityLogoUrl = detectEntityLogoUrl(article);

  // ── Step 1: Get base image buffer ─────────────────────────────────────────
  // Prefer the article's own source image (official press renders, real photos).
  // Fall back to AI generation if unavailable.
  let rawImageBuffer: Buffer;
  let isSourceImage = false;

  if (article.image_url) {
    console.log("[NewsToSocial] Trying source image:", article.image_url.slice(0, 80));
    const sourceBuffer = await fetchSourceImageBuffer(article.image_url);
    if (sourceBuffer) {
      rawImageBuffer = sourceBuffer;
      isSourceImage = true;
      console.log("[NewsToSocial] Using source image — skipping AI generation");
    } else {
      console.log("[NewsToSocial] Source image unavailable, falling back to AI generation");
    }
  }

  if (!isSourceImage) {
    // Build a vivid, context-specific prompt via Claude Haiku, then generate
    console.log("[NewsToSocial] Building contextual prompt via Haiku...");
    const imagePrompt = await buildContextualImagePrompt(article);
    console.log("[NewsToSocial] Generating AI image for:", article.headline.slice(0, 60));

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
        quality: "high",
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
    rawImageBuffer = Buffer.from(base64Image, "base64");
  }

  // ── Step 2: Build composite layers in parallel ────────────────────────────
  console.log("[NewsToSocial] Compositing layers...");

  const parallelFetches: [
    Promise<Buffer>,                   // gradient strip (always)
    Promise<Buffer | null>,            // top band (when stat exists)
    Promise<Buffer>,                   // REMAX logo
    Promise<Buffer | null>,            // entity logo (optional)
  ] = [
    buildGradientStripBuffer(),
    keyStat ? buildTopBandBuffer() : Promise.resolve(null),
    fetch(LOGO_URL).then((r) => r.arrayBuffer()).then((ab) => Buffer.from(ab)),
    entityLogoUrl ? fetchLogoBuffer(entityLogoUrl) : Promise.resolve(null),
  ];

  const [gradientStrip, topBand, logoBuffer, entityLogoBuffer] = await Promise.all(parallelFetches);

  // Resize REMAX logo
  const logoResized = await sharp(logoBuffer)
    .resize(160, null, { fit: "inside" })
    .toBuffer();
  const logoMeta = await sharp(logoResized).metadata();
  const logoWidth = logoMeta.width ?? 160;

  // Resize entity logo if present
  let entityLogoResized: Buffer | null = null;
  let entityLogoWidth = 0;
  if (entityLogoBuffer) {
    entityLogoResized = await sharp(entityLogoBuffer)
      .resize(120, 60, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const eMeta = await sharp(entityLogoResized).metadata();
    entityLogoWidth = eMeta.width ?? 120;
    console.log("[NewsToSocial] Entity logo composited:", entityLogoUrl!.split("/").pop());
  }

  // ── Step 3: Composite everything with Sharp ───────────────────────────────
  const GRADIENT_H = 440;
  const compositeInputs: sharp.OverlayOptions[] = [
    // Bottom gradient for headline readability
    { input: gradientStrip, top: 1024 - GRADIENT_H, left: 0 },
    // REMAX logo — top-right
    { input: logoResized, top: 20, left: 1024 - logoWidth - 20 },
  ];

  // Top dark band when key stat will be shown (improves contrast)
  if (topBand) {
    compositeInputs.push({ input: topBand, top: 0, left: 0 });
  }

  // Entity logo — top-left
  if (entityLogoResized) {
    compositeInputs.push({ input: entityLogoResized, top: 20, left: 20 });
  }

  const compositedBuffer = await sharp(rawImageBuffer!)
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

  // ── Step 5: Apply text overlays via Cloudinary URL transforms ─────────────
  const finalUrl: string = applyCloudinaryTextOverlay(
    uploadResult.secure_url,
    article.headline,
    keyStat,
    isSourceImage,
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
