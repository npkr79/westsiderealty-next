import { createServiceClient } from "@/lib/supabase/serviceClient";

interface SlaConfig {
  thresholdHours: number;
  escalationRole: "team_lead" | "sales_head";
}

interface TaskRow {
  id: string;
  title: string | null;
  due_date: string | null;
  assigned_to: string | null;
  lead_id: string | null;
  status: string | null;
  updated_at: string | null;
}

interface UserRoleRow {
  id: string;
  full_name: string | null;
  crm_roles: { name: string } | Array<{ name: string }> | null;
}

export interface SlaSummary {
  thresholdHours: number;
  overdueCount: number;
  overdueByAgent: Array<{ agentId: string; overdue: number }>;
  alertTasks: Array<{ taskId: string; title: string; overdueHours: number; assignedTo: string | null }>;
  responsivenessByAgent: Array<{ agentId: string; responsivenessPct: number; overdue: number; dueTasks: number }>;
}

const DEFAULT_CONFIG: SlaConfig = {
  thresholdHours: 12,
  escalationRole: "team_lead",
};

const normalizeRole = (value: string | null | undefined): string =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const getRoleName = (row: UserRoleRow): string | null => {
  if (!row.crm_roles) return null;
  if (Array.isArray(row.crm_roles)) return row.crm_roles[0]?.name ?? null;
  return row.crm_roles.name ?? null;
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

async function loadConfig(): Promise<SlaConfig> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("crm_automation_config")
    .select("enabled,metadata")
    .eq("key", "task_sla_monitor")
    .maybeSingle();

  if (!data?.metadata || typeof data.metadata !== "object") {
    return DEFAULT_CONFIG;
  }
  const meta = data.metadata as Record<string, unknown>;
  return {
    thresholdHours:
      typeof meta.thresholdHours === "number" && Number.isFinite(meta.thresholdHours) && meta.thresholdHours > 0
        ? meta.thresholdHours
        : DEFAULT_CONFIG.thresholdHours,
    escalationRole:
      meta.escalationRole === "sales_head" || meta.escalationRole === "team_lead"
        ? meta.escalationRole
        : DEFAULT_CONFIG.escalationRole,
  };
}

const overdueHours = (dueDate: string | null, now = Date.now()): number => {
  if (!dueDate) return 0;
  const due = new Date(dueDate).getTime();
  if (Number.isNaN(due)) return 0;
  return Math.max(0, Math.floor((now - due) / (60 * 60 * 1000)));
};

async function fetchOverdueTasks(thresholdHours: number): Promise<TaskRow[]> {
  const supabase = createServiceClient();
  const thresholdIso = new Date(Date.now() - thresholdHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("crm_tasks")
    .select("id,title,due_date,assigned_to,lead_id,status,updated_at")
    .neq("status", "completed")
    .not("due_date", "is", null)
    .lte("due_date", thresholdIso)
    .order("due_date", { ascending: true })
    .limit(1000);
  if (error) throw new Error(error.message || "Failed to fetch overdue tasks.");
  return (data as TaskRow[]) || [];
}

async function fetchDueTaskSample(daysBack = 7): Promise<TaskRow[]> {
  const supabase = createServiceClient();
  const fromIso = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("crm_tasks")
    .select("id,title,due_date,assigned_to,lead_id,status,updated_at")
    .not("due_date", "is", null)
    .gte("due_date", fromIso)
    .order("due_date", { ascending: false })
    .limit(3000);
  if (error) throw new Error(error.message || "Failed to fetch due task sample.");
  return (data as TaskRow[]) || [];
}

async function insertNotification(params: {
  leadId: string | null;
  userId: string;
  title: string;
  message: string;
  severity?: string;
}) {
  const supabase = createServiceClient();
  const candidates = [
    {
      lead_id: params.leadId,
      recipient_user_id: params.userId,
      title: params.title,
      message: params.message,
      severity: params.severity || "high",
      read: false,
      created_at: new Date().toISOString(),
    },
    {
      lead_id: params.leadId,
      user_id: params.userId,
      title: params.title,
      body: params.message,
      type: params.severity || "high",
      is_read: false,
    },
  ];

  let lastError: string | null = null;
  for (const payload of candidates) {
    const { error } = await supabase.from("crm_notifications").insert(payload);
    if (!error) return;
    lastError = error.message || "Failed to insert notification.";
  }
  throw new Error(lastError || "Failed to insert notification.");
}

async function logSlaActivity(params: {
  leadId: string | null;
  activityType: string;
  payload: Record<string, unknown>;
}) {
  const supabase = createServiceClient();
  await supabase.from("crm_lead_activities").insert({
    lead_id: params.leadId,
    activity_type: params.activityType,
    notes: JSON.stringify({
      ...params.payload,
      at: new Date().toISOString(),
    }),
  });
}

async function wasAlertSent(taskId: string, kind: "agent" | "manager"): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("crm_lead_activities")
    .select("id")
    .eq("activity_type", "sla_alert")
    .ilike("notes", `%"task_id":"${taskId}"%`)
    .ilike("notes", `%"alert_kind":"${kind}"%`)
    .limit(1)
    .maybeSingle();
  return Boolean(data?.id);
}

async function getEscalationTargets(role: "team_lead" | "sales_head"): Promise<string[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("crm_users")
    .select("id,full_name,crm_roles(name)")
    .eq("is_active", true)
    .limit(500);
  const users = (data as UserRoleRow[]) || [];
  return users
    .filter((user) => normalizeRole(getRoleName(user)) === role)
    .map((user) => user.id);
}

export async function runTaskSlaMonitor(): Promise<{
  thresholdHours: number;
  overdueScanned: number;
  agentAlertsSent: number;
  managerEscalationsSent: number;
  missedFollowups: number;
}> {
  const config = await loadConfig();
  const overdue = await fetchOverdueTasks(config.thresholdHours);
  const managerIds = await getEscalationTargets(config.escalationRole);

  let agentAlertsSent = 0;
  let managerEscalationsSent = 0;
  let missedFollowups = 0;

  for (const task of overdue) {
    const hours = overdueHours(task.due_date);
    if (hours < config.thresholdHours) continue;
    missedFollowups += 1;

    if (task.assigned_to && !(await wasAlertSent(task.id, "agent"))) {
      await withRetries(async () => {
        await insertNotification({
          leadId: task.lead_id,
          userId: task.assigned_to as string,
          title: "SLA breach: follow-up overdue",
          message: `Task "${task.title || "Untitled task"}" is overdue by ${hours}h.`,
          severity: "high",
        });
      });
      await logSlaActivity({
        leadId: task.lead_id,
        activityType: "sla_alert",
        payload: { task_id: task.id, alert_kind: "agent", overdue_hours: hours },
      });
      agentAlertsSent += 1;
    }

    if (!(await wasAlertSent(task.id, "manager"))) {
      for (const managerId of managerIds) {
        await withRetries(async () => {
          await insertNotification({
            leadId: task.lead_id,
            userId: managerId,
            title: "SLA escalation: missed follow-up",
            message: `Task "${task.title || "Untitled task"}" is overdue by ${hours}h and requires intervention.`,
            severity: "high",
          });
        });
        managerEscalationsSent += 1;
      }
      await logSlaActivity({
        leadId: task.lead_id,
        activityType: "sla_alert",
        payload: { task_id: task.id, alert_kind: "manager", overdue_hours: hours },
      });
    }
  }

  return {
    thresholdHours: config.thresholdHours,
    overdueScanned: overdue.length,
    agentAlertsSent,
    managerEscalationsSent,
    missedFollowups,
  };
}

export async function getTaskSlaSummary(): Promise<SlaSummary> {
  const config = await loadConfig();
  const overdue = await fetchOverdueTasks(config.thresholdHours);
  const dueSample = await fetchDueTaskSample(7);

  const overdueByAgent = new Map<string, number>();
  for (const task of overdue) {
    const agentId = task.assigned_to || "unassigned";
    overdueByAgent.set(agentId, (overdueByAgent.get(agentId) || 0) + 1);
  }

  const dueByAgent = new Map<string, number>();
  const overdueDueByAgent = new Map<string, number>();
  for (const task of dueSample) {
    const agentId = task.assigned_to || "unassigned";
    dueByAgent.set(agentId, (dueByAgent.get(agentId) || 0) + 1);
    if (task.status !== "completed" && overdueHours(task.due_date) >= config.thresholdHours) {
      overdueDueByAgent.set(agentId, (overdueDueByAgent.get(agentId) || 0) + 1);
    }
  }

  const responsivenessByAgent = Array.from(dueByAgent.entries())
    .map(([agentId, dueTasks]) => {
      const overdueCount = overdueDueByAgent.get(agentId) || 0;
      const responsivenessPct = dueTasks > 0 ? Math.max(0, Math.round(((dueTasks - overdueCount) / dueTasks) * 100)) : 100;
      return { agentId, responsivenessPct, overdue: overdueCount, dueTasks };
    })
    .sort((a, b) => a.responsivenessPct - b.responsivenessPct)
    .slice(0, 20);

  return {
    thresholdHours: config.thresholdHours,
    overdueCount: overdue.length,
    overdueByAgent: Array.from(overdueByAgent.entries()).map(([agentId, count]) => ({ agentId, overdue: count })),
    alertTasks: overdue.slice(0, 20).map((task) => ({
      taskId: task.id,
      title: task.title || "Untitled task",
      overdueHours: overdueHours(task.due_date),
      assignedTo: task.assigned_to,
    })),
    responsivenessByAgent,
  };
}
