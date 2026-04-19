import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';
import { generateImage } from '@/services/newsToSocialService';

export const maxDuration = 300;

const TEMP_SECRET = 'westside-bulk-2026-temp';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-temp-secret');
  if (secret !== TEMP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Get today's posts with their linked articles
  const { data: posts, error } = await supabase
    .from('social_posts')
    .select('id, platform, news_article_id')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .not('news_article_id', 'is', null);

  if (error || !posts) {
    return NextResponse.json({ error: 'DB fetch failed', detail: error }, { status: 500 });
  }

  // Get unique article IDs
  const articleIds = [...new Set(posts.map((p) => p.news_article_id as string))];

  const SELECT = 'id, headline, summary, ai_summary, ai_tags, category, sub_category, cities, relevance_score, sentiment, source_name, source_url, image_url, search_query_type';
  const { data: articles, error: artErr } = await supabase
    .from('news_articles')
    .select(SELECT)
    .in('id', articleIds);

  if (artErr || !articles) {
    return NextResponse.json({ error: 'Articles fetch failed', detail: artErr }, { status: 500 });
  }

  // Generate one composited image per article
  const imageMap = new Map<string, string>(); // article_id -> cloudinary URL
  const results: { article_id: string; status: string; image_url?: string; error?: string }[] = [];

  for (const article of articles) {
    try {
      console.log('[bulk-generate] Generating image for:', article.headline.slice(0, 60));
      const imageUrl = await generateImage(article);
      imageMap.set(article.id, imageUrl);
      results.push({ article_id: article.id, status: 'done', image_url: imageUrl });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[bulk-generate] Error for article', article.id, msg);
      results.push({ article_id: article.id, status: 'error', error: msg });
    }
  }

  // Update all posts with the Cloudinary URL for their article
  const postUpdates: { id: string; status: string }[] = [];
  for (const post of posts) {
    const imageUrl = imageMap.get(post.news_article_id as string);
    if (!imageUrl) {
      postUpdates.push({ id: post.id, status: 'skipped (no image)' });
      continue;
    }
    const { error: updateErr } = await supabase
      .from('social_posts')
      .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
      .eq('id', post.id);
    postUpdates.push({ id: post.id, status: updateErr ? `update_error: ${updateErr.message}` : 'done' });
  }

  return NextResponse.json({ articles: results, posts: postUpdates });
}
