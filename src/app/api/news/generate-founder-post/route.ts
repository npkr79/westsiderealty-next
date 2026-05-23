import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';
import { generateFounderPost } from '@/services/founderVoiceService';
import { generateFitnessBrief } from '@/services/fitnessBriefService';
import type { FitnessBrief } from '@/services/fitnessBriefService';
import type { NewsArticle } from '@/services/newsToSocialService';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const session = await getCrmSessionResult();
  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { article_id: string; reviewer_note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { article_id, reviewer_note = '' } = body;
  if (!article_id) {
    return NextResponse.json({ error: 'article_id is required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Load article + existing brief
  const { data: row, error } = await supabase
    .from('news_articles')
    .select('id, headline, summary, ai_summary, full_text, ai_tags, category, sub_category, cities, relevance_score, sentiment, source_name, source_url, image_url, search_query_type, editorial_override, brief')
    .eq('id', article_id)
    .single();

  if (error || !row) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  const article = row as NewsArticle & { brief: FitnessBrief | null };

  // If no brief exists yet (e.g. brief was never generated), run Stage A first
  let brief: FitnessBrief | null = article.brief ?? null;
  if (!brief) {
    console.log('[generate-founder-post] No brief found — running Stage A first');
    brief = await generateFitnessBrief(supabase, article);
    if (!brief) {
      return NextResponse.json(
        { error: 'Failed to generate Fitness Brief for this article. It may be quarantined.' },
        { status: 422 }
      );
    }
  }

  // Run Stage B
  try {
    const result = await generateFounderPost(supabase, article, brief, reviewer_note);
    return NextResponse.json({ success: true, ...result, brief });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[generate-founder-post] Stage B error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
