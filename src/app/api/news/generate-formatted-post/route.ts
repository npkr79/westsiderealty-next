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
    .select('headline, summary, ai_summary, full_text, source_name, source_url, published_at')
    .eq('id', article_id)
    .single();

  if (error || !article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const todayQuarter = `Q${Math.floor(today.getMonth() / 3) + 1} ${today.getFullYear()}`;
  const publishedIso = article.published_at
    ? new Date(article.published_at).toISOString().slice(0, 10)
    : null;

  // Prefer full_text (real article body) over summaries when available.
  const articleBody =
    (article.full_text && article.full_text.trim().length > 200)
      ? article.full_text
      : (article.ai_summary || article.summary || '');

  const topic = [
    `Headline: ${article.headline}`,
    article.source_name ? `Source: ${article.source_name}` : null,
    publishedIso ? `Published: ${publishedIso}` : null,
    article.source_url ? `URL: ${article.source_url}` : null,
    `Article body:\n${articleBody}`,
  ]
    .filter(Boolean)
    .join('\n');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Tool-use is the canonical Anthropic pattern for guaranteed structured output.
  // The model MUST call `submit_posts` with valid JSON matching the schema.
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: 'submit_posts',
        description: 'Submit the four social media post variants generated for the article.',
        input_schema: {
          type: 'object',
          properties: {
            x: { type: 'string', description: 'X (Twitter) post — short and concise.' },
            linkedin: { type: 'string', description: 'LinkedIn post — professional and insight-driven.' },
            facebook: { type: 'string', description: 'Facebook post — explanatory and informative.' },
            instagram: { type: 'string', description: 'Instagram post — engaging and simple.' },
          },
          required: ['x', 'linkedin', 'facebook', 'instagram'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'submit_posts' },
    messages: [
      {
        role: 'user',
        content: [
          `Today's date is ${todayIso} (${todayQuarter}).`,
          `The article below was published on ${publishedIso ?? 'unknown'}.`,
          `Use ONLY the dates and numbers stated in the article body. If the article says "Jan-Mar" or "Q1" without a year, the year is the year of the published date — never assume a different year.`,
          `Do NOT invent statistics. If a specific number (sq ft, %, ₹ amount, count) is not in the article body, do not include it in the post.`,
          `Pull the most concrete numbers (sq ft leased, %, ₹ crore, year-on-year, market share) directly from the article body and feature them as bullets.`,
          ``,
          `Generate 4 social media posts for this real estate news article and submit them via the submit_posts tool:`,
          ``,
          topic,
        ].join('\n'),
      },
    ],
  });

  // Extract the tool_use block — guaranteed present because tool_choice forced it.
  const toolUseBlock = response.content.find(
    (b): b is Extract<typeof b, { type: 'tool_use' }> => b.type === 'tool_use'
  );

  if (!toolUseBlock) {
    const textBlock = response.content.find((b) => b.type === 'text');
    const preview = textBlock && textBlock.type === 'text' ? textBlock.text.slice(0, 500) : '';
    console.error('[generate-formatted-post] No tool_use block. stop_reason:', response.stop_reason, 'text preview:', preview);
    return NextResponse.json({ error: 'Generation failed — unexpected response format' }, { status: 500 });
  }

  const posts = toolUseBlock.input as { x: string; linkedin: string; facebook: string; instagram: string };

  if (!posts.x || !posts.linkedin || !posts.facebook || !posts.instagram) {
    console.error('[generate-formatted-post] Tool input missing required keys:', Object.keys(posts || {}));
    return NextResponse.json({ error: 'Generation failed — missing post variants' }, { status: 500 });
  }

  return NextResponse.json({ success: true, posts });
}
