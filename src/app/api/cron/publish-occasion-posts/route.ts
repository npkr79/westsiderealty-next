import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';
import { publishPost } from '@/lib/social/publishPost';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Today's date in IST (YYYY-MM-DD)
  const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const todayIST = nowIST.toISOString().slice(0, 10);

  const supabase = createServiceClient();

  // Fetch approved posts scheduled for today (IST), excluding X and WhatsApp
  const { data: posts, error } = await supabase
    .from('social_posts')
    .select('*')
    .eq('status', 'approved')
    .not('platform', 'in', '("X","WhatsApp")')
    .not('scheduled_at', 'is', null);

  if (error) {
    console.error('[cron/publish-occasion-posts] fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter to only posts whose scheduled_at falls on today in IST
  const todayPosts = (posts ?? []).filter((post) => {
    if (!post.scheduled_at) return false;
    const scheduledIST = new Date(
      new Date(post.scheduled_at).getTime() + 5.5 * 60 * 60 * 1000
    );
    return scheduledIST.toISOString().slice(0, 10) === todayIST;
  });

  if (!todayPosts.length) {
    return NextResponse.json({ success: true, published: 0, message: 'No posts scheduled for today' });
  }

  let published = 0;
  for (const post of todayPosts) {
    const result = await publishPost(post);
    if (result.success) published++;
    else {
      console.error(`[cron/publish-occasion-posts] failed for post ${post.id}:`, result.error);
    }
  }

  return NextResponse.json({ success: true, published });
}
