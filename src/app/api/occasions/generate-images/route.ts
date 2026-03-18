import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  analytics: false,
});

const LOGO_PUBLIC_ID = 'westside_realty_logo';
const LOGO_SOURCE_URL =
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
    console.log('[Occasions Images] gpt-image-1 response received, uploading to Cloudinary');

    const imageBuffer = Buffer.from(base64Image, 'base64');

    // Upload raw image to Cloudinary
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
      uploadStream.end(imageBuffer);
    });

    const rawImageUrl: string = uploadResult.secure_url;
    const publicId: string = uploadResult.public_id;
    console.log('[Occasions Images] Cloudinary upload complete:', rawImageUrl);

    // Ensure logo exists in Cloudinary
    try {
      await cloudinary.api.resource(LOGO_PUBLIC_ID);
    } catch {
      console.log('[Occasions Images] Uploading logo to Cloudinary');
      await cloudinary.uploader.upload(LOGO_SOURCE_URL, {
        public_id: LOGO_PUBLIC_ID,
        overwrite: false,
      });
    }

    // Build transformation URL with text overlays
    const teluguGreeting: string = anyCaption.telugu_greeting || '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformations: any[] = [
      // Dark banner at top
      {
        effect: 'colorize:100',
        color: 'black',
        opacity: 55,
        width: 1024,
        height: 160,
        crop: 'fill',
        gravity: 'north',
      },
      // "Happy {occasion_name}" text
      {
        overlay: {
          font_family: 'Arial',
          font_size: 68,
          font_weight: 'bold',
          text: `Happy ${occasionName}`,
        },
        color: 'FFD700',
        gravity: 'north',
        y: 20,
      },
    ];

    // Telugu greeting if available
    if (teluguGreeting) {
      transformations.push({
        overlay: {
          font_family: 'Noto Sans Telugu',
          font_size: 48,
          font_weight: 'bold',
          text: teluguGreeting,
        },
        color: 'FFFFFF',
        gravity: 'north',
        y: 100,
      });
    }

    // Dark banner at bottom
    transformations.push({
      effect: 'colorize:100',
      color: 'black',
      opacity: 55,
      width: 1024,
      height: 55,
      crop: 'fill',
      gravity: 'south',
    });

    // Brand name text
    transformations.push({
      overlay: {
        font_family: 'Arial',
        font_size: 26,
        font_weight: 'bold',
        text: 'Team REMAX Westside Realty',
      },
      color: 'FFFFFF',
      gravity: 'south',
      y: 15,
    });

    // Logo overlay bottom right
    transformations.push({
      overlay: LOGO_PUBLIC_ID,
      width: 200,
      crop: 'scale',
      gravity: 'south_east',
      x: 20,
      y: 65,
    });

    // Generate final URL with all transformations
    const finalImageUrl = cloudinary.url(publicId, {
      transformation: transformations,
      secure: true,
      sign_url: false,
      type: 'upload',
    });

    console.log('[Occasions Images] Final Cloudinary URL:', finalImageUrl);

    // Update occasions_calendar with image URL and stage
    await serviceClient
      .from('occasions_calendar')
      .update({
        occasion_image_url: finalImageUrl,
        image_stage: 'generated',
        stage: 'images_generated',
      })
      .eq('id', occasion_id);

    // Update ALL captions for this occasion with the shared image
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
