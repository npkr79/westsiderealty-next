import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionResult } from '@/lib/crm/auth';

export async function POST(request: NextRequest) {
  const session = await getCrmSessionResult();
  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { idea: string; platforms: string[]; count: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { idea, platforms, count } = body;

  const prompt = `Generate ${count} social media posts for this idea: ${idea}
Platforms: ${platforms.join(', ')}
Return a JSON array where each object has:
- platforms: array of platform names from the requested list
- caption_facebook: max 500 chars, conversational, 3-5 hashtags
- caption_instagram: max 300 chars, visual, 5-8 hashtags
- caption_linkedin: max 700 chars, professional, no hashtags
- caption_x: max 280 chars, punchy, 2-3 hashtags
- caption_whatsapp: max 400 chars, friendly, no hashtags
- image_prompt: detailed DALL-E prompt for professional real estate photo
- title: max 60 chars
ONLY return the JSON array.`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: `You are an expert social media manager for Westside Realty, a premium real estate advisory firm in Hyderabad, India. You have deep knowledge of:
- Hyderabad micro-markets: Jubilee Hills, Banjara Hills, Kokapet, Narsingi, Tellapur, Gachibowli, Financial District, Kondapur
- Premium developers: My Home, Prestige, Lodha, Aparna, Aliens, Ramky
- Buyer profiles: HNIs, NRIs, IT professionals, investors
- Market context: Hyderabad is India's fastest growing real estate market in 2026

Your posts must:
- Sound like they come from a trusted real estate expert, NOT a generic AI
- Include specific local insights, not generic statements
- Reference actual locations, landmarks, price points where relevant
- Create genuine FOMO and urgency for serious buyers
- LinkedIn: thought leadership tone, data-driven, professional insights
- Instagram: aspirational lifestyle, visual storytelling
- Facebook: community-focused, approachable, informative
- X: sharp market takes, contrarian insights
- WhatsApp: personal, exclusive feel like insider information

NEVER use generic phrases like 'incredible resilience', 'smart investors', 'strategic patience'.
ALWAYS include specific Hyderabad/India context.
Current year is 2026. Never use hashtags with years before 2025.

Return ONLY valid JSON array, no other text.`,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[social/generate] Anthropic error:', err);
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
  }

  const data = await res.json();
  const raw: string = data.content?.[0]?.text ?? '[]';
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  let posts: unknown[];
  try {
    posts = JSON.parse(cleaned);
  } catch {
    console.error('[social/generate] JSON parse failed:', cleaned.slice(0, 200));
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }

  return NextResponse.json({ posts });
}
