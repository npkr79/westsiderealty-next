"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { createClient } from "@/lib/supabase/client";
import type { CrmUser } from "@/lib/crm/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AgentIntentAlertsPanel from "@/components/crm/agent/AgentIntentAlertsPanel";
import { getPriorityBadgeClassName, getPriorityLabel } from "@/lib/crm/leadPriority";
import { getLeadBudgetValue } from "@/lib/crm/budget";

type LeadRow = {
  id?: string;
  created_at?: string | null;
  updated_at?: string | null;
  status?: string | null;
  source?: string | null;
  source_channel?: string | null;
  source_type?: string | null;
  stage_id?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  assigned_to?: string | null;
  assigned_agent_name?: string | null;
  priority?: string | null;
  lead_priority?: string | null;
};

type TaskRow = {
  id?: string;
  title?: string | null;
  status?: string | null;
  due_date?: string | null;
  assigned_to?: string | null;
};

type StageRow = {
  id?: string;
  name?: string | null;
  display_name?: string | null;
};

type DealRow = {
  id?: string;
  value?: string | number | null;
  status?: string | null;
  assigned_to?: string | null;
  owner_id?: string | null;
  agent_id?: string | null;
};

interface SalesCockpitRealtimeProps {
  user: CrmUser;
  scope?: "all" | "assigned";
}

const STAGE_PROBABILITY: Record<string, number> = {
  contacted: 0.1,
  qualified: 0.25,
  site_visit: 0.4,
  site_visit_scheduled: 0.4,
  site_visit_done: 0.5,
  negotiation: 0.6,
  token: 0.8,
};

const normalizeStageKey = (value?: string | null): string =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const getProbabilityForStage = (stageOrStatus?: string | null): number => {
  const normalized = normalizeStageKey(stageOrStatus);
  if (!normalized) return 0.1;
  if (STAGE_PROBABILITY[normalized] !== undefined) return STAGE_PROBABILITY[normalized];
  if (/proposal|hot/.test(normalized)) return 0.6;
  if (/won|closed_won|booked|converted/.test(normalized)) return 1;
  if (/lost|closed_lost/.test(normalized)) return 0;
  return 0.1;
};

type SlaSummaryRow = {
  thresholdHours: number;
  overdueCount: number;
  overdueByAgent: Array<{ agentId: string; overdue: number }>;
  alertTasks: Array<{ taskId: string; title: string; overdueHours: number; assignedTo: string | null }>;
  responsivenessByAgent: Array<{ agentId: string; responsivenessPct: number; overdue: number; dueTasks: number }>;
};

const isSameDay = (value?: string | null, ref = new Date()): boolean => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === ref.getFullYear() &&
    date.getMonth() === ref.getMonth() &&
    date.getDate() === ref.getDate()
  );
};

const parseInrLoose = (value?: string | number | null): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value || typeof value !== "string") return 0;

  const text = value.toLowerCase().replace(/,/g, "");
  const matches = Array.from(text.matchAll(/(\d+(\.\d+)?)/g)).map((m) => Number(m[1]));
  if (!matches.length) return 0;
  const base = Math.max(...matches);

  if (text.includes("cr")) return base * 10000000;
  if (text.includes("lakh") || /\bl\b/.test(text)) return base * 100000;
  if (text.includes("k")) return base * 1000;
  return base;
};

const formatInrCompact = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const isQualifiedStatus = (status?: string | null): boolean => /qualified|proposal|hot|negotiat|site/i.test(status || "");
const isWonStatus = (status?: string | null): boolean => /won|closed_won|booked|converted/i.test(status || "");
const isClosedOrLost = (status?: string | null): boolean => /lost|won|closed/i.test(status || "");

export default function SalesCockpitRealtime({ user, scope = "all" }: SalesCockpitRealtimeProps) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [stages, setStages] = useState<StageRow[]>([]);
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [dealsAvailable, setDealsAvailable] = useState(false);
  const [slaSummary, setSlaSummary] = useState<SlaSummaryRow | null>(null);
  const refreshTimer = useRef<number | null>(null);

  const scopedUserId = scope === "assigned" ? user.id : null;

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const leadSelectVariants = [
        "id,created_at,updated_at,status,source_channel,source_type,stage_id,budget_min,budget_max,assigned_to,assigned_agent_name,priority",
        "id,created_at,updated_at,status,source_channel,source_type,stage_id,budget_min,budget_max,assigned_to,assigned_agent_name,lead_priority",
        "id,created_at,updated_at,status,source_channel,source_type,stage_id,budget_min,budget_max,assigned_to,assigned_agent_name",
        "id,created_at,updated_at,status,source_channel,source_type,stage_id,budget_min,budget_max,assigned_to,priority",
        "id,created_at,updated_at,status,source_channel,source_type,stage_id,budget_min,budget_max,assigned_to,lead_priority",
        "id,created_at,updated_at,status,source_channel,source_type,stage_id,budget_min,budget_max,assigned_to",
      ];
      let leadRes: { data: LeadRow[] | null; error: Error | null } = { data: null, error: null };
      for (const selectClause of leadSelectVariants) {
        let leadsQuery = supabase.from("crm_leads_view").select(selectClause).order("created_at", { ascending: false }).limit(5000);
        if (scopedUserId) leadsQuery = leadsQuery.eq("assigned_to", scopedUserId);
        const queryResult = await leadsQuery;
        if (!queryResult.error) {
          leadRes = { data: (queryResult.data as LeadRow[]) || [], error: null };
          break;
        }
        const message = queryResult.error.message || "";
        if (!/column .* does not exist/i.test(message)) {
          leadRes = { data: null, error: queryResult.error as unknown as Error };
          break;
        }
        leadRes = { data: null, error: queryResult.error as unknown as Error };
      }

      let tasksQuery = supabase
        .from("crm_tasks")
        .select("id,title,status,due_date,assigned_to")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(5000);
      if (scopedUserId) tasksQuery = tasksQuery.eq("assigned_to", scopedUserId);

      const [taskRes, stageRes, dealRes] = await Promise.all([
        tasksQuery,
        supabase.from("crm_lead_stages").select("id,name,display_name").order("name", { ascending: true }),
        supabase.from("crm_deals").select("id,value,status,assigned_to,owner_id,agent_id").limit(5000),
      ]);

      if (leadRes.error) throw leadRes.error;
      if (taskRes.error) throw taskRes.error;

      setLeads(
        ((leadRes.data as LeadRow[]) || []).map((lead) => ({
          ...lead,
          priority: lead.priority || lead.lead_priority || null,
        }))
      );
      setTasks((taskRes.data as TaskRow[]) || []);
      setStages((stageRes.data as StageRow[]) || []);

      if (!dealRes.error) {
        setDealsAvailable(true);
        const rawDeals = (dealRes.data as DealRow[]) || [];
        const filteredDeals = scopedUserId
          ? rawDeals.filter((deal) =>
              [deal.assigned_to, deal.owner_id, deal.agent_id].some((id) => id && id === scopedUserId)
            )
          : rawDeals;
        setDeals(filteredDeals);
      } else {
        setDealsAvailable(false);
        setDeals([]);
      }

      if (user.role === "admin" || user.role === "sales_head" || user.role === "team_lead") {
        const slaResponse = await fetch("/api/crm/tasks/sla", { method: "GET" });
        const slaPayload = await slaResponse.json().catch(() => ({}));
        if (slaResponse.ok && slaPayload?.summary) {
          setSlaSummary(slaPayload.summary as SlaSummaryRow);
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [scopedUserId, supabase]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      refreshTimer.current = window.setTimeout(() => {
        void fetchDashboard();
      }, 250);
    };

    const channel = supabase
      .channel(`crm-sales-cockpit-${scopedUserId || "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_leads" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_tasks" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_lead_stages" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_deals" }, scheduleRefresh)
      .subscribe();

    return () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      supabase.removeChannel(channel);
    };
  }, [fetchDashboard, scopedUserId, supabase]);

  const metrics = useMemo(() => {
    const now = new Date();
    const newLeadsToday = leads.filter((lead) => isSameDay(lead.created_at, now)).length;
    const tasksDueToday = tasks.filter((task) => task.status !== "completed" && isSameDay(task.due_date, now)).length;
    const siteVisitsUpcoming = tasks.filter((task) => {
      if (task.status === "completed") return false;
      if (!(task.title || "").toLowerCase().includes("site visit")) return false;
      if (!task.due_date) return true;
      const due = new Date(task.due_date);
      return !Number.isNaN(due.getTime()) && due.getTime() >= now.getTime();
    }).length;

    const qualifiedLeads = leads.filter((lead) => isQualifiedStatus(lead.status)).length;
    const hotLeadsToday = leads.filter((lead) => isSameDay(lead.created_at, now) && getPriorityLabel(lead.priority) === "HOT").length;
    const wonLeads = leads.filter((lead) => isWonStatus(lead.status)).length;
    const conversionRate = leads.length ? (wonLeads / leads.length) * 100 : 0;

    const activePipelineValue = dealsAvailable && deals.length
      ? deals
          .filter((deal) => !isClosedOrLost(deal.status))
          .reduce((sum, deal) => sum + parseInrLoose(deal.value), 0)
      : leads
          .filter((lead) => !isClosedOrLost(lead.status))
          .reduce((sum, lead) => sum + getLeadBudgetValue(lead), 0);

    const stageMap = new Map<string, string>();
    for (const stage of stages) {
      if (stage.id) stageMap.set(stage.id, stage.display_name || stage.name || stage.id);
    }

    const forecastPipelineValue = leads
      .filter((lead) => !isClosedOrLost(lead.status))
      .reduce((sum, lead) => {
        const stageName = (lead.stage_id && stageMap.get(lead.stage_id)) || lead.status || "contacted";
        const probability = getProbabilityForStage(stageName);
        return sum + getLeadBudgetValue(lead) * probability;
      }, 0);

    return {
      newLeadsToday,
      tasksDueToday,
      siteVisitsUpcoming,
      qualifiedLeads,
      hotLeadsToday,
      conversionRate,
      activePipelineValue,
      forecastPipelineValue,
    };
  }, [deals, dealsAvailable, leads, stages, tasks]);

  const stageDistribution = useMemo(() => {
    const stageMap = new Map<string, string>();
    for (const stage of stages) {
      if (stage.id) stageMap.set(stage.id, stage.display_name || stage.name || stage.id);
    }

    const counts = new Map<string, number>();
    for (const lead of leads) {
      const label = (lead.stage_id && stageMap.get(lead.stage_id)) || lead.status || "unknown";
      counts.set(label, (counts.get(label) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [leads, stages]);

  const weeklyTrends = useMemo(() => {
    const days: Array<{ key: string; label: string; leads: number; won: number }> = [];
    const now = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      days.push({ key, label: day.toLocaleDateString("en-IN", { weekday: "short" }), leads: 0, won: 0 });
    }
    const map = new Map(days.map((d) => [d.key, d]));
    for (const lead of leads) {
      if (!lead.created_at) continue;
      const key = new Date(lead.created_at).toISOString().slice(0, 10);
      const bucket = map.get(key);
      if (!bucket) continue;
      bucket.leads += 1;
      if (isWonStatus(lead.status)) bucket.won += 1;
    }
    return days;
  }, [leads]);

  const monthlyRevenueForecast = useMemo(() => {
    const monthBuckets: Array<{ key: string; label: string; forecast: number; won: number }> = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
      monthBuckets.push({
        key,
        label: month.toLocaleDateString("en-IN", { month: "short" }),
        forecast: 0,
        won: 0,
      });
    }

    const stageMap = new Map<string, string>();
    for (const stage of stages) {
      if (stage.id) stageMap.set(stage.id, stage.display_name || stage.name || stage.id);
    }
    const bucketMap = new Map(monthBuckets.map((bucket) => [bucket.key, bucket]));

    for (const lead of leads) {
      if (!lead.created_at) continue;
      const d = new Date(lead.created_at);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = bucketMap.get(key);
      if (!bucket) continue;

      const value = getLeadBudgetValue(lead);
      const stageName = (lead.stage_id && stageMap.get(lead.stage_id)) || lead.status || "contacted";
      bucket.forecast += value * getProbabilityForStage(stageName);
      if (isWonStatus(lead.status)) {
        bucket.won += value;
      }
    }

    return monthBuckets.map((bucket) => ({
      ...bucket,
      forecast: Math.round(bucket.forecast),
      won: Math.round(bucket.won),
    }));
  }, [leads, stages]);

  const agentForecastPerformance = useMemo(() => {
    const stageMap = new Map<string, string>();
    for (const stage of stages) {
      if (stage.id) stageMap.set(stage.id, stage.display_name || stage.name || stage.id);
    }

    const grouped = new Map<string, { agentId: string; agentName: string; forecast: number; pipeline: number; wins: number; leads: number }>();
    for (const lead of leads) {
      const agentId = lead.assigned_to || "unassigned";
      const agentName = lead.assigned_agent_name?.trim() || "Unassigned";
      const value = getLeadBudgetValue(lead);
      const stageName = (lead.stage_id && stageMap.get(lead.stage_id)) || lead.status || "contacted";
      const probability = getProbabilityForStage(stageName);
      const row = grouped.get(agentId) || { agentId, agentName, forecast: 0, pipeline: 0, wins: 0, leads: 0 };
      row.leads += 1;
      if (!isClosedOrLost(lead.status)) row.pipeline += value;
      row.forecast += value * probability;
      if (isWonStatus(lead.status)) row.wins += 1;
      grouped.set(agentId, row);
    }

    return Array.from(grouped.values())
      .map((row) => ({
        ...row,
        forecast: Math.round(row.forecast),
        pipeline: Math.round(row.pipeline),
      }))
      .sort((a, b) => b.forecast - a.forecast)
      .slice(0, 10);
  }, [leads, stages]);

  const sourcePerformance = useMemo(() => {
    const grouped = new Map<string, { source: string; total: number; qualified: number; won: number }>();
    for (const lead of leads) {
      const source = lead.source_channel || lead.source_type || lead.source || "unknown";
      const row = grouped.get(source) || { source, total: 0, qualified: 0, won: 0 };
      row.total += 1;
      if (isQualifiedStatus(lead.status)) row.qualified += 1;
      if (isWonStatus(lead.status)) row.won += 1;
      grouped.set(source, row);
    }
    return Array.from(grouped.values())
      .map((row) => ({
        ...row,
        conversionRate: row.total ? (row.won / row.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [leads]);

  const hotLeadsByAgent = useMemo(() => {
    const grouped = new Map<string, { agentId: string; agentName: string; hotCount: number }>();
    for (const lead of leads) {
      if (getPriorityLabel(lead.priority) !== "HOT") continue;
      const agentId = lead.assigned_to || "unassigned";
      const agentName = lead.assigned_agent_name?.trim() || "Unassigned";
      const existing = grouped.get(agentId);
      grouped.set(agentId, { agentId, agentName, hotCount: (existing?.hotCount ?? 0) + 1 });
    }
    return Array.from(grouped.values())
      .sort((a, b) => b.hotCount - a.hotCount)
      .slice(0, 8);
  }, [leads]);

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
      {loading ? <p className="text-sm">Loading cockpit metrics...</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">New leads today</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{metrics.newLeadsToday}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Tasks due today</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{metrics.tasksDueToday}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Site visits upcoming</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{metrics.siteVisitsUpcoming}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Active pipeline value</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{formatInrCompact(metrics.activePipelineValue)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Qualified leads</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{metrics.qualifiedLeads}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Conversion rate</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{metrics.conversionRate.toFixed(1)}%</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Forecast pipeline value</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{formatInrCompact(metrics.forecastPipelineValue)}</p></CardContent></Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Hot leads today</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-semibold">{metrics.hotLeadsToday}</p>
              <Badge className={getPriorityBadgeClassName("HOT")}>HOT</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Hot leads by agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {hotLeadsByAgent.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No hot leads assigned yet.</p>
          ) : (
            hotLeadsByAgent.map((row) => (
              <div key={row.agentId} className="flex items-center justify-between rounded border p-2 text-sm">
                <p className="font-medium">{row.agentName}</p>
                <Badge className={getPriorityBadgeClassName("HOT")}>{row.hotCount} HOT</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Stage-wise distribution</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Weekly trends</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="leads" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="won" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Source performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sourcePerformance.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No source data available.</p>
          ) : (
            sourcePerformance.map((source) => (
              <div key={source.source} className="flex items-center justify-between rounded border p-2 text-sm">
                <div>
                  <p className="font-medium">{source.source}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {source.total} leads · {source.qualified} qualified
                  </p>
                </div>
                <Badge variant="secondary">{source.conversionRate.toFixed(1)}% conversion</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly revenue forecast</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRevenueForecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="forecast" stroke="#0f766e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="won" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Agent forecast performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agentForecastPerformance.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No agent forecast data available.</p>
            ) : (
              agentForecastPerformance.map((row) => (
                <div key={row.agentId} className="rounded border p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{row.agentName}</p>
                    <Badge variant="secondary">{row.wins} wins</Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Forecast: {formatInrCompact(row.forecast)} · Pipeline: {formatInrCompact(row.pipeline)} · Leads: {row.leads}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {slaSummary ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Task SLA alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded border p-2 text-sm">
                <p className="text-slate-500 dark:text-slate-400">SLA threshold</p>
                <p className="text-lg font-semibold">{slaSummary.thresholdHours}h</p>
              </div>
              <div className="rounded border p-2 text-sm">
                <p className="text-slate-500 dark:text-slate-400">Missed follow-ups</p>
                <p className="text-lg font-semibold">{slaSummary.overdueCount}</p>
              </div>
              <div className="rounded border p-2 text-sm">
                <p className="text-slate-500 dark:text-slate-400">Lowest responsiveness</p>
                <p className="text-lg font-semibold">
                  {slaSummary.responsivenessByAgent.length > 0 ? `${slaSummary.responsivenessByAgent[0].responsivenessPct}%` : "-"}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              {slaSummary.alertTasks.slice(0, 5).map((task) => (
                <div key={task.taskId} className="flex items-center justify-between rounded border p-2 text-sm">
                  <span>{task.title}</span>
                  <Badge variant="outline">{task.overdueHours}h overdue</Badge>
                </div>
              ))}
              {slaSummary.alertTasks.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No SLA breaches currently.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {scopedUserId ? <AgentIntentAlertsPanel userId={scopedUserId} /> : null}
    </div>
  );
}
