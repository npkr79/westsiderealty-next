import { NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { sendWhatsAppTemplate, sendWhatsAppText } from "@/services/whatsappCloudService";

const managerRoles = new Set(["admin", "sales_head", "team_lead"]);

const normalize = (value: unknown): string => String(value || "").trim();

async function ensureConversationMirror(leadId: string, phone: string, assignedAgentId: string | null) {
  const supabase = createServiceClient();
  const normalizedPhone = phone.replace(/[^\d]/g, "");
  const { data: existing } = await supabase
    .from("crm_whatsapp_conversations")
    .select("id")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing?.id) return String(existing.id);

  const insertCandidates = [
    {
      lead_id: leadId,
      recipient_phone: normalizedPhone || null,
      assigned_agent_id: assignedAgentId,
      status: "open",
      last_message_at: new Date().toISOString(),
    },
    {
      lead_id: leadId,
      recipient_phone: normalizedPhone || null,
      owner_id: assignedAgentId,
      status: "open",
      last_message_at: new Date().toISOString(),
    },
  ];
  for (const payload of insertCandidates) {
    const { data, error } = await supabase.from("crm_whatsapp_conversations").insert(payload).select("id").maybeSingle();
    if (!error && data?.id) return String(data.id);
  }
  return null;
}

async function mirrorOutboundMessage(input: {
  conversationId: string | null;
  leadId: string;
  mode: "text" | "template";
  message: string | null;
  templateName: string | null;
  status: string;
  providerMessageId: string | null;
  userId: string;
}) {
  const supabase = createServiceClient();
  let inserted = false;
  const payloadCandidates: Array<Record<string, unknown>> = [
    {
      conversation_id: input.conversationId,
      lead_id: input.leadId,
      direction: "outbound",
      message_type: input.mode,
      content: input.message,
      template_name: input.templateName,
      status: input.status,
      provider_message_id: input.providerMessageId,
      sent_by: input.userId,
    },
    {
      whatsapp_conversation_id: input.conversationId,
      lead_id: input.leadId,
      direction: "outbound",
      message_type: input.mode,
      body: input.message,
      template_name: input.templateName,
      status: input.status,
      provider_message_id: input.providerMessageId,
      sent_by: input.userId,
    },
  ];
  for (const payload of payloadCandidates) {
    const { error } = await supabase.from("crm_whatsapp_messages").insert(payload);
    if (!error) {
      inserted = true;
      break;
    }
  }
  if (inserted && input.conversationId) {
    await supabase
      .from("crm_whatsapp_conversations")
      .update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", input.conversationId);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCrmSessionResult();
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const leadId = normalize(body?.leadId);
    const phone = normalize(body?.phone);
    const mode = normalize(body?.mode) === "template" ? "template" : "text";
    const message = mode === "text" ? normalize(body?.message) : "";
    const templateName = mode === "template" ? normalize(body?.templateName) : "";

    if (!leadId || !phone || (mode === "text" && !message) || (mode === "template" && !templateName)) {
      return NextResponse.json({ error: "leadId, phone and payload are required." }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: leadRow } = await supabase.from("crm_leads").select("id,assigned_to").eq("id", leadId).maybeSingle();
    const assignedAgentId = typeof leadRow?.assigned_to === "string" ? leadRow.assigned_to : null;
    const canViewAll = managerRoles.has(session.user.role);
    if (!canViewAll && assignedAgentId && assignedAgentId !== session.user.id) {
      return NextResponse.json({ error: "Conversation access denied." }, { status: 403 });
    }

    const mirroredConversationId = await ensureConversationMirror(leadId, phone, assignedAgentId);

    if (mode === "text") {
      const result = await sendWhatsAppText({
        leadId,
        phone,
        message,
        sentBy: session.user.id,
      });
      await mirrorOutboundMessage({
        conversationId: mirroredConversationId,
        leadId,
        mode: "text",
        message,
        templateName: null,
        status: result.success ? "sent" : "failed",
        providerMessageId: result.providerMessageId || null,
        userId: session.user.id,
      });
      if (!result.success) {
        return NextResponse.json({ error: result.error || "Failed to send WhatsApp text." }, { status: 502 });
      }
      return NextResponse.json({ success: true, providerMessageId: result.providerMessageId || null });
    }

    const result = await sendWhatsAppTemplate({
      leadId,
      phone,
      templateName,
      sentBy: session.user.id,
      languageCode: "en",
    });
    await mirrorOutboundMessage({
      conversationId: mirroredConversationId,
      leadId,
      mode: "template",
      message: null,
      templateName,
      status: result.success ? "sent" : "failed",
      providerMessageId: result.providerMessageId || null,
      userId: session.user.id,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send WhatsApp template." }, { status: 502 });
    }
    return NextResponse.json({ success: true, providerMessageId: result.providerMessageId || null });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected inbox send error." },
      { status: 500 }
    );
  }
}

