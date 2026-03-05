import { createServiceClient } from "@/lib/supabase/serviceClient";
import { sendWhatsAppTemplate } from "@/services/whatsappCloudService";

type AutomationKey =
  | "new_lead_greeting"
  | "post_assignment_intro"
  | "site_visit_reminder"
  | "no_response_followup_48h";

interface AutomationConfig {
  enabled: boolean;
  templateName: string;
  languageCode: string;
}

const DEFAULT_CONFIG: Record<AutomationKey, AutomationConfig> = {
  new_lead_greeting: {
    enabled: true,
    templateName: "lead_greeting_v1",
    languageCode: "en",
  },
  post_assignment_intro: {
    enabled: true,
    templateName: "agent_introduction_v1",
    languageCode: "en",
  },
  site_visit_reminder: {
    enabled: true,
    templateName: "site_visit_reminder_v1",
    languageCode: "en",
  },
  no_response_followup_48h: {
    enabled: true,
    templateName: "followup_48h_v1",
    languageCode: "en",
  },
};

const normalizePhone = (value: string | null | undefined): string =>
  String(value || "").replace(/[^\d]/g, "");

async function getAutomationConfig(key: AutomationKey): Promise<AutomationConfig> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("crm_automation_config")
    .select("enabled,template_name,language_code")
    .eq("key", key)
    .maybeSingle();

  if (!data) return DEFAULT_CONFIG[key];
  return {
    enabled: data.enabled ?? DEFAULT_CONFIG[key].enabled,
    templateName: data.template_name || DEFAULT_CONFIG[key].templateName,
    languageCode: data.language_code || DEFAULT_CONFIG[key].languageCode,
  };
}

async function wasAutomationAlreadySent(leadId: string, key: AutomationKey): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("crm_messages")
    .select("id")
    .eq("lead_id", leadId)
    .eq("direction", "outbound")
    .eq("message_type", "template")
    .ilike("content", `automation:${key}%`)
    .limit(1)
    .maybeSingle();
  return Boolean(data?.id);
}

async function runTemplateAutomation(params: {
  key: AutomationKey;
  leadId: string;
  phone: string | null | undefined;
  sentBy: string;
}): Promise<{ sent: boolean; reason: string }> {
  const phone = normalizePhone(params.phone);
  if (!phone) return { sent: false, reason: "missing_phone" };

  const cfg = await getAutomationConfig(params.key);
  if (!cfg.enabled) return { sent: false, reason: "disabled" };

  const alreadySent = await wasAutomationAlreadySent(params.leadId, params.key);
  if (alreadySent) return { sent: false, reason: "already_sent" };

  const result = await sendWhatsAppTemplate({
    leadId: params.leadId,
    phone,
    templateName: cfg.templateName,
    languageCode: cfg.languageCode,
    sentBy: params.sentBy,
    automationKey: params.key,
  });
  if (!result.success) return { sent: false, reason: result.error || "send_failed" };
  return { sent: true, reason: "sent" };
}

export async function onNewLeadAutomation(params: { leadId: string; leadPhone: string | null | undefined; sentBy: string }) {
  return runTemplateAutomation({
    key: "new_lead_greeting",
    leadId: params.leadId,
    phone: params.leadPhone,
    sentBy: params.sentBy,
  });
}

export async function onAssignmentAutomation(params: { leadId: string; leadPhone: string | null | undefined; sentBy: string }) {
  return runTemplateAutomation({
    key: "post_assignment_intro",
    leadId: params.leadId,
    phone: params.leadPhone,
    sentBy: params.sentBy,
  });
}

async function runSiteVisitReminders(nowIso: string, sentBy: string): Promise<number> {
  const supabase = createServiceClient();
  const now = new Date(nowIso);
  const reminderWindowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data: tasks } = await supabase
    .from("crm_tasks")
    .select("id,lead_id,due_date,title")
    .neq("status", "completed")
    .gte("due_date", now.toISOString())
    .lte("due_date", reminderWindowEnd.toISOString())
    .ilike("title", "%site visit%");

  let sent = 0;
  for (const task of tasks || []) {
    if (!task?.lead_id) continue;
    const { data: lead } = await supabase.from("crm_leads").select("id,phone").eq("id", task.lead_id).maybeSingle();
    if (!lead?.id) continue;
    const result = await runTemplateAutomation({
      key: "site_visit_reminder",
      leadId: String(lead.id),
      phone: lead.phone,
      sentBy,
    });
    if (result.sent) sent += 1;
  }
  return sent;
}

async function runNoResponseFollowups(nowIso: string, sentBy: string): Promise<number> {
  const supabase = createServiceClient();
  const threshold = new Date(new Date(nowIso).getTime() - 48 * 60 * 60 * 1000).toISOString();

  const { data: leads } = await supabase
    .from("crm_leads")
    .select("id,phone,updated_at,last_activity_at")
    .lt("updated_at", threshold)
    .limit(500);

  let sent = 0;
  for (const lead of leads || []) {
    const latestActivityAt = lead.last_activity_at || lead.updated_at;
    if (!latestActivityAt || latestActivityAt > threshold) continue;
    const { data: inboundRecent } = await supabase
      .from("crm_messages")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("direction", "inbound")
      .gt("created_at", threshold)
      .limit(1)
      .maybeSingle();
    if (inboundRecent?.id) continue;

    const result = await runTemplateAutomation({
      key: "no_response_followup_48h",
      leadId: String(lead.id),
      phone: lead.phone,
      sentBy,
    });
    if (result.sent) sent += 1;
  }
  return sent;
}

export async function runScheduledWhatsAppAutomation(nowIso = new Date().toISOString(), sentBy = "automation-bot") {
  const siteVisitSent = await runSiteVisitReminders(nowIso, sentBy);
  const followupSent = await runNoResponseFollowups(nowIso, sentBy);
  return {
    siteVisitRemindersSent: siteVisitSent,
    noResponseFollowupsSent: followupSent,
  };
}
