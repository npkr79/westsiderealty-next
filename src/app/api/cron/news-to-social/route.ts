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
  const articles = await pickTopArticles(supabase, 4);

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

  const results: NewsPostResult[] = [];
  const errors: string[] = [];

  for (const article of articles) {
    try {
      console.log('[news-to-social] Processing:', article.headline.slice(0, 80));
      const result = await processArticle(supabase, article);
      results.push(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[news-to-social] Failed article', article.id, msg);
      errors.push(`${article.source_name} — ${article.headline.slice(0, 60)}: ${msg}`);
    }
  }

  return {
    articlesProcessed: results.length,
    postsCreated: results.reduce((n, r) => n + r.post_ids.length, 0),
    errors,
    processed: results.map((r) => ({
      article_id: r.article_id,
      headline: r.headline.slice(0, 80),
      posts: r.post_ids.length,
      image_url: r.image_url,
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
