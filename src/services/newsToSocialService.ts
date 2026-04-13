import { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";

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
    "id, headline, summary, ai_summary, ai_tags, category, sub_category, cities, relevance_score, sentiment, source_name, source_url, image_url";

  // Pull a larger pool — positive sentiment only, high relevance
  const { data, error } = await supabase
    .from("news_articles")
    .select(SELECT)
    .eq("is_processed", false)
    .eq("is_rejected", false)
    .neq("sentiment", "negative")
    .gte("relevance_score", 7.5)
    .order("relevance_score", { ascending: false })
    .limit(20);

  if (error) throw new Error(`pickTopArticles failed: ${error.message}`);
  const pool = (data ?? []) as NewsArticle[];

  const picked: NewsArticle[] = [];
  const used = new Set<string>();

  // Reserve 1 slot each for Hyderabad and Goa (best scored available)
  for (const city of ["hyderabad", "goa"]) {
    const match = pool.find(
      (a) => !used.has(a.id) && a.cities?.includes(city)
    );
    if (match) {
      picked.push(match);
      used.add(match.id);
    }
  }

  // Fill remaining slots with top-scored articles not already picked
  for (const article of pool) {
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
// Generate image prompt for a news article by category
// ---------------------------------------------------------------------------

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

// Inject Cloudinary text overlays into a Cloudinary URL.
// Yellow headline at bottom, small "PHOTO: AI GENERATED" label at top-left.
function applyCloudinaryTextOverlay(cloudinaryUrl: string, headline: string): string {
  const decoded = decodeHtmlEntities(headline).slice(0, 120);
  const encoded = encodeCloudinaryText(decoded);

  const [before, after] = cloudinaryUrl.split("/upload/");
  if (!before || !after) return cloudinaryUrl;

  // Yellow headline text anchored bottom-left
  const headlineLayer = [
    `l_text:Arial_56_bold:${encoded}`,
    "co_rgb:FFD700",
    "g_south_west",
    "x_36",
    "y_44",
    "w_952",
    "c_fit",
  ].join(",");

  // Small "PHOTO: AI GENERATED" label top-left
  const labelLayer = [
    "l_text:Arial_22_bold:PHOTO%3A%20AI%20GENERATED",
    "co_rgb:FFFFFF",
    "g_north_west",
    "x_20",
    "y_20",
  ].join(",");

  return `${before}/upload/${labelLayer}/${headlineLayer}/${after}`;
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

function buildImagePrompt(article: NewsArticle): string {
  const categoryVisuals: Record<string, string> = {
    infrastructure:
      "Modern Indian infrastructure — elevated metro rail, highways, bridges, smart city skyline at dusk with warm golden light. Cinematic, architectural photography style.",
    policy:
      "Indian government policy and real estate — elegant government building facade, official documents, Indian tricolor, professional corporate atmosphere. Clean and authoritative.",
    market:
      "Indian real estate market — premium residential towers, luxury apartments, modern glass buildings against a blue sky with clouds. Aspirational and dynamic.",
    corporate:
      "Corporate India — glass and steel office towers, business district skyline, modern commercial real estate. Professional and upscale.",
    regulatory:
      "Legal and regulatory framework — balanced scales of justice, official documents, premium office environment. Trustworthy and professional.",
    investment:
      "Real estate investment — growth charts, premium properties, upward trajectory, gold and green tones, prosperity theme. Optimistic and wealth-aspirational.",
    launch:
      "New property launch — architectural rendering of a premium residential project, luxury amenities, landscaping. Premium and exciting.",
  };

  const baseVisual =
    categoryVisuals[article.category] ??
    "Premium Indian real estate — modern residential and commercial buildings, city skyline, aspirational architecture. Professional quality.";

  const cityContext =
    article.cities.length && !article.cities.includes("national")
      ? ` Setting evokes ${article.cities[0]} city character.`
      : "";

  return `Professional social media background image for a real estate news post. ${baseVisual}${cityContext}

CRITICAL REQUIREMENTS:
- NO human faces, NO text, NO watermarks, NO logos
- Square format 1:1, vibrant but not garish
- Style: Premium Indian real estate brand, Instagram-ready
- Lighting: Professional, bright and engaging
- Keep the bottom 40% of the image relatively dark/shadowed — text will be overlaid there`;
}

// ---------------------------------------------------------------------------
// Generate and upload image
// ---------------------------------------------------------------------------

export async function generateImage(article: NewsArticle): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) throw new Error("OPENAI_API_KEY not configured");

  const imagePrompt = buildImagePrompt(article);

  // Generate with gpt-image-1
  console.log("[NewsToSocial] Generating image for:", article.headline.slice(0, 60));
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

  // Build gradient + fetch logo in parallel
  console.log("[NewsToSocial] Compositing gradient + logo");
  const [gradientStrip, logoBuffer] = await Promise.all([
    buildGradientStripBuffer(),
    fetch(LOGO_URL).then((r) => r.arrayBuffer()).then((ab) => Buffer.from(ab)),
  ]);

  const logoResized = await sharp(logoBuffer)
    .resize(160, null, { fit: "inside" })
    .toBuffer();
  const logoMeta = await sharp(logoResized).metadata();
  const logoWidth = logoMeta.width ?? 160;

  const GRADIENT_H = 440;
  const compositedBuffer = await sharp(rawImageBuffer)
    .composite([
      // 1. Dark gradient anchored to the bottom (y = 1024 - 440 = 584)
      { input: gradientStrip, top: 1024 - GRADIENT_H, left: 0 },
      // 2. Logo top-right
      { input: logoResized, top: 20, left: 1024 - logoWidth - 20 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  // Upload to Cloudinary
  console.log("[NewsToSocial] Uploading to Cloudinary");
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

  // Apply Cloudinary URL-based text overlay (server-side font rendering — works on Vercel)
  const finalUrl: string = applyCloudinaryTextOverlay(
    uploadResult.secure_url,
    article.headline
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
