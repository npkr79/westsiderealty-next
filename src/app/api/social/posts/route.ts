import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const statusParam = searchParams.get('status');
  const platform = searchParams.get('platform');
  const newsArticleId = searchParams.get('news_article_id');

  const supabase = createServiceClient();
  let query = supabase
    .from('social_posts')
    .select('*, news_articles(ai_summary, summary)')
    .order('created_at', { ascending: false });

  if (statusParam) {
    const statuses = statusParam.split(',').map((s) => s.trim());
    if (statuses.length === 1) {
      query = query.eq('status', statuses[0]);
    } else {
      query = query.in('status', statuses);
    }
  }

  if (platform) {
    query = query.eq('platform', platform);
  }

  if (newsArticleId) {
    query = query.eq('news_article_id', newsArticleId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[social/posts GET] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await getCrmSessionResult();
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown> | Record<string, unknown>[];
  try {
    body = await request.json() as Record<string, unknown> | Record<string, unknown>[];
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const isArray = Array.isArray(body);
  const rows: Record<string, unknown>[] = isArray ? body as Record<string, unknown>[] : [body as Record<string, unknown>];
  const rowsWithCreatedBy = rows.map((r) => ({ ...r, created_by: session.user!.id }));

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('social_posts')
    .insert(rowsWithCreatedBy)
    .select();

  if (error) {
    console.error('[social/posts POST] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(isArray ? { posts: data } : { post: data?.[0] });
}

export async function PATCH(request: NextRequest) {
  let body: { id: string; [key: string]: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, ...updates } = body;
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('social_posts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[social/posts PATCH] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from('social_posts').delete().eq('id', id);

  if (error) {
    console.error('[social/posts DELETE] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
