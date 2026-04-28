/**
 * Lightweight article body fetcher — pulls main text content from a news URL.
 * Used by the news scraper to populate `news_articles.full_text` so downstream
 * post-generation has actual numbers to work with (not just headlines).
 *
 * Design: regex-only, no JSDOM/cheerio dependency. Good enough for ~90% of
 * Indian news sites. Paywalled / SPA-rendered sites silently return null.
 */

const FETCH_TIMEOUT_MS = 8000;
const MAX_BODY_LENGTH = 8000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripTags(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ");
}

function normalizeText(text: string): string {
  return decodeEntities(text)
    .replace(/\s+/g, " ")
    .trim();
}

function extractMainBlock(html: string): string {
  // Drop boilerplate sections (header/nav/footer/aside) before further work
  const cleaned = html
    .replace(/<header\b[\s\S]*?<\/header>/gi, " ")
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside\b[\s\S]*?<\/aside>/gi, " ");

  // Prefer <article>, then <main>, then aggregate all <p> tags
  const articleMatch = cleaned.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch && articleMatch[1].length > 500) {
    return stripTags(articleMatch[1]);
  }
  const mainMatch = cleaned.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch && mainMatch[1].length > 500) {
    return stripTags(mainMatch[1]);
  }
  // Fallback: collect all <p> tags
  const paragraphs = cleaned.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi);
  if (paragraphs && paragraphs.length > 0) {
    return paragraphs.map(stripTags).join(" ");
  }
  return stripTags(cleaned);
}

export async function fetchArticleBody(url: string): Promise<string | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) return null;

    const html = await res.text();
    if (!html) return null;

    const raw = extractMainBlock(html);
    const text = normalizeText(raw);
    if (text.length < 200) return null;
    return text.length > MAX_BODY_LENGTH ? text.slice(0, MAX_BODY_LENGTH) : text;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchArticleBodies(
  urls: string[],
  concurrency = 5
): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();
  const queue = [...urls];

  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      if (!url) return;
      result.set(url, await fetchArticleBody(url));
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
  return result;
}
