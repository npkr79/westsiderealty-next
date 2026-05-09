import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";

// Source types that must NEVER trigger alerts (bulk imports, migrations, simulations).
// Any row inserted with one of these source_type values is silently skipped.
// When you build a CSV/bulk import flow, set source_type = 'bulk_import'.
const SILENT_SOURCES = new Set([
  "bulk_import",
  "csv_import",
  "import",
  "migration",
  "data_migration",
  "simulation",
  "test",
  "seed",
]);

const PRAVEEN_ID = "9021aff0-6ba3-4f7b-852f-561862fbc1ac";

interface LeadRow {
  id: string;
  name?: string | null;
  phone?: string | null;
  source_type?: string | null;
  source_channel?: string | null;
  source_id?: string | null;
  location_preference?: string | null;
  budget?: string | null;
  notes?: string | null;
  attribution_metadata?: Record<string, unknown> | null;
  fb_lead_id?: string | null;
  meta_leadgen_id?: string | null;
  assigned_to?: string | null;
  is_bulk_upload?: boolean | null;
  property_type?: string | null;
  landing_page?: string | null;
}

interface FullLead extends LeadRow {}

function formatBudget(budget?: string | null): string | null {
  if (!budget) return null;
  const n = Number(budget);
  if (isNaN(n) || n === 0) return null;
  return `₹${(n / 10000000).toFixed(2)} Cr`;
}

async function extractPropertyFromFormName(formName: string): Promise<string> {
  if (!formName || formName === 'Meta Lead Ad') return 'Not specified';
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `Extract only the property/project name from this Meta Lead Ad form name.
Return ONLY the clean property name as plain text, nothing else, no explanation.
Remove dates, "Lead form", "Lead Gen", "Submit Form", "Leads Form" etc.

Examples:
"Godrej Lead form 15th Feb 2026" → Godrej Regal Pavilion
"Sapphire Lead Gen Submit Form 09Feb" → Sapphire, Siolim, Goa
"Commercial Investors Leads Form March 5th 2026" → Commercial Property, Hyderabad
"Kokapet & Gandipet Resale Villas Lead Form - 10th March" → Villas in Kokapet & Gandipet
"Westsiderealty - Buyers Feb 2026" → General Enquiry

Form name: "${formName}"
Property name:`,
        }],
      }),
    });

    if (!response.ok) {
      console.error('[extractProperty] API error:', response.status);
      return formName;
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text?.trim();

    // Return plain text directly - no JSON.parse needed
    if (text && text.length > 0 && text.length < 200) {
      return text;
    }
    return formName;
  } catch (err) {
    console.error('[extractProperty] Failed:', err);
    return formName;
  }
}


// Called by a Supabase Database Webhook on:
//   - INSERT into crm_leads
//   - UPDATE on crm_leads where assigned_to changed
//
// Auth: Authorization: Bearer {CRON_SECRET}
// Configure in Supabase Dashboard → Database → Webhooks
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      console.log("[PushDebug] Returning", { reason: "unauthorized" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    console.log("[PushDebug] Returning", { reason: "invalid_json" });
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = String(body?.type ?? "").toUpperCase(); // "INSERT" | "UPDATE"
  const record = body?.record as LeadRow | null;
  const oldRecord = body?.old_record as LeadRow | null;

  // 1. Log raw fields immediately after parsing
  console.log("[PushDebug] Received", {
    type,
    recordId: record?.id,
    is_bulk_upload: record?.is_bulk_upload,
    source_type: record?.source_type,
    assigned_to: record?.assigned_to,
    ts: new Date().toISOString(),
  });

  if (!record?.id) {
    console.log("[PushDebug] Returning", { reason: "no_record_id" });
    return NextResponse.json({ error: "No record in payload" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Purge stale dedup entries before checking — ensures legitimate retries
  // after the TTL window are not incorrectly blocked.
  try {
    await supabase
      .from("crm_push_dedup")
      .delete()
      .lt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());
  } catch (_) {}

  // DB-level dedup — unique constraint on dedup_key means first insert wins;
  // any subsequent delivery from another serverless instance gets a conflict error.
  const dedupKey = `push:${type}:${record.id}`;

  const { error: dedupError } = await supabase
    .from("crm_push_dedup")
    .insert({ dedup_key: dedupKey });

  if (dedupError) {
    console.log("[PushDebug] DB dedup hit — skipping duplicate", { dedupKey });
    return NextResponse.json({ skipped: true, reason: "duplicate" });
  }

  console.log("[PushDebug] DB dedup passed", { dedupKey });

  // Skip bulk imports / simulations / test data
  const sourceType = record.source_type?.toLowerCase() ?? null;

  // 3. Log SILENT_SOURCES check
  console.log("[PushDebug] SourceCheck", {
    suppressed: !!(sourceType && SILENT_SOURCES.has(sourceType)),
    source_type: record.source_type,
  });

  if (sourceType && SILENT_SOURCES.has(sourceType)) {
    console.log(`[Push/new-lead] Skipped alert — silent source: ${sourceType}`);
    console.log("[PushDebug] Returning", { reason: "silent_source" });
    return NextResponse.json({ skipped: true, reason: "silent_source" });
  }

  // Skip any row explicitly flagged as a bulk upload

  // 4. Log is_bulk_upload check
  console.log("[PushDebug] BulkCheck", { suppressed: record.is_bulk_upload === true });

  if (record.is_bulk_upload === true) {
    console.log(`[Push/new-lead] Skipped alert — bulk_upload flag set`);
    console.log("[PushDebug] Returning", { reason: "bulk_upload" });
    return NextResponse.json({ skipped: true, reason: "bulk_upload" });
  }

  // Fetch full lead for rich templateParams
  const { data: fullLeadData } = await supabase
    .from('crm_leads')
    .select('id, name, phone, source_channel, source_type, source_id, location_preference, budget, notes, attribution_metadata, fb_lead_id, meta_leadgen_id, assigned_to, is_bulk_upload, property_type, landing_page')
    .eq('id', record.id)
    .single();
  const fullLead: FullLead = fullLeadData ?? record;

  // ── Normalize phone helper ────────────────────────────────────────────────
  function normalizePhone(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) return digits;
    if (digits.length === 10) return `91${digits}`;
    return digits.startsWith("91") ? digits : `91${digits}`;
  }

  // ── Source detection ──────────────────────────────────────────────────────
  const sourceChannel = fullLead.source_channel?.toLowerCase() || '';
  const sourceId = fullLead.source_id || '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = (fullLead.attribution_metadata as Record<string, any>) || {};

  const is99acres = sourceId === '3308dd6c-a656-42c8-947e-a94e2e46c0ab' ||
                    sourceChannel.includes('99acres');
  const isMeta = sourceId === '192bf7e8-8be9-46e5-bb8f-dfe9298e3598' ||
                 sourceChannel.includes('meta') ||
                 sourceChannel.includes('facebook') ||
                 sourceChannel.includes('fb');
  const isWebsite = sourceId === 'c3b72f38-171b-4ce6-a060-f40beed8bdb4' ||
                    sourceChannel.includes('website');

  // ── Target routing ────────────────────────────────────────────────────────
  type AlertTarget = { name: string; phone: string };
  const targets: AlertTarget[] = [];
  const adminTarget = { name: 'Praveen', phone: '919866085831' };
  let agentWhatsappForAssignment: string | null = null; // set for 99acres matched leads only

  if (is99acres) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawPayload = (meta.raw_payload as Record<string, any>) || {};
    const propertyName = (
      rawPayload.property_name ||
      rawPayload.project_name ||
      fullLead.location_preference || ''
    ).toLowerCase();

    const SRINIVAS_WHATSAPP = '918520099841';
    const KRISHNA_WHATSAPP = '919666845340';
    const NAVEEN_WHATSAPP = '919573808992';

    // 99acres routing: project-based per agent (add new projects here as needed)
    const srinivasProperties = ['rajapushpa imperia', 'aparna zenon', 'nk villa scapes', 'hallmark treasor', 'my home vipina', 'rajapushpa cannon dale', 'aparna elixir', 'preston', 'anvitas', 'amari'];
    const krishnaProperties = ['aparna cyberon', 'aparna cyber heights'];
    const naveenProperties = ['my home tridasa', 'myhome tridasa'];

    if (srinivasProperties.some(p => propertyName.includes(p))) {
      targets.push({ name: 'Srinivas', phone: SRINIVAS_WHATSAPP });
      agentWhatsappForAssignment = SRINIVAS_WHATSAPP;
    } else if (krishnaProperties.some(p => propertyName.includes(p))) {
      targets.push({ name: 'Krishna', phone: KRISHNA_WHATSAPP });
      agentWhatsappForAssignment = KRISHNA_WHATSAPP;
    } else if (naveenProperties.some(p => propertyName.includes(p))) {
      targets.push({ name: 'Naveen', phone: NAVEEN_WHATSAPP });
      agentWhatsappForAssignment = NAVEEN_WHATSAPP;
    }
    targets.push(adminTarget);

  } else if (isWebsite) {
    const propertyType = (fullLead.property_type || '').toLowerCase();
    const locationPref = (fullLead.location_preference || '').toLowerCase();
    const landingPage = (fullLead.landing_page || '').toLowerCase();
    const leadType = (meta.lead_type || '').toLowerCase();
    const metaSourceType = ((meta.source_type as string) || '').toLowerCase();

    const isGoa = metaSourceType === 'goa_property' ||
                  leadType === 'goa_property' ||
                  locationPref.includes('goa') ||
                  landingPage.includes('/goa');
    const isCommercial = metaSourceType === 'commercial' ||
                         propertyType.includes('commercial');
    const isResidential = metaSourceType === 'residential' ||
                          metaSourceType === 'website_project' ||
                          propertyType.includes('villa') ||
                          propertyType.includes('flat') ||
                          propertyType.includes('apartment') ||
                          propertyType.includes('residential');

    if (isGoa) {
      targets.push({ name: 'Swetha', phone: '918367724368' });
    } else if (isCommercial) {
      targets.push({ name: 'Krishna', phone: '919666845340' });
    } else if (isResidential) {
      targets.push({ name: 'Srinivas', phone: '918520099841' });
    }
    targets.push(adminTarget);

  } else if (isMeta) {
    if (fullLead.assigned_to) {
      const { data: assignedAgent } = await supabase
        .from('crm_users')
        .select('full_name, whatsapp_number')
        .eq('id', fullLead.assigned_to)
        .single();
      if (assignedAgent?.whatsapp_number) {
        targets.push({
          name: assignedAgent.full_name || 'Team',
          phone: normalizePhone(assignedAgent.whatsapp_number),
        });
      }
    }
    targets.push(adminTarget);

  } else {
    targets.push(adminTarget);
  }

  // ── Template params builder ───────────────────────────────────────────────
  async function buildTemplateParams(
    lead: FullLead,
    agentName: string,
    source: '99acres' | 'meta' | 'website' | 'default'
  ): Promise<{ campaign: string; params: string[] }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leadMeta = (lead.attribution_metadata as Record<string, any>) || {};
    const crmLink = `https://www.westsiderealty.in/leads/${lead.id}`;
    const phone = normalizePhone(lead.phone || '');

    if (source === '99acres') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawPayload = (leadMeta.raw_payload as Record<string, any>) || {};
      const propertyName = rawPayload.property_name ||
                           rawPayload.project_name ||
                           lead.location_preference ||
                           'Not specified';
      const location = rawPayload.location ||
                       rawPayload.city ||
                       rawPayload.area ||
                       'Not specified';
      return {
        campaign: 'alert_99acres_v1',
        params: [agentName, lead.name || 'Unknown', phone, propertyName, location, crmLink],
      };
    }

    if (source === 'meta') {
      // Bug fix 1: prefer project_name stored directly in attribution_metadata
      // (set by metaLeadService when form routing matches); fall back to AI extraction
      const propertyInterest =
        (typeof leadMeta.project_name === 'string' && leadMeta.project_name.trim())
          ? leadMeta.project_name.trim()
          : await extractPropertyFromFormName(leadMeta.fb_form_name || '');

      let fieldData: Array<{ field_name: string; values: string[] }> = [];
      try {
        const rawFieldData = leadMeta.field_data;
        if (Array.isArray(rawFieldData)) {
          // Already in expected array format
          fieldData = rawFieldData;
        } else if (typeof rawFieldData === 'string') {
          const parsed = JSON.parse(rawFieldData);
          fieldData = Array.isArray(parsed) ? parsed : [];
        } else if (typeof rawFieldData === 'object' && rawFieldData !== null) {
          // Bug fix 2: field_data stored as Record<string,string> by buildFieldMap()
          fieldData = Object.entries(rawFieldData as Record<string, unknown>).map(
            ([field_name, val]) => ({ field_name, values: [String(val ?? '')] })
          );
        }
      } catch {
        fieldData = [];
      }
      const SKIP_FIELDS = new Set(['full_name', 'phone_number', 'email', 'phone', 'mobile',
                                    'first_name', 'last_name', 'email_address',
                                    'best_whatsapp_number_to_reach_you']);
      const formResponses = fieldData
        .filter(f => {
          const key = f.field_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          return !SKIP_FIELDS.has(key) && !SKIP_FIELDS.has(f.field_name.toLowerCase());
        })
        .map(f => {
          // Pretty-print field name: remove trailing ?, replace _ with space, title-case
          const label = f.field_name
            .replace(/\?+$/, '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
          return `${label}: ${f.values?.[0] || 'N/A'}`;
        })
        .slice(0, 3)
        .join(' | ') || 'Not specified';
      return {
        campaign: 'alert_meta_v1',
        params: [agentName, lead.name || 'Unknown', phone, propertyInterest, formResponses, crmLink],
      };
    }

    if (source === 'website') {
      const leadType = (leadMeta.lead_type || 'GENERAL_CONTACT')
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
      const projectName = (leadMeta.project_name as string) || null;
      const propertyInterest = projectName
        ? `${leadType}: ${projectName}`
        : lead.location_preference
          ? `${leadType}: ${lead.location_preference}`
          : leadType;
      const message = lead.notes || 'Not specified';
      const truncatedMessage = message.length > 100 ? message.substring(0, 100) + '...' : message;
      return {
        campaign: 'alert_website_v1',
        params: [agentName, lead.name || 'Unknown', phone, propertyInterest, truncatedMessage, crmLink],
      };
    }

    // Default fallback
    return {
      campaign: 'agent_new_lead_v2',
      params: [
        agentName,
        phone,
        fullLead.source_channel || 'Unknown',
        lead.location_preference || 'Not specified',
        'Not specified',
        crmLink,
      ],
    };
  }

  // ── AiSensy sender ────────────────────────────────────────────────────────
  async function sendAiSensyAlert(phone: string, campaignName: string, templateParams: string[]) {
    const res = await fetch('https://backend.aisensy.com/campaign/t1/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: process.env.AISENSY_API_KEY,
        campaignName,
        destination: phone,
        userName: process.env.AISENSY_USERNAME,
        templateParams,
        source: 'crm-lead-alert',
      }),
    });
    const rawText = await res.text();
    const success = res.ok || rawText.includes("Success");
    if (!success) {
      console.error("[AiSensy] Unexpected response:", rawText);
    }
    return success;
  }

  const alertSource = is99acres ? '99acres' : isMeta ? 'meta' : isWebsite ? 'website' : 'default';

  if (type === "INSERT") {
    for (const target of targets) {
      const { campaign, params } = await buildTemplateParams(fullLead, target.name, alertSource);
      await sendAiSensyAlert(target.phone, campaign, params);
    }

    // Assign 99acres lead to matched agent (Srinivas or Krishna only — not Praveen)
    if (is99acres && agentWhatsappForAssignment) {
      try {
        const digits = agentWhatsappForAssignment.replace(/\D/g, '');
        const withoutPrefix = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
        const withPrefix = digits.startsWith('91') ? digits : '91' + digits;

        let agentUser: { id: string } | null = null;
        for (const num of [agentWhatsappForAssignment, withoutPrefix, withPrefix]) {
          const { data } = await supabase
            .from('crm_users')
            .select('id')
            .eq('whatsapp_number', num)
            .maybeSingle();
          if (data) { agentUser = data; break; }
        }

        if (agentUser) {
          await supabase
            .from('crm_leads')
            .update({ assigned_to: agentUser.id, assignment_status: 'assigned' })
            .eq('id', record.id);
          fullLead.assigned_to = agentUser.id; // refresh so welcome message uses correct agent
          console.log('[PushDebug] 99acres auto-assignment success:', agentUser.id);
        } else {
          console.error('[PushDebug] 99acres auto-assignment FAILED: no crm_users match for', agentWhatsappForAssignment);
        }
      } catch (err) {
        console.error('[Push/new-lead] 99acres assignment failed:', err);
      }
    }

    // ── Lead welcome message ────────────────────────────────────────────────
    // Runs after agent alerts + assignment. Failures are isolated — never
    // affect the response returned to Supabase's webhook delivery.
    try {
      const formatLeadPhone = (phone: string) => {
        const digits = phone.replace(/\D/g, '');
        if (!digits.startsWith('91')) return '91' + digits;
        return digits;
      };
      const formatAgentPhone = (phone: string) => {
        const digits = phone.replace(/\D/g, '');
        if (digits.startsWith('91') && digits.length === 12) {
          return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
        }
        if (digits.length === 10) {
          return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
        }
        return `+${digits}`;
      };

      // Re-derive isGoa / isCommercial (same logic as routing block above)
      const _metaSourceType = ((meta.source_type as string) || '').toLowerCase();
      const _leadType        = (meta.lead_type || '').toLowerCase();
      const _locationPref    = (fullLead.location_preference || '').toLowerCase();
      const _landingPage     = (fullLead.landing_page || '').toLowerCase();
      const _propertyType    = (fullLead.property_type || '').toLowerCase();

      const isGoa        = _metaSourceType === 'goa_property' ||
                           _leadType === 'goa_property' ||
                           _locationPref.includes('goa') ||
                           _landingPage.includes('/goa');
      const isCommercial = _metaSourceType === 'commercial' ||
                           _propertyType.includes('commercial');

      let welcomeCampaign: string | null = null;
      if (is99acres)       welcomeCampaign = 'lead_welcome_99acres';
      else if (isGoa)      welcomeCampaign = 'lead_welcome_goa';
      else if (isCommercial) welcomeCampaign = 'lead_welcome_commercial';
      else if (isMeta)     welcomeCampaign = 'lead_welcome_meta_v1';
      else if (isWebsite)  welcomeCampaign = 'lead_welcome_residential';
      // else: manual / unknown source — skip

      if (welcomeCampaign && fullLead.phone && !fullLead.assigned_to) {
        console.log('[lead-welcome] Skipped — no agent assigned yet. Welcome will be sent on assignment (UPDATE path).');
      }

      if (welcomeCampaign && fullLead.phone && fullLead.assigned_to) {
        // Resolve assigned agent
        let welcomeAgent: { full_name: string | null; whatsapp_number: string | null } | null = null;
        if (fullLead.assigned_to) {
          const { data } = await supabase
            .from('crm_users')
            .select('full_name, whatsapp_number')
            .eq('id', fullLead.assigned_to)
            .maybeSingle();
          welcomeAgent = data;
        }

        // Null-safe params — never pass empty/null/undefined to AiSensy
        const welcomeLeadName  = fullLead.name?.trim() || 'there';
        const welcomeAgentName = welcomeAgent?.full_name?.trim() || 'our advisor';
        const welcomeAgentPhone = welcomeAgent?.whatsapp_number
          ? formatAgentPhone(welcomeAgent.whatsapp_number)
          : '+91 83677 24368';

        const leadPhone = formatLeadPhone(fullLead.phone);

        // Positional params per template
        let templateParams: string[];
        if (welcomeCampaign === 'lead_welcome_99acres') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawPayload = (meta.raw_payload as Record<string, any>) || {};
          const welcomeProjectName = (
            rawPayload.property_name ||
            rawPayload.project_name ||
            fullLead.location_preference ||
            ''
          ).trim() || 'the property';
          templateParams = [welcomeLeadName, welcomeProjectName, welcomeAgentName, welcomeAgentPhone];
        } else {
          templateParams = [welcomeLeadName, welcomeAgentName, welcomeAgentPhone];
        }

        console.log('[lead-welcome] params being sent:', {
          campaign: welcomeCampaign,
          phone: leadPhone,
          params: templateParams,
        });

        // Send welcome WhatsApp
        await sendAiSensyAlert(leadPhone, welcomeCampaign, templateParams);
        console.log(`[Push/new-lead] Welcome sent — campaign=${welcomeCampaign} phone=${leadPhone}`);

        // Log to crm_whatsapp_messages (visible in WhatsApp Logs tab)
        const { error: waLogErr } = await supabase
          .from('crm_whatsapp_messages')
          .insert({
            lead_id:       record.id,
            message:       `Template: ${welcomeCampaign}`,
            content:       welcomeCampaign,
            template_name: welcomeCampaign,
            direction:     'outbound',
            status:        'sent',
            phone:         leadPhone,
          });
        if (waLogErr) console.error('[lead-welcome] crm_whatsapp_messages insert failed:', waLogErr);

        // Find or create conversation (crm_messages is a view — do not insert into it)
        const { data: existingConv, error: convFetchErr } = await supabase
          .from('crm_conversations')
          .select('id')
          .eq('lead_id', record.id)
          .eq('channel', 'whatsapp')
          .maybeSingle();
        if (convFetchErr) console.error('[lead-welcome] crm_conversations fetch failed:', convFetchErr);

        let conversationId = existingConv?.id as string | undefined;

        // crm_conversations is a VIEW — cannot insert directly; update only if it already exists
        if (conversationId) {
          const { error: convUpdateErr } = await supabase
            .from('crm_conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conversationId);
          if (convUpdateErr) console.error('[lead-welcome] crm_conversations update failed:', convUpdateErr);
        }
      }
    } catch (err) {
      console.error('[Push/new-lead] Lead welcome message failed:', err);
    }

    return NextResponse.json({ success: true, reason: "insert_ok" });
  }

  if (type === "UPDATE") {
    const wasUnassigned = !oldRecord?.assigned_to;
    const nowAssigned = !!record.assigned_to;

    if (!wasUnassigned || !nowAssigned) {
      return NextResponse.json({ skipped: true, reason: "assigned_to_unchanged" });
    }

    // Lead just got assigned — alert the newly assigned agent only
    if (record.assigned_to && record.assigned_to !== PRAVEEN_ID) {
      const { data: assignedAgent } = await supabase
        .from('crm_users')
        .select('full_name, whatsapp_number')
        .eq('id', record.assigned_to)
        .single();
      if (assignedAgent?.whatsapp_number) {
        const { campaign, params } = await buildTemplateParams(
          fullLead,
          assignedAgent.full_name || 'Team',
          alertSource
        );
        await sendAiSensyAlert(normalizePhone(assignedAgent.whatsapp_number), campaign, params);

        // Send lead welcome message now that we know the assigned agent
        try {
          const formatLeadPhone = (phone: string) => {
            const digits = phone.replace(/\D/g, '');
            if (!digits.startsWith('91')) return '91' + digits;
            return digits;
          };
          const formatAgentPhone = (phone: string) => {
            const digits = phone.replace(/\D/g, '');
            if (digits.startsWith('91') && digits.length === 12) {
              return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
            }
            if (digits.length === 10) {
              return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
            }
            return `+${digits}`;
          };

          if (fullLead.phone) {
            const leadPhone = formatLeadPhone(fullLead.phone);
            const metaWelcomeParams = [
              fullLead.name?.trim() || 'there',
              assignedAgent.full_name?.trim() || 'our advisor',
              formatAgentPhone(assignedAgent.whatsapp_number),
            ];

            console.log('[lead-welcome] params being sent:', {
              campaign: 'lead_welcome_meta_v1',
              phone: leadPhone,
              params: metaWelcomeParams,
            });

            await sendAiSensyAlert(leadPhone, 'lead_welcome_meta_v1', metaWelcomeParams);

            // Log to crm_whatsapp_messages
            const { error: waLogErr } = await supabase
              .from('crm_whatsapp_messages')
              .insert({
                lead_id:       record.id,
                message:       'Template: lead_welcome_meta_v1',
                content:       'lead_welcome_meta_v1',
                template_name: 'lead_welcome_meta_v1',
                direction:     'outbound',
                status:        'sent',
                phone:         leadPhone,
              });
            if (waLogErr) console.error('[lead-welcome] crm_whatsapp_messages insert failed:', waLogErr);

            // Find or create conversation (crm_messages is a view — do not insert into it)
            const { data: existingConv, error: convFetchErr } = await supabase
              .from('crm_conversations')
              .select('id')
              .eq('lead_id', record.id)
              .eq('channel', 'whatsapp')
              .maybeSingle();
            if (convFetchErr) console.error('[lead-welcome] crm_conversations fetch failed:', convFetchErr);

            // crm_conversations is a VIEW — cannot insert directly; update only if it already exists
            const conversationId = existingConv?.id as string | undefined;
            if (conversationId) {
              const { error: convUpdateErr } = await supabase
                .from('crm_conversations')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', conversationId);
              if (convUpdateErr) console.error('[lead-welcome] crm_conversations update failed:', convUpdateErr);
            }

            console.log('[lead-welcome] Meta welcome sent:', leadPhone, assignedAgent.full_name);
          }
        } catch (err) {
          console.error('[lead-welcome] Meta welcome failed:', err);
        }
      }
    }
    return NextResponse.json({ success: true, reason: "update_ok" });
  }

  return NextResponse.json({ skipped: true, reason: "unknown_type" });
}
