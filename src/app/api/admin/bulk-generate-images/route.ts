import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';

export const maxDuration = 300;

const TEMP_SECRET = 'westside-bulk-2026-temp';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-temp-secret');
  if (secret !== TEMP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 });
  }

  const supabase = createServiceClient();
  const { data: posts, error } = await supabase
    .from('social_posts')
    .select('id, image_prompt, platform')
    .is('image_url', null)
    .not('image_prompt', 'is', null);

  if (error || !posts) {
    return NextResponse.json({ error: 'DB fetch failed', detail: error }, { status: 500 });
  }

  // Deduplicate by image_prompt to avoid calling DALL-E 3 multiple times for the same image
  const promptMap = new Map<string, string>(); // prompt -> image_url
  const results: { id: string; platform: string; status: string; image_url?: string }[] = [];

  for (const post of posts) {
    const prompt = post.image_prompt as string;

    let image_url = promptMap.get(prompt);

    if (!image_url) {
      try {
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
          console.error(`[bulk-generate] DALL-E error for post ${post.id}:`, err);
          results.push({ id: post.id, platform: post.platform, status: 'dalle_error' });
          continue;
        }

        const data = await res.json();
        image_url = data.data?.[0]?.url as string;
        if (image_url) promptMap.set(prompt, image_url);
      } catch (e) {
        console.error(`[bulk-generate] fetch error for post ${post.id}:`, e);
        results.push({ id: post.id, platform: post.platform, status: 'fetch_error' });
        continue;
      }
    }

    if (image_url) {
      const { error: updateErr } = await supabase
        .from('social_posts')
        .update({ image_url, updated_at: new Date().toISOString() })
        .eq('id', post.id);

      results.push({
        id: post.id,
        platform: post.platform,
        status: updateErr ? 'update_error' : 'done',
        image_url,
      });
    }
  }

  return NextResponse.json({ total: posts.length, results });
}
