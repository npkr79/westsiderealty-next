import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';

export async function POST(request: NextRequest) {
  const session = await getCrmSessionResult();
  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { occasion_id: string; action: 'approve' | 'regenerate' };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { occasion_id, action } = body;
  const serviceClient = createServiceClient();

  if (action === 'approve') {
    // Update occasions_calendar
    await serviceClient
      .from('occasions_calendar')
      .update({ image_stage: 'approved', stage: 'approved' })
      .eq('id', occasion_id);

    // Update ALL occasion_captions for this occasion
    await serviceClient
      .from('occasion_captions')
      .update({ image_status: 'approved', updated_at: new Date().toISOString() })
      .eq('occasion_id', occasion_id);

    // Fetch occasion for name, date, image URL
    const { data: occasion } = await serviceClient
      .from('occasions_calendar')
      .select('occasion_name, occasion_date, occasion_image_url')
      .eq('id', occasion_id)
      .single();

    // scheduled_at: occasion_date at 01:00 IST = previous day at 19:30 UTC
    let scheduledAt: string | null = null;
    if (occasion?.occasion_date) {
      const d = new Date(occasion.occasion_date + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      d.setUTCHours(19, 30, 0, 0);
      scheduledAt = d.toISOString();
    }

    // Fetch all approved captions
    const { data: approvedCaptions } = await serviceClient
      .from('occasion_captions')
      .select('*')
      .eq('occasion_id', occasion_id)
      .eq('status', 'approved');

    if (approvedCaptions?.length) {
      const posts = approvedCaptions.map((c) => ({
        batch_id: c.batch_id,
        content_idea: occasion?.occasion_name ?? '',
        content_type: 'post',
        topic_type: 'announcement',
        platform: c.platform,
        caption: c.caption,
        hashtags: c.hashtags,
        image_url: occasion?.occasion_image_url ?? c.image_url,
        scheduled_at: scheduledAt,
        status: 'approved',
      }));

      await serviceClient.from('social_posts').insert(posts);
    }

    return NextResponse.json({ success: true, all_approved: true });
  }

  if (action === 'regenerate') {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.westsiderealty.in';
    const cronSecret = process.env.CRON_SECRET;

    await fetch(`${siteUrl}/api/occasions/generate-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({ occasion_id }),
    });

    return NextResponse.json({ success: true, regenerating: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
