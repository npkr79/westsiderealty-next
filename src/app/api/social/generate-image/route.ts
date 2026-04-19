import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const session = await getCrmSessionResult();
  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { prompt: string; post_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { prompt, post_id } = body;

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
  }

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: `${prompt}. Professional real estate photography style, architectural visualization, premium quality, no text or watermarks, no people.`,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[social/generate-image] OpenAI error:', err);
    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
  }

  const data = await res.json();
  const image_url: string = data.data?.[0]?.url;

  if (!image_url) {
    return NextResponse.json({ error: 'No image URL returned' }, { status: 500 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('social_posts')
    .update({ image_url, updated_at: new Date().toISOString() })
    .eq('id', post_id);

  if (error) {
    console.error('[social/generate-image] Update error:', error);
  }

  return NextResponse.json({ success: true, image_url });
}
