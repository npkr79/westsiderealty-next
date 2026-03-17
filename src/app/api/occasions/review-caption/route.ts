import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';

async function regenerateCaption(
  platform: string,
  occasionName: string,
  occasionDate: string,
  currentCaption: string,
  feedback: string,
  apiKey: string
): Promise<{ caption: string; hashtags: string[]; image_prompt: string }> {
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

Previous caption was: ${currentCaption}
Admin feedback: ${feedback}
Please regenerate incorporating this feedback.

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
    throw new Error(`Claude regeneration error: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw: string = data.content?.[0]?.text ?? '{}';
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned);
}

export async function POST(request: NextRequest) {
  const session = await getCrmSessionResult();
  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { caption_id: string; action: 'approve' | 'feedback'; feedback?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { caption_id, action, feedback } = body;
  const supabase = createServiceClient();

  // Fetch the caption
  const { data: caption, error: fetchError } = await supabase
    .from('occasion_captions')
    .select('*')
    .eq('id', caption_id)
    .single();

  if (fetchError || !caption) {
    return NextResponse.json({ error: 'Caption not found' }, { status: 404 });
  }

  if (action === 'approve') {
    await supabase
      .from('occasion_captions')
      .update({ status: 'approved' })
      .eq('id', caption_id);

    // Check if all captions for this occasion are approved
    const { data: allCaptions } = await supabase
      .from('occasion_captions')
      .select('status')
      .eq('occasion_id', caption.occasion_id);

    const allApproved = (allCaptions ?? []).every((c) => c.status === 'approved');

    if (allApproved) {
      await supabase
        .from('occasions_calendar')
        .update({ stage: 'captions_approved' })
        .eq('id', caption.occasion_id);
    }

    return NextResponse.json({ success: true, all_approved: allApproved });
  }

  if (action === 'feedback') {
    if (!feedback) {
      return NextResponse.json({ error: 'feedback text required' }, { status: 400 });
    }

    // Mark as feedback_given
    await supabase
      .from('occasion_captions')
      .update({ status: 'feedback_given', feedback })
      .eq('id', caption_id);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    // Fetch occasion details for the regeneration prompt
    const { data: occasion } = await supabase
      .from('occasions_calendar')
      .select('occasion_name, occasion_date')
      .eq('id', caption.occasion_id)
      .single();

    const regenerated = await regenerateCaption(
      caption.platform,
      occasion?.occasion_name ?? '',
      occasion?.occasion_date ?? '',
      caption.caption,
      feedback,
      apiKey
    );

    // Update with new caption, reset status
    await supabase
      .from('occasion_captions')
      .update({
        caption: regenerated.caption,
        hashtags: regenerated.hashtags,
        image_prompt: regenerated.image_prompt,
        status: 'pending_review',
        feedback: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', caption_id);

    return NextResponse.json({ success: true, new_caption: regenerated.caption });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
