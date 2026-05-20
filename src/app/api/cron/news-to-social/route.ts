import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';
import {
  pickTopArticles,
  processArticle,
  type NewsPostResult,
} from '@/services/newsToSocialService';

export const maxDuration = 300;

async function run() {
  const supabase = createServiceClient();
  const articles = await pickTopArticles(supabase, 6);

  if (articles.length === 0) {
    return {
      articlesProcessed: 0,
      postsCreated: 0,
      errors: [],
      message: 'No unprocessed articles with relevance_score >= 7.0 found',
    };
  }

  // Claim articles immediately to prevent duplicate processing on concurrent runs
  await supabase
    .from('news_articles')
    .update({ is_processed: true, processed_at: new Date().toISOString() })
    .in('id', articles.map((a) => a.id));

  // Process all articles in parallel — Claude caption calls are independent
  // and each takes ~15-30s, so sequential processing on 6 articles easily
  // exceeds the 300s function limit. Parallel keeps total wall time ~30s.
  const settled = await Promise.allSettled(
    articles.map((article) => {
      console.log('[news-to-social] Processing:', article.headline.slice(0, 80));
      return processArticle(supabase, article);
    })
  );

  const results: NewsPostResult[] = [];
  const errors: string[] = [];
  const failedIds: string[] = [];

  for (let i = 0; i < settled.length; i++) {
    const outcome = settled[i];
    const article = articles[i];
    if (outcome.status === 'fulfilled') {
      results.push(outcome.value);
    } else {
      const msg = outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason);
      console.error('[news-to-social] Failed article', article.id, msg);
      errors.push(`${article.source_name} — ${article.headline.slice(0, 60)}: ${msg}`);
      failedIds.push(article.id);
    }
  }

  // Reset failed articles so they can be retried on next run
  if (failedIds.length > 0) {
    await supabase
      .from('news_articles')
      .update({ is_processed: false, processed_at: null })
      .in('id', failedIds);
    console.log('[news-to-social] Reset', failedIds.length, 'failed articles for retry');
  }

  return {
    articlesProcessed: results.length,
    postsCreated: results.reduce((n, r) => n + r.post_ids.length, 0),
    errors,
    processed: results.map((r) => ({
      article_id: r.article_id,
      headline: r.headline.slice(0, 80),
      posts: r.post_ids.length,
    })),
  };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await run();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[news-to-social] Fatal error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await run();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[news-to-social] Fatal error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
