import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';

const LOGO_URL =
  'https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/REMAX%20WR%20Logo%20with%20no%20background.jpg';

async function compositeWithLogo(imageBuffer: Buffer): Promise<Buffer> {
  const logoRes = await fetch(LOGO_URL);
  const logoBuffer = Buffer.from(await logoRes.arrayBuffer());

  const logoResized = await sharp(logoBuffer)
    .resize(200, null, { fit: 'inside' })
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

  const { data: occasion } = await serviceClient
    .from('occasions_calendar')
    .select('occasion_name')
    .eq('id', occasion_id)
    .single();

  const occasionName: string = occasion?.occasion_name ?? 'the occasion';

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
      // GPT-4o image generation
      console.log('[Occasions Images] Starting gpt-image-1 for:', caption.platform);
      const enhanced_prompt = `Create a beautiful festive background for ${occasionName}. Pure visual design only — NO text, NO words, NO letters anywhere in the image. Visual theme: ${caption.image_prompt} Style: Premium Indian festive social media background, warm colors, culturally authentic symbols and decorative elements only. High quality, suitable as background for text overlay.`;
      const imageRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: enhanced_prompt,
          n: 1,
          size: '1024x1024',
          quality: 'medium',
          output_format: 'jpeg',
        }),
      });

      if (!imageRes.ok) {
        const errText = await imageRes.text();
        throw new Error(`gpt-image-1 API error: ${errText.slice(0, 200)}`);
      }

      const imageData = await imageRes.json();
      const base64Image: string = imageData.data?.[0]?.b64_json;
      if (!base64Image) throw new Error('gpt-image-1 returned no image data');
      console.log('[Occasions Images] gpt-image-1 response received, converting buffer');

      const rawImageBuffer = Buffer.from(base64Image, 'base64');

      // Sharp composite
      console.log('[Occasions Images] Starting sharp composite');
      const compositedBuffer = await compositeWithLogo(rawImageBuffer);

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
