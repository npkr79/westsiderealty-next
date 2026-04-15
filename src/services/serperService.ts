/**
 * Serper.dev API service — replaces RSS feed scraping.
 * Runs 6 targeted Google News searches and returns RawArticle[] ready for
 * the existing classify → insert pipeline.
 */

import type { RawArticle } from "@/services/newsScraperService";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SerperQueryType =
  | "national_developer"
  | "national_infra"
  | "national_gcc"
  | "national_launches"
  | "hyderabad"
  | "goa";

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

const SERPER_QUERIES: Array<{ type: SerperQueryType; query: string }> = [
  {
    type: "national_developer",
    query:
      "(real estate developer OR realty OR builder OR housing) India (launches OR revenue OR sales OR investment OR funding OR acquires OR IPO OR pre-sales OR bookings)",
  },
  {
    type: "national_infra",
    query:
      "(expressway OR metro rail OR airport OR national highway OR railway OR bullet train OR elevated corridor) India (approved OR launched OR completed OR inaugurated OR investment OR crore OR km)",
  },
  {
    type: "national_gcc",
    query:
      '"global capability center" OR "global capability centre" OR "GCC" India (Hyderabad OR Bangalore OR Pune OR Chennai OR Mumbai) (opens OR sets up OR expands OR investment OR hiring OR seats)',
  },
  {
    type: "national_launches",
    query:
      "(residential project launch OR new housing project OR township launch) (Hyderabad OR Mumbai OR Bangalore OR Chennai OR Delhi OR Pune OR Goa) 2025",
  },
  {
    type: "hyderabad",
    query:
      "Hyderabad (real estate OR property market OR infrastructure OR metro OR IT park OR GCC OR ORR OR Kokapet OR Neopolis OR Financial District OR HMDA)",
  },
  {
    type: "goa",
    query:
      "Goa (property OR real estate OR villa OR resort OR investment OR infrastructure OR Mopa airport OR tourism OR coastal)",
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
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface SerperFetchResult {
  articles: RawArticle[];
  queryStats: Array<{ type: SerperQueryType; count: number; error?: string }>;
}

/**
 * Runs all 6 Serper news queries in parallel.
 * Returns deduplicated RawArticle[] (by URL, across all queries).
 */
export async function fetchSerperNews(): Promise<SerperFetchResult> {
  const queryStats: SerperFetchResult["queryStats"] = [];

  // Run all 6 queries in parallel
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
      queryStats.push({ type: "national_developer", count: 0, error: String(result.reason) });
      continue;
    }

    const { type, items } = result.value;
    let count = 0;

    for (const item of items) {
      if (!item.link || seenUrls.has(item.link)) continue; // deduplicate by URL across queries
      seenUrls.add(item.link);
      allArticles.push(toRawArticle(item, type));
      count++;
    }

    console.log(`[Serper] ${type}: ${count} articles`);
    queryStats.push({ type, count });
  }

  return { articles: allArticles, queryStats };
}
