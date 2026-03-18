import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';

const LOGO_URL =
  'https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/REMAX%20WR%20Logo%20with%20no%20background.jpg';

async function compositeWithLogo(imageUrl: string): Promise<Buffer> {
  const [imageRes, logoRes] = await Promise.all([fetch(imageUrl), fetch(LOGO_URL)]);
  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
  const logoBuffer = Buffer.from(await logoRes.arrayBuffer());

  const logoResized = await sharp(logoBuffer)
    .resize(220, null, { fit: 'inside' })
    .toBuffer();

  const logoMeta = await sharp(logoResized).metadata();
  const logoWidth = logoMeta.width ?? 220;
  const logoHeight = logoMeta.height ?? 80;

  const compositedBuffer = await sharp(imageBuffer)
    .composite([
      {
        input: logoResized,
        left: 1024 - logoWidth - 30,
        top: 1024 - logoHeight - 30,
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  return compositedBuffer;
}

export async function POST(request: NextRequest) {
  const session = await getCrmSessionResult();
  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { occasion_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { occasion_id } = body;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
  }

  const serviceClient = createServiceClient();

  const { data: captions, error: captionsError } = await serviceClient
    .from('occasion_captions')
    .select('*')
    .eq('occasion_id', occasion_id)
    .eq('status', 'approved');

  if (captionsError || !captions?.length) {
    return NextResponse.json({ error: 'No approved captions found' }, { status: 404 });
  }

  const results: { platform: string; image_url: string | null; status: string }[] = [];

  for (const caption of captions) {
    try {
      // DALL-E generation
      console.log('[Occasions Images] Starting DALL-E for:', caption.platform);
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
        const errText = await dalleRes.text();
        throw new Error(`DALL-E API error: ${errText.slice(0, 200)}`);
      }

      const dalleData = await dalleRes.json();
      const dalleImageUrl: string = dalleData.data?.[0]?.url;
      if (!dalleImageUrl) throw new Error('DALL-E returned no image URL');
      console.log('[Occasions Images] DALL-E response:', dalleImageUrl);

      // Sharp composite
      console.log('[Occasions Images] Starting sharp composite');
      const compositedBuffer = await compositeWithLogo(dalleImageUrl);

      // Supabase upload
      const fileName = `occasions/${occasion_id}/${caption.platform}-${Date.now()}.jpg`;
      console.log('[Occasions Images] Starting Supabase upload:', fileName);
      const { error: uploadError } = await serviceClient.storage
        .from('social-media-images')
        .upload(fileName, compositedBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw new Error(`Supabase upload error: ${uploadError.message}`);

      const { data: { publicUrl } } = serviceClient.storage
        .from('social-media-images')
        .getPublicUrl(fileName);

      if (!publicUrl) throw new Error('getPublicUrl returned null');
      console.log('[Occasions Images] Upload complete:', publicUrl);

      // Update caption
      await serviceClient
        .from('occasion_captions')
        .update({
          image_url: publicUrl,
          image_status: 'generated',
          updated_at: new Date().toISOString(),
        })
        .eq('id', caption.id);

      results.push({ platform: caption.platform, image_url: publicUrl, status: 'generated' });
    } catch (err) {
      console.error('[Occasions Images] Failed for platform', caption.platform, ':', err);
      await serviceClient
        .from('occasion_captions')
        .update({ image_status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', caption.id);
      results.push({ platform: caption.platform, image_url: null, status: 'failed' });
    }
  }

  // Update occasion stage
  await serviceClient
    .from('occasions_calendar')
    .update({ stage: 'images_generated' })
    .eq('id', occasion_id);

  return NextResponse.json({
    success: true,
    results: results,
  });
}
