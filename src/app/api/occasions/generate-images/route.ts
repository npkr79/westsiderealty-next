import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  analytics: false,
});

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
    const teluguGreeting: string = anyCaption.telugu_greeting || '';

    // Generate ONE image — GPT-4o renders text directly
    console.log('[Occasions Images] Starting gpt-image-1 for:', occasionName);
    const enhanced_prompt = `
Create a stunning professional social media creative (1080x1080px) for ${occasionName} festival.

CRITICAL TEXT REQUIREMENTS - render these EXACTLY as specified:
- At the TOP of the image, render in large bold decorative gold/yellow font: "Happy ${occasionName}"
${teluguGreeting ? `- Directly below that, render in Telugu script: "${teluguGreeting}"` : ''}
- At the BOTTOM of the image in small elegant white font: "Team RE/MAX Westside Realty"
- Leave a 200x80px clear space at bottom-right corner for logo placement

Visual design:
${anyCaption.image_prompt}

Style: Premium Indian festive social media post, professional quality,
suitable for a luxury real estate brand. The text must be clearly
readable, properly rendered, and look professionally designed.
The overall composition should look like it was created by a
professional graphic designer.
`;

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
    console.log('[Occasions Images] gpt-image-1 response received');

    const rawImageBuffer = Buffer.from(base64Image, 'base64');

    // Composite logo onto bottom-right (sharp only, no text overlays)
    console.log('[Occasions Images] Compositing logo');
    const logoFetch = await fetch(LOGO_URL);
    const logoBuffer = Buffer.from(await logoFetch.arrayBuffer());
    const logoResized = await sharp(logoBuffer)
      .resize(200, null, { fit: 'inside' })
      .toBuffer();
    const logoMeta = await sharp(logoResized).metadata();
    const logoWidth = logoMeta.width ?? 200;
    const logoHeight = logoMeta.height ?? 80;

    const compositedBuffer = await sharp(rawImageBuffer)
      .composite([{
        input: logoResized,
        gravity: 'southeast',
        left: 1024 - logoWidth - 20,
        top: 1024 - logoHeight - 20,
      }])
      .jpeg({ quality: 92 })
      .toBuffer();

    // Upload to Cloudinary (simple storage, no transformations)
    console.log('[Occasions Images] Uploading to Cloudinary');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `occasions/${occasion_id}`,
          public_id: 'main',
          overwrite: true,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(compositedBuffer);
    });

    const finalImageUrl: string = uploadResult.secure_url;
    console.log('[Occasions Images] Upload complete:', finalImageUrl);

    // Update occasions_calendar
    await serviceClient
      .from('occasions_calendar')
      .update({
        occasion_image_url: finalImageUrl,
        image_stage: 'generated',
        stage: 'images_generated',
      })
      .eq('id', occasion_id);

    // Update ALL captions for this occasion
    await serviceClient
      .from('occasion_captions')
      .update({
        image_url: finalImageUrl,
        image_status: 'generated',
        updated_at: new Date().toISOString(),
      })
      .eq('occasion_id', occasion_id);

    return NextResponse.json({ success: true, image_url: finalImageUrl });

  } catch (err) {
    console.error('[Occasions Images] Failed:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
