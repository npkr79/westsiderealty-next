import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';
import { processArticle, type NewsArticle } from '@/services/newsToSocialService';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  // Allow admin session or cron bearer token
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCron) {
    const session = await getCrmSessionResult();
    if (!session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let body: { article_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { article_id } = body;
  if (!article_id) {
    return NextResponse.json({ error: 'article_id is required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: article, error } = await supabase
    .from('news_articles')
    .select(
      'id, headline, summary, ai_summary, ai_tags, category, sub_category, cities, relevance_score, source_name, source_url, image_url'
    )
    .eq('id', article_id)
    .single();

  if (error || !article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  if ((article as NewsArticle & { is_rejected: boolean }).is_rejected) {
    return NextResponse.json({ error: 'Article is rejected' }, { status: 400 });
  }

  try {
    console.log('[generate-post] Processing article:', article.id);
    const result = await processArticle(supabase, article as NewsArticle);
    return NextResponse.json({
      success: true,
      article_id: result.article_id,
      headline: result.headline,
      posts_created: result.post_ids.length,
      post_ids: result.post_ids,
      image_url: result.image_url,
    });
  } catch (err) {
    console.error('[generate-post] Failed:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
