import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';

async function callClaude(platform: string, occasionName: string, occasionDate: string, apiKey: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are a creative social media expert for Westside Realty, a premium real estate agency in Hyderabad, India (RE/MAX franchise). Create festive greeting posts that are warm, culturally authentic, and carry Westside Realty's brand identity of helping families find their dream homes. Brand voice: Premium, warm, locally rooted in Hyderabad, trustworthy. Never be generic. Each post must feel crafted for that specific occasion and Indian audience. Always end with — Team Westside Realty`,
      messages: [
        {
          role: 'user',
          content: `Create a ${platform} greeting post for ${occasionName} on ${occasionDate}.

Platform rules:
- Facebook: 200-350 chars, warm community tone, 3-4 hashtags
- Instagram: 150-250 chars, aspirational visual, emoji-rich, 6-8 hashtags
- LinkedIn: 200-400 chars, professional yet warm, connect occasion to new beginnings or home ownership journey, 2-3 hashtags
- X: max 240 chars, punchy and warm, 2 hashtags
- WhatsApp: 150-250 chars, personal intimate tone like message from trusted friend, no hashtags

Also create a DALL-E image prompt for a festive background image.
Image must: be vibrant and celebratory, culturally authentic for Indian audience, NO text in image, NO human faces, focus on symbols/elements/colors of ${occasionName}.

Return ONLY valid JSON:
{
  "caption": "string",
  "hashtags": ["string"],
  "image_prompt": "detailed DALL-E prompt string"
}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude error for ${platform}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw: string = data.content?.[0]?.text ?? '{}';
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned) as { caption: string; hashtags: string[]; image_prompt: string };
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
  // Allow both session auth (admin) and cron bearer token
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
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const supabase = createServiceClient();

  const { data: occasion, error: fetchError } = await supabase
    .from('occasions_calendar')
    .select('*')
    .eq('id', occasion_id)
    .single();

  if (fetchError || !occasion) {
    return NextResponse.json({ error: 'Occasion not found' }, { status: 404 });
  }

  const platforms: string[] = occasion.platforms ?? [];
  const batch_id = crypto.randomUUID();

  const results = await Promise.allSettled(
    platforms.map(async (platform: string) => {
      const parsed = await callClaude(platform, occasion.occasion_name, occasion.occasion_date, apiKey);
      await supabase.from('occasion_captions').insert({
        occasion_id,
        platform,
        caption: parsed.caption,
        hashtags: parsed.hashtags,
        image_prompt: parsed.image_prompt,
        status: 'pending_review',
        batch_id,
      });
      return platform;
    })
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const errors = results
    .filter((r) => r.status === 'rejected')
    .map((r) => (r as PromiseRejectedResult).reason?.message ?? 'unknown error');

  if (errors.length > 0) {
    console.error('[occasions/generate-captions] errors:', errors);
  }

  // Update stage
  await supabase
    .from('occasions_calendar')
    .update({ stage: 'captions_generated' })
    .eq('id', occasion_id);

  // WhatsApp alert
  await sendAiSensyAlert(occasion.occasion_name, 'captions ready for review');

  return NextResponse.json({ success: true, captions_generated: succeeded });
}
