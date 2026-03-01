"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BellRing, Clock3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AlertPriority = "high" | "medium" | "low";

interface AlertRow {
  id: string;
  lead_id: string | null;
  agent_id: string | null;
  title: string;
  message: string;
  alert_type: string | null;
  priority: AlertPriority;
  is_read: boolean;
  created_at: string | null;
  read_at: string | null;
}

interface InstitutionalAlertCommandCenterProps {
  currentUserId: string;
  canManageAll: boolean;
}

const SLA_MINUTES = 30;

const normalizePriority = (value: string | null | undefined): AlertPriority => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (normalized === "high" || normalized === "hot" || normalized === "critical" || normalized === "p1") return "high";
  if (normalized === "medium" || normalized === "warm" || normalized === "p2") return "medium";
  return "low";
};

const priorityRank = (value: AlertPriority): number => {
  if (value === "high") return 0;
  if (value === "medium") return 1;
  return 2;
};

const priorityBadgeClass = (value: AlertPriority): string => {
  if (value === "high") return "border-transparent bg-rose-600 text-white hover:bg-rose-600";
  if (value === "medium") return "border-transparent bg-orange-500 text-white hover:bg-orange-500";
  return "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
};

const minutesSince = (createdAt: string | null): number => {
  if (!createdAt) return 0;
  const createdMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdMs)) return 0;
  return Math.max(0, Math.floor((Date.now() - createdMs) / 60000));
};

const isOverdue = (alert: AlertRow): boolean => !alert.is_read && minutesSince(alert.created_at) > SLA_MINUTES;

const readState = (row: Record<string, unknown>): boolean =>
  row.is_read === true || row.read === true || Boolean(row.read_at);

const getAgentId = (row: Record<string, unknown>): string | null => {
  const candidates = [row.agent_id, row.assigned_to, row.recipient_user_id, row.user_id];
  const hit = candidates.find((value) => typeof value === "string" && value.length > 0);
  return typeof hit === "string" ? hit : null;
};

const mapAlertRow = (row: Record<string, unknown>): AlertRow => ({
  id: String(row.id || ""),
  lead_id: typeof row.lead_id === "string" ? row.lead_id : null,
  agent_id: getAgentId(row),
  title: typeof row.title === "string" ? row.title : "Untitled alert",
  message:
    typeof row.message === "string"
      ? row.message
      : typeof row.body === "string"
        ? row.body
        : "-",
  alert_type:
    typeof row.alert_type === "string"
      ? row.alert_type
      : typeof row.type === "string"
        ? row.type
        : null,
  priority: normalizePriority(
    typeof row.priority === "string"
      ? row.priority
      : typeof row.severity === "string"
        ? row.severity
        : typeof row.alert_type === "string"
          ? row.alert_type
          : null
  ),
  is_read: readState(row),
  created_at: typeof row.created_at === "string" ? row.created_at : null,
  read_at: typeof row.read_at === "string" ? row.read_at : null,
});

export default function InstitutionalAlertCommandCenter({ currentUserId, canManageAll }: InstitutionalAlertCommandCenterProps) {
  const supabase = useMemo(() => createClient(), []);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentNames, setAgentNames] = useState<Record<string, string>>({});

  const loadAgentNames = useCallback(async () => {
    const { data } = await supabase.from("crm_users").select("id,full_name").eq("is_active", true).limit(500);
    const mapped: Record<string, string> = {};
    for (const row of (data as Array<{ id: string; full_name: string | null }>) || []) {
      mapped[row.id] = row.full_name || row.id;
    }
    setAgentNames(mapped);
  }, [supabase]);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const selectVariants = [
      "id,lead_id,agent_id,title,message,alert_type,priority,is_read,read_at,created_at",
      "id,lead_id,agent_id,title,message,type,severity,read,read_at,created_at",
      "id,lead_id,recipient_user_id,title,message,severity,read,read_at,created_at",
    ];

    let loadedRows: AlertRow[] = [];
    let loaded = false;
    let lastError = "Failed to load alerts.";

    for (const selectClause of selectVariants) {
      const { data, error: queryError } = await supabase
        .from("crm_agent_alerts")
        .select(selectClause)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (!queryError) {
        loadedRows = ((data as Array<Record<string, unknown>>) || []).map(mapAlertRow);
        loaded = true;
        break;
      }
      lastError = queryError.message || "Failed to load alerts.";
      if (!/column .* does not exist/i.test(lastError)) break;
    }

    if (!loaded) {
      setError(lastError);
      setAlerts([]);
      setLoading(false);
      return;
    }

    const scopedRows = canManageAll ? loadedRows : loadedRows.filter((item) => item.agent_id === currentUserId);
    scopedRows.sort((a, b) => {
      const rankDiff = priorityRank(a.priority) - priorityRank(b.priority);
      if (rankDiff !== 0) return rankDiff;
      const aTs = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTs = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTs - aTs;
    });
    setAlerts(scopedRows);
    setLoading(false);
  }, [canManageAll, currentUserId, supabase]);

  const runEscalation = useCallback(async () => {
    if (!canManageAll) return;
    await fetch("/api/crm/alerts/escalate", { method: "POST" });
  }, [canManageAll]);

  useEffect(() => {
    void loadAgentNames();
    void loadAlerts();
  }, [loadAgentNames, loadAlerts]);

  useEffect(() => {
    const channel = supabase
      .channel("crm-agent-alerts-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_agent_alerts" }, () => {
        void loadAlerts();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAlerts, supabase]);

  useEffect(() => {
    if (!canManageAll) return;
    const timer = window.setInterval(() => {
      void runEscalation();
    }, 60 * 1000);
    return () => window.clearInterval(timer);
  }, [canManageAll, runEscalation]);

  const overdueCount = useMemo(() => alerts.filter((item) => isOverdue(item)).length, [alerts]);
  const unreadCount = useMemo(() => alerts.filter((item) => !item.is_read).length, [alerts]);
  const hotCount = useMemo(() => alerts.filter((item) => item.priority === "high").length, [alerts]);

  const productivity = useMemo(() => {
    const grouped = new Map<string, { total: number; timelyRead: number }>();
    for (const alert of alerts) {
      const key = alert.agent_id || "unassigned";
      const row = grouped.get(key) || { total: 0, timelyRead: 0 };
      row.total += 1;
      if (alert.is_read) {
        const createdMs = alert.created_at ? new Date(alert.created_at).getTime() : NaN;
        const readMs = alert.read_at ? new Date(alert.read_at).getTime() : NaN;
        if (!Number.isNaN(createdMs) && !Number.isNaN(readMs) && readMs - createdMs <= SLA_MINUTES * 60000) {
          row.timelyRead += 1;
        }
      }
      grouped.set(key, row);
    }
    return Array.from(grouped.entries())
      .map(([agentId, row]) => ({
        agentId,
        name: agentNames[agentId] || agentId,
        total: row.total,
        timelyRead: row.timelyRead,
        score: row.total > 0 ? Math.round((row.timelyRead / row.total) * 100) : 100,
      }))
      .sort((a, b) => b.score - a.score);
  }, [agentNames, alerts]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{alerts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Unread alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{unreadCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">High priority</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-rose-600 dark:text-rose-300">{hotCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Overdue ({SLA_MINUTES}m+)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-amber-600 dark:text-amber-300">{overdueCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BellRing className="h-4 w-4" />
              Real-time institutional alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading alert stream...</p> : null}
            {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
            {!loading && alerts.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No alerts in command center.</p>
            ) : null}
            {alerts.map((alert) => {
              const age = minutesSince(alert.created_at);
              const overdue = isOverdue(alert);
              return (
                <Link
                  key={alert.id}
                  href={alert.lead_id ? `/leads/${alert.lead_id}` : "/leads"}
                  className={`block rounded-md border p-3 transition hover:bg-slate-50 dark:hover:bg-slate-900 ${
                    overdue ? "border-amber-300 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/20" : ""
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="font-medium">{alert.title}</p>
                    <div className="inline-flex items-center gap-2">
                      <Badge className={priorityBadgeClass(alert.priority)}>{alert.priority.toUpperCase()}</Badge>
                      <Badge variant={alert.is_read ? "secondary" : "default"}>{alert.is_read ? "Read" : "Unread"}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{alert.message}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Clock3 className="h-3.5 w-3.5" />
                    <span>{age}m ago</span>
                    {overdue ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Overdue - escalation eligible
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Agent productivity score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {productivity.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No productivity data yet.</p>
            ) : (
              productivity.slice(0, 12).map((row) => (
                <div key={row.agentId} className="rounded-md border p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{row.name}</p>
                    <Badge variant={row.score >= 70 ? "default" : "secondary"}>{row.score}%</Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Timely: {row.timelyRead}/{row.total} within {SLA_MINUTES}m
                  </p>
                </div>
              ))
            )}
            {canManageAll ? (
              <Button type="button" className="w-full" variant="outline" onClick={() => void runEscalation()}>
                Run escalation now
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

