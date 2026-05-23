/**
 * Serper.dev API service — replaces RSS feed scraping.
 * Runs 6 targeted Google News searches and returns RawArticle[] ready for
 * the existing classify → insert pipeline.
 */

import type { RawArticle } from "@/services/newsScraperService";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SerperQueryType =
  | "gcc"
  | "reits"
  | "national_re"
  | "broadsheets_re"
  | "digital_re"
  | "hyderabad"
  | "infra"
  | "goa"
  | "nri_luxury";

interface SerperNewsItem {
  title: string;
  link: string;
  snippet: string;
  date?: string;
  source?: string;
  imageUrl?: string;
}

interface SerperNewsResponse {
  news?: SerperNewsItem[];
}

// ─── Query definitions ────────────────────────────────────────────────────────

// Sources: gcc-pulse.com, gcc.economictimes.indiatimes.com, moneycontrol.com (GCC tag)
// Sources: realty.economictimes.indiatimes.com (REITs tag)
// Sources: realty.economictimes.indiatimes.com/news, moneycontrol.com/RE, economictimes.indiatimes.com/wealth/RE
// Sources: thehindu.com/RE, business-standard.com/RE, thehindubusinessline.com/RE
// Sources: therealtytoday.com, cnbctv18.com/RE
// Sources: realty.economictimes.indiatimes.com/tag/hyderabad
// Sources: metrorailnews.in, economictimes.indiatimes.com/infra, constructionworld.in (all sections), financialexpress.com/infra
// Sources: goa real estate — TOI Goa, Herald Goa, realty.economictimes (goa), moneycontrol (goa)
// Sources: NRI/luxury — nrirealtytimes.com, realty.economictimes (nri OR luxury), housing.com (luxury)
const SERPER_QUERIES: Array<{ type: SerperQueryType; query: string }> = [
  {
    type: "gcc",
    query:
      "site:gcc-pulse.com OR site:gcc.economictimes.indiatimes.com OR (site:moneycontrol.com gcc)",
  },
  {
    type: "reits",
    query:
      "site:realty.economictimes.indiatimes.com reits",
  },
  {
    type: "national_re",
    query:
      "(site:realty.economictimes.indiatimes.com OR site:moneycontrol.com OR site:economictimes.indiatimes.com) \"real estate\"",
  },
  {
    type: "broadsheets_re",
    query:
      "(site:thehindu.com OR site:thehindubusinessline.com OR site:business-standard.com) \"real estate\"",
  },
  {
    type: "digital_re",
    query:
      "site:therealtytoday.com OR (site:cnbctv18.com \"real estate\")",
  },
  {
    type: "hyderabad",
    query:
      "site:realty.economictimes.indiatimes.com hyderabad",
  },
  {
    type: "infra",
    query:
      "site:metrorailnews.in OR site:constructionworld.in OR (site:economictimes.indiatimes.com infrastructure) OR (site:financialexpress.com infrastructure)",
  },
  {
    type: "goa",
    query:
      "(site:timesofindia.com OR site:heraldgoa.in OR site:realty.economictimes.indiatimes.com OR site:moneycontrol.com) (goa \"real estate\" OR goa property OR goa villa OR goa luxury)",
  },
  {
    type: "nri_luxury",
    query:
      "site:nrirealtytimes.com OR (site:realty.economictimes.indiatimes.com (nri OR luxury OR \"ultra luxury\")) OR (site:housing.com luxury) OR (site:moneycontrol.com \"nri investment\" real estate)",
  },
];

// ─── Serper API call ──────────────────────────────────────────────────────────

async function searchSerperNews(
  query: string
): Promise<SerperNewsItem[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error("SERPER_API_KEY not configured");

  const res = await fetch("https://google.serper.dev/news", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      gl: "in",       // India
      hl: "en",       // English
      num: 10,        // max results per query
      tbs: "qdr:d",   // last 24 hours
    }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Serper API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data: SerperNewsResponse = await res.json();
  return data.news ?? [];
}

// ─── Date parsing ─────────────────────────────────────────────────────────────
// Serper returns relative dates like "3 hours ago", "2 days ago", "May 12, 2025"

function parseSerperDate(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString();

  const s = dateStr.toLowerCase().trim();

  // Relative: "X hours/minutes ago"
  const hoursMatch = s.match(/(\d+)\s+hour/);
  if (hoursMatch) {
    const ms = parseInt(hoursMatch[1]) * 60 * 60 * 1000;
    return new Date(Date.now() - ms).toISOString();
  }

  const minsMatch = s.match(/(\d+)\s+min/);
  if (minsMatch) {
    const ms = parseInt(minsMatch[1]) * 60 * 1000;
    return new Date(Date.now() - ms).toISOString();
  }

  const daysMatch = s.match(/(\d+)\s+day/);
  if (daysMatch) {
    const ms = parseInt(daysMatch[1]) * 24 * 60 * 60 * 1000;
    return new Date(Date.now() - ms).toISOString();
  }

  // Try parsing as absolute date
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed.toISOString();

  return new Date().toISOString();
}

// ─── Map Serper result → RawArticle ──────────────────────────────────────────

function toRawArticle(item: SerperNewsItem, queryType: SerperQueryType): RawArticle {
  return {
    source_name: item.source ?? "Unknown",
    source_url: item.link,
    source_type: "serper_news",
    headline: item.title,
    summary: item.snippet ?? null,
    image_url: item.imageUrl ?? null,
    published_at: parseSerperDate(item.date),
    raw_category: queryType,
    search_query_type: queryType,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface SerperFetchResult {
  articles: RawArticle[];
  queryStats: Array<{ type: SerperQueryType; count: number; error?: string }>;
}

/**
 * Runs all Serper news queries in parallel (currently 9).
 * Returns deduplicated RawArticle[] (by URL, across all queries).
 */
export async function fetchSerperNews(): Promise<SerperFetchResult> {
  const queryStats: SerperFetchResult["queryStats"] = [];

  // Run all queries in parallel
  const results = await Promise.allSettled(
    SERPER_QUERIES.map(async ({ type, query }) => {
      const items = await searchSerperNews(query);
      return { type, items };
    })
  );

  // Collect all articles, tracking which query produced each
  const allArticles: RawArticle[] = [];
  const seenUrls = new Set<string>();

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[Serper] Query failed:", result.reason);
      queryStats.push({ type: "gcc", count: 0, error: String(result.reason) });
      continue;
    }

    const { type, items } = result.value;
    let count = 0;

    for (const item of items) {
      if (!item.link || seenUrls.has(item.link)) continue; // deduplicate by URL across queries
      const article = toRawArticle(item, type);
      // Hard reject at source: skip anything published more than 24h ago.
      // tbs:"qdr:d" asks Google for last 24h but isn't always strict — this
      // ensures stale articles never enter the pipeline at all.
      const publishedMs = article.published_at ? new Date(article.published_at).getTime() : Date.now();
      if (Date.now() - publishedMs > 24 * 60 * 60 * 1000) {
        console.log(`[Serper] Skipping stale article (${item.date}): ${item.title.slice(0, 60)}`);
        continue;
      }
      seenUrls.add(item.link);
      allArticles.push(article);
      count++;
    }

    console.log(`[Serper] ${type}: ${count} articles`);
    queryStats.push({ type, count });
  }

  return { articles: allArticles, queryStats };
}
