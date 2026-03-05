import { NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { createServiceClient } from "@/lib/supabase/serviceClient";

const allowedRoles = new Set(["admin", "sales_head", "team_lead"]);
const SLA_MINUTES = 30;

const normalizeRole = (value: string | null | undefined): string =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const roleNameFromJoin = (value: { crm_roles: { name: string } | Array<{ name: string }> | null }): string | null => {
  if (!value.crm_roles) return null;
  if (Array.isArray(value.crm_roles)) return value.crm_roles[0]?.name ?? null;
  return value.crm_roles.name ?? null;
};

const isReadRow = (row: Record<string, unknown>): boolean => row.is_read === true || row.read === true || Boolean(row.read_at);

async function getManagerIds() {
  const supabase = createServiceClient();
  const { data } = await supabase.from("crm_users").select("id,crm_roles(name)").eq("is_active", true).limit(500);
  return ((data as Array<{ id: string; crm_roles: { name: string } | Array<{ name: string }> | null }>) || [])
    .filter((row) => {
      const role = normalizeRole(roleNameFromJoin(row));
      return role === "team_lead" || role === "sales_head";
    })
    .map((row) => row.id);
}

async function fetchOverdueAlerts() {
  const supabase = createServiceClient();
  const thresholdIso = new Date(Date.now() - SLA_MINUTES * 60000).toISOString();
  const selectVariants = [
    "id,lead_id,agent_id,title,message,priority,is_read,read_at,created_at,escalated_at",
    "id,lead_id,agent_id,title,message,severity,read,read_at,created_at,escalated_at",
    "id,lead_id,recipient_user_id,title,message,severity,read,read_at,created_at,escalated_at",
  ];
  for (const selectClause of selectVariants) {
    const { data, error } = await supabase
      .from("crm_agent_alerts")
      .select(selectClause)
      .lte("created_at", thresholdIso)
      .order("created_at", { ascending: true })
      .limit(1000);
    if (!error) {
      const rows = ((data as Array<Record<string, unknown>>) || []).filter((row) => !isReadRow(row) && !row.escalated_at);
      return rows;
    }
    if (!/column .* does not exist/i.test(error.message || "")) {
      throw new Error(error.message || "Failed to fetch overdue alerts.");
    }
  }
  return [] as Array<Record<string, unknown>>;
}

async function wasEscalated(alertId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("crm_lead_activities")
    .select("id")
    .eq("activity_type", "alert_escalation")
    .ilike("notes", `%"alert_id":"${alertId}"%`)
    .limit(1)
    .maybeSingle();
  return Boolean(data?.id);
}

async function insertNotification(params: { leadId: string | null; userId: string; title: string; message: string }) {
  const supabase = createServiceClient();
  const candidates = [
    {
      lead_id: params.leadId,
      recipient_user_id: params.userId,
      title: params.title,
      message: params.message,
      severity: "high",
      read: false,
      created_at: new Date().toISOString(),
    },
    {
      lead_id: params.leadId,
      user_id: params.userId,
      title: params.title,
      body: params.message,
      type: "high",
      is_read: false,
    },
  ];
  for (const payload of candidates) {
    const { error } = await supabase.from("crm_notifications").insert(payload);
    if (!error) return;
  }
}

async function markEscalated(alertId: string) {
  const supabase = createServiceClient();
  const payloads = [{ escalated_at: new Date().toISOString() }, { escalation_sent_at: new Date().toISOString() }];
  for (const payload of payloads) {
    const { error } = await supabase.from("crm_agent_alerts").update(payload).eq("id", alertId);
    if (!error) return;
  }
}

async function logEscalation(params: { alertId: string; leadId: string | null; managerCount: number }) {
  const supabase = createServiceClient();
  await supabase.from("crm_lead_activities").insert({
    lead_id: params.leadId,
    activity_type: "alert_escalation",
    notes: JSON.stringify({
      alert_id: params.alertId,
      manager_count: params.managerCount,
      threshold_minutes: SLA_MINUTES,
      at: new Date().toISOString(),
    }),
  });
}

export async function POST() {
  try {
    const session = await getCrmSessionResult();
    if (!session.user || !allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const managerIds = await getManagerIds();
    if (!managerIds.length) {
      return NextResponse.json({ success: true, escalated: 0, reason: "no_managers" });
    }

    const overdueAlerts = await fetchOverdueAlerts();
    let escalated = 0;

    for (const alert of overdueAlerts) {
      const alertId = String(alert.id || "");
      if (!alertId) continue;
      if (await wasEscalated(alertId)) continue;

      const leadId = typeof alert.lead_id === "string" ? alert.lead_id : null;
      const title = typeof alert.title === "string" ? alert.title : "Alert overdue";
      const message = typeof alert.message === "string" ? alert.message : "Agent alert unread for over 30 minutes.";

      for (const managerId of managerIds) {
        await insertNotification({
          leadId,
          userId: managerId,
          title: `Escalation: ${title}`,
          message: `${message} (Unread > ${SLA_MINUTES} minutes)`,
        });
      }

      await logEscalation({ alertId, leadId, managerCount: managerIds.length });
      await markEscalated(alertId);
      escalated += 1;
    }

    return NextResponse.json({
      success: true,
      escalated,
      scanned: overdueAlerts.length,
      thresholdMinutes: SLA_MINUTES,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected alert escalation error." },
      { status: 500 }
    );
  }
}

