import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';

// ── Serper helper ──────────────────────────────────────────────────────────────

interface SerperResult {
  title: string;
  snippet: string;
  link: string;
}

async function serperSearch(query: string, apiKey: string): Promise<SerperResult[]> {
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: 5, gl: 'in', hl: 'en' }),
    });
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.organic || []).map((r: any) => ({
      title: r.title ?? '',
      snippet: r.snippet ?? '',
      link: r.link ?? '',
    }));
  } catch {
    return [];
  }
}

// ── Claude helper ──────────────────────────────────────────────────────────────

async function callClaude(
  system: string,
  userContent: string,
  apiKey: string,
  maxTokens = 1500
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude error: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return (data.content?.[0]?.text ?? '') as string;
}

function parseClaudeJson<T>(raw: string): T {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned) as T;
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface ContentStrategy {
  primary_language: string;
  tone: string;
  format: string;
  use_bullets: boolean;
  occasion_summary_english: string;
  occasion_summary_telugu: string;
  year_name: string;
  key_themes: string[];
  real_estate_angle: string;
  avoid: string[];
  image_style: string;
  image_elements: string[];
  telugu_greeting: string;
}

interface CaptionResult {
  caption: string;
  hashtags: string[];
  image_prompt: string;
}

// ── Platform prompt builders ───────────────────────────────────────────────────

function buildPlatformPrompt(
  platform: string,
  occasionName: string,
  occasionDate: string,
  strategy: ContentStrategy,
  researchContext: string
): string {
  if (platform === 'Facebook') {
    return `Write a Facebook greeting post for ${occasionName} on ${occasionDate}.

Content Strategy: ${JSON.stringify(strategy)}
Research context: ${researchContext}

Format:
- Opening: Warm greeting line (use year name if provided: ${strategy.year_name})
- Body: ${strategy.use_bullets ? '3-4 wishes as emoji bullet points, connecting to home/family/prosperity journey' : 'Short heartfelt paragraph, ' + strategy.tone + ' tone'}
- Closing: '— Team RE/MAX Westside Realty'
- If primary_language includes telugu: Add the Telugu occasion summary after closing
- Length: 200-350 chars for English part, Telugu addition separate
- Hashtags: 5-6 (mix: occasion-specific + HyderabadRealEstate + WestsideRealty + REMAXIndia)

Return ONLY valid JSON:
{
  "caption": "full post text",
  "hashtags": ["without # symbol"],
  "image_prompt": "detailed DALL-E prompt"
}`;
  }

  if (platform === 'Instagram') {
    return `Write an Instagram caption for ${occasionName} on ${occasionDate}.

Content Strategy: ${JSON.stringify(strategy)}

Format:
- Opening: Hook line with relevant emoji
- Body: ${strategy.use_bullets ? 'emoji-rich bullet wishes' : 'aspirational short paragraph'}
- Closing: '— Team RE/MAX Westside Realty'
- If telugu occasion: Add Telugu history snippet
- Length: 150-250 chars English part
- Hashtags: 8-10 (mix broad and niche)

Return ONLY valid JSON:
{
  "caption": "full caption",
  "hashtags": ["array"],
  "image_prompt": "detailed DALL-E prompt"
}`;
  }

  if (platform === 'LinkedIn') {
    return `Write a LinkedIn post for ${occasionName} on ${occasionDate}.

Content Strategy: ${JSON.stringify(strategy)}
Research context: ${researchContext}

Format:
- Professional yet warm opening
- ${strategy.use_bullets ? 'Brief bullet points' : 'Short thoughtful paragraph'}
- Real estate angle (subtle): ${strategy.real_estate_angle}
- Closing: '— Team RE/MAX Westside Realty'
- NO Telugu in LinkedIn
- Length: 200-400 chars
- Hashtags: 3-4 professional ones

Return ONLY valid JSON:
{
  "caption": "full post",
  "hashtags": ["array"],
  "image_prompt": "detailed DALL-E prompt"
}`;
  }

  if (platform === 'X') {
    return `Write a tweet for ${occasionName} on ${occasionDate}.

Content Strategy: ${JSON.stringify(strategy)}

Format:
- Single punchy line, ${strategy.tone} tone
- Max 240 chars
- 2 hashtags only
- '— Team RE/MAX Westside Realty' at end

Return ONLY valid JSON:
{
  "caption": "tweet text",
  "hashtags": ["2 only"],
  "image_prompt": "DALL-E prompt"
}`;
  }

  if (platform === 'WhatsApp') {
    return `Write a WhatsApp broadcast for ${occasionName} on ${occasionDate}.

Content Strategy: ${JSON.stringify(strategy)}

Format:
- Personal, intimate tone — like message from trusted friend
- If telugu occasion: Start with Telugu greeting line, then English
- Short: 150-250 chars
- No hashtags
- '— Team RE/MAX Westside Realty' at end

Return ONLY valid JSON:
{
  "caption": "message text",
  "hashtags": [],
  "image_prompt": "DALL-E prompt"
}`;
  }

  // Fallback
  return `Write a ${platform} post for ${occasionName} on ${occasionDate}.
Return ONLY valid JSON: { "caption": "...", "hashtags": [], "image_prompt": "..." }`;
}

// ── Main handler ───────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Allow both admin session and cron bearer token
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

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const serperKey = process.env.SERPER_API_KEY ?? '';
  const supabase = createServiceClient();

  // Fetch occasion
  const { data: occasion, error: occasionError } = await supabase
    .from('occasions_calendar')
    .select('*')
    .eq('id', occasion_id)
    .single();

  if (occasionError || !occasion) {
    return NextResponse.json({ error: 'Occasion not found' }, { status: 404 });
  }

  const batch_id = crypto.randomUUID();
  const occasionName: string = occasion.occasion_name;
  const occasionDate: string = occasion.occasion_date;
  const platforms: string[] = occasion.platforms ?? [];
  const occasionYear = new Date(occasionDate + 'T00:00:00Z').getFullYear().toString();
  const isHinduFestival =
    occasion.occasion_type === 'festival' &&
    Array.isArray(occasion.religions) &&
    (occasion.religions as string[]).includes('hindu');

  // ── AGENT 1: Research ────────────────────────────────────────────────────────

  const searchQueries: string[] = [
    `${occasionName} 2026 significance history cultural importance India`,
    `${occasionName} Telugu history meaning traditions Hyderabad`,
    `${occasionName} social media wishes captions 2026 India`,
  ];

  // Insert Telugu calendar query at position 2 if applicable
  if (isHinduFestival) {
    searchQueries.splice(2, 0, `${occasionName} ${occasionYear} samvatsaram year name Telugu new year`);
  }

  const searchResults = await Promise.all(
    searchQueries.map((q) => serperSearch(q, serperKey))
  );

  const researchContext = searchResults
    .flat()
    .map((r) => `Source: ${r.title}\nInsight: ${r.snippet}\n`)
    .join('\n---\n');

  // ── AGENT 2: Content Strategist ──────────────────────────────────────────────

  const strategyRaw = await callClaude(
    'You are a senior content strategist for Westside Realty, a premium RE/MAX real estate agency in Hyderabad, India. You deeply understand Indian culture, Telugu traditions, and what resonates with affluent Hyderabad homebuyers.',
    `Based on this research about ${occasionName} (${occasionDate}):

${researchContext}

Create a content strategy. Return ONLY valid JSON:
{
  "primary_language": "telugu" or "english" or "bilingual",
  "tone": "celebratory" or "patriotic" or "spiritual" or "warm" or "professional",
  "format": "wishes_with_bullets" or "straight_message" or "storytelling" or "inspirational",
  "use_bullets": true or false,
  "occasion_summary_english": "2-3 sentence culturally accurate summary of this occasion",
  "occasion_summary_telugu": "2-3 sentence summary in Telugu script (only if primary_language includes telugu, else empty string)",
  "year_name": "specific year name if applicable e.g. Parabhava Nama Samvatsaram (else empty string)",
  "key_themes": ["theme1", "theme2", "theme3"],
  "real_estate_angle": "how to subtly connect this occasion to home/real estate journey (1 sentence)",
  "avoid": ["things to avoid for this occasion"],
  "image_style": "description of visual style, colors, symbols appropriate for this occasion",
  "image_elements": ["specific visual element 1", "specific visual element 2", "specific visual element 3"],
  "telugu_greeting": "The correct greeting for this occasion in Telugu script. If this is a Telugu/Hindu festival: provide the authentic Telugu greeting (e.g. ఉగాది శుభాకాంక్షలు, దీపావళి శుభాకాంక్షలు etc.). If this is NOT a Telugu festival (Eid, Christmas, Independence Day etc.): return empty string"
}`,
    anthropicKey,
    1500
  );

  const strategy = parseClaudeJson<ContentStrategy>(strategyRaw);

  // ── AGENT 3: Caption Writers (all platforms in parallel) ─────────────────────

  const captionSystem =
    'You are an expert social media copywriter for Westside Realty, a premium RE/MAX real estate agency in Hyderabad. You write authentic, culturally rich content that resonates with affluent Telugu-speaking and English-speaking homebuyers. You never write generic corporate greetings.';

  const captionResults = await Promise.all(
    platforms.map(async (platform) => {
      const userPrompt = buildPlatformPrompt(
        platform,
        occasionName,
        occasionDate,
        strategy,
        researchContext
      );
      const raw = await callClaude(captionSystem, userPrompt, anthropicKey, 800);
      const parsed = parseClaudeJson<CaptionResult>(raw);
      return { platform, ...parsed };
    })
  );

  // ── AGENT 4: Image Prompt Refiner ────────────────────────────────────────────

  const refinedImagePromptRaw = await callClaude(
    'You are an expert AI image prompt engineer specializing in festive Indian cultural imagery for social media.',
    `Based on this occasion strategy:
${JSON.stringify(strategy)}

Create a highly detailed DALL-E 3 image generation prompt for ${occasionName}.

The image must:
- Capture the visual essence of ${occasionName} accurately
- Use colors: ${strategy.image_style}
- Include these elements: ${strategy.image_elements.join(', ')}
- Style: Vibrant, festive, professional quality suitable for social media
- NO human faces, NO text in image, NO watermarks
- Format: Square 1:1, bright and eye-catching

Return ONLY the prompt string, no JSON.`,
    anthropicKey,
    400
  );

  const refinedImagePrompt = refinedImagePromptRaw.trim();

  // ── Save to DB ────────────────────────────────────────────────────────────────

  const now = new Date().toISOString();

  await Promise.all(
    captionResults.map((result) =>
      supabase.from('occasion_captions').insert({
        occasion_id,
        platform: result.platform,
        caption: result.caption,
        hashtags: result.hashtags,
        image_prompt: refinedImagePrompt,
        telugu_greeting: strategy.telugu_greeting || '',
        status: 'pending_review',
        batch_id,
        updated_at: now,
      })
    )
  );

  await supabase
    .from('occasions_calendar')
    .update({ stage: 'captions_generated' })
    .eq('id', occasion_id);

  console.log('[Occasions Agent] Pipeline complete for:', occasionName, '| Captions:', platforms.length);

  return NextResponse.json({
    success: true,
    occasion: occasionName,
    captions_generated: platforms.length,
    strategy: strategy.tone,
  });
}
