import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';

const LOGO_URL =
  'https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/REMAX%20WR%20Logo%20with%20no%20background.jpg';

export async function POST(request: NextRequest) {
  // Dual auth: admin session OR cron secret (review-image calls this internally)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCron) {
    const session = await getCrmSessionResult();
    if (!session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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

  // Fetch ONE approved caption for image_prompt
  const { data: anyCaption, error: captionError } = await serviceClient
    .from('occasion_captions')
    .select('image_prompt')
    .eq('occasion_id', occasion_id)
    .eq('status', 'approved')
    .limit(1)
    .single();

  if (captionError || !anyCaption) {
    return NextResponse.json({ error: 'No approved captions found' }, { status: 404 });
  }

  try {
    // Generate ONE image
    console.log('[Occasions Images] Starting gpt-image-1 for:', occasionName);
    const enhanced_prompt = `Create a beautiful festive background for ${occasionName}. Pure visual design only — NO text, NO words, NO letters anywhere in the image. Visual theme: ${anyCaption.image_prompt} Style: Premium Indian festive social media background, warm colors, culturally authentic symbols and decorative elements only. High quality, suitable as background for text overlay.`;

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

    // Sharp composite — SVG text overlays + logo
    console.log('[Occasions Images] Starting sharp composite');

    const logoFetch = await fetch(LOGO_URL);
    const logoBuffer = Buffer.from(await logoFetch.arrayBuffer());
    const logoResized = await sharp(logoBuffer)
      .resize(200, null, { fit: 'inside' })
      .toBuffer();
    const logoMeta = await sharp(logoResized).metadata();
    const logoHeight = logoMeta.height ?? 80;
    const logoWidth = logoMeta.width ?? 200;

    const imgWidth = 1024;

    const compositeLayers: sharp.OverlayOptions[] = [
      // 1. Dark top banner
      {
        input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${imgWidth}" height="100">
          <rect width="${imgWidth}" height="100" fill="rgba(0,0,0,0.6)"/>
        </svg>`),
        top: 0, left: 0,
      },
      // 2. "Happy {occasion_name}" title
      {
        input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${imgWidth}" height="100">
          <rect width="${imgWidth}" height="100" fill="rgba(0,0,0,0)"/>
          <text
            x="${imgWidth / 2}"
            y="72"
            text-anchor="middle"
            font-family="Arial, Helvetica, sans-serif"
            font-size="68"
            font-weight="bold"
            fill="#FFD700"
            stroke="rgba(0,0,0,0.8)"
            stroke-width="3"
            paint-order="stroke fill"
          >Happy ${occasionName}</text>
        </svg>`),
        top: 0, left: 0,
      },
      // 3. Dark bottom banner
      {
        input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${imgWidth}" height="50">
          <rect width="${imgWidth}" height="50" fill="rgba(0,0,0,0.6)"/>
        </svg>`),
        top: imgWidth - 50, left: 0,
      },
      // 4. Brand name text
      {
        input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${imgWidth}" height="50">
          <rect width="${imgWidth}" height="50" fill="rgba(0,0,0,0)"/>
          <text
            x="${imgWidth / 2}"
            y="36"
            text-anchor="middle"
            font-family="Arial, Helvetica, sans-serif"
            font-size="26"
            font-weight="bold"
            fill="#FFFFFF"
            stroke="rgba(0,0,0,0.6)"
            stroke-width="2"
            paint-order="stroke fill"
          >— Team RE/MAX Westside Realty</text>
        </svg>`),
        top: imgWidth - 50, left: 0,
      },
      // 5. Logo bottom right
      {
        input: logoResized,
        top: imgWidth - logoHeight - 60,
        left: imgWidth - logoWidth - 30,
      },
    ];

    const compositedBuffer = await sharp(rawImageBuffer)
      .composite(compositeLayers)
      .jpeg({ quality: 92 })
      .toBuffer();

    // Upload single shared image
    const fileName = `occasions/${occasion_id}/main.jpg`;
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

    // Update occasions_calendar with image URL and stage
    await serviceClient
      .from('occasions_calendar')
      .update({
        occasion_image_url: publicUrl,
        image_stage: 'generated',
        stage: 'images_generated',
      })
      .eq('id', occasion_id);

    // Update ALL captions for this occasion with the shared image
    await serviceClient
      .from('occasion_captions')
      .update({
        image_url: publicUrl,
        image_status: 'generated',
        updated_at: new Date().toISOString(),
      })
      .eq('occasion_id', occasion_id);

    return NextResponse.json({ success: true, image_url: publicUrl });

  } catch (err) {
    console.error('[Occasions Images] Failed:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
