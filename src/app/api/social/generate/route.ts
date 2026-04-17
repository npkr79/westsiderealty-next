import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionResult } from '@/lib/crm/auth';

const SYSTEM_PROMPT = `You are an expert social media manager and content strategist for Westside Realty, a premium real estate advisory firm in Hyderabad, India.

Company context:
- Premium real estate advisory, not a developer
- Key markets: Jubilee Hills, Banjara Hills, Kokapet, Narsingi, Tellapur, Gachibowli, Financial District, Kondapur, Shamshabad
- Top developers we work with: My Home, Prestige, Lodha, Aparna, Aliens, Ramky, Shapoorji
- Buyer profiles: HNIs (₹2Cr+), NRIs, senior IT professionals, investors
- Hyderabad is India's fastest growing real estate market in 2026
- Price range: ₹80L to ₹10Cr+ depending on micro-market

Writing rules:
- NEVER use generic phrases: 'incredible resilience', 'smart investors', 'strategic patience', 'in today's market'
- ALWAYS include specific local context, landmarks, price points, developer names
- Write like a trusted local expert who knows every lane of Hyderabad
- Create genuine insight and value, not marketing fluff
- Current year is 2026

ACCURACY RULES:
- You have strong knowledge of Hyderabad's real estate micro-markets.
  Use it confidently.
- For Tellapur specifically: nearby landmarks include Hitec City (18km),
  Financial District (15km), Outer Ring Road exit (2km), My Home Vipina
  (adjacent), Aparna Sarovar. Nearest major mall is Inorbit Cyberabad
  (12km). International schools nearby: Oakridge International, Manthan.
- For any micro-market you write about, only mention landmarks and
  amenities you are highly confident exist near that location.
- If you are not certain about a specific landmark's proximity,
  describe the category generically (e.g. 'top international schools
  within 5km' rather than naming a specific school you are unsure about)
- Never place a developer in a micro-market where they have no presence.
  My Home operates in: Tellapur, Kokapet, Narsingi, Gachibowli corridor.
  NOT in Banjara Hills, Jubilee Hills, Madhapur.`;

function buildUserPrompt(platform: string, content_type: string, idea: string, topic_type: string): string {
  if (platform === 'LinkedIn' && content_type === 'article') {
    return `Write a LinkedIn article about: ${idea}
Topic category: ${topic_type}

Return JSON with:
{
  "article_title": "compelling headline (max 80 chars)",
  "article_body": "full article in markdown (800-1200 words), structured with: hook paragraph, 3-4 H2 sections with substantive content, data points and specific locations, practical insights, closing CTA",
  "image_prompt": "DALL-E prompt for article cover image",
  "hashtags": ["5 relevant professional hashtags without # symbol"],
  "title": "same as article_title"
}
Return ONLY valid JSON.`;
  }

  if (platform === 'LinkedIn' && content_type === 'post') {
    return `Write a LinkedIn short post about: ${idea}
Topic category: ${topic_type}

Return JSON with:
{
  "caption": "LinkedIn post (150-300 chars, professional insight, no hashtags, ends with a thought-provoking question or observation)",
  "hashtags": [],
  "image_prompt": "DALL-E prompt for post image",
  "title": "short title (max 60 chars)"
}
Return ONLY valid JSON.`;
  }

  if (platform === 'Instagram' && content_type === 'post') {
    return `Write an Instagram caption about: ${idea}
Topic category: ${topic_type}

Return JSON with:
{
  "caption": "Instagram caption (150-250 chars, aspirational and visual, lifestyle-focused)",
  "hashtags": ["8-10 relevant hashtags without # symbol, mix of broad and niche like HyderabadRealEstate and LuxuryHomes"],
  "image_prompt": "DALL-E prompt for a stunning real estate lifestyle photo",
  "title": "short title (max 60 chars)"
}
Return ONLY valid JSON.`;
  }

  if (platform === 'Facebook' && content_type === 'post') {
    return `Write a Facebook post about: ${idea}
Topic category: ${topic_type}

Return JSON with:
{
  "caption": "Facebook post (200-400 chars, conversational community tone, informative, ends with question to drive comments)",
  "hashtags": ["3-5 hashtags without # symbol"],
  "image_prompt": "DALL-E prompt for post image",
  "title": "short title (max 60 chars)"
}
Return ONLY valid JSON.`;
  }

  if (platform === 'X' && content_type === 'tweet') {
    return `Write an X (Twitter) post about: ${idea}
Topic category: ${topic_type}

X Premium account — no character limit. Write with the same depth as LinkedIn.

Return JSON with:
{
  "caption": "X post (200-400 chars, professional market insight, punchy opening that stops the scroll, no emojis)",
  "hashtags": ["3-4 hashtags without # symbol"],
  "image_prompt": "DALL-E prompt for post image",
  "title": "short title (max 60 chars)"
}
Return ONLY valid JSON.`;
  }

  if (platform === 'WhatsApp' && content_type === 'broadcast') {
    return `Write a WhatsApp broadcast message about: ${idea}
Topic category: ${topic_type}

Return JSON with:
{
  "caption": "WhatsApp message (150-300 chars, feels like exclusive insider tip from a trusted advisor, personal tone, creates urgency without being pushy)",
  "hashtags": [],
  "image_prompt": "DALL-E prompt for accompanying image",
  "title": "short title (max 60 chars)"
}
Return ONLY valid JSON.`;
  }

  return `Write a ${content_type} for ${platform} about: ${idea}
Return JSON with { caption, hashtags, image_prompt, title }. Return ONLY valid JSON.`;
}

async function callClaude(userPrompt: string, apiKey: string): Promise<Record<string, unknown>> {
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
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw: string = data.content?.[0]?.text ?? '{}';
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    throw new Error(`JSON parse failed: ${cleaned.slice(0, 200)}`);
  }
}

export async function POST(request: NextRequest) {
  const session = await getCrmSessionResult();
  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { idea: string; topic_type: string; selections: Array<{ platform: string; content_type: string }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { idea, topic_type, selections } = body;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const batch_id = crypto.randomUUID();

  const results = await Promise.allSettled(
    selections.map(async ({ platform, content_type }) => {
      const userPrompt = buildUserPrompt(platform, content_type, idea, topic_type);
      const generated = await callClaude(userPrompt, apiKey);
      return {
        batch_id,
        platform,
        content_type,
        topic_type,
        content_idea: idea,
        status: 'draft',
        ...generated,
      };
    })
  );

  const posts: unknown[] = [];
  const errors: string[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      posts.push(result.value);
    } else {
      errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
    }
  }

  if (posts.length === 0) {
    return NextResponse.json({ error: 'All generations failed', details: errors }, { status: 500 });
  }

  return NextResponse.json({ posts, batch_id, errors: errors.length > 0 ? errors : undefined });
}
