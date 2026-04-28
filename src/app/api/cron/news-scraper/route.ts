import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import {
  deduplicateItems,
  classifyArticles,
  insertArticles,
  fetchExistingIdentifiers,
} from "@/services/newsScraperService";
import { fetchSerperNews } from "@/services/serperService";

export const maxDuration = 300;

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev fallback
  return authHeader === `Bearer ${secret}`;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

async function handler(request: NextRequest) {
  const startedAt = Date.now();

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    // 1. Fetch existing URLs + headlines for deduplication (last 14 days)
    const { urls: existingUrls, headlines: existingHeadlines } =
      await fetchExistingIdentifiers(supabase);

    // 2. Fetch news via Serper (6 queries in parallel)
    console.log("[news-scraper] Fetching news via Serper...");
    const { articles: rawArticles, queryStats } = await fetchSerperNews();
    const articlesFound = rawArticles.length;

    console.log(`[news-scraper] Serper returned ${articlesFound} total articles across ${queryStats.length} queries`);

    // 3. Deduplicate — 3-layer: URL + normalized headline + same-story keyword overlap
    const uniqueArticles = deduplicateItems(rawArticles, existingUrls, existingHeadlines);
    const duplicatesSkipped = articlesFound - uniqueArticles.length;

    console.log(`[news-scraper] ${uniqueArticles.length} unique articles after dedup (${duplicatesSkipped} skipped)`);

    // 4. Classify with Claude Haiku
    let articlesRelevant = 0;
    let inserted = 0;
    let classifySkipped = 0;
    const insertErrors: string[] = [];

    if (uniqueArticles.length > 0) {
      const classified = await classifyArticles(uniqueArticles);
      articlesRelevant = classified.filter((a) => a.relevance_score >= 7.0).length;

      // 5. Insert (only articles scoring >= 6.5)
      const insertResult = await insertArticles(supabase, classified);
      inserted = insertResult.inserted;
      classifySkipped = insertResult.skipped;
      insertErrors.push(...insertResult.errors);
    }

    // 6. Fetch top articles for response preview
    const { data: topArticles } = await supabase
      .from("news_articles")
      .select("id, headline, source_name, relevance_score, category, cities, search_query_type")
      .gte("relevance_score", 7.0)
      .gte("scraped_at", new Date(startedAt - 60_000).toISOString())
      .order("relevance_score", { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      source: "serper",
      queryStats,
      articlesFound,
      articlesNew: uniqueArticles.length,
      duplicatesSkipped,
      articlesRelevant,
      inserted,
      skipped: classifySkipped,
      errors: insertErrors,
      topArticles: topArticles ?? [],
      durationMs: Date.now() - startedAt,
      scrapedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("[news-scraper] Fatal error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "News scraper failed",
        durationMs: Date.now() - startedAt,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}
