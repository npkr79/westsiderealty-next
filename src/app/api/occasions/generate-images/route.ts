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

async function sendAiSensyAlert(occasionName: string, message: string) {
  const apiKey = process.env.AISENSY_API_KEY;
  const userName = process.env.AISENSY_USERNAME;
  if (!apiKey || !userName) return;

  try {
    await fetch('https://backend.aisensy.com/campaign/t1/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        campaignName: 'agent_new_lead_v2',
        destination: '919866085831',
        userName,
        templateParams: [
          'Praveen',
          '919866085831',
          'Occasions',
          occasionName + ' ' + message,
          'Review now',
          'system-occasions',
        ],
        source: 'occasions-generator',
        media: {},
        buttons: [],
        carouselCards: [],
        location: {},
      }),
    });
  } catch (e) {
    console.error('[occasions] AiSensy alert failed:', e);
  }
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

  const supabase = createServiceClient();

  const { data: occasion } = await supabase
    .from('occasions_calendar')
    .select('occasion_name')
    .eq('id', occasion_id)
    .single();

  const { data: captions, error: captionsError } = await supabase
    .from('occasion_captions')
    .select('*')
    .eq('occasion_id', occasion_id)
    .eq('status', 'approved');

  if (captionsError || !captions?.length) {
    return NextResponse.json({ error: 'No approved captions found' }, { status: 404 });
  }

  let imagesGenerated = 0;

  for (const caption of captions) {
    try {
      // Generate image with DALL-E 3
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
        console.error(`[occasions/generate-images] DALL-E error for caption ${caption.id}`);
        continue;
      }

      const dalleData = await dalleRes.json();
      const dalleImageUrl: string = dalleData.data?.[0]?.url;
      if (!dalleImageUrl) continue;

      // Composite logo onto image
      const compositedBuffer = await compositeWithLogo(dalleImageUrl);

      // Upload to Supabase storage
      const fileName = `occasions/${occasion_id}/${caption.platform}-${Date.now()}.jpg`;
      await supabase.storage
        .from('social-media-images')
        .upload(fileName, compositedBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      const { data: { publicUrl } } = supabase.storage
        .from('social-media-images')
        .getPublicUrl(fileName);

      // Update caption with image URL
      await supabase
        .from('occasion_captions')
        .update({ image_url: publicUrl, image_status: 'generated' })
        .eq('id', caption.id);

      imagesGenerated++;
    } catch (e) {
      console.error(`[occasions/generate-images] Error for caption ${caption.id}:`, e);
    }
  }

  // Update occasion stage
  await supabase
    .from('occasions_calendar')
    .update({ stage: 'images_generated' })
    .eq('id', occasion_id);

  // WhatsApp alert
  await sendAiSensyAlert(
    occasion?.occasion_name ?? 'Occasion',
    'images ready for final approval'
  );

  return NextResponse.json({ success: true, images_generated: imagesGenerated });
}
