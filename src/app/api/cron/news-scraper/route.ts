import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export const maxDuration = 300;
import {
  fetchAllRSSFeeds,
  deduplicateItems,
  classifyArticles,
  insertArticles,
  updateSourceStats,
  fetchExistingUrls,
  NewsSource,
} from "@/services/newsScraperService";

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
    // 1. Fetch active sources
    const { data: sourcesData, error: sourcesError } = await supabase
      .from("news_sources")
      .select("id, name, url, source_type, category, is_active")
      .eq("is_active", true);

    if (sourcesError) {
      return NextResponse.json(
        { error: `Failed to fetch sources: ${sourcesError.message}` },
        { status: 500 }
      );
    }

    const sources: NewsSource[] = sourcesData ?? [];

    if (sources.length === 0) {
      return NextResponse.json({ message: "No active sources configured", sourcesScraped: 0 });
    }

    // 2. Fetch existing URLs for deduplication (last 7 days)
    const existingUrls = await fetchExistingUrls(supabase);

    // 3. Fetch all RSS feeds
    const { articles: rawArticles, errors: fetchErrors } = await fetchAllRSSFeeds(sources);

    const sourcesScraped = sources.length - fetchErrors.length;
    const articlesFound = rawArticles.length;

    // 4. Deduplicate
    const uniqueArticles = deduplicateItems(rawArticles, existingUrls);
    const duplicatesSkipped = articlesFound - uniqueArticles.length;

    // 5. Classify with Claude Haiku (only if we have new articles)
    let articlesRelevant = 0;
    let inserted = 0;
    let classifySkipped = 0;
    const insertErrors: string[] = [];

    if (uniqueArticles.length > 0) {
      const classified = await classifyArticles(uniqueArticles);
      articlesRelevant = classified.filter((a) => a.relevance_score >= 7.0).length;

      // 6. Insert (only articles scoring >= 6.0)
      const insertResult = await insertArticles(supabase, classified);
      inserted = insertResult.inserted;
      classifySkipped = insertResult.skipped;
      insertErrors.push(...insertResult.errors);
    }

    // 7. Update source stats
    const successfulSources = sources
      .filter((s) => !fetchErrors.find((e) => e.source === s.name))
      .map((s) => s.name);
    await updateSourceStats(supabase, successfulSources);

    // 8. Fetch top articles for response preview
    const { data: topArticles } = await supabase
      .from("news_articles")
      .select("id, headline, source_name, relevance_score, category, cities")
      .gte("relevance_score", 7.0)
      .gte("scraped_at", new Date(startedAt - 60_000).toISOString())
      .order("relevance_score", { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      sourcesScraped,
      articlesFound,
      articlesNew: uniqueArticles.length,
      duplicatesSkipped,
      articlesRelevant,
      inserted,
      skipped: classifySkipped,
      errors: [...fetchErrors.map((e) => `${e.source}: ${e.error}`), ...insertErrors],
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
