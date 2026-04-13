import Anthropic from "@anthropic-ai/sdk";
import { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  source_type: string;
  category: string | null;
  is_active: boolean;
}

export interface RawArticle {
  source_name: string;
  source_url: string;
  source_type: string;
  headline: string;
  summary: string | null;
  image_url: string | null;
  published_at: string | null;
  raw_category: string | null;
}

export interface ClassifiedArticle extends RawArticle {
  category: string;
  sub_category: string | null;
  cities: string[];
  relevance_score: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  ai_summary: string;
  ai_tags: string[];
}

// ---------------------------------------------------------------------------
// RSS Feed Fetcher
// ---------------------------------------------------------------------------

/**
 * Extracts text content between XML tags (handles CDATA sections too).
 */
function extractTag(xml: string, tag: string): string {
  // Try CDATA first
  const cdataRe = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, "i");
  const cdataMatch = xml.match(cdataRe);
  if (cdataMatch) return cdataMatch[1].trim();

  // Plain text
  const plainRe = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const plainMatch = xml.match(plainRe);
  if (plainMatch) return plainMatch[1].replace(/<[^>]+>/g, "").trim();

  return "";
}

/**
 * Extracts the first image URL from an RSS <item> block.
 */
function extractImageUrl(itemXml: string): string | null {
  // <media:content url="..." />
  const mediaMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch) return mediaMatch[1];

  // <enclosure url="..." type="image/..." />
  const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image[^"']*["']/i);
  if (enclosureMatch) return enclosureMatch[1];

  // <img src="..." /> inside description/content
  const imgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];

  return null;
}

/**
 * Parses an RSS/Atom XML string and returns raw article items.
 */
function parseRSS(xml: string, source: NewsSource): RawArticle[] {
  const articles: RawArticle[] = [];

  // Split on <item> or <entry> (Atom)
  const itemRegex = /<(item|entry)[\s>]([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[2];

    const headline =
      extractTag(itemXml, "title") ||
      extractTag(itemXml, "h1");
    if (!headline) continue;

    // Link: <link> or <link href="..." /> (Atom)
    let link = extractTag(itemXml, "link");
    if (!link) {
      const hrefMatch = itemXml.match(/<link[^>]+href=["']([^"']+)["']/i);
      if (hrefMatch) link = hrefMatch[1];
    }
    if (!link) continue;

    // Published date
    const pubDate =
      extractTag(itemXml, "pubDate") ||
      extractTag(itemXml, "published") ||
      extractTag(itemXml, "updated") ||
      extractTag(itemXml, "dc:date");

    const summary =
      extractTag(itemXml, "description") ||
      extractTag(itemXml, "summary") ||
      extractTag(itemXml, "content:encoded") ||
      null;

    articles.push({
      source_name: source.name,
      source_url: link.trim(),
      source_type: source.source_type,
      headline: headline.trim(),
      summary: summary ? summary.substring(0, 1000) : null,
      image_url: extractImageUrl(itemXml),
      published_at: pubDate ? new Date(pubDate).toISOString() : null,
      raw_category: source.category,
    });
  }

  return articles;
}

/**
 * Determines if an article is within the last 48 hours.
 */
function isRecent(article: RawArticle): boolean {
  if (!article.published_at) return true; // include if no date (err on the side of inclusion)
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  return new Date(article.published_at).getTime() >= cutoff;
}

/**
 * Fetches and parses all active RSS feeds in parallel with a 15s timeout.
 */
export async function fetchAllRSSFeeds(sources: NewsSource[]): Promise<{
  articles: RawArticle[];
  errors: { source: string; error: string }[];
}> {
  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8_000);
      try {
        const res = await fetch(source.url, {
          signal: controller.signal,
          headers: { "User-Agent": "WestsideRealty-NewsScraper/1.0" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const xml = await res.text();
        const articles = parseRSS(xml, source).filter(isRecent);
        return { source: source.name, articles };
      } finally {
        clearTimeout(timeout);
      }
    })
  );

  const articles: RawArticle[] = [];
  const errors: { source: string; error: string }[] = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      articles.push(...result.value.articles);
    } else {
      errors.push({
        source: sources[i].name,
        error: result.reason?.message ?? String(result.reason),
      });
    }
  });

  return { articles, errors };
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

/**
 * Normalizes a headline for fuzzy duplicate detection.
 */
function normalizeHeadline(headline: string): string {
  return headline
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 80);
}

/**
 * Two-layer deduplication: exact URL match + normalized headline match.
 */
export function deduplicateItems(
  items: RawArticle[],
  existingUrls: Set<string>
): RawArticle[] {
  const seenUrls = new Set(existingUrls);
  const seenHeadlines = new Set<string>();
  const unique: RawArticle[] = [];

  for (const item of items) {
    const url = item.source_url.trim();
    const normHeadline = normalizeHeadline(item.headline);

    if (seenUrls.has(url)) continue;
    if (seenHeadlines.has(normHeadline)) continue;

    seenUrls.add(url);
    seenHeadlines.add(normHeadline);
    unique.push(item);
  }

  return unique;
}

// ---------------------------------------------------------------------------
// AI Classification
// ---------------------------------------------------------------------------

const CITY_SLUGS = [
  "hyderabad", "mumbai", "bangalore", "delhi_ncr", "pune", "chennai",
  "kolkata", "ahmedabad", "goa", "jaipur", "lucknow", "chandigarh",
  "kochi", "national",
];

const CATEGORIES = [
  "infrastructure", "policy", "market", "corporate",
  "regulatory", "investment", "launch",
];

interface ClassificationResult {
  relevance_score: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
  sub_category: string | null;
  cities: string[];
  ai_summary: string;
  ai_tags: string[];
}

/**
 * Classifies a batch of articles using Claude Haiku.
 */
async function classifyBatch(
  client: Anthropic,
  batch: RawArticle[]
): Promise<ClassificationResult[]> {
  const articlesJson = batch.map((a, i) => ({
    index: i,
    headline: a.headline,
    summary: a.summary?.substring(0, 300) ?? "",
    source_category: a.raw_category,
  }));

  const prompt = `You are a real estate news classifier for Westside Realty, a premium Indian real estate advisory firm.

Your job is to identify EXCITING, POSITIVE, FOMO-inducing real estate news that encourages buyers and investors to act. We want content that signals market momentum, growth, and opportunity.

SENTIMENT GUIDE — classify first:
- "positive": News showing market growth, price appreciation, record sales/leasing, investment inflows, infrastructure wins, developer success, demand milestones, strong employment, economic tailwinds. These CREATE confidence and FOMO.
- "negative": Fraud cases, scams, ED/CBI raids, demolitions (HYDRAA etc.), builder insolvency/NCLT/NCLAT, GST complaints, encroachment disputes, delays, affordable housing schemes for low-income (not aspirational), protests, legal disputes. These DISCOURAGE buyers.
- "neutral": Regulatory clarifications, policy announcements with mixed/unclear buyer impact, general economic news.

SCORING GUIDE — score based on relevance AND sentiment:
- 9-10: Positive news with direct real estate impact — record sales, price surges, investment announcements, leasing milestones, new luxury launches, demand highs
- 7-8: Positive news with strong indirect impact — metro/infra expansion near residential zones, IT/GCC job growth (drives housing demand), RBI rate cuts, major developer wins
- 5-6: Neutral/positive moderate impact — general economic growth, policy with unclear impact
- 1-3: ANY negative news (fraud, demolitions, distress) OR irrelevant news — score LOW regardless of how "real estate relevant" it seems. We never post discouraging content.

EXPLICIT REJECT LIST — always score 1-3 and mark "negative":
- Demolitions by HYDRAA, BMC, or any authority
- Fraud/scam/ED raids/CBI raids on builders or homebuyers
- Builder insolvency, NCLT, NCLAT, IRP proceedings
- Homebuyer protests or complaints
- GST disputes, tax compliance issues
- Encroachment disputes, land grab allegations
- Affordable housing for economically weaker sections (EWS/LIG)
- Builder delays, stalled projects
- Any news that would make a buyer feel scared or at risk

CATEGORIES: ${CATEGORIES.join(", ")}
CITY SLUGS (use exact slugs): ${CITY_SLUGS.join(", ")}

For each article, respond with a JSON array (same order as input) where each element has:
{
  "relevance_score": <number 1-10, one decimal>,
  "sentiment": <"positive" | "negative" | "neutral">,
  "category": <one of the categories above>,
  "sub_category": <optional specific sub-topic, e.g. "metro_rail", "home_loans", "premium_launch">,
  "cities": <array of city slugs from the list above, empty array if national/unclear>,
  "ai_summary": <one exciting sentence about why this matters for buyers/investors, max 150 chars>,
  "ai_tags": <array of 3-5 lowercase tags>
}

Articles to classify:
${JSON.stringify(articlesJson, null, 2)}

Respond with ONLY the JSON array, no other text.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON array from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`Haiku returned non-JSON response: ${text.substring(0, 200)}`);
  }

  const parsed = JSON.parse(jsonMatch[0]) as ClassificationResult[];
  return parsed;
}

/**
 * Classifies all articles in batches of 15 using Claude Haiku.
 */
export async function classifyArticles(
  articles: RawArticle[]
): Promise<ClassifiedArticle[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const batchSize = 15;
  const classified: ClassifiedArticle[] = [];

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    try {
      const results = await classifyBatch(client, batch);
      batch.forEach((article, j) => {
        const result = results[j];
        if (!result) return;
        classified.push({
          ...article,
          category: result.category ?? article.raw_category ?? "market",
          sub_category: result.sub_category ?? null,
          cities: Array.isArray(result.cities) ? result.cities : [],
          relevance_score: Number(result.relevance_score) || 5,
          sentiment: result.sentiment ?? 'neutral',
          ai_summary: result.ai_summary ?? article.headline,
          ai_tags: Array.isArray(result.ai_tags) ? result.ai_tags : [],
        });
      });
    } catch (err) {
      // On classification error, include articles with default score
      console.error(`Batch classification error (batch ${i / batchSize + 1}):`, err);
      batch.forEach((article) => {
        classified.push({
          ...article,
          category: article.raw_category ?? "market",
          sub_category: null,
          cities: [],
          relevance_score: 5,
          sentiment: 'neutral',
          ai_summary: article.headline,
          ai_tags: [],
        });
      });
    }
  }

  return classified;
}

// ---------------------------------------------------------------------------
// Database Operations
// ---------------------------------------------------------------------------

/**
 * Upserts classified articles to news_articles table (minimum score: 6.0).
 */
export async function insertArticles(
  supabase: SupabaseClient,
  articles: ClassifiedArticle[]
): Promise<{ inserted: number; skipped: number; errors: string[] }> {
  // Only keep positive/neutral articles with strong relevance — never save negative news
  const relevant = articles.filter(
    (a) => a.sentiment !== 'negative' && a.relevance_score >= 6.5
  );
  const skipped = articles.length - relevant.length;
  const errors: string[] = [];
  let inserted = 0;

  if (relevant.length === 0) return { inserted: 0, skipped, errors };

  const rows = relevant.map((a) => ({
    source_name: a.source_name,
    source_url: a.source_url,
    source_type: a.source_type,
    headline: a.headline,
    summary: a.summary,
    image_url: a.image_url,
    published_at: a.published_at,
    category: a.category,
    sub_category: a.sub_category,
    cities: a.cities,
    relevance_score: a.relevance_score,
    sentiment: a.sentiment,
    ai_summary: a.ai_summary,
    ai_tags: a.ai_tags,
    is_processed: false,
    is_rejected: false,
  }));

  // Upsert in chunks of 50
  const chunkSize = 50;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error, data } = await supabase
      .from("news_articles")
      .upsert(chunk, { onConflict: "source_url", ignoreDuplicates: true })
      .select("id");

    if (error) {
      errors.push(`Insert chunk ${i / chunkSize + 1}: ${error.message}`);
    } else {
      inserted += data?.length ?? chunk.length;
    }
  }

  return { inserted, skipped, errors };
}

/**
 * Updates last_scraped_at and increments articles_count for each source.
 */
export async function updateSourceStats(
  supabase: SupabaseClient,
  sourceNames: string[]
): Promise<void> {
  await supabase
    .from("news_sources")
    .update({ last_scraped_at: new Date().toISOString() })
    .in("name", sourceNames);
}

/**
 * Fetches existing article URLs from the last 7 days for deduplication.
 */
export async function fetchExistingUrls(
  supabase: SupabaseClient
): Promise<Set<string>> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("news_articles")
    .select("source_url")
    .gte("scraped_at", cutoff);

  return new Set((data ?? []).map((r: { source_url: string }) => r.source_url));
}
