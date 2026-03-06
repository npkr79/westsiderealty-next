# CRM Lead Pipeline — Complete Source Code

Generated: 2026-03-06

---

## src/app/actions/submit-lead.ts

```typescript
"use server";

import { createServiceClient } from "@/lib/supabase/serviceClient";
import { routeLeadByOwnership } from "@/services/crmLeadRoutingService";
import { extractLeadAttribution } from "@/lib/crm/leadAttribution";
import { mapBehaviorToLead } from "@/services/behaviorLeadMappingService";
import { toBudgetNumber } from "@/lib/crm/budget";

export type LeadType =
  | "PROJECT_INTEREST"
  | "SELLER_VALUATION"
  | "BUYER_REQUIREMENT"
  | "LANDOWNER_SHARE"
  | "GENERAL_CONTACT"
  | "GOA_PROPERTY"
  | "DEVELOPER_INQUIRY";

export interface SubmitLeadData {
  name: string;
  phone: string;
  email?: string | null;
  type: LeadType;
  source_page: string;
  details?: Record<string, unknown>;
}

export interface SubmitLeadResponse {
  success: boolean;
  error?: string;
}

// Module-level cache for the Website source_id (persists across warm invocations)
let _websiteSourceId: string | null | undefined = undefined;

async function getWebsiteSourceId(): Promise<string | null> {
  if (_websiteSourceId !== undefined) return _websiteSourceId;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("crm_lead_sources")
    .select("id")
    .ilike("name", "website%")
    .limit(1)
    .maybeSingle();

  if (data?.id) {
    _websiteSourceId = String(data.id);
    return _websiteSourceId;
  }

  // Create "Website" source if it doesn't exist
  const { data: created } = await supabase
    .from("crm_lead_sources")
    .insert({ name: "Website" })
    .select("id")
    .single();

  _websiteSourceId = created?.id ? String(created.id) : null;
  return _websiteSourceId;
}

function buildNotes(details: Record<string, unknown>): string | null {
  // Explicit notes/message fields take priority
  if (typeof details.notes === "string" && details.notes.trim()) return details.notes.trim();
  if (typeof details.interest_details === "string" && details.interest_details.trim()) return details.interest_details.trim();

  // Build from contextual fields
  const parts: string[] = [];
  if (typeof details.message === "string" && details.message.trim()) parts.push(details.message.trim());
  if (details.projectName) parts.push(`Interested in ${details.projectName}`);
  if (details.buyerIntent) parts.push(`Intent: ${details.buyerIntent}`);
  if (details.institution) parts.push(`Institution: ${details.institution}`);
  if (details.ticketSizeInrCrore) parts.push(`Ticket size: ₹${details.ticketSizeInrCrore} Cr`);
  if (details.investorType) parts.push(`Investor type: ${details.investorType}`);
  if (details.additionalDetails) parts.push(String(details.additionalDetails));

  return parts.length > 0 ? parts.join(". ") : null;
}

/**
 * Master server action — inserts into crm_leads only (universal leads table).
 * Column reference: id, name, phone, email, source_id, source_type, source_channel,
 * budget, budget_min, budget_max, location_preference, property_type, buyer_type,
 * timeline, risk_appetite, wealth_bracket, investment_style, investor_type,
 * notes, status, assigned_to, assignment_status, utm_*, gclid, fb_lead_id,
 * landing_page, stage_id, lead_score, priority, attribution_metadata, campaign_id,
 * referral_source, meta_leadgen_id, source_channel
 */
export async function submitLead(formData: SubmitLeadData): Promise<SubmitLeadResponse> {
  try {
    if (!formData.name || !formData.phone) {
      return { success: false, error: "Name and phone number are required" };
    }

    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return { success: false, error: "Please enter a valid phone number (at least 10 digits)" };
    }

    const normalizedPhone = phoneDigits.slice(0, 15);
    const serviceClient = createServiceClient();
    const details = formData.details || {};
    const attribution = extractLeadAttribution({ sourcePage: formData.source_page, details });

    // Look up website source_id (UUID FK to crm_lead_sources)
    const websiteSourceId = await getWebsiteSourceId().catch(() => null);

    // Build notes with context from all detail fields
    const notesValue = buildNotes(details);

    // Merge attribution metadata with extra form context
    const attributionMeta: Record<string, unknown> = Object.assign(
      {},
      attribution.attribution_metadata,
      { lead_type: formData.type },
      details.segment ? { segment: details.segment } : {},
      details.institution ? { institution: details.institution } : {},
      details.ticketSizeInrCrore ? { ticket_size_inr_crore: details.ticketSizeInrCrore } : {},
      details.configuration ? { configuration: details.configuration } : {},
      details.expectedPrice ? { expected_price: details.expectedPrice } : {},
      details.qualificationStep ? { qualification_step: details.qualificationStep } : {},
      details.leadPersona ? { lead_persona: details.leadPersona } : {},
      details.triggerContext ? { trigger_context: details.triggerContext } : {},
      details.budgetBand ? { budget_band: details.budgetBand } : {},
    );

    // Build payload — only confirmed crm_leads columns
    const candidate: Record<string, unknown> = {
      name: formData.name.trim(),
      phone: normalizedPhone,
      email: formData.email?.trim() || null,

      // Source tracking
      source_id: websiteSourceId,
      source_type: attribution.source_type || null,
      source_channel: attribution.source_name || formData.type,
      landing_page: attribution.landing_page_url || formData.source_page || null,

      // Notes
      notes: notesValue,

      // Budget
      budget_min: toBudgetNumber(details.budget_min ?? details.budget),
      budget_max: toBudgetNumber(details.budget_max ?? details.budget),
      budget:
        typeof details.budgetRange === "string" ? details.budgetRange :
        typeof details.budgetBand === "string" ? details.budgetBand :
        null,

      // Buyer profile
      location_preference:
        (typeof details.location_preference === "string" ? details.location_preference : null) ||
        (typeof details.location === "string" ? details.location : null),
      property_type:
        typeof details.property_type === "string" ? details.property_type :
        Array.isArray(details.propertyTypes) ? (details.propertyTypes as string[]).join(", ") :
        null,
      buyer_type:
        typeof details.buyer_type === "string" ? details.buyer_type :
        typeof details.purpose === "string" ? details.purpose :
        null,
      timeline:
        typeof details.timeline === "string" ? details.timeline :
        typeof details.purchaseTimeline === "string" ? details.purchaseTimeline :
        null,
      wealth_bracket: typeof details.wealth_bracket === "string" ? details.wealth_bracket : null,
      investment_style: typeof details.investment_style === "string" ? details.investment_style : null,
      risk_appetite: typeof details.risk_appetite === "string" ? details.risk_appetite : null,

      // Institutional-specific
      investor_type:
        typeof details.investorType === "string" ? details.investorType :
        typeof details.investor_type === "string" ? details.investor_type :
        null,

      // UTM / attribution
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_term: attribution.utm_term,
      utm_content: attribution.utm_content,
      gclid: attribution.gclid,
      fb_lead_id: attribution.fbclid,
      attribution_metadata: attributionMeta,
    };

    // Strip null/undefined — prevents schema cache errors for missing optional fields
    const payload = Object.fromEntries(
      Object.entries(candidate).filter(([, v]) => v !== null && v !== undefined)
    );

    console.log("Inserting crm_lead:", {
      ...payload,
      phone: "***",
      email: payload.email ? "***" : undefined,
    });

    const { data: inserted, error: insertError } = await serviceClient
      .from("crm_leads")
      .insert(payload)
      .select("id")
      .single();

    if (insertError) {
      console.error("crm_leads insert error:", {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      });
      return {
        success: false,
        error: insertError.message || "Failed to submit. Please try again.",
      };
    }

    if (inserted?.id) {
      // Post-save actions are non-critical — never let them fail the lead capture
      try {
        await mapBehaviorToLead(String(inserted.id), normalizedPhone);
      } catch (e) {
        console.warn("[submitLead] mapBehaviorToLead failed (non-critical):", e instanceof Error ? e.message : e);
      }
      try {
        await routeLeadByOwnership({
          leadId: String(inserted.id),
          sourceType: attribution.source_type,
          sourceName: attribution.source_name,
          projectId: null,
        });
      } catch (e) {
        console.warn("[submitLead] routeLeadByOwnership failed (non-critical):", e instanceof Error ? e.message : e);
      }
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Unexpected error in submitLead:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
    };
  }
}
```

---

## src/services/crmLeadRoutingService.ts

```typescript
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { onAssignmentAutomation } from "@/services/whatsappAutomationService";
import { sanitizeLeadPayload } from "@/lib/crm/sanitizeLeadPayload";

interface RouteLeadInput {
  leadId: string;
  sourceType: string | null | undefined;
  sourceName: string | null | undefined;
  projectId: string | null | undefined;
}

interface ManualAssignInput {
  leadId: string;
  agentId: string;
  note?: string | null;
  assignedBy: string;
}

interface RoutingResult {
  assigned: boolean;
  agentId: string | null;
  reason: string;
}

const normalize = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

async function insertAssignmentLog(leadId: string, agentId: string, note: string | null, assignedBy: string | null) {
  const supabase = createServiceClient();

  const payloadCandidates: Array<Record<string, unknown>> = [
    {
      lead_id: leadId,
      agent_id: agentId,
      assignment_note: note,
      assignment_type: "manual_or_auto",
      assigned_by: assignedBy,
    },
    {
      lead_id: leadId,
      agent_id: agentId,
      note,
      assigned_by: assignedBy,
    },
    {
      lead_id: leadId,
      agent_id: agentId,
    },
  ];

  for (const payload of payloadCandidates) {
    const { error } = await supabase.from("crm_lead_assignments").insert(payload);
    if (!error) return;
  }
}

async function insertAssignmentActivity(leadId: string, agentId: string, note: string | null, assignedBy: string | null) {
  const supabase = createServiceClient();
  const detail = note ? `Lead assigned to agent (${agentId}). Note: ${note}` : `Lead assigned to agent (${agentId}).`;
  const payloadCandidates: Array<Record<string, unknown>> = [
    {
      lead_id: leadId,
      activity_type: "assignment_change",
      notes: detail,
      created_by: assignedBy,
      metadata: { agent_id: agentId, note, assigned_by: assignedBy },
    },
    {
      lead_id: leadId,
      activity_type: "assignment_change",
      notes: detail,
      created_by: assignedBy,
    },
    {
      lead_id: leadId,
      activity_type: "assignment_change",
      notes: detail,
    },
  ];
  for (const payload of payloadCandidates) {
    const { error } = await supabase.from("crm_lead_activities").insert(payload);
    if (!error) return;
  }
}

export async function routeLeadByOwnership(input: RouteLeadInput): Promise<RoutingResult> {
  const supabase = createServiceClient();

  const sourceType = normalize(input.sourceType);
  const sourceName = normalize(input.sourceName);
  const projectId = normalize(input.projectId);

  if (!sourceType || !sourceName) {
    const pendingPatch = sanitizeLeadPayload({ assignment_status: "pending" });
    if (Object.keys(pendingPatch).length > 0) {
      await supabase
        .from("crm_leads")
        .update(pendingPatch)
        .eq("id", input.leadId);
    }
    return { assigned: false, agentId: null, reason: "missing_source_keys" };
  }

  const { data: ownership, error: ownershipError } = await supabase
    .from("crm_source_ownership")
    .select("agent_id, source_type, source_name, project_id")
    .eq("source_type", sourceType)
    .eq("source_name", sourceName)
    .or(`project_id.eq.${projectId ?? ""},project_id.is.null`)
    .order("project_id", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (ownershipError || !ownership?.agent_id) {
    const pendingPatch = sanitizeLeadPayload({ assignment_status: "pending" });
    if (Object.keys(pendingPatch).length > 0) {
      await supabase
        .from("crm_leads")
        .update(pendingPatch)
        .eq("id", input.leadId);
    }
    return { assigned: false, agentId: null, reason: "no_ownership_match" };
  }

  const agentId = String(ownership.agent_id);
  const assignPatch = sanitizeLeadPayload({
    assigned_to: agentId,
    assignment_status: "assigned",
  });
  const { error: updateError } = await supabase
    .from("crm_leads")
    .update(assignPatch)
    .eq("id", input.leadId);

  if (updateError) {
    return { assigned: false, agentId: null, reason: "lead_update_failed" };
  }

  await insertAssignmentLog(input.leadId, agentId, "Auto-assigned via source ownership", null);
  await insertAssignmentActivity(input.leadId, agentId, "Auto-assigned via source ownership", null);
  const { data: lead } = await supabase.from("crm_leads").select("id,phone").eq("id", input.leadId).maybeSingle();
  if (lead?.id) {
    await onAssignmentAutomation({
      leadId: String(lead.id),
      leadPhone: lead.phone,
      sentBy: "automation-bot",
    });
  }
  return { assigned: true, agentId, reason: "ownership_match" };
}

export async function assignLeadManually(input: ManualAssignInput): Promise<RoutingResult> {
  const supabase = createServiceClient();
  const note = normalize(input.note);

  const manualAssignPatch = sanitizeLeadPayload({
    assigned_to: input.agentId,
    assignment_status: "assigned",
  });
  const { error } = await supabase
    .from("crm_leads")
    .update(manualAssignPatch)
    .eq("id", input.leadId);

  if (error) {
    return { assigned: false, agentId: null, reason: "lead_update_failed" };
  }

  await insertAssignmentLog(input.leadId, input.agentId, note, input.assignedBy);
  await insertAssignmentActivity(input.leadId, input.agentId, note, input.assignedBy);
  const { data: lead } = await supabase.from("crm_leads").select("id,phone").eq("id", input.leadId).maybeSingle();
  if (lead?.id) {
    await onAssignmentAutomation({
      leadId: String(lead.id),
      leadPhone: lead.phone,
      sentBy: input.assignedBy,
    });
  }
  return { assigned: true, agentId: input.agentId, reason: "manual_assignment" };
}

export async function reconcilePendingLeadRouting(limit = 100): Promise<{ processed: number; assigned: number }> {
  const supabase = createServiceClient();
  // Select only columns that exist in crm_leads schema
  // source_channel stores the routing source name (was previously source_name)
  const { data: pendingLeads } = await supabase
    .from("crm_leads")
    .select("id,source_type,source_channel")
    .eq("assignment_status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  let assigned = 0;
  let processed = 0;
  for (const lead of pendingLeads || []) {
    processed += 1;
    const result = await routeLeadByOwnership({
      leadId: String(lead.id),
      sourceType: lead.source_type,
      sourceName: lead.source_channel,
      projectId: null,
    });
    if (result.assigned) assigned += 1;
  }
  return { processed, assigned };
}
```

---

## src/services/whatsappCloudService.ts

```typescript
import { createServiceClient } from "@/lib/supabase/serviceClient";

const GRAPH_BASE_URL = "https://graph.facebook.com/v20.0";

interface EnsureConversationInput {
  leadId: string;
  phone: string;
}

interface SendTextInput {
  leadId: string;
  phone: string;
  message: string;
  sentBy: string;
}

interface SendTemplateInput {
  leadId: string;
  phone: string;
  templateName: string;
  languageCode?: string;
  sentBy: string;
  automationKey?: string | null;
}

const sanitizePhone = (phone: string): string => phone.replace(/[^\d]/g, "");

async function touchInstitutionalConversationByLead(leadId: string, phone: string) {
  const supabase = createServiceClient();
  const normalizedPhone = sanitizePhone(phone);
  const { data: existing } = await supabase
    .from("crm_whatsapp_conversations")
    .select("id")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("crm_whatsapp_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return String(existing.id);
  }

  const payloadCandidates = [
    {
      lead_id: leadId,
      recipient_phone: normalizedPhone || null,
      status: "open",
      last_message_at: new Date().toISOString(),
    },
    {
      lead_id: leadId,
      recipient_phone: normalizedPhone || null,
      last_message_at: new Date().toISOString(),
    },
  ];
  for (const payload of payloadCandidates) {
    const { data, error } = await supabase.from("crm_whatsapp_conversations").insert(payload).select("id").maybeSingle();
    if (!error && data?.id) return String(data.id);
  }
  return null;
}

async function mirrorInboundToInstitutional(params: {
  leadId: string;
  conversationId: string | null;
  providerMessageId: string;
  content: string | null;
}) {
  const supabase = createServiceClient();
  const payloadCandidates = [
    {
      conversation_id: params.conversationId,
      lead_id: params.leadId,
      direction: "inbound",
      message_type: "text",
      content: params.content,
      provider_message_id: params.providerMessageId,
      status: "received",
    },
    {
      whatsapp_conversation_id: params.conversationId,
      lead_id: params.leadId,
      direction: "inbound",
      message_type: "text",
      body: params.content,
      provider_message_id: params.providerMessageId,
      status: "received",
    },
  ];
  for (const payload of payloadCandidates) {
    const { error } = await supabase.from("crm_whatsapp_messages").insert(payload);
    if (!error) break;
  }
}

async function updateInstitutionalStatusByProviderId(providerMessageId: string, status: string) {
  const supabase = createServiceClient();
  await supabase
    .from("crm_whatsapp_messages")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("provider_message_id", providerMessageId);
}

const getWhatsappEnv = () => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error("WhatsApp Cloud API is not configured.");
  }
  return { token, phoneNumberId };
};

export async function ensureWhatsAppConversation(input: EnsureConversationInput) {
  const supabase = createServiceClient();
  const normalizedPhone = sanitizePhone(input.phone);
  if (!normalizedPhone) throw new Error("Lead phone is required for WhatsApp conversation.");

  const { data: existing, error: findError } = await supabase
    .from("crm_conversations")
    .select("id,lead_id,channel,recipient_phone")
    .eq("lead_id", input.leadId)
    .eq("channel", "whatsapp")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (findError) throw new Error(findError.message || "Unable to load conversations.");
  if (existing?.id) return existing.id as string;

  const { data: created, error: createError } = await supabase
    .from("crm_conversations")
    .insert({
      lead_id: input.leadId,
      channel: "whatsapp",
      recipient_phone: normalizedPhone,
      status: "open",
    })
    .select("id")
    .single();
  if (createError || !created?.id) {
    throw new Error(createError?.message || "Unable to create conversation.");
  }
  return created.id as string;
}

async function persistOutboundMessage(params: {
  conversationId: string;
  leadId: string;
  messageType: "text" | "template";
  content: string | null;
  templateName?: string | null;
  sentBy: string;
}) {
  const supabase = createServiceClient();
  // Encode template name into content as fallback when template_name column is absent
  const contentWithTemplate = params.content ?? (params.templateName ? `template:${params.templateName}` : null);

  // Try multiple payload shapes to handle varying crm_messages / crm_whatsapp_messages schemas
  const candidates = [
    // Full schema with template_name
    {
      conversation_id: params.conversationId,
      lead_id: params.leadId,
      direction: "outbound",
      message_type: params.messageType,
      content: params.content,
      template_name: params.templateName ?? null,
      status: "queued",
      sent_by: params.sentBy,
    },
    // Without template_name (crm_whatsapp_messages may not have that column)
    {
      conversation_id: params.conversationId,
      lead_id: params.leadId,
      direction: "outbound",
      message_type: params.messageType,
      content: contentWithTemplate,
      status: "queued",
      sent_by: params.sentBy,
    },
    // body instead of content variant
    {
      conversation_id: params.conversationId,
      lead_id: params.leadId,
      direction: "outbound",
      message_type: params.messageType,
      body: contentWithTemplate,
      status: "queued",
    },
    // Minimal fallback
    {
      lead_id: params.leadId,
      direction: "outbound",
      message_type: params.messageType,
      content: contentWithTemplate,
      status: "queued",
    },
  ];

  for (const candidate of candidates) {
    const { data, error } = await supabase
      .from("crm_messages")
      .insert(candidate)
      .select("id")
      .maybeSingle();
    if (!error && data?.id) return String(data.id);
    // Only retry on column-not-found errors; hard-fail on other errors
    if (error && !/column .* does not exist|schema cache/i.test(error.message || "")) {
      throw new Error(error.message || "Unable to persist outbound message.");
    }
  }
  throw new Error("Unable to persist outbound message after all candidates.");
}

async function updateMessageResult(messageId: string, payload: { status: string; provider_message_id?: string | null; error_message?: string | null }) {
  const supabase = createServiceClient();
  await supabase
    .from("crm_messages")
    .update({
      status: payload.status,
      provider_message_id: payload.provider_message_id ?? null,
      error_message: payload.error_message ?? null,
    })
    .eq("id", messageId);
}

async function touchConversation(conversationId: string) {
  const supabase = createServiceClient();
  await supabase
    .from("crm_conversations")
    .update({
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);
}

async function sendToWhatsapp(payload: Record<string, unknown>) {
  const { token, phoneNumberId } = getWhatsappEnv();
  const response = await fetch(`${GRAPH_BASE_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = body?.error?.message || "WhatsApp send failed.";
    throw new Error(reason);
  }
  return body;
}

export async function sendWhatsAppText(input: SendTextInput) {
  const conversationId = await ensureWhatsAppConversation({ leadId: input.leadId, phone: input.phone });
  const messageId = await persistOutboundMessage({
    conversationId,
    leadId: input.leadId,
    messageType: "text",
    content: input.message,
    sentBy: input.sentBy,
  });

  try {
    const body = await sendToWhatsapp({
      messaging_product: "whatsapp",
      to: sanitizePhone(input.phone),
      type: "text",
      text: { body: input.message },
    });
    const providerMessageId = body?.messages?.[0]?.id ? String(body.messages[0].id) : null;
    await updateMessageResult(messageId, { status: "sent", provider_message_id: providerMessageId });
    await touchConversation(conversationId);
    await touchInstitutionalConversationByLead(input.leadId, input.phone);
    return { success: true, messageId, providerMessageId };
  } catch (error: unknown) {
    await updateMessageResult(messageId, {
      status: "failed",
      error_message: error instanceof Error ? error.message : "Failed to send text.",
    });
    return {
      success: false,
      messageId,
      error: error instanceof Error ? error.message : "Failed to send text.",
    };
  }
}

export async function sendWhatsAppTemplate(input: SendTemplateInput) {
  const conversationId = await ensureWhatsAppConversation({ leadId: input.leadId, phone: input.phone });
  const messageId = await persistOutboundMessage({
    conversationId,
    leadId: input.leadId,
    messageType: "template",
    content: input.automationKey ? `automation:${input.automationKey}` : null,
    templateName: input.templateName,
    sentBy: input.sentBy,
  });

  try {
    const body = await sendToWhatsapp({
      messaging_product: "whatsapp",
      to: sanitizePhone(input.phone),
      type: "template",
      template: {
        name: input.templateName,
        language: { code: input.languageCode || "en" },
      },
    });
    const providerMessageId = body?.messages?.[0]?.id ? String(body.messages[0].id) : null;
    await updateMessageResult(messageId, { status: "sent", provider_message_id: providerMessageId });
    await touchConversation(conversationId);
    await touchInstitutionalConversationByLead(input.leadId, input.phone);
    return { success: true, messageId, providerMessageId };
  } catch (error: unknown) {
    await updateMessageResult(messageId, {
      status: "failed",
      error_message: error instanceof Error ? error.message : "Failed to send template.",
    });
    return {
      success: false,
      messageId,
      error: error instanceof Error ? error.message : "Failed to send template.",
    };
  }
}

export async function upsertInboundWhatsAppMessage(payload: {
  providerMessageId: string;
  from: string;
  content: string | null;
}) {
  const supabase = createServiceClient();
  const normalizedPhone = sanitizePhone(payload.from);
  const { data: conversation } = await supabase
    .from("crm_conversations")
    .select("id,lead_id")
    .eq("channel", "whatsapp")
    .eq("recipient_phone", normalizedPhone)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!conversation?.id || !conversation?.lead_id) {
    return { success: false, error: "Conversation not found for inbound message." };
  }

  const { error } = await supabase.from("crm_messages").insert({
    conversation_id: conversation.id,
    lead_id: conversation.lead_id,
    direction: "inbound",
    message_type: "text",
    content: payload.content,
    status: "received",
    provider_message_id: payload.providerMessageId,
  });
  if (error) return { success: false, error: error.message };
  await touchConversation(conversation.id);
  const institutionalConversationId = await touchInstitutionalConversationByLead(String(conversation.lead_id), normalizedPhone);
  await mirrorInboundToInstitutional({
    leadId: String(conversation.lead_id),
    conversationId: institutionalConversationId,
    providerMessageId: payload.providerMessageId,
    content: payload.content,
  });
  return { success: true };
}

export async function updateOutboundStatusByProviderId(providerMessageId: string, status: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("crm_messages")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("provider_message_id", providerMessageId);
  await updateInstitutionalStatusByProviderId(providerMessageId, status);
  return { success: !error, error: error?.message };
}
```

---

## src/services/journeyExecutionService.ts

```typescript
import { createServiceClient } from "@/lib/supabase/serviceClient";

type QueueStatus = "pending" | "processing" | "completed" | "failed";
type ActionType = "whatsapp" | "task" | "reminder";

interface JourneyQueueRow {
  id: string;
  lead_id: string;
  journey_step_id: string | null;
  step_id: string | null;
  status: string | null;
  scheduled_at: string | null;
  attempts: number | null;
  metadata: Record<string, unknown> | null;
}

interface JourneyStepRow {
  id: string;
  action_type: string;
  title: string | null;
  message: string | null;
  payload: Record<string, unknown> | null;
}

const MAX_RETRY_ATTEMPTS = 2;

const normalizeActionType = (value: string | null | undefined): ActionType | null => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (normalized === "whatsapp") return "whatsapp";
  if (normalized === "task") return "task";
  if (normalized === "reminder") return "reminder";
  return null;
};

const normalizePriority = (value: string | null | undefined): "hot" | "warm" | "cold" => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (normalized === "hot" || normalized === "high" || normalized === "p1") return "hot";
  if (normalized === "warm" || normalized === "medium" || normalized === "p2") return "warm";
  return "cold";
};

const toRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

const getAttempts = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
};

const withRetries = async <T>(fn: () => Promise<T>, retries = MAX_RETRY_ATTEMPTS): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
      }
    }
  }
  throw lastError;
};

async function insertActivityLog(params: {
  queueId: string;
  leadId: string;
  status: QueueStatus;
  actionType: string;
  message: string;
  attempts: number;
  metadata?: Record<string, unknown> | null;
}) {
  const supabase = createServiceClient();
  const payload = {
    queue_id: params.queueId,
    lead_id: params.leadId,
    action_type: params.actionType,
    status: params.status,
    message: params.message,
    attempts: params.attempts,
    metadata: params.metadata ?? null,
    created_at: new Date().toISOString(),
  };
  const candidates = [
    payload,
    {
      lead_id: params.leadId,
      action_type: params.actionType,
      status: params.status,
      message: params.message,
      attempts: params.attempts,
      metadata: params.metadata ?? null,
    },
    {
      lead_id: params.leadId,
      notes: JSON.stringify(payload),
      type: "journey_execution",
    },
  ];
  for (const candidate of candidates) {
    const { error } = await supabase.from("crm_activity_log").insert(candidate);
    if (!error) return;
  }
}

async function fetchPendingQueue(limit: number): Promise<JourneyQueueRow[]> {
  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();
  const selectVariants = [
    "id,lead_id,journey_step_id,status,scheduled_at,attempts,metadata",
    "id,lead_id,step_id,status,scheduled_at,attempts,metadata",
  ];
  for (const selectClause of selectVariants) {
    const { data, error } = await supabase
      .from("crm_journey_queue")
      .select(selectClause)
      .eq("status", "pending")
      .lte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(limit);
    if (!error) {
      return ((data as Array<Record<string, unknown>>) || []).map((row) => ({
        id: String(row.id || ""),
        lead_id: String(row.lead_id || ""),
        journey_step_id: typeof row.journey_step_id === "string" ? row.journey_step_id : null,
        step_id: typeof row.step_id === "string" ? row.step_id : null,
        status: typeof row.status === "string" ? row.status : null,
        scheduled_at: typeof row.scheduled_at === "string" ? row.scheduled_at : null,
        attempts: getAttempts(row.attempts),
        metadata: toRecord(row.metadata),
      }));
    }
    const message = error.message || "";
    if (!/column .* does not exist/i.test(message)) {
      throw new Error(message || "Failed to fetch journey queue.");
    }
  }
  return [];
}

async function fetchJourneyStep(stepId: string): Promise<JourneyStepRow | null> {
  const supabase = createServiceClient();
  const selectVariants = [
    "id,action_type,title,message,payload",
    "id,action_type,name,description,metadata",
  ];
  for (const selectClause of selectVariants) {
    const { data, error } = await supabase.from("crm_journey_steps").select(selectClause).eq("id", stepId).maybeSingle();
    if (!error) {
      const row = (data as Record<string, unknown> | null) || null;
      if (!row?.id) return null;
      return {
        id: String(row.id),
        action_type: typeof row.action_type === "string" ? row.action_type : "",
        title: typeof row.title === "string" ? row.title : typeof row.name === "string" ? row.name : null,
        message: typeof row.message === "string" ? row.message : typeof row.description === "string" ? row.description : null,
        payload: toRecord(row.payload) || toRecord(row.metadata),
      };
    }
    const message = error.message || "";
    if (!/column .* does not exist/i.test(message)) {
      throw new Error(message || "Failed to load journey step.");
    }
  }
  return null;
}

async function claimQueueRow(queueId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("crm_journey_queue")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", queueId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  return !error && Boolean(data?.id);
}

async function updateQueueResult(input: {
  queueId: string;
  status: QueueStatus;
  attempts: number;
  errorMessage?: string | null;
}) {
  const supabase = createServiceClient();
  const payloadCandidates = [
    {
      status: input.status,
      attempts: input.attempts,
      error_message: input.errorMessage || null,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      status: input.status,
      attempts: input.attempts,
      last_error: input.errorMessage || null,
      executed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      status: input.status,
      attempts: input.attempts,
      updated_at: new Date().toISOString(),
    },
  ];
  for (const payload of payloadCandidates) {
    const { error } = await supabase.from("crm_journey_queue").update(payload).eq("id", input.queueId);
    if (!error) return;
  }
}

async function isLeadCold(leadId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const selectVariants = ["id,priority", "id,lead_priority"];
  for (const selectClause of selectVariants) {
    const { data, error } = await supabase.from("crm_leads").select(selectClause).eq("id", leadId).maybeSingle();
    if (!error) {
      const row = (data as Record<string, unknown> | null) || null;
      const priority =
        typeof row?.priority === "string"
          ? row.priority
          : typeof row?.lead_priority === "string"
            ? row.lead_priority
            : null;
      return normalizePriority(priority) === "cold";
    }
    const message = error.message || "";
    if (!/column .* does not exist/i.test(message)) {
      throw new Error(message || "Failed to read lead priority.");
    }
  }
  return false;
}

async function executeWhatsApp(params: {
  queue: JourneyQueueRow;
  step: JourneyStepRow;
}) {
  const supabase = createServiceClient();
  const payload = params.step.payload || params.queue.metadata || {};
  const content =
    typeof payload.message === "string"
      ? payload.message
      : typeof params.step.message === "string"
        ? params.step.message
        : null;
  const templateName = typeof payload.template_name === "string" ? payload.template_name : null;
  const messageType = templateName ? "template" : "text";

  // Encode template name into content for fallback when template_name column is absent
  const contentWithTemplate = content ?? (templateName ? `template:${templateName}` : null);

  const candidates = [
    // Full schema with template_name
    {
      lead_id: params.queue.lead_id,
      message_type: messageType,
      content,
      template_name: templateName,
      direction: "outbound",
      status: "queued",
    },
    // body variant with template_name
    {
      lead_id: params.queue.lead_id,
      body: content,
      template_name: templateName,
      direction: "outbound",
      status: "queued",
    },
    // Without template_name (crm_whatsapp_messages may not have that column)
    {
      lead_id: params.queue.lead_id,
      message_type: messageType,
      content: contentWithTemplate,
      direction: "outbound",
      status: "queued",
    },
    // body variant without template_name
    {
      lead_id: params.queue.lead_id,
      body: contentWithTemplate,
      direction: "outbound",
      status: "queued",
    },
  ];

  for (const candidate of candidates) {
    const { error } = await supabase.from("crm_whatsapp_messages").insert(candidate);
    if (!error) return;
    // Only try next candidate on column/schema errors; hard-fail otherwise
    if (!/column .* does not exist|schema cache/i.test(error.message || "")) {
      throw new Error(error.message || "Unable to enqueue WhatsApp journey message.");
    }
  }
  throw new Error("Unable to enqueue WhatsApp journey message after all candidates.");
}

async function executeTask(params: { queue: JourneyQueueRow; step: JourneyStepRow }) {
  const supabase = createServiceClient();
  const payload = params.step.payload || params.queue.metadata || {};
  const title =
    typeof payload.title === "string"
      ? payload.title
      : params.step.title || "Journey follow-up task";
  const description =
    typeof payload.description === "string"
      ? payload.description
      : params.step.message || null;
  const dueInMinutes =
    typeof payload.due_in_minutes === "number" && Number.isFinite(payload.due_in_minutes)
      ? payload.due_in_minutes
      : 120;

  const dueDate = new Date(Date.now() + dueInMinutes * 60 * 1000).toISOString();
  const candidates = [
    {
      lead_id: params.queue.lead_id,
      title,
      description,
      status: "pending",
      priority: "high",
      due_date: dueDate,
    },
    {
      lead_id: params.queue.lead_id,
      title,
      notes: description,
      status: "pending",
      priority: "high",
      due_date: dueDate,
    },
  ];
  for (const candidate of candidates) {
    const { error } = await supabase.from("crm_tasks").insert(candidate);
    if (!error) return;
  }
  throw new Error("Unable to create journey task.");
}

async function executeReminder(params: { queue: JourneyQueueRow; step: JourneyStepRow }) {
  const supabase = createServiceClient();
  const payload = params.step.payload || params.queue.metadata || {};
  const title =
    typeof payload.title === "string"
      ? payload.title
      : params.step.title || "Journey reminder";
  const message =
    typeof payload.message === "string"
      ? payload.message
      : params.step.message || "New journey reminder";

  const candidates = [
    {
      lead_id: params.queue.lead_id,
      title,
      message,
      status: "pending",
      channel: "in_app",
    },
    {
      lead_id: params.queue.lead_id,
      title,
      body: message,
      status: "pending",
      notification_type: "reminder",
    },
  ];
  for (const candidate of candidates) {
    const { error } = await supabase.from("crm_outbound_notifications").insert(candidate);
    if (!error) return;
  }
  throw new Error("Unable to create journey reminder.");
}

async function executeByAction(params: { queue: JourneyQueueRow; step: JourneyStepRow }) {
  const actionType = normalizeActionType(params.step.action_type);
  if (!actionType) throw new Error(`Unsupported action type: ${params.step.action_type || "unknown"}`);
  if (actionType === "whatsapp") return executeWhatsApp(params);
  if (actionType === "task") return executeTask(params);
  return executeReminder(params);
}

export async function runJourneyQueueWorker(limit = 100): Promise<{
  scanned: number;
  completed: number;
  failed: number;
  skippedCold: number;
}> {
  const pendingRows = await fetchPendingQueue(Math.max(1, Math.min(500, limit)));
  let completed = 0;
  let failed = 0;
  let skippedCold = 0;

  for (const queue of pendingRows) {
    if (!queue.id || !queue.lead_id) continue;

    const claimed = await claimQueueRow(queue.id);
    if (!claimed) continue;

    const attempts = getAttempts(queue.attempts) + 1;
    try {
      const isCold = await isLeadCold(queue.lead_id);
      if (isCold) {
        await updateQueueResult({
          queueId: queue.id,
          status: "failed",
          attempts,
          errorMessage: "Lead priority is cold; execution skipped.",
        });
        await insertActivityLog({
          queueId: queue.id,
          leadId: queue.lead_id,
          status: "failed",
          actionType: "safeguard",
          message: "Journey step blocked due to cold priority.",
          attempts,
        });
        skippedCold += 1;
        continue;
      }

      const stepId = queue.journey_step_id || queue.step_id;
      if (!stepId) throw new Error("Journey step reference missing on queue row.");
      const step = await fetchJourneyStep(stepId);
      if (!step) throw new Error("Journey step not found.");

      await withRetries(() => executeByAction({ queue, step }), MAX_RETRY_ATTEMPTS);
      await updateQueueResult({ queueId: queue.id, status: "completed", attempts });
      await insertActivityLog({
        queueId: queue.id,
        leadId: queue.lead_id,
        status: "completed",
        actionType: normalizeActionType(step.action_type) || step.action_type || "unknown",
        message: "Journey step executed successfully.",
        attempts,
      });
      completed += 1;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Journey execution failed.";
      await updateQueueResult({
        queueId: queue.id,
        status: "failed",
        attempts,
        errorMessage,
      });
      await insertActivityLog({
        queueId: queue.id,
        leadId: queue.lead_id,
        status: "failed",
        actionType: "execution",
        message: errorMessage,
        attempts,
      });
      failed += 1;
    }
  }

  return {
    scanned: pendingRows.length,
    completed,
    failed,
    skippedCold,
  };
}

export async function getJourneyQueueMonitoring(limit = 200): Promise<{
  summary: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    successRatePct: number;
  };
  rows: Array<Record<string, unknown>>;
}> {
  const supabase = createServiceClient();
  const selectVariants = [
    "id,lead_id,journey_step_id,status,scheduled_at,attempts,error_message,created_at,updated_at",
    "id,lead_id,step_id,status,scheduled_at,attempts,last_error,created_at,updated_at",
  ];
  let rows: Array<Record<string, unknown>> = [];
  let loaded = false;
  for (const selectClause of selectVariants) {
    const { data, error } = await supabase
      .from("crm_journey_queue")
      .select(selectClause)
      .order("scheduled_at", { ascending: false })
      .limit(Math.max(1, Math.min(1000, limit)));
    if (!error) {
      rows = (data as Array<Record<string, unknown>>) || [];
      loaded = true;
      break;
    }
    if (!/column .* does not exist/i.test(error.message || "")) {
      throw new Error(error.message || "Failed to load journey queue monitor.");
    }
  }
  if (!loaded) rows = [];

  const counts = {
    total: rows.length,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };
  for (const row of rows) {
    const status = String(row.status || "").toLowerCase() as QueueStatus;
    if (status === "pending") counts.pending += 1;
    else if (status === "processing") counts.processing += 1;
    else if (status === "completed") counts.completed += 1;
    else if (status === "failed") counts.failed += 1;
  }
  const settled = counts.completed + counts.failed;
  const successRatePct = settled > 0 ? Math.round((counts.completed / settled) * 100) : 100;

  return {
    summary: {
      ...counts,
      successRatePct,
    },
    rows,
  };
}
```

---

## src/lib/crm/types.ts

```typescript
export type CrmRole =
  | "admin"
  | "sales_head"
  | "team_lead"
  | "agent"
  | "marketing"
  | "channel_partner"
  | "analyst";

export interface CrmUser {
  id: string;
  email: string;
  full_name: string | null;
  role: CrmRole;
  is_active: boolean;
  role_name?: string | null;
}

export interface CrmLead {
  id: string;
  name: string;
  phone: string;
  source: string | null;
  source_type?: string | null;
  source_name?: string | null;
  project_id?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  location: string | null;
  buyer_type: string | null;
  status: string | null;
  priority?: string | null;
  assignment_status?: string | null;
  assigned_to?: string | null;
  assigned_agent_id: string | null;
  assigned_agent_name?: string | null;
  stage_id?: string | null;
  stage_name?: string | null;
  created_at?: string;
  updated_at?: string;
  last_activity_at?: string | null;
  campaign_name?: string | null;
  campaign_id?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  landing_page_url?: string | null;
  micro_market?: string | null;
}

export interface CrmTask {
  id: string;
  title: string;
  description?: string | null;
  status: string | null;
  priority?: string | null;
  due_date?: string | null;
  assigned_to?: string | null;
  lead_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CrmActivity {
  id: string;
  lead_id: string;
  activity_type: string;
  notes?: string | null;
  created_by?: string | null;
  created_at?: string;
}

export interface CrmConversation {
  id: string;
  lead_id: string;
  channel: "whatsapp" | string;
  recipient_phone: string;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
  last_message_at?: string | null;
}

export interface CrmMessage {
  id: string;
  conversation_id: string;
  lead_id: string;
  direction: "inbound" | "outbound" | string;
  message_type: "text" | "template" | "system" | string;
  content: string | null;
  template_name?: string | null;
  status?: string | null;
  provider_message_id?: string | null;
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CrmBehaviorEvent {
  id: string;
  lead_id: string | null;
  event_name: string;
  event_type?: string | null;
  event_score?: number | null;
  source?: string | null;
  device?: string | null;
  session_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}
```

---

## src/app/api/crm/routing/assign/route.ts

```typescript
import { NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { assignLeadManually } from "@/services/crmLeadRoutingService";

const allowedRoles = new Set(["admin", "sales_head", "team_lead"]);

export async function POST(request: Request) {
  try {
    const session = await getCrmSessionResult();
    if (!session.user || !allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const leadId = String(body?.leadId || "");
    const agentId = String(body?.agentId || "");
    const note = typeof body?.note === "string" ? body.note : null;

    if (!leadId || !agentId) {
      return NextResponse.json({ error: "leadId and agentId are required." }, { status: 400 });
    }

    const result = await assignLeadManually({
      leadId,
      agentId,
      note,
      assignedBy: session.user.id,
    });

    if (!result.assigned) {
      return NextResponse.json({ error: "Assignment failed.", reason: result.reason }, { status: 500 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected assignment error." },
      { status: 500 }
    );
  }
}
```

---

## src/app/api/cron/journey-worker/route.ts

```typescript
import { NextRequest, NextResponse } from "next/server";
import { runJourneyQueueWorker } from "@/services/journeyExecutionService";

const isAuthorized = (request: NextRequest): boolean => {
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.JOURNEY_WORKER_API_KEY || process.env.SITEMAP_API_KEY;
  if (!apiKey) return true;
  return authHeader === `Bearer ${apiKey}`;
};

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const limitRaw = Number(body?.limit ?? 100);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, limitRaw)) : 100;
    const result = await runJourneyQueueWorker(limit);
    return NextResponse.json({ success: true, result, executedAt: new Date().toISOString() });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Journey worker execution failed." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
```

---

## src/app/api/crm/whatsapp/send-template/route.ts

```typescript
import { NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { sendWhatsAppTemplate } from "@/services/whatsappCloudService";

export async function POST(request: Request) {
  try {
    const session = await getCrmSessionResult();
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const leadId = String(body?.leadId || "");
    const phone = String(body?.phone || "");
    const templateName = String(body?.templateName || "").trim();
    const languageCode = typeof body?.languageCode === "string" ? body.languageCode : "en";

    if (!leadId || !phone || !templateName) {
      return NextResponse.json({ error: "leadId, phone and templateName are required." }, { status: 400 });
    }

    const result = await sendWhatsAppTemplate({
      leadId,
      phone,
      templateName,
      languageCode,
      sentBy: session.user.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send template." }, { status: 502 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId, providerMessageId: result.providerMessageId });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected WhatsApp template send error." },
      { status: 500 }
    );
  }
}
```
