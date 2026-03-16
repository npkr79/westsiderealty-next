import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';

export const revalidate = 3600;

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('blog_articles')
    .select('title, slug, category')
    .eq('status', 'published')
    .order('date', { ascending: false })
    .limit(3);

  if (error) {
    console.error('[/api/blog/recent] error:', error);
    return NextResponse.json({ articles: [] });
  }

  return NextResponse.json({ articles: data ?? [] });
}
