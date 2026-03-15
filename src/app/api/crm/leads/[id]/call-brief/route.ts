import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';
import { getCrmSessionResult } from '@/lib/crm/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// ---------------------------------------------------------------------------
// Build a structured summary from lead data — no Claude call needed
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSummary(lead: any): string {
  const parts: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attrMeta = lead.attribution_metadata as any;
  const fieldData = attrMeta?.field_data || {};
  const skipKeys = ['email', 'phone', 'full_name', 'phone_number', 'name'];

  // Meta form answers — most valuable, show first
  const metaAnswers = Object.entries(fieldData)
    .filter(([key]) => !skipKeys.includes(key.toLowerCase()))
    .map(([key, val]) => {
      const cleanVal = String(val).replace(/_/g, ' ');
      const cleanKey = key
        .replace(/_/g, ' ')
        .replace(/\?/g, '')
        .trim()
        .replace(/^what /i, '')
        .trim();
      return `${cleanKey}: ${cleanVal}`;
    });

  if (metaAnswers.length > 0) parts.push(...metaAnswers);

  // Budget
  const fmt = (v: number | null) => {
    if (!v) return null;
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(0)}Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`;
    return `₹${v}`;
  };
  if (lead.budget_min || lead.budget_max) {
    parts.push(`Budget: ${fmt(lead.budget_min) ?? '?'} – ${fmt(lead.budget_max) ?? '?'}`);
  }

  if (lead.location_preference) parts.push(`Location: ${lead.location_preference}`);
  if (lead.buyer_type) parts.push(`Type: ${lead.buyer_type}`);
  if (lead.timeline) parts.push(`Timeline: ${lead.timeline}`);
  if (lead.notes) parts.push(lead.notes);

  const source = attrMeta?.fb_form_name || lead.source_channel || lead.source_type || '';
  if (source) parts.push(`Via: ${source}`);

  if (lead.landing_page) {
    const match = lead.landing_page.match(/projects\/([^/?]+)/);
    if (match) parts.push(`Project: ${match[1].replace(/-/g, ' ')}`);
  }

  const full = parts.join(' · ');
  const words = full.split(' ');
  return words.length > 60 ? words.slice(0, 60).join(' ') + '...' : full;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leadId } = await params;

  const session = await getCrmSessionResult();
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
    return NextResponse.json({ success: true, brief: cached, cached: true });
  }

  // Fetch lead first
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

  // Fetch supporting data in parallel (no meta raw — read from attribution_metadata)
  const [
    { data: activities },
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
      ? supabase.from('crm_lead_stages').select('name').eq('id', lead.stage_id).single()
      : Promise.resolve({ data: null }),
  ]);

  // Build summary from lead data — no Claude call
  const aiSummary = buildSummary(lead);

  // Build raw snapshot for storage
  const rawData = {
    stage: (stage as Record<string, unknown> | null)?.name,
    recent_activities: (activities || []).map((a) => ({
      type: a.activity_type,
      description: a.description,
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

  // Phone intelligence — Claude with web search
  const phone10 = (lead.phone ?? '').replace(/\D/g, '').slice(-10);

  const intelligencePrompt = `Task: Create a comprehensive profile for the individual or entity associated with the Indian mobile number: ${phone10}

Objective: Use this number to identify the owner's name, profession, location, and digital presence.

Search Instructions:
1. Strict String Search: Search for the number using exact match quotes: "${phone10}" and "+91 ${phone10}".
2. Professional & Social Discovery: Look for profiles on LinkedIn, Facebook, Instagram, and Twitter/X where this number may be linked to a bio or contact button.
3. Public Directories: Check Truecaller (Web), WhitePages, and JustDial to verify the name associated with the SIM registration or business listing.
4. Operational Presence: Identify if this number is mentioned on any "Contact Us" pages, PDF documents, government registrations (like GST or MSME), or news articles.
5. WhatsApp/UPI Check: Check if the number has a linked WhatsApp Business catalog or a UPI ID (e.g., on Google Pay/PhonePe) to confirm the legal name.

Return ONLY this JSON with no other text:
{
  "found": true or false,
  "name": "full name if found or null",
  "designation": "job title or null",
  "company": "company or business name or null",
  "location": "city or null",
  "profile_url": "best url found or null",
  "confidence": "high, medium, or low",
  "summary": "one line about this person/business or null",
  "source": "where found: LinkedIn/JustDial/Truecaller/99acres/etc or null"
}

If nothing found after exhaustive search, return: {"found": false}`;

  const intelligenceResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ type: 'web_search_20250305' as any, name: 'web_search' }],
    messages: [{ role: 'user', content: intelligencePrompt }],
  });

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
      raw_data: rawData,
      generated_by: session.user.id,
    })
    .select()
    .single();

  if (insertError) {
    console.error('[CallBrief] Insert error:', insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, brief, cached: false });
}
