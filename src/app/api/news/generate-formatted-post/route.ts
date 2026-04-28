import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';

export const maxDuration = 60;

// Unicode mathematical sans-serif bold character map used in the prompt
// so Claude knows exactly which characters to produce.
const SYSTEM_PROMPT = `You create social media posts for X, LinkedIn, Facebook, and Instagram.

CRITICAL: All bold text must use Unicode mathematical sans-serif bold characters directly — NOT Markdown **bold**.
Use exactly these Unicode bold characters:
• Bold UPPERCASE: 𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭
• Bold lowercase: 𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇
• Bold digits: 𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵

WHAT TO BOLD (use the Unicode chars above):
• Title — ALL CAPS bold
• Subtitle — bold
• Every heading and sub-heading — bold
• All key numbers, percentages, years
• All important keywords, company names, project names

WHAT NOT TO BOLD: Regular sentence text, bullet content, hashtags.
Never use ** or __ Markdown syntax — those characters must NOT appear in the output.

STRUCTURE — use for every post:
[Bold Title in ALL CAPS]
[Bold Subtitle]

[Bold Heading]
• Bullet with key numbers in Unicode bold
• Short sentences

[Bold Second Heading]
• Impact / implications
• Practical insight

𝗞𝗲𝘆 𝗧𝗮𝗸𝗲𝗮𝘄𝗮𝘆
• 2–3 short summary lines

#hashtags

PLATFORM RULES:
• X: short and concise
• LinkedIn: professional and insight-driven
• Facebook: explanatory and informative
• Instagram: engaging and simple

TONE: Professional. Neutral. Informational. No emojis.
CONTENT ORDER: Facts → Impact → Takeaway.`;

export async function POST(request: NextRequest) {
  const session = await getCrmSessionResult();
  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { article_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { article_id } = body;
  if (!article_id) {
    return NextResponse.json({ error: 'article_id is required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: article, error } = await supabase
    .from('news_articles')
    .select('headline, summary, ai_summary')
    .eq('id', article_id)
    .single();

  if (error || !article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  const topic = [article.headline, article.ai_summary || article.summary]
    .filter(Boolean)
    .join('\n\n');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate 4 social media posts for this real estate news topic:\n\n${topic}\n\nReturn a JSON object with exactly these keys: "x", "linkedin", "facebook", "instagram". Each value is the complete post text with Unicode bold formatting and hashtags. Return ONLY the JSON object — no other text, no markdown code fences.`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // Strip possible markdown code fences before JSON parsing
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  const jsonMatch = stripped.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    console.error('[generate-formatted-post] Non-JSON response:', text.slice(0, 300));
    return NextResponse.json({ error: 'Generation failed — unexpected response format' }, { status: 500 });
  }

  try {
    const posts = JSON.parse(jsonMatch[0]) as { x: string; linkedin: string; facebook: string; instagram: string };
    return NextResponse.json({ success: true, posts });
  } catch {
    return NextResponse.json({ error: 'Failed to parse generated posts' }, { status: 500 });
  }
}
