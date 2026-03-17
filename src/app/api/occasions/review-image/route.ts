import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';

const LOGO_URL =
  'https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/REMAX%20WR%20Logo%20with%20no%20background.jpg';

async function compositeWithLogo(imageUrl: string): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sharp = require('sharp') as typeof import('sharp');

  const [imageRes, logoRes] = await Promise.all([fetch(imageUrl), fetch(LOGO_URL)]);
  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
  const logoBuffer = Buffer.from(await logoRes.arrayBuffer());

  const logoResized = await sharp(logoBuffer)
    .resize(220, null, { fit: 'inside' })
    .toBuffer();

  const logoMeta = await sharp(logoResized).metadata();
  const logoWidth = logoMeta.width ?? 220;
  const logoHeight = logoMeta.height ?? 80;

  return sharp(imageBuffer)
    .composite([{ input: logoResized, left: 1024 - logoWidth - 30, top: 1024 - logoHeight - 30 }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

export async function POST(request: NextRequest) {
  const session = await getCrmSessionResult();
  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { caption_id: string; action: 'approve' | 'regenerate'; feedback?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { caption_id, action } = body;
  const supabase = createServiceClient();

  const { data: caption, error: fetchError } = await supabase
    .from('occasion_captions')
    .select('*')
    .eq('id', caption_id)
    .single();

  if (fetchError || !caption) {
    return NextResponse.json({ error: 'Caption not found' }, { status: 404 });
  }

  if (action === 'approve') {
    await supabase
      .from('occasion_captions')
      .update({ image_status: 'approved' })
      .eq('id', caption_id);

    // Check if all captions for this occasion have approved images
    const { data: allCaptions } = await supabase
      .from('occasion_captions')
      .select('image_status')
      .eq('occasion_id', caption.occasion_id);

    const allApproved = (allCaptions ?? []).every((c) => c.image_status === 'approved');

    if (allApproved) {
      // Update occasion stage
      await supabase
        .from('occasions_calendar')
        .update({ stage: 'approved' })
        .eq('id', caption.occasion_id);

      // Fetch occasion for name and date
      const { data: occasion } = await supabase
        .from('occasions_calendar')
        .select('occasion_name, occasion_date')
        .eq('id', caption.occasion_id)
        .single();

      // scheduled_at: occasion_date at 01:00 IST = previous day at 19:30 UTC
      let scheduledAt: string | null = null;
      if (occasion?.occasion_date) {
        const d = new Date(occasion.occasion_date + 'T00:00:00Z');
        d.setUTCDate(d.getUTCDate() - 1);
        d.setUTCHours(19, 30, 0, 0);
        scheduledAt = d.toISOString();
      }

      // Fetch all approved captions for this occasion
      const { data: approvedCaptions } = await supabase
        .from('occasion_captions')
        .select('*')
        .eq('occasion_id', caption.occasion_id)
        .eq('image_status', 'approved');

      // Insert into social_posts
      if (approvedCaptions?.length) {
        const posts = approvedCaptions.map((c) => ({
          batch_id: c.batch_id,
          content_idea: occasion?.occasion_name ?? '',
          content_type: 'post',
          topic_type: 'announcement',
          platform: c.platform,
          caption: c.caption,
          hashtags: c.hashtags,
          image_url: c.image_url,
          scheduled_at: scheduledAt,
          status: 'approved',
        }));

        await supabase.from('social_posts').insert(posts);
      }
    }

    return NextResponse.json({ success: true, all_approved: allApproved });
  }

  if (action === 'regenerate') {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
    }

    const dalleRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: `${caption.image_prompt}. Vibrant festive atmosphere, professional quality, no text overlays, no watermarks, no human faces, suitable for social media post.`,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      }),
    });

    if (!dalleRes.ok) {
      const err = await dalleRes.text();
      console.error('[occasions/review-image] DALL-E error:', err);
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
    }

    const dalleData = await dalleRes.json();
    const dalleImageUrl: string = dalleData.data?.[0]?.url;
    if (!dalleImageUrl) {
      return NextResponse.json({ error: 'No image URL returned' }, { status: 500 });
    }

    const compositedBuffer = await compositeWithLogo(dalleImageUrl);

    const fileName = `occasions/${caption.occasion_id}/${caption.platform}-${Date.now()}.jpg`;
    await supabase.storage
      .from('social-media-images')
      .upload(fileName, compositedBuffer, { contentType: 'image/jpeg', upsert: true });

    const { data: { publicUrl } } = supabase.storage
      .from('social-media-images')
      .getPublicUrl(fileName);

    await supabase
      .from('occasion_captions')
      .update({ image_url: publicUrl, image_status: 'generated', updated_at: new Date().toISOString() })
      .eq('id', caption_id);

    return NextResponse.json({ success: true, new_image_url: publicUrl });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
