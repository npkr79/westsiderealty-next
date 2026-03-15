import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';
import { getCrmSessionResult } from '@/lib/crm/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();


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

  // Phone intelligence — reuse permanently if ai_profile already exists
  const cachedIntelligence = existing?.phone_intelligence;
  const hasIntelligence = cachedIntelligence?.ai_profile != null;

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

  // Build structured data for AI summary prompt
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData = {
    name: lead.name,
    source: (lead.attribution_metadata as Record<string, unknown> | null)?.fb_form_name as string
      || lead.source_channel || lead.source_type,
    meta_answers: Object.entries(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((lead.attribution_metadata as any)?.field_data || {}) as Record<string, unknown>
    )
      .filter(([k]) => !['email', 'phone', 'full_name', 'phone_number', 'name'].includes(k.toLowerCase()))
      .map(([k, v]) => `${k.replace(/_/g, ' ').replace(/\?/g, '')}: ${String(v).replace(/_/g, ' ')}`),
    budget: lead.budget_min || lead.budget_max
      ? `${lead.budget_min ? '₹' + (lead.budget_min / 10000000).toFixed(0) + 'Cr' : '?'} – ${lead.budget_max ? '₹' + (lead.budget_max / 10000000).toFixed(0) + 'Cr' : '?'}`
      : null,
    location: lead.location_preference,
    buyer_type: lead.buyer_type,
    timeline: lead.timeline,
    notes: lead.notes,
    landing_page: lead.landing_page,
    status: lead.status,
    last_activity: lead.last_activity_at,
    first_contact: lead.first_contact_at,
    recent_calls: (activities || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((a: any) => a.activity_type === 'call')
      .slice(0, 3)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((a: any) => a.metadata?.outcome || a.description),
  };

  // Claude Haiku: 1-2 sentence call brief
  const summaryRes = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `Write a 1-2 sentence call brief for a real estate agent about to call this lead.
Be conversational and specific. Use the lead's name.
Focus on what they want and current status.
Max 40 words. No bullet points.

Data: ${JSON.stringify(rawData)}`,
    }],
  });

  const aiSummary = summaryRes.content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((b: any) => b.type === 'text')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((b: any) => b.text)
    .join('').trim();

  // ---------------------------------------------------------------------------
  // Phone intelligence — Serper search + direct result parsing
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

      const allItems = [...r1, ...r2, ...r3].slice(0, 10);

      if (allItems.length > 0) {
        const priorityDomains = [
          'linkedin.com', 'justdial.com', '99acres.com',
          'magicbricks.com', 'housing.com', 'indiamart.com',
          'sulekha.com', 'truecaller.com', 'zaubacorp.com',
          'facebook.com', 'instagram.com', 'twitter.com',
        ];

        const sorted = [...allItems].sort((a, b) => {
          const aScore = priorityDomains.some((d) => a.link?.includes(d)) ? 1 : 0;
          const bScore = priorityDomains.some((d) => b.link?.includes(d)) ? 1 : 0;
          return bScore - aScore;
        });

        const best = sorted[0];
        let domain = '';
        try {
          domain = new URL(best.link).hostname.replace('www.', '');
        } catch { /* invalid URL — leave domain empty */ }

        phoneIntelligence = {
          found: true,
          name: best.title?.split(' - ')[0]?.split(' | ')[0]?.trim() || null,
          summary: best.snippet || null,
          profile_url: best.link || null,
          source: domain || null,
          confidence: priorityDomains.some((d) => domain.includes(d)) ? 'high' : 'medium',
          all_results: sorted.slice(0, 5).map((r) => ({
            title: r.title,
            url: r.link,
            snippet: r.snippet,
          })),
        };
      }

      // Claude Haiku: summarize Serper findings into a concise AI profile
      if (phoneIntelligence.found && phoneIntelligence.all_results?.length > 0) {
        try {
          const snippets = phoneIntelligence.all_results
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((r: any) => `Title: ${r.title}\nSnippet: ${r.snippet}\nURL: ${r.url}`)
            .join('\n\n');

          const profileRes = await anthropic.messages.create({
            model: 'claude-haiku-4-5',
            max_tokens: 150,
            messages: [{
              role: 'user',
              content: `Based on these Google search results for phone number ${phone10}, write a 2-3 line professional profile of this person or business. Be factual, use only what's in the results. Max 50 words. If results are spam/irrelevant, return "No meaningful profile found."

${snippets}`,
            }],
          });

          const profileText = profileRes.content
            .filter((b) => b.type === 'text')
            .map((b) => (b as { type: 'text'; text: string }).text)
            .join('');

          phoneIntelligence.ai_profile = profileText.trim();
          console.log('[CallBrief] AI profile:', phoneIntelligence.ai_profile);
        } catch (e) {
          console.warn('[CallBrief] Profile summarization failed:', e);
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
