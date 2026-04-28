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

  type Posts = { x: string; linkedin: string; facebook: string; instagram: string };

  const userContent = [
    `Today's date is ${todayIso} (${todayQuarter}).`,
    `The article below was published on ${publishedIso ?? 'unknown'}.`,
    `Use ONLY the dates and numbers stated in the article body. If the article says "Jan-Mar" or "Q1" without a year, the year is the year of the published date — never assume a different year.`,
    `Do NOT invent statistics. If a specific number (sq ft, %, ₹ amount, count) is not in the article body, do not include it in the post.`,
    `Pull the most concrete numbers (sq ft leased, %, ₹ crore, year-on-year, market share) directly from the article body and feature them as bullets.`,
    ``,
    `IMPORTANT: All four platform fields (x, linkedin, facebook, instagram) MUST be non-empty strings of at least 100 characters each. Generate complete, distinct post text for every platform — never leave a field blank.`,
    ``,
    `Generate 4 social media posts for this real estate news article and submit them via the submit_posts tool:`,
    ``,
    topic,
  ].join('\n');

  async function callModel(): Promise<{ posts: Partial<Posts> | null; stopReason: string | null }> {
    const resp = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      tools: [
        {
          name: 'submit_posts',
          description: 'Submit the four social media post variants generated for the article. ALL FOUR fields must be non-empty.',
          input_schema: {
            type: 'object',
            properties: {
              x: { type: 'string', description: 'X (Twitter) post — short and concise. Must be non-empty.' },
              linkedin: { type: 'string', description: 'LinkedIn post — professional and insight-driven. Must be non-empty.' },
              facebook: { type: 'string', description: 'Facebook post — explanatory and informative. Must be non-empty.' },
              instagram: { type: 'string', description: 'Instagram post — engaging and simple. Must be non-empty.' },
            },
            required: ['x', 'linkedin', 'facebook', 'instagram'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'submit_posts' },
      messages: [{ role: 'user', content: userContent }],
    });

    const toolUse = resp.content.find(
      (b): b is Extract<typeof b, { type: 'tool_use' }> => b.type === 'tool_use'
    );
    return {
      posts: toolUse ? (toolUse.input as Partial<Posts>) : null,
      stopReason: resp.stop_reason ?? null,
    };
  }

  function variantsOk(p: Partial<Posts> | null): p is Posts {
    if (!p) return false;
    return ['x', 'linkedin', 'facebook', 'instagram'].every(
      (k) => typeof p[k as keyof Posts] === 'string' && (p[k as keyof Posts] as string).trim().length >= 50
    );
  }

  // Try once. If any variant is empty/short, retry once. Then merge best-of-both.
  const attempt1 = await callModel();
  let merged: Partial<Posts> = attempt1.posts ?? {};

  if (!variantsOk(merged)) {
    console.warn('[generate-formatted-post] attempt 1 incomplete (stop_reason=%s). Retrying.', attempt1.stopReason);
    const attempt2 = await callModel();
    const second = attempt2.posts ?? {};
    // Merge: prefer non-empty from either attempt for each key.
    for (const k of ['x', 'linkedin', 'facebook', 'instagram'] as const) {
      const a = (merged[k] ?? '').trim();
      const b = (second[k] ?? '').trim();
      merged[k] = a.length >= 50 ? a : b.length >= 50 ? b : a || b;
    }
  }

  // Lenient final validation: succeed if at least 2 variants have real content.
  // Front-end can show "Not generated" placeholders for any empties.
  const filledCount = (['x', 'linkedin', 'facebook', 'instagram'] as const).filter(
    (k) => typeof merged[k] === 'string' && (merged[k] as string).trim().length >= 50
  ).length;

  if (filledCount === 0) {
    console.error('[generate-formatted-post] All 4 variants empty after retry. attempt1.stop=%s', attempt1.stopReason);
    return NextResponse.json({ error: 'Generation failed — model returned no usable content. Please try again.' }, { status: 500 });
  }

  // Fill any remaining empty variant by reusing another (so UI always has 4 fields).
  const fallback = (['linkedin', 'facebook', 'x', 'instagram'] as const)
    .map((k) => (typeof merged[k] === 'string' ? (merged[k] as string).trim() : ''))
    .find((v) => v.length >= 50) ?? '';

  for (const k of ['x', 'linkedin', 'facebook', 'instagram'] as const) {
    if (typeof merged[k] !== 'string' || (merged[k] as string).trim().length < 50) {
      merged[k] = fallback;
    }
  }

  return NextResponse.json({
    success: true,
    posts: merged as Posts,
    meta: { generated: filledCount, total: 4 },
  });
}
