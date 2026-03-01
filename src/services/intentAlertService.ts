import { createServiceClient } from "@/lib/supabase/serviceClient";
import { sendWhatsAppTemplate } from "@/services/whatsappCloudService";
import { sanitizeLeadPayload } from "@/lib/crm/sanitizeLeadPayload";

interface IntentSignalInput {
  leadId: string;
  eventName: string;
  isRepeatVisit: boolean;
  eventPayload: Record<string, unknown>;
  simulationMode?: boolean;
}

const startOfDayIso = (): string => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return start.toISOString();
};

async function getLeadContext(leadId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("crm_leads")
    .select("id,name,phone,assigned_agent_id,priority,buyer_type")
    .eq("id", leadId)
    .maybeSingle();
  return data;
}

async function insertNotification(input: { leadId: string; agentId: string; title: string; message: string; severity?: string }) {
  const supabase = createServiceClient();
  const candidates = [
    {
      lead_id: input.leadId,
      recipient_user_id: input.agentId,
      title: input.title,
      message: input.message,
      severity: input.severity || "info",
      read: false,
      created_at: new Date().toISOString(),
    },
    {
      lead_id: input.leadId,
      user_id: input.agentId,
      title: input.title,
      body: input.message,
      type: input.severity || "info",
      is_read: false,
    },
  ];
  for (const candidate of candidates) {
    const { error } = await supabase.from("crm_notifications").insert(candidate);
    if (!error) return true;
  }
  return false;
}

async function insertLeadIntentActivity(leadId: string, message: string) {
  const supabase = createServiceClient();
  await supabase.from("crm_lead_activities").insert({
    lead_id: leadId,
    activity_type: "intent_alert",
    notes: message,
  });
}

async function createFollowupTask(leadId: string, agentId: string | null, title: string, description: string) {
  const supabase = createServiceClient();
  const due = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from("crm_tasks").insert({
    lead_id: leadId,
    assigned_to: agentId,
    title,
    description,
    status: "pending",
    priority: "high",
    due_date: due,
  });
  return !error;
}

const isInvestorActivity = (lead: Record<string, unknown>, eventPayload: Record<string, unknown>): boolean => {
  const fromLead = typeof lead.buyer_type === "string" ? lead.buyer_type : "";
  const fromPayloadBuyerType = typeof eventPayload.buyer_type === "string" ? eventPayload.buyer_type : "";
  const fromPayloadSegment = typeof eventPayload.segment === "string" ? eventPayload.segment : "";
  const text = `${fromLead} ${fromPayloadBuyerType} ${fromPayloadSegment}`.toLowerCase();
  return /investor|investment|institutional/.test(text);
};

async function bumpPriorityHigh(leadId: string) {
  const supabase = createServiceClient();
  const candidates = [{ priority: "high" }, { lead_priority: "high" }];
  for (const patch of candidates) {
    const safePatch = sanitizeLeadPayload(patch);
    if (Object.keys(safePatch).length === 0) continue;
    const { error } = await supabase.from("crm_leads").update(safePatch).eq("id", leadId);
    if (!error) return true;
  }
  return false;
}

async function sendIntentWhatsApp(leadId: string, phone: string, key: string, templateName: string) {
  await sendWhatsAppTemplate({
    leadId,
    phone,
    templateName,
    languageCode: "en",
    sentBy: "intent-engine",
    automationKey: key,
  });
}

async function alreadyTriggeredToday(leadId: string, key: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("crm_messages")
    .select("id")
    .eq("lead_id", leadId)
    .eq("message_type", "template")
    .ilike("content", `automation:${key}%`)
    .gt("created_at", startOfDayIso())
    .limit(1)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function handleIntentSignals(input: IntentSignalInput): Promise<void> {
  const lead = await getLeadContext(input.leadId);
  if (!lead?.id) return;

  const leadId = String(lead.id);
  const phone = typeof lead.phone === "string" ? lead.phone : "";
  const agentId = typeof lead.assigned_agent_id === "string" ? lead.assigned_agent_id : null;

  if (agentId && isInvestorActivity(lead as Record<string, unknown>, input.eventPayload)) {
    await insertNotification({
      leadId,
      agentId,
      title: "Investor activity detected",
      message: `${lead.name || "Lead"} showed investor-level activity. Prioritize follow-up.`,
      severity: "high",
    });
  }

  if (input.eventName === "pricing_view") {
    const key = "intent_pricing_revisit";
    if (await alreadyTriggeredToday(leadId, key)) return;
    if (agentId) {
      await insertNotification({
        leadId,
        agentId,
        title: "Pricing revisited",
        message: `${lead.name || "Lead"} viewed pricing again. Reach out now.`,
        severity: "high",
      });
    }
    await insertLeadIntentActivity(leadId, "Lead viewed pricing today.");
    if (phone && !input.simulationMode) {
      await sendIntentWhatsApp(leadId, phone, key, "pricing_revisit_followup_v1");
    } else if (input.simulationMode) {
      await insertLeadIntentActivity(leadId, "Simulation: WhatsApp pricing trigger emitted.");
    }
    return;
  }

  if (input.eventName === "brochure_download") {
    const key = "intent_brochure_download";
    if (await alreadyTriggeredToday(leadId, key)) return;
    await createFollowupTask(
      leadId,
      agentId,
      "Follow up: brochure downloaded",
      "Lead downloaded brochure. Call and qualify intent."
    );
    if (agentId) {
      await insertNotification({
        leadId,
        agentId,
        title: "Brochure downloaded",
        message: `${lead.name || "Lead"} downloaded brochure. Follow-up task created.`,
        severity: "high",
      });
    }
    await insertLeadIntentActivity(leadId, "Brochure downloaded; follow-up task created.");
    if (phone && !input.simulationMode) {
      await sendIntentWhatsApp(leadId, phone, key, "brochure_download_followup_v1");
    } else if (input.simulationMode) {
      await insertLeadIntentActivity(leadId, "Simulation: WhatsApp brochure trigger emitted.");
    }
    return;
  }

  if (input.eventName === "page_view" && input.isRepeatVisit) {
    const key = "intent_repeat_visit";
    if (await alreadyTriggeredToday(leadId, key)) return;
    await bumpPriorityHigh(leadId);
    if (agentId) {
      await insertNotification({
        leadId,
        agentId,
        title: "Repeat visit detected",
        message: `${lead.name || "Lead"} is revisiting. Priority raised to high.`,
        severity: "high",
      });
    }
    await insertLeadIntentActivity(leadId, "Repeat visit detected; lead priority raised.");
    return;
  }
}
