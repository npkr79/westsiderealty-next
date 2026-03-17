import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';
import { publishPost } from '@/lib/social/publishPost';

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

  const { data: post, error: fetchError } = await supabase
    .from('social_posts')
    .select('*')
    .eq('id', post_id)
    .single();

  if (fetchError || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const result = await publishPost(post);

  return NextResponse.json(result);
}
