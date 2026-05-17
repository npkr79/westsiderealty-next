import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';
import { generateSingleImage } from '@/services/newsToSocialService';

export const maxDuration = 120;

// POST /api/social/generate-images-for-article
// Generates ONE image variant per call to stay within Vercel's 60s timeout.
// Pass variant: "portrait" (1080×1350, FB+Instagram) or "landscape" (1200×675, X+LinkedIn).
// Returns the URL only — does NOT save to social_posts DB.
export async function POST(request: NextRequest) {
  const session = await getCrmSessionResult();
  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { article_id: string; variant: 'portrait' | 'landscape' };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { article_id, variant } = body;
  if (!article_id) return NextResponse.json({ error: 'article_id required' }, { status: 400 });
  if (variant !== 'portrait' && variant !== 'landscape') {
    return NextResponse.json({ error: 'variant must be "portrait" or "landscape"' }, { status: 400 });
  }

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
    const url = await generateSingleImage(article, variant);
    return NextResponse.json({ success: true, url, variant });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[generate-images-for-article] ${variant}:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
