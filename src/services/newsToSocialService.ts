import { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import { areSameStory } from "@/services/newsScraperService";

const STYLE_WRAPPER = `Create a professional social media post image (940px × 788px Facebook post size) for a real estate news update.

VISUAL STYLE
- Clean, modern, professional infographic style
- Broad daylight lighting — avoid dark, sunset, golden hour, or night themes
- Realistic urban / office / infrastructure / business environments
- Modern, high-quality, editorial-style visuals
- Corporate, trustworthy, credible tone

LAYOUT & SPACING
- Balanced layout with strong visual hierarchy
- Adequate spacing and margins
- Do not overcrowd the design
- Prioritise readability on mobile screens

BRANDING
- Do NOT place any logo or branding in the top-right corner (reserved for company logo added separately)
- If relevant, include logos of regulatory bodies, companies, or institutions mentioned — placed naturally in header area
- If a notable person is mentioned (CEO / Minister / Chairman / Founder), include a realistic photo of them
- Avoid Government of India logos

TEXT ON IMAGE
- Keep text short and punchy — title and subtitle only
- Place the main title near the bottom of the image
- White text for normal content; yellow text for highlighted keywords, numbers, percentages, and years
- Bold emphasis on numbers, percentages, years, key warnings, and important phrases
- Use a dark overlay behind text for readability
- Maintain clear spacing between the bottom edge and text

VISUAL ELEMENTS
- Use relevant icons: warning icons, growth charts, buildings, infrastructure, money symbols, legal symbols, checklists
- Keep the design clean and minimal — no clutter

TONE
- Professional, regulatory, informative, credible, authoritative
- No marketing hype, sales language, or clickbait

OUTPUT
- Sharp, modern, corporate-grade, social-media ready
- Readable on mobile
- Professional enough for LinkedIn and Facebook

POST CONTENT:
{post_text}`;

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
Your role is to create professional, factual social media posts about real estate news.

TONE RULES:
- Professional, neutral, informational — no emojis unless requested
- Facts first, then impact, then takeaway
- No speculation presented as certainty
- NEVER say: "early movers will benefit", "prices will surge", "now is the time to invest"
- NEVER use direct sales CTAs: "Contact us", "Book a consultation", "Call now"
- The brand signature is the only CTA needed

UNICODE BOLD FORMATTING (MANDATORY):
- Use Lingojam Unicode bold (𝗹𝗶𝗸𝗲 𝘁𝗵𝗶𝘀) for: titles, subtitles, all headings, sub-headings, key numbers, percentages, years, and important keywords
- Do NOT bold the entire post — only titles, headings, key numbers, and key phrases
- All bold text must be Unicode style, not Markdown asterisks
- Posts must be fully copy-paste ready for social media`;

  const userPrompt = `Create social media posts for X, LinkedIn, Facebook, and Instagram for this real estate news article:

${context}

POST STRUCTURE — use this exact structure for every platform:
[Unicode Bold Title]
[Unicode Bold Subtitle]

[Unicode Bold Heading]
• Bullet point explaining the news or update
• Keep sentences short
• Highlight key numbers in Unicode bold

[Unicode Bold Second Heading]
• Explain impact or implications
• Use practical insights

𝗞𝗲𝘆 𝗧𝗮𝗸𝗲𝗮𝘄𝗮𝘆
• 2–3 short summary lines

— REMAX Westside Realty

PLATFORM RULES:
- X: short and concise, 3-4 hashtags
- LinkedIn: professional and insight-driven, 3-4 hashtags
- Facebook: explanatory and informative, 5-6 hashtags
- Instagram: engaging and simple, 8-10 hashtags

SIGNATURE FORMATTING:
- Signature must be on its own paragraph separated by a blank line
- In the JSON caption value use \\n\\n before the signature

Return ONLY a valid JSON array (no markdown, no code fences):
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

  // ── Step 1: Generate image with gpt-image-2 ───────────────────────────────
  const imageRes = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "high",
      output_format: "jpeg",
    }),
  });

  if (!imageRes.ok) {
    const errText = await imageRes.text();
    throw new Error(`gpt-image-2 error: ${errText.slice(0, 200)}`);
  }

  const imageData = await imageRes.json();
  const base64Image: string = imageData.data?.[0]?.b64_json;
  if (!base64Image) throw new Error("gpt-image-2 returned no image data");
  const rawImageBuffer = Buffer.from(base64Image, "base64");

  // ── Step 2: Resize to 940×788 (Facebook post) + composite REMAX logo top-right ──
  // The AI generates the image at 1024×1024 and we crop/resize to the target dimensions.
  // Text (title, subtitle, dark overlay) is already embedded by the AI — no text overlay needed.
  console.log("[NewsToSocial] Resizing to 940×788 and compositing logo...");
  const IMG_W = 940;
  const IMG_H = 788;

  const logoBuffer = await fetch(LOGO_URL).then((r) => r.arrayBuffer()).then((ab) => Buffer.from(ab));

  const logoResized = await sharp(logoBuffer)
    .resize(140, null, { fit: "inside" })
    .toBuffer();
  const logoWidth = (await sharp(logoResized).metadata()).width ?? 140;

  const compositedBuffer = await sharp(rawImageBuffer)
    .resize(IMG_W, IMG_H, { fit: "cover", position: "centre" })
    .composite([
      { input: logoResized, top: 16, left: IMG_W - logoWidth - 16 },
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

  const finalUrl = uploadResult.secure_url;
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
