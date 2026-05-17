import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';
import { generateSingleImage } from '@/services/newsToSocialService';

export const maxDuration = 300;

// POST /api/social/generate-images-for-article
// Returns immediately with { status: 'generating' }.
// Image generation runs in the background via after() — no HTTP timeout possible.
// When done, saves image_url directly to the matching social_posts rows.
// Frontend polls GET /api/social/posts?news_article_id= to detect completion.
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

  // Mark image_url as 'generating' on the relevant social_posts rows so the
  // frontend can distinguish "not started" from "in progress".
  const platforms = variant === 'portrait' ? ['Facebook', 'Instagram'] : ['X', 'LinkedIn'];
  await supabase
    .from('social_posts')
    .update({ image_url: 'generating' })
    .eq('news_article_id', article_id)
    .in('platform', platforms);

  // Run the actual generation AFTER the response is sent — no HTTP timeout.
  after(async () => {
    try {
      const url = await generateSingleImage(article, variant);
      const svc = createServiceClient();
      await svc
        .from('social_posts')
        .update({ image_url: url })
        .eq('news_article_id', article_id)
        .in('platform', platforms);
      console.log(`[image-gen] ${variant} done for article ${article_id}:`, url.slice(-40));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[image-gen] ${variant} failed for article ${article_id}:`, msg);
      // Clear 'generating' sentinel so the frontend knows it failed
      const svc = createServiceClient();
      await svc
        .from('social_posts')
        .update({ image_url: null })
        .eq('news_article_id', article_id)
        .in('platform', platforms);
    }
  });

  return NextResponse.json({ status: 'generating', variant });
}
