import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';
import { getCrmSessionResult } from '@/lib/crm/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getCrmSessionResult();
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const leadId = params.id;
  const supabase = createServiceClient();

  // Check cache first — return if generated within last 6 hours
  const { data: cached } = await supabase
    .from('crm_call_briefs')
    .select('*')
    .eq('lead_id', leadId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  if (cached && cached.generated_at > sixHoursAgo) {
    return NextResponse.json({
      success: true,
      brief: cached,
      cached: true,
    });
  }

  // Fetch lead first (needed for phone in subsequent queries)
  const { data: lead, error: leadError } = await supabase
    .from('crm_leads')
    .select(`
      id, name, phone, email,
      budget_min, budget_max,
      location_preference, buyer_type,
      timeline, notes, source_type,
      source_channel, landing_page,
      status, stage_id, lead_score,
      priority, investor_type,
      attribution_metadata, created_at,
      first_contact_at, last_activity_at,
      assigned_to
    `)
    .eq('id', leadId)
    .single();

  console.log('[CallBrief] Lead query result:', lead ? 'found' : 'not found', leadError?.message);

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Fetch all remaining data in parallel
  const [
    { data: activities },
    { data: metaRaw },
    { data: behaviors },
    { data: messages },
    { data: stage },
  ] = await Promise.all([
    supabase
      .from('crm_lead_activities')
      .select('activity_type, description, notes, metadata, created_at')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('crm_meta_raw_leads')
      .select('payload, created_at, ad_id, campaign_id')
      .eq('crm_lead_id', leadId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('crm_behavior_events')
      .select('event_type, page_url, metadata, created_at')
      .eq('phone', lead.phone ?? '')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('crm_whatsapp_messages')
      .select('message, direction, created_at')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(5),
    lead.stage_id
      ? supabase
          .from('crm_lead_stages')
          .select('name')
          .eq('id', lead.stage_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  // Format budget
  const formatBudget = (v: number | null) => {
    if (!v) return null;
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`;
    return `₹${v.toLocaleString('en-IN')}`;
  };

  // Build structured data for AI
  const leadData = {
    name: lead.name,
    phone: lead.phone,
    budget:
      lead.budget_min || lead.budget_max
        ? `${formatBudget(lead.budget_min)} – ${formatBudget(lead.budget_max)}`
        : null,
    location: lead.location_preference,
    buyer_type: lead.buyer_type,
    timeline: lead.timeline,
    notes: lead.notes,
    source: lead.source_type || lead.source_channel,
    landing_page: lead.landing_page,
    status: lead.status,
    stage: (stage as Record<string, unknown> | null)?.name,
    lead_score: lead.lead_score,
    submitted_at: lead.created_at,
    first_contacted_at: lead.first_contact_at,
    last_activity_at: lead.last_activity_at,
    meta_raw_payload: (metaRaw as Record<string, unknown> | null)?.payload ?? null,
    meta_ad_id: (metaRaw as Record<string, unknown> | null)?.ad_id ?? null,
    meta_campaign_id: (metaRaw as Record<string, unknown> | null)?.campaign_id ?? null,
    recent_activities: (activities || []).map((a) => ({
      type: a.activity_type,
      description: a.description,
      notes: a.notes,
      outcome: (a.metadata as Record<string, unknown> | null)?.outcome,
      at: a.created_at,
    })),
    pages_visited: (behaviors || [])
      .filter((b) => b.event_type === 'page_view')
      .map((b) => (b as Record<string, unknown>).page_url)
      .filter(Boolean)
      .slice(0, 5),
    whatsapp_history: (messages || []).map((m) => ({
      direction: m.direction,
      message: m.message,
      at: m.created_at,
    })),
  };

  // Generate AI Summary
  const summaryPrompt = `You are a real estate sales assistant for Westside Realty, Hyderabad.

Write a 3-4 sentence call brief for an agent about to call this lead.
Be direct, specific, and actionable. Write in second person to the agent.

Include:
1. Who they are and what they want (budget, location, type)
2. Where they came from and what they engaged with
3. Current status and any call history
4. One specific talking point or approach suggestion

Lead data:
${JSON.stringify(leadData, null, 2)}

Write only the brief — no headers, no bullet points, just flowing sentences.`;

  // Generate Phone Intelligence
  const intelligencePrompt = `Search the web for public professional information about a person
using their phone number: ${lead.phone}

Try these searches:
- "${lead.phone}" linkedin
- "${lead.phone}" professional
- "${lead.phone?.replace(/\D/g, '')}" site:linkedin.com

Return ONLY a JSON object with no other text:
{
  "found": true or false,
  "designation": "job title or null",
  "company": "company name or null",
  "location": "city or null",
  "profile_url": "url or null",
  "confidence": "high, medium, or low",
  "summary": "one line about this person or null"
}

If nothing relevant found, return {"found": false}`;

  // Call Claude API for both in parallel
  const [summaryResponse, intelligenceResponse] = await Promise.all([
    anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: summaryPrompt }],
    }),
    anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ type: 'web_search_20250305' as any, name: 'web_search' }],
      messages: [{ role: 'user', content: intelligencePrompt }],
    }),
  ]);

  // Extract summary text
  const aiSummary = summaryResponse.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('');

  // Extract intelligence JSON
  let phoneIntelligence: Record<string, unknown> = { found: false };
  try {
    const intelligenceText = intelligenceResponse.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');
    const jsonMatch = intelligenceText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      phoneIntelligence = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('[CallBrief] Intelligence parse error:', e);
  }

  // Cache the result
  const { data: brief, error: insertError } = await supabase
    .from('crm_call_briefs')
    .insert({
      lead_id: leadId,
      ai_summary: aiSummary,
      phone_intelligence: phoneIntelligence,
      raw_data: leadData,
      generated_by: session.user.id,
    })
    .select()
    .single();

  if (insertError) {
    console.error('[CallBrief] Insert error:', insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    brief,
    cached: false,
  });
}
