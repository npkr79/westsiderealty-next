import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';
import { generateImage } from '@/services/newsToSocialService';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const session = await getCrmSessionResult();
  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { post_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { post_id } = body;
  const supabase = createServiceClient();

  // Get the post and its linked article
  const { data: post, error: postErr } = await supabase
    .from('social_posts')
    .select('id, news_article_id')
    .eq('id', post_id)
    .single();

  if (postErr || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  if (!post.news_article_id) {
    return NextResponse.json({ error: 'Post has no linked article' }, { status: 400 });
  }

  const SELECT = 'id, headline, summary, ai_summary, ai_tags, category, sub_category, cities, relevance_score, sentiment, source_name, source_url, image_url, search_query_type';
  const { data: article, error: artErr } = await supabase
    .from('news_articles')
    .select(SELECT)
    .eq('id', post.news_article_id)
    .single();

  if (artErr || !article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  let image_url: string;
  try {
    image_url = await generateImage(article);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[social/generate-image] generateImage error:', msg);
    return NextResponse.json({ error: 'Image generation failed', detail: msg }, { status: 500 });
  }

  // Update this post AND all sibling posts for the same article
  const { error: updateErr } = await supabase
    .from('social_posts')
    .update({ image_url, updated_at: new Date().toISOString() })
    .eq('news_article_id', post.news_article_id);

  if (updateErr) {
    console.error('[social/generate-image] Update error:', updateErr);
  }

  return NextResponse.json({ success: true, image_url });
}
