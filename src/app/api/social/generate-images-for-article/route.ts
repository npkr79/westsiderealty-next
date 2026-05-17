import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';
import { generateImage } from '@/services/newsToSocialService';

export const maxDuration = 120;

// POST /api/social/generate-images-for-article
// Generates portrait (1080×1350) + landscape (1200×675) images for a news article.
// Returns URLs only — does NOT save to social_posts DB.
export async function POST(request: NextRequest) {
  const session = await getCrmSessionResult();
  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { article_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { article_id } = body;
  if (!article_id) return NextResponse.json({ error: 'article_id required' }, { status: 400 });

  const supabase = createServiceClient();
  const SELECT = 'id, headline, summary, ai_summary, ai_tags, category, sub_category, cities, relevance_score, sentiment, source_name, source_url, image_url, search_query_type';
  const { data: article, error } = await supabase
    .from('news_articles')
    .select(SELECT)
    .eq('id', article_id)
    .single();

  if (error || !article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  try {
    const images = await generateImage(article);
    return NextResponse.json({ success: true, portraitUrl: images.portraitUrl, landscapeUrl: images.landscapeUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[generate-images-for-article]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
