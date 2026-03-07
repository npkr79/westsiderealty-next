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

  // crm_conversations is a view — insert into the underlying table instead
  const insertCandidates = [
    { lead_id: input.leadId, recipient_phone: normalizedPhone, status: "open", last_message_at: new Date().toISOString() },
    { lead_id: input.leadId, recipient_phone: normalizedPhone, last_message_at: new Date().toISOString() },
  ];
  for (const payload of insertCandidates) {
    const { data, error } = await supabase.from("crm_whatsapp_conversations").insert(payload).select("id").maybeSingle();
    if (!error && data?.id) return String(data.id);
  }
  throw new Error("Unable to create WhatsApp conversation.");
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
  // crm_conversations is a view — update the underlying table
  await supabase
    .from("crm_whatsapp_conversations")
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
