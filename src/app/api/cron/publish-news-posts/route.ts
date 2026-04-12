import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';
import { publishPost } from '@/lib/social/publishPost';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Publish all news posts that are scheduled and due (scheduled_at <= now)
  const { data: posts, error } = await supabase
    .from('social_posts')
    .select('*')
    .eq('status', 'scheduled')
    .eq('post_category', 'news')
    .not('platform', 'in', '("X","WhatsApp")')
    .lte('scheduled_at', new Date().toISOString());

  if (error) {
    console.error('[cron/publish-news-posts] fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!posts?.length) {
    return NextResponse.json({ success: true, published: 0, message: 'No due news posts' });
  }

  console.log(`[cron/publish-news-posts] Found ${posts.length} due posts`);

  let published = 0;
  const failures: string[] = [];

  for (const post of posts) {
    const result = await publishPost(post);
    if (result.success) {
      published++;
    } else {
      console.error(`[cron/publish-news-posts] failed post ${post.id}:`, result.error);
      failures.push(`${post.platform} / ${post.id}: ${result.error}`);
    }
  }

  return NextResponse.json({ success: true, published, failures });
}
