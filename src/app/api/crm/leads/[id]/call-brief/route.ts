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
// Serper search helper
// ---------------------------------------------------------------------------

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
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
      link: r.link ?? '',
      snippet: r.snippet ?? '',
    }));
  } catch {
    return [];
  }
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
  const serperKey = process.env.SERPER_API_KEY ?? '';

  // Check for existing brief
  const { data: existing } = await supabase
    .from('crm_call_briefs')
    .select('*')
    .eq('lead_id', leadId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  // If fully cached and summary is fresh — return as is
  if (existing && existing.generated_at > sixHoursAgo) {
    return NextResponse.json({ success: true, brief: existing, cached: true });
  }

  // Phone intelligence — reuse permanently if exists
  const cachedIntelligence = existing?.phone_intelligence || null;
  const hasIntelligence = cachedIntelligence !== null && cachedIntelligence !== undefined;

  console.log('[CallBrief] Cache state:', {
    hasExisting: !!existing,
    summaryFresh: !!(existing && existing.generated_at > sixHoursAgo),
    hasIntelligence,
  });

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

  // Fetch supporting data in parallel
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

  // ---------------------------------------------------------------------------
  // Phone intelligence — Serper search + Claude extraction
  // Cached permanently: skip entirely if already stored
  // ---------------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let phoneIntelligence: any = cachedIntelligence || { found: false };

  // Only call Serper if no cached intelligence exists
  if (!hasIntelligence && serperKey) {
    try {
      const phone10 = (lead.phone ?? '').replace(/\D/g, '').slice(-10);

      // Run 3 targeted searches in parallel
      const [r1, r2, r3] = await Promise.all([
        serperSearch(`"${phone10}"`, serperKey),
        serperSearch(`"+91${phone10}" linkedin OR justdial OR truecaller`, serperKey),
        serperSearch(`"${phone10}" real estate OR property OR director OR founder`, serperKey),
      ]);

      const allResults = [...r1, ...r2, ...r3].slice(0, 10);

      if (allResults.length > 0) {
        const snippets = allResults
          .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\n${r.link}`)
          .join('\n\n');

        const extractionPrompt = `You are extracting structured profile data from Google search results for an Indian mobile number.

Phone: ${phone10}

Search results:
${snippets}

Based ONLY on the above search results, extract what you can verify about the person or business associated with this number.

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

If the results don't clearly identify this number's owner, return: {"found": false}`;

        const extractionResponse = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          messages: [{ role: 'user', content: extractionPrompt }],
        });

        try {
          const text = extractionResponse.content
            .filter((b) => b.type === 'text')
            .map((b) => (b as { type: 'text'; text: string }).text)
            .join('');
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            phoneIntelligence = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.warn('[CallBrief] Intelligence parse error:', e);
        }
      }
    } catch (e) {
      console.error('[CallBrief] Serper error:', e);
    }
  } else if (hasIntelligence) {
    console.log('[CallBrief] Using cached phone intelligence');
  }

  // ---------------------------------------------------------------------------
  // Upsert — update summary + raw_data; keep intelligence if already stored
  // ---------------------------------------------------------------------------

  const { data: brief, error: insertError } = await supabase
    .from('crm_call_briefs')
    .upsert(
      {
        id: existing?.id ?? undefined,
        lead_id: leadId,
        ai_summary: aiSummary,
        phone_intelligence: phoneIntelligence,
        raw_data: rawData,
        generated_at: new Date().toISOString(),
        generated_by: session.user.id,
      },
      { onConflict: 'id', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (insertError) {
    console.error('[CallBrief] Upsert error:', insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, brief, cached: false });
}
