import { createServiceClient } from "@/lib/supabase/serviceClient";
import { sendWhatsAppTemplate } from "@/services/whatsappCloudService";
import { sanitizeLeadPayload } from "@/lib/crm/sanitizeLeadPayload";

type StageKey =
  | "contacted"
  | "qualified"
  | "site_visit_scheduled"
  | "site_visit_done"
  | "negotiation"
  | "token"
  | "booking"
  | "lost";

type RuleActionType =
  | "create_task"
  | "send_whatsapp_template"
  | "set_lead_priority"
  | "create_activity"
  | "escalate_to_team_lead"
  | "calendar_sync";

interface RuleAction {
  type: RuleActionType;
  taskTitle?: string;
  taskDescription?: string;
  taskPriority?: "low" | "medium" | "high";
  dueInHours?: number;
  templateName?: string;
  languageCode?: string;
  priorityValue?: string;
  activityType?: string;
  activityNote?: string;
}

interface StageAutomationRule {
  key: StageKey;
  label: string;
  enabled: boolean;
  actions: RuleAction[];
}

interface LeadContext {
  id: string;
  phone: string | null;
  assigned_to: string | null;
  name?: string | null;
}

interface StageContext {
  id: string;
  name: string | null;
}

interface RetryTask {
  action: RuleAction;
  reason: string;
}

const DEFAULT_RULES: Record<StageKey, StageAutomationRule> = {
  contacted: {
    key: "contacted",
    label: "Contacted",
    enabled: true,
    actions: [
      { type: "create_task", taskTitle: "Follow-up call", taskDescription: "Follow up after initial contact.", taskPriority: "medium", dueInHours: 24 },
      { type: "send_whatsapp_template", templateName: "agent_introduction_v1", languageCode: "en" },
    ],
  },
  qualified: {
    key: "qualified",
    label: "Qualified",
    enabled: true,
    actions: [
      { type: "create_task", taskTitle: "Discovery call", taskDescription: "Run discovery and requirement refinement.", taskPriority: "high", dueInHours: 12 },
      { type: "set_lead_priority", priorityValue: "high" },
    ],
  },
  site_visit_scheduled: {
    key: "site_visit_scheduled",
    label: "Site Visit Scheduled",
    enabled: true,
    actions: [
      { type: "create_task", taskTitle: "Site visit reminder", taskDescription: "Call and confirm site visit schedule.", taskPriority: "high", dueInHours: 4 },
      { type: "send_whatsapp_template", templateName: "site_visit_reminder_v1", languageCode: "en" },
      { type: "calendar_sync", activityType: "calendar_sync", activityNote: "Site visit event pushed for calendar sync." },
    ],
  },
  site_visit_done: {
    key: "site_visit_done",
    label: "Site Visit Done",
    enabled: true,
    actions: [
      { type: "create_task", taskTitle: "Collect site visit feedback", taskDescription: "Capture buyer feedback and objections.", taskPriority: "high", dueInHours: 6 },
      { type: "create_task", taskTitle: "Negotiation prep", taskDescription: "Prepare pricing and negotiation strategy.", taskPriority: "high", dueInHours: 12 },
    ],
  },
  negotiation: {
    key: "negotiation",
    label: "Negotiation",
    enabled: true,
    actions: [
      { type: "create_task", taskTitle: "Negotiation follow-up", taskDescription: "Track negotiation checkpoints.", taskPriority: "high", dueInHours: 8 },
      { type: "escalate_to_team_lead", activityType: "escalation", activityNote: "Negotiation escalation sent to team lead." },
    ],
  },
  token: {
    key: "token",
    label: "Token",
    enabled: true,
    actions: [{ type: "create_task", taskTitle: "Document checklist", taskDescription: "Share and validate token-stage document checklist.", taskPriority: "high", dueInHours: 12 }],
  },
  booking: {
    key: "booking",
    label: "Booking",
    enabled: true,
    actions: [
      { type: "create_task", taskTitle: "Finance workflow", taskDescription: "Start booking finance process.", taskPriority: "high", dueInHours: 24 },
      { type: "create_task", taskTitle: "Legal workflow", taskDescription: "Start legal documentation and agreement workflow.", taskPriority: "high", dueInHours: 24 },
    ],
  },
  lost: {
    key: "lost",
    label: "Lost",
    enabled: true,
    actions: [{ type: "send_whatsapp_template", templateName: "followup_48h_v1", languageCode: "en" }],
  },
};

const normalizeStageName = (value: string | null | undefined): string =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const inferStageKey = (stage: StageContext): StageKey | null => {
  const key = normalizeStageName(stage.name);
  if (key in DEFAULT_RULES) return key as StageKey;
  if (key === "site_visit") return "site_visit_scheduled";
  return null;
};

const withRetries = async <T>(fn: () => Promise<T>, retries = 2): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }
  }
  throw lastError;
};

const parseRuleOverride = (value: unknown): StageAutomationRule | null => {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const key = typeof row.key === "string" ? row.key : null;
  if (!key || !(key in DEFAULT_RULES)) return null;
  const enabled = typeof row.enabled === "boolean" ? row.enabled : true;
  const actions = Array.isArray(row.actions) ? (row.actions as RuleAction[]) : DEFAULT_RULES[key as StageKey].actions;
  return {
    key: key as StageKey,
    label: typeof row.label === "string" ? row.label : DEFAULT_RULES[key as StageKey].label,
    enabled,
    actions,
  };
};

async function loadRule(stageKey: StageKey): Promise<StageAutomationRule> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("crm_automation_config")
    .select("key,enabled,metadata")
    .eq("key", `stage_${stageKey}`)
    .maybeSingle();

  if (!data) return DEFAULT_RULES[stageKey];
  const override = parseRuleOverride(data.metadata);
  if (!override) {
    return {
      ...DEFAULT_RULES[stageKey],
      enabled: typeof data.enabled === "boolean" ? data.enabled : DEFAULT_RULES[stageKey].enabled,
    };
  }
  if (typeof data.enabled === "boolean") override.enabled = data.enabled;
  return override;
}

async function fetchLeadContext(leadId: string): Promise<LeadContext | null> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("crm_leads").select("id,name,phone,assigned_to").eq("id", leadId).maybeSingle();
  if (!data?.id) return null;
  return {
    id: String(data.id),
    name: data.name ? String(data.name) : null,
    phone: data.phone ? String(data.phone) : null,
    assigned_to: data.assigned_to ? String(data.assigned_to) : null,
  };
}

async function insertStageChangeNotification(params: {
  leadId: string;
  leadName?: string | null;
  stageName?: string | null;
  agentId: string;
}) {
  const supabase = createServiceClient();
  const title = "Stage changed";
  const message = `${params.leadName || "Lead"} moved to ${params.stageName || "a new stage"}.`;
  const candidates = [
    {
      lead_id: params.leadId,
      recipient_user_id: params.agentId,
      title,
      message,
      severity: "info",
      read: false,
      created_at: new Date().toISOString(),
    },
    {
      lead_id: params.leadId,
      user_id: params.agentId,
      title,
      body: message,
      type: "info",
      is_read: false,
    },
  ];
  for (const payload of candidates) {
    const { error } = await supabase.from("crm_notifications").insert(payload);
    if (!error) return;
  }
}

async function fetchStage(stageId: string): Promise<StageContext | null> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("crm_lead_stages").select("id,name").eq("id", stageId).maybeSingle();
  if (!data?.id) return null;
  return { id: String(data.id), name: data.name ? String(data.name) : null };
}

async function insertLog(params: {
  leadId: string;
  stageId: string;
  stageKey: string;
  status: "success" | "error";
  actionType: string;
  message: string;
  payload?: Record<string, unknown> | null;
}) {
  const supabase = createServiceClient();
  await supabase.from("crm_lead_activities").insert({
    lead_id: params.leadId,
    activity_type: "stage_automation",
    notes: JSON.stringify({
      stage_id: params.stageId,
      stage_key: params.stageKey,
      status: params.status,
      action: params.actionType,
      message: params.message,
      payload: params.payload ?? null,
      at: new Date().toISOString(),
    }),
  });
}

async function createTask(lead: LeadContext, action: RuleAction): Promise<void> {
  const supabase = createServiceClient();
  const due = new Date(Date.now() + (action.dueInHours || 12) * 60 * 60 * 1000).toISOString();
  await withRetries(async () => {
    const { error } = await supabase.from("crm_tasks").insert({
      lead_id: lead.id,
      assigned_to: lead.assigned_to,
      title: action.taskTitle || "Stage action task",
      description: action.taskDescription || null,
      status: "pending",
      priority: action.taskPriority || "medium",
      due_date: due,
    });
    if (error) throw new Error(error.message || "Failed to create task.");
  });
}

async function sendTemplate(lead: LeadContext, action: RuleAction): Promise<void> {
  const phone = String(lead.phone || "").replace(/[^\d]/g, "");
  if (!phone) throw new Error("Missing lead phone for WhatsApp automation.");
  const template = action.templateName || "agent_introduction_v1";
  await withRetries(async () => {
    const result = await sendWhatsAppTemplate({
      leadId: lead.id,
      phone,
      templateName: template,
      languageCode: action.languageCode || "en",
      sentBy: "stage-automation-engine",
      automationKey: `stage_${template}`,
    });
    if (!result.success) throw new Error(result.error || "WhatsApp send failed.");
  });
}

async function setLeadPriority(leadId: string, value: string): Promise<void> {
  const supabase = createServiceClient();
  await withRetries(async () => {
    const candidates = [{ priority: value }];
    let success = false;
    let lastErr: string | null = null;
    for (const patch of candidates) {
      const safePatch = sanitizeLeadPayload(patch);
      if (Object.keys(safePatch).length === 0) {
        lastErr = "No schema-safe fields to update.";
        continue;
      }
      const { error } = await supabase.from("crm_leads").update(safePatch).eq("id", leadId);
      if (!error) {
        success = true;
        break;
      }
      lastErr = error.message || "Priority update failed.";
    }
    if (!success) throw new Error(lastErr || "Priority update failed.");
  });
}

async function createActivity(leadId: string, action: RuleAction): Promise<void> {
  const supabase = createServiceClient();
  await withRetries(async () => {
    const { error } = await supabase.from("crm_lead_activities").insert({
      lead_id: leadId,
      activity_type: action.activityType || "stage_action",
      notes: action.activityNote || "Stage automation activity",
    });
    if (error) throw new Error(error.message || "Failed to create activity.");
  });
}

async function escalateToTeamLead(leadId: string, action: RuleAction): Promise<void> {
  const supabase = createServiceClient();
  const { data: teamLeads } = await supabase
    .from("crm_users")
    .select("id,crm_roles(name)")
    .eq("is_active", true);
  const teamLead = (teamLeads || []).find((user) => {
    const roleName = Array.isArray(user.crm_roles) ? user.crm_roles[0]?.name : user.crm_roles?.name;
    return normalizeStageName(roleName) === "team_lead";
  });
  if (!teamLead?.id) throw new Error("No active team lead found for escalation.");

  await createActivity(leadId, {
    type: "create_activity",
    activityType: action.activityType || "escalation",
    activityNote: action.activityNote || `Escalated to team lead ${teamLead.id}.`,
  });
}

async function handleAction(lead: LeadContext, action: RuleAction): Promise<void> {
  if (action.type === "create_task") return createTask(lead, action);
  if (action.type === "send_whatsapp_template") return sendTemplate(lead, action);
  if (action.type === "set_lead_priority") return setLeadPriority(lead.id, action.priorityValue || "high");
  if (action.type === "create_activity") return createActivity(lead.id, action);
  if (action.type === "escalate_to_team_lead") return escalateToTeamLead(lead.id, action);
  if (action.type === "calendar_sync") return createActivity(lead.id, action);
}

export async function runStageAutomation(input: { leadId: string; toStageId: string; fromStageId?: string | null }) {
  const lead = await fetchLeadContext(input.leadId);
  if (!lead) {
    return { success: false, reason: "lead_not_found", executed: 0, failed: 0 };
  }

  const stage = await fetchStage(input.toStageId);
  if (!stage) {
    await insertLog({
      leadId: input.leadId,
      stageId: input.toStageId,
      stageKey: "unknown",
      status: "error",
      actionType: "stage_lookup",
      message: "Stage not found.",
    });
    return { success: false, reason: "stage_not_found", executed: 0, failed: 0 };
  }

  const stageKey = inferStageKey(stage);
  if (!stageKey) {
    await insertLog({
      leadId: input.leadId,
      stageId: input.toStageId,
      stageKey: "unmapped",
      status: "error",
      actionType: "stage_mapping",
      message: `No automation mapping for stage "${stage.name || stage.id}".`,
    });
    return { success: false, reason: "stage_unmapped", executed: 0, failed: 0 };
  }

  const rule = await loadRule(stageKey);

  if (lead.assigned_to) {
    await insertStageChangeNotification({
      leadId: lead.id,
      leadName: lead.name || null,
      stageName: stage.name || stageKey,
      agentId: lead.assigned_to,
    });
  }

  if (!rule.enabled) {
    await insertLog({
      leadId: input.leadId,
      stageId: input.toStageId,
      stageKey,
      status: "success",
      actionType: "rule_disabled",
      message: "Stage rule disabled.",
    });
    return { success: true, reason: "rule_disabled", executed: 0, failed: 0 };
  }

  let executed = 0;
  let failed = 0;
  const retryQueue: RetryTask[] = [];

  for (const action of rule.actions) {
    try {
      await handleAction(lead, action);
      executed += 1;
      await insertLog({
        leadId: input.leadId,
        stageId: input.toStageId,
        stageKey,
        status: "success",
        actionType: action.type,
        message: "Action executed.",
      });
    } catch (error: unknown) {
      failed += 1;
      retryQueue.push({
        action,
        reason: error instanceof Error ? error.message : "Unknown stage automation failure.",
      });
      await insertLog({
        leadId: input.leadId,
        stageId: input.toStageId,
        stageKey,
        status: "error",
        actionType: action.type,
        message: error instanceof Error ? error.message : "Unknown stage automation failure.",
      });
    }
  }

  for (const retryItem of retryQueue) {
    try {
      await handleAction(lead, retryItem.action);
      executed += 1;
      failed = Math.max(0, failed - 1);
      await insertLog({
        leadId: input.leadId,
        stageId: input.toStageId,
        stageKey,
        status: "success",
        actionType: retryItem.action.type,
        message: "Action retry succeeded.",
        payload: { previous_reason: retryItem.reason },
      });
    } catch (error: unknown) {
      await insertLog({
        leadId: input.leadId,
        stageId: input.toStageId,
        stageKey,
        status: "error",
        actionType: retryItem.action.type,
        message: `Retry failed: ${error instanceof Error ? error.message : "Unknown error."}`,
      });
    }
  }

  return {
    success: failed === 0,
    reason: failed === 0 ? "completed" : "partial_failure",
    stageKey,
    executed,
    failed,
  };
}
