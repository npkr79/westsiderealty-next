import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createCanvas } from '@napi-rs/canvas';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';

const LOGO_URL =
  'https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/REMAX%20WR%20Logo%20with%20no%20background.jpg';

async function createTextImageBuffer(
  text: string,
  canvasWidth: number,
  fontSize: number,
  fillColor: string,
  font: string
): Promise<Buffer> {
  const height = fontSize + 40;
  const canvas = createCanvas(canvasWidth, height);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvasWidth, height);
  ctx.font = `bold ${fontSize}px ${font}`;
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 3;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeText(text, canvasWidth / 2, height / 2);
  ctx.fillText(text, canvasWidth / 2, height / 2);
  return canvas.toBuffer('image/png');
}

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

  // Fetch ONE approved caption for image_prompt + telugu_greeting
  const { data: anyCaption, error: captionError } = await serviceClient
    .from('occasion_captions')
    .select('image_prompt, telugu_greeting')
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

    // Sharp composite — canvas text overlays + logo
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
    const teluguGreeting: string = anyCaption.telugu_greeting || '';

    const compositeLayers: sharp.OverlayOptions[] = [];

    // 1. Dark top banner
    compositeLayers.push({
      input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${imgWidth}" height="140">
        <rect width="${imgWidth}" height="140" fill="rgba(0,0,0,0.6)"/>
      </svg>`),
      top: 0, left: 0,
    });

    // 2. "Happy {occasion_name}" title
    const titleBuffer = await createTextImageBuffer(
      `Happy ${occasionName}`, imgWidth, 68, '#FFD700', 'Arial'
    );
    compositeLayers.push({ input: titleBuffer, top: 10, left: 0 });

    // 3. Telugu greeting
    if (teluguGreeting) {
      const teluguBuffer = await createTextImageBuffer(
        teluguGreeting, imgWidth, 44, '#FFFFFF', 'Arial Unicode MS'
      );
      compositeLayers.push({ input: teluguBuffer, top: 88, left: 0 });
    }

    // 4. Dark bottom banner
    compositeLayers.push({
      input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${imgWidth}" height="50">
        <rect width="${imgWidth}" height="50" fill="rgba(0,0,0,0.6)"/>
      </svg>`),
      top: imgWidth - 50, left: 0,
    });

    // 5. Brand name
    const brandBuffer = await createTextImageBuffer(
      '— Team RE/MAX Westside Realty', imgWidth, 24, '#FFFFFF', 'Arial'
    );
    compositeLayers.push({ input: brandBuffer, top: imgWidth - 45, left: 0 });

    // 6. Logo above bottom banner
    compositeLayers.push({
      input: logoResized,
      top: imgWidth - logoHeight - 60,
      left: imgWidth - logoWidth - 30,
    });

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
