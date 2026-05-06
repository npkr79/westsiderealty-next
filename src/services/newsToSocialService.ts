import { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import { areSameStory } from "@/services/newsScraperService";

const STYLE_WRAPPER = `Create a photorealistic image that visually represents this Indian social media post. Style: cinematic editorial photography, natural lighting, warm color grade. No text in the image.

POST:
{post_text}

Generate one image matching the subject and emotional tone of the post.`;

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
  image_url: string | null;
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

  // Only pick articles published in the last 24 hours — no stale news.
  // Use published_at (the article's actual publication date) not scraped_at,
  // so articles from days ago that the scraper finds late are still excluded.
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Pull a larger pool — positive sentiment only, high relevance, never processed
  const { data, error } = await supabase
    .from("news_articles")
    .select(SELECT)
    .eq("is_processed", false)
    .eq("is_rejected", false)
    .eq("social_post_count", 0)   // hard stop: never regenerate if posts were already made
    .neq("sentiment", "negative")
    .gte("relevance_score", 7.5)
    .gte("published_at", cutoff24h)  // freshness gate: published within last 24h
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

  // ── Load recently seen article headlines (last 30 days) ───────────────────
  // Three sources:
  //   1. Processed articles (is_processed=true) — already had posts generated
  //   2. Rejected articles (is_rejected=true) — rejected before or after post creation
  //   3. Social posts from last 30 days — catches any status (posted/rejected/pending)
  // Together these ensure no story is repeated regardless of its outcome status.
  const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [processedRes, rejectedRes, socialPostsRes] = await Promise.all([
    supabase
      .from("news_articles")
      .select("headline")
      .eq("is_processed", true)
      .gte("processed_at", cutoff30d),
    supabase
      .from("news_articles")
      .select("headline")
      .eq("is_rejected", true)
      .gte("scraped_at", cutoff30d),
    supabase
      .from("social_posts")
      .select("news_articles(headline)")
      .gte("created_at", cutoff30d)
      .not("news_article_id", "is", null),
  ]);

  const processedHeadlines: string[] = [
    ...((processedRes.data ?? []) as { headline: string }[]).map((r) => r.headline),
    ...((rejectedRes.data ?? []) as { headline: string }[]).map((r) => r.headline),
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
        model: "claude-sonnet-4-6",
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
// Dark gradient strip for text readability (bottom of image)
// ---------------------------------------------------------------------------

async function buildGradientStripBuffer(width: number, height: number): Promise<Buffer> {
  const H = 280;
  const raw = Buffer.alloc(width * H * 4);
  for (let y = 0; y < H; y++) {
    const alpha = Math.round((y / (H - 1)) * 200);
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      raw[i] = 0; raw[i + 1] = 0; raw[i + 2] = 0; raw[i + 3] = alpha;
    }
  }
  return sharp(raw, { raw: { width, height: H, channels: 4 } }).png().toBuffer();
}

// ---------------------------------------------------------------------------
// Cloudinary yellow headline text overlay
// ---------------------------------------------------------------------------

function encodeCloudinaryText(text: string): string {
  return text
    .replace(/(\d),(\d)/g, "$1$2")
    .replace(/,/g, " - ")
    .replace(/&#039;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .split("")
    .map((char) => {
      if (char.charCodeAt(0) > 127) return encodeURIComponent(char);
      const map: Record<string, string> = { "%": "%25", " ": "%20", "/": "%2F", "?": "%3F", "#": "%23", "&": "%26", "+": "%2B", "$": "%24" };
      return map[char] ?? char;
    })
    .join("");
}

function applyHeadlineOverlay(cloudinaryUrl: string, headline: string): string {
  const encoded = encodeCloudinaryText(headline.replace(/\*\*/g, "").trim().slice(0, 120));
  const [before, after] = cloudinaryUrl.split("/upload/");
  if (!before || !after) return cloudinaryUrl;
  const layer = [
    `l_text:Arial_54_bold:${encoded}`,
    "co_rgb:FFD700",
    "g_south_west",
    "x_36",
    "y_44",
    "w_952",
    "c_fit",
  ].join(",");
  return `${before}/upload/${layer}/${after}`;
}

// ---------------------------------------------------------------------------
// Generate and upload image
// ---------------------------------------------------------------------------

export async function generateImage(article: NewsArticle): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) throw new Error("OPENAI_API_KEY not configured");

  const postText = [
    article.headline,
    article.ai_summary ?? article.summary ?? "",
  ].filter(Boolean).join("\n\n");

  const prompt = STYLE_WRAPPER.replace("{post_text}", postText);
  console.log("[NewsToSocial] Generating image for:", article.headline.slice(0, 60));

  // ── Step 1: Generate image with gpt-image-1 ───────────────────────────────
  const imageRes = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1536",
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
  const rawImageBuffer = Buffer.from(base64Image, "base64");

  // ── Step 2: Composite REMAX logo (top-right) + dark gradient (bottom) ────
  console.log("[NewsToSocial] Compositing logo + gradient...");
  const IMG_W = 1024;
  const IMG_H = 1536;

  const [logoBuffer, gradientBuffer] = await Promise.all([
    fetch(LOGO_URL).then((r) => r.arrayBuffer()).then((ab) => Buffer.from(ab)),
    buildGradientStripBuffer(IMG_W, IMG_H),
  ]);

  const logoResized = await sharp(logoBuffer)
    .resize(160, null, { fit: "inside" })
    .toBuffer();
  const logoWidth = (await sharp(logoResized).metadata()).width ?? 160;

  const compositedBuffer = await sharp(rawImageBuffer)
    .composite([
      { input: gradientBuffer, top: IMG_H - 280, left: 0 },
      { input: logoResized, top: 20, left: IMG_W - logoWidth - 20 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  // ── Step 3: Upload to Cloudinary ──────────────────────────────────────────
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

  // ── Step 4: Yellow headline text via Cloudinary transform ────────────────
  const finalUrl = applyHeadlineOverlay(uploadResult.secure_url, article.headline);
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
  imageUrl: string | null
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
  const captions = await generateCaptions(article);
  const postIds = await createSocialPosts(supabase, article, captions, null);

  return {
    article_id: article.id,
    headline: article.headline,
    captions,
    image_url: null,
    post_ids: postIds,
  };
}
