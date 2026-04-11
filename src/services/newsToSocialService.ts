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
  const { data, error } = await supabase
    .from("news_articles")
    .select(
      "id, headline, summary, ai_summary, ai_tags, category, sub_category, cities, relevance_score, source_name, source_url, image_url"
    )
    .eq("is_processed", false)
    .eq("is_rejected", false)
    .gte("relevance_score", 7.0)
    .order("relevance_score", { ascending: false })
    .limit(count);

  if (error) throw new Error(`pickTopArticles failed: ${error.message}`);
  return (data ?? []) as NewsArticle[];
}

// ---------------------------------------------------------------------------
// Generate platform captions (all 4 in one Sonnet call)
// ---------------------------------------------------------------------------

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

  const systemPrompt = `You are a social media expert for REMAX Westside Realty, a premium real estate agency in Hyderabad, India.
You create engaging social media posts about Indian real estate and infrastructure news that position the brand as a knowledgeable market advisor.
Always connect news to what it means for property buyers, investors, or the market. Never post raw news — add context and insight.`;

  const userPrompt = `Generate social media captions for all 4 platforms for this real estate news article:

${context}

RULES per platform:
- LinkedIn: 200-400 chars, professional market insight + implication, 3-4 hashtags, NO emojis, end with "— REMAX Westside Realty"
- Instagram: 150-250 chars, hook line + key stat or insight, emoji-rich, 8-10 hashtags, end with "— REMAX Westside Realty"
- Facebook: 200-350 chars, conversational tone + useful detail for homebuyers, 5-6 hashtags, end with "— REMAX Westside Realty"
- X: max 240 chars total (including hashtags), sharp headline + one key stat or angle, 2 hashtags only, end with "— REMAX Westside Realty"

FORMATTING for Facebook and LinkedIn only — use **double asterisks** to mark text that should appear bold:
- Wrap the opening hook/question line: **Planning your next property purchase?**
- Wrap strong lead-in words: **Consider this:** or **Here's why it matters:**
- Wrap the closing signature: **— REMAX Westside Realty**
- Body sentences: plain text, no asterisks
- Instagram and X: plain text only, no asterisks at all

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
    "hashtags": ["2 only"]
  }
]`;

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

// Cloudinary text overlay encoding — spaces must be %20 (not underscore).
// Non-ASCII chars (e.g. ₹) must also be percent-encoded or Cloudinary breaks.
function encodeCloudinaryText(text: string): string {
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      // Encode all non-ASCII (including ₹, smart quotes, etc.)
      if (code > 127) return encodeURIComponent(char);
      // Encode ASCII chars that break Cloudinary transformation params
      switch (char) {
        case "%": return "%25";
        case " ": return "%20";
        case ",": return "%2C";
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

// Inject Cloudinary text overlay transformation into a Cloudinary URL.
// White headline text at the bottom — image AI prompt ensures a dark bottom zone.
function applyCloudinaryTextOverlay(cloudinaryUrl: string, headline: string): string {
  const decoded = decodeHtmlEntities(headline).slice(0, 120);
  const encoded = encodeCloudinaryText(decoded);

  const [before, after] = cloudinaryUrl.split("/upload/");
  if (!before || !after) return cloudinaryUrl;

  // White headline text anchored bottom-left
  const textLayer = [
    `l_text:Arial_52_bold:${encoded}`,
    "co_white",
    "g_south_west",
    "x_36",
    "y_44",
    "w_952",
    "c_fit",
  ].join(",");

  return `${before}/upload/${textLayer}/${after}`;
}

// Build a dark gradient strip SVG for the bottom of the image.
// Pure geometry only — NO text — so no system fonts are needed on Vercel.
function buildGradientStripSvg(): Buffer {
  const svg = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="black" stop-opacity="0"/>
        <stop offset="100%" stop-color="black" stop-opacity="0.82"/>
      </linearGradient>
    </defs>
    <rect x="0" y="580" width="1024" height="444" fill="url(#g)"/>
  </svg>`;
  return Buffer.from(svg);
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

  // Fetch and resize logo for top-right corner
  console.log("[NewsToSocial] Compositing gradient + logo");
  const logoFetch = await fetch(LOGO_URL);
  const logoBuffer = Buffer.from(await logoFetch.arrayBuffer());
  const logoResized = await sharp(logoBuffer)
    .resize(160, null, { fit: "inside" })
    .toBuffer();
  const logoMeta = await sharp(logoResized).metadata();
  const logoWidth = logoMeta.width ?? 160;

  // Dark gradient strip (SVG, pure geometry — no fonts needed on Vercel)
  const gradientStrip = buildGradientStripSvg();

  const compositedBuffer = await sharp(rawImageBuffer)
    .composite([
      // 1. Dark gradient at the bottom so white text is always readable
      { input: gradientStrip, top: 0, left: 0 },
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
