"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Loader2, UserX, Clock, Users, TrendingUp, BarChart2, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UnassignedLead {
  id: string;
  name: string | null;
  phone: string | null;
  created_at: string;
  source_channel: string | null;
  source_type: string | null;
}

interface AgingLead {
  id: string;
  name: string | null;
  phone: string | null;
  status: string | null;
  created_at: string;
  last_activity_at: string | null;
  agent_name: string;
}

interface AgentStat {
  agent_id: string;
  agent_name: string;
  total_leads: number;
  total_activities: number;
  calls_logged: number;
  site_visits: number;
}

interface PipelineStage {
  status: string;
  label: string;
  count: number;
  pct: number;
}

interface SourceRow {
  source: string;
  total: number;
  contacted: number;
  site_visits: number;
  won: number;
  conversion_rate: number;
}

interface AgentOption { id: string; full_name: string | null; }

// ── Helpers ───────────────────────────────────────────────────────────────────

const IST = 5.5 * 60 * 60 * 1000;

function computeDateRange(preset: string, customFrom: string, customTo: string) {
  const nowIST = new Date(Date.now() + IST);
  nowIST.setUTCHours(0, 0, 0, 0);
  const todayUTC = new Date(nowIST.getTime() - IST);
  const tomorrowUTC = new Date(todayUTC.getTime() + 86400_000);
  switch (preset) {
    case "today":      return { from: todayUTC.toISOString(), to: tomorrowUTC.toISOString() };
    case "yesterday":  return { from: new Date(todayUTC.getTime() - 86400_000).toISOString(), to: todayUTC.toISOString() };
    case "last7":      return { from: new Date(todayUTC.getTime() - 7 * 86400_000).toISOString(), to: tomorrowUTC.toISOString() };
    case "last14":     return { from: new Date(todayUTC.getTime() - 14 * 86400_000).toISOString(), to: tomorrowUTC.toISOString() };
    case "last30":     return { from: new Date(todayUTC.getTime() - 30 * 86400_000).toISOString(), to: tomorrowUTC.toISOString() };
    case "this_month": {
      const f = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), 1) - IST);
      return { from: f.toISOString(), to: tomorrowUTC.toISOString() };
    }
    case "last_month": {
      const f = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth() - 1, 1) - IST);
      const t = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), 1) - IST);
      return { from: f.toISOString(), to: t.toISOString() };
    }
    case "custom": return {
      from: customFrom ? new Date(customFrom).toISOString() : undefined,
      to: customTo ? new Date(new Date(customTo).getTime() + 86400_000).toISOString() : undefined,
    };
    default: return { from: undefined, to: undefined };
  }
}

function toIST(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

// Per-row idle time with normalized timestamp parsing
function computeIdleDisplay(lastActivityAt: string | null, createdAt: string): { label: string; colorClass: string; totalMinutes: number } {
  const raw = lastActivityAt ?? createdAt;
  const normalized = raw.includes("Z") || raw.includes("+") ? raw : raw + "Z";
  const diffMs = Date.now() - new Date(normalized).getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = totalMinutes / 60;
  const days = Math.floor(totalHours / 24);
  const remHours = Math.floor(totalHours % 24);
  const remMins = totalMinutes % 60;

  let label: string;
  if (totalMinutes < 60) {
    label = `${totalMinutes}m`;
  } else if (days > 0) {
    label = `${days}d ${remHours}h`;
  } else {
    label = `${Math.floor(totalHours)}h ${remMins}m`;
  }

  const colorClass =
    totalHours >= 72 ? "text-red-600 font-semibold" :
    totalHours >= 48 ? "text-amber-600 font-medium" :
    totalHours >= 24 ? "text-yellow-600" :
    "text-slate-400"; // 30m–24h: neutral gray

  return { label, colorClass, totalMinutes };
}

function buildParams(from?: string, to?: string, agentId?: string) {
  const p = new URLSearchParams();
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  if (agentId) p.set("agentId", agentId);
  return p.toString() ? `?${p.toString()}` : "";
}

// ── Tab: Unassigned ───────────────────────────────────────────────────────────

function UnassignedTab({ from, to, agents }: { from?: string; to?: string; agents: AgentOption[] }) {
  const [leads, setLeads] = useState<UnassignedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState<string | null>(null);
  const [bulkAgentId, setBulkAgentId] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/crm/reports/unassigned${buildParams(from, to)}`);
    const data = await res.json();
    setLeads(data.leads ?? []);
    setLoading(false);
  }, [from, to]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => setSelected(prev =>
    prev.size === leads.length ? new Set() : new Set(leads.map(l => l.id))
  );

  const assign = async (leadIds: string[], agentId: string) => {
    setAssigning(agentId);
    await Promise.all(leadIds.map(id =>
      fetch(`/api/crm/leads/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assigned_to: agentId }),
      })
    ));
    setAssigning(null);
    setSelected(new Set());
    fetchData();
  };

  if (loading) return <LoadingRow />;
  if (!leads.length) return <EmptyState message="No unassigned leads in this period." />;

  return (
    <div>
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{selected.size} selected</span>
          <select
            value={bulkAgentId}
            onChange={e => setBulkAgentId(e.target.value)}
            className="text-sm px-2 py-1 border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
          >
            <option value="">Assign to agent…</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.full_name ?? a.id}</option>)}
          </select>
          <button
            disabled={!bulkAgentId || assigning !== null}
            onClick={() => bulkAgentId && assign(Array.from(selected), bulkAgentId)}
            className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assigning ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
            Assign
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="py-2 pr-3 text-left w-8">
                <input type="checkbox" checked={selected.size === leads.length && leads.length > 0}
                  onChange={toggleAll} className="rounded" />
              </th>
              <th className="py-2 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
              <th className="py-2 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</th>
              <th className="py-2 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Source</th>
              <th className="py-2 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</th>
              <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Assign</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-2 pr-3">
                  <input type="checkbox" checked={selected.has(lead.id)} onChange={() => toggle(lead.id)} className="rounded" />
                </td>
                <td className="py-2 pr-3 font-medium">{lead.name ?? "—"}</td>
                <td className="py-2 pr-3 text-slate-500">{lead.phone ?? "—"}</td>
                <td className="py-2 pr-3 text-slate-500">
                  {lead.source_channel ?? lead.source_type ?? "—"}
                </td>
                <td className="py-2 pr-3 text-slate-400 text-xs">{toIST(lead.created_at)}</td>
                <td className="py-2">
                  <select
                    defaultValue=""
                    onChange={e => e.target.value && assign([lead.id], e.target.value)}
                    className="text-xs px-2 py-1 border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  >
                    <option value="">Assign…</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.full_name ?? a.id}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Lead Aging ───────────────────────────────────────────────────────────

function AgingTab({ from, to, agentId }: { from?: string; to?: string; agentId?: string }) {
  const [leads, setLeads] = useState<AgingLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/crm/reports/aging${buildParams(from, to, agentId)}`)
      .then(r => r.json())
      .then(d => { setLeads(d.leads ?? []); setLoading(false); });
  }, [from, to, agentId]);

  if (loading) return <LoadingRow />;
  if (!leads.length) return <EmptyState message="No stale leads in this period." />;

  // Summary counts
  const idle24plus = leads.filter(l => {
    const { totalMinutes } = computeIdleDisplay(l.last_activity_at, l.created_at);
    return totalMinutes >= 24 * 60;
  }).length;
  const idle48plus = leads.filter(l => {
    const { totalMinutes } = computeIdleDisplay(l.last_activity_at, l.created_at);
    return totalMinutes >= 48 * 60;
  }).length;
  const idle72plus = leads.filter(l => {
    const { totalMinutes } = computeIdleDisplay(l.last_activity_at, l.created_at);
    return totalMinutes >= 72 * 60;
  }).length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
          {leads.length} idle 30m+
        </span>
        <span className="px-3 py-1 rounded-full bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 font-medium">
          {idle24plus} idle 24h+
        </span>
        <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-medium">
          {idle48plus} idle 48h+
        </span>
        <span className="px-3 py-1 rounded-full bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 font-medium">
          {idle72plus} idle 72h+
        </span>
      </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            {["Name", "Phone", "Status", "Assigned To", "Created", "Last Activity", "Idle"].map(h => (
              <th key={h} className="py-2 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map(lead => {
            const { label: idleText, colorClass } = computeIdleDisplay(lead.last_activity_at, lead.created_at);
            return (
              <tr key={lead.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-2 pr-3 font-medium">{lead.name ?? "—"}</td>
                <td className="py-2 pr-3 text-slate-500">{lead.phone ?? "—"}</td>
                <td className="py-2 pr-3">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 capitalize">
                    {lead.status?.replace(/_/g, " ") ?? "new"}
                  </span>
                </td>
                <td className="py-2 pr-3 text-slate-500">{lead.agent_name}</td>
                <td className="py-2 pr-3 text-slate-400 text-xs">{toIST(lead.created_at)}</td>
                <td className="py-2 pr-3 text-slate-400 text-xs">{toIST(lead.last_activity_at)}</td>
                <td className={`py-2 pr-3 text-xs ${colorClass}`}>{idleText}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </div>
  );
}

// ── Tab: Agent Activity ───────────────────────────────────────────────────────

function AgentActivityTab({ from, to, agentId }: { from?: string; to?: string; agentId?: string }) {
  const [agents, setAgents] = useState<AgentStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/crm/reports/agent-activity${buildParams(from, to, agentId)}`)
      .then(r => r.json())
      .then(d => { setAgents(d.agents ?? []); setLoading(false); });
  }, [from, to, agentId]);

  if (loading) return <LoadingRow />;
  if (!agents.length) return <EmptyState message="No agent data available." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            {["Agent", "Leads Assigned", "Activities", "Calls Logged", "Site Visits"].map(h => (
              <th key={h} className="py-2 pr-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {agents.map(a => (
            <tr key={a.agent_id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="py-2 pr-4 font-medium">{a.agent_name}</td>
              <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">{a.total_leads}</td>
              <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">{a.total_activities}</td>
              <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">{a.calls_logged}</td>
              <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">{a.site_visits}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Tab: Pipeline ─────────────────────────────────────────────────────────────

function PipelineTab({ from, to, agentId }: { from?: string; to?: string; agentId?: string }) {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/crm/reports/pipeline${buildParams(from, to, agentId)}`)
      .then(r => r.json())
      .then(d => { setStages(d.stages ?? []); setTotal(d.total ?? 0); setLoading(false); });
  }, [from, to, agentId]);

  if (loading) return <LoadingRow />;

  const COLORS = ["#94a3b8","#60a5fa","#34d399","#a78bfa","#f59e0b","#10b981","#22c55e","#f87171"];

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500 dark:text-slate-400">Total leads: <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span></p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stages} layout="vertical" margin={{ left: 16, right: 24 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} width={100} />
            <Tooltip />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {stages.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            {["Stage", "Count", "% of Total"].map(h => (
              <th key={h} className="py-2 pr-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stages.map(s => (
            <tr key={s.status} className="border-b border-slate-100 dark:border-slate-800">
              <td className="py-2 pr-4 capitalize">{s.label}</td>
              <td className="py-2 pr-4 font-medium">{s.count}</td>
              <td className="py-2 pr-4 text-slate-500">{s.pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Tab: Source Performance ───────────────────────────────────────────────────

function SourcePerformanceTab({ from, to }: { from?: string; to?: string }) {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/crm/reports/source-performance${buildParams(from, to)}`)
      .then(r => r.json())
      .then(d => { setSources(d.sources ?? []); setLoading(false); });
  }, [from, to]);

  if (loading) return <LoadingRow />;
  if (!sources.length) return <EmptyState message="No source data available." />;

  return (
    <div className="space-y-6">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sources} margin={{ bottom: 40 }}>
            <XAxis dataKey="source" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="total" name="Total Leads" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            <Bar dataKey="won" name="Conversions" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              {["Source", "Total", "Contacted", "Site Visits", "Won", "Conv. Rate"].map(h => (
                <th key={h} className="py-2 pr-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sources.map(s => (
              <tr key={s.source} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-2 pr-4 font-medium">{s.source}</td>
                <td className="py-2 pr-4">{s.total}</td>
                <td className="py-2 pr-4">{s.contacted}</td>
                <td className="py-2 pr-4">{s.site_visits}</td>
                <td className="py-2 pr-4">{s.won}</td>
                <td className="py-2 pr-4">
                  <span className={`font-medium ${s.conversion_rate >= 10 ? "text-green-600" : s.conversion_rate >= 5 ? "text-amber-600" : "text-slate-500"}`}>
                    {s.conversion_rate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function LoadingRow() {
  return (
    <div className="flex items-center justify-center py-16 text-slate-400">
      <Loader2 className="w-5 h-5 animate-spin mr-2" />
      <span className="text-sm">Loading…</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="py-12 text-center text-sm text-slate-400">{message}</p>;
}

// ── Tab config ────────────────────────────────────────────────────────────────

const TABS = [
  { key: "unassigned", label: "Unassigned",        icon: UserX      },
  { key: "aging",      label: "Lead Aging",         icon: Clock      },
  { key: "agent",      label: "Agent Activity",     icon: Users      },
  { key: "pipeline",   label: "Pipeline",           icon: TrendingUp },
  { key: "source",     label: "Source Performance", icon: BarChart2  },
];

// FIX 1: Date range dropdown options
const DATE_OPTIONS = [
  { value: "all",        label: "All time" },
  { value: "today",      label: "Today" },
  { value: "yesterday",  label: "Yesterday" },
  { value: "last7",      label: "Last 7 days" },
  { value: "last14",     label: "Last 14 days" },
  { value: "last30",     label: "Last 30 days" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "custom",     label: "Custom range" },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminReportsClient() {
  const [activeTab, setActiveTab] = useState("unassigned");
  // FIX 1: default to last30
  const [datePreset, setDatePreset] = useState("last30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [agentId, setAgentId] = useState("");
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase
      .from("crm_users")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name")
      .then((res: { data: AgentOption[] | null }) => setAgents(res.data ?? []));
  }, [supabase]);

  const dateRange = useMemo(
    () => computeDateRange(datePreset, customFrom, customTo),
    [datePreset, customFrom, customTo]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Reports</h1>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Global filters — FIX 1: dropdown, FIX 2: agent always visible */}
      <div className="flex flex-wrap items-end gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
        {/* Date range dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-medium">Date range</label>
          <select
            value={datePreset}
            onChange={e => setDatePreset(e.target.value)}
            className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white"
          >
            {DATE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Custom date inputs */}
        {datePreset === "custom" && (
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 font-medium">From</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="text-sm px-2 py-1.5 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 font-medium">To</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="text-sm px-2 py-1.5 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
            </div>
          </div>
        )}

        {/* Agent dropdown — always visible on all tabs */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-medium">Agent</label>
          <select
            value={agentId}
            onChange={e => setAgentId(e.target.value)}
            className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white"
          >
            <option value="">All agents</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.full_name ?? a.id}</option>)}
          </select>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === key
                ? "border-slate-900 text-slate-900 dark:border-white dark:text-white"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div key={refreshKey} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
        {activeTab === "unassigned" && <UnassignedTab from={dateRange.from} to={dateRange.to} agents={agents} />}
        {activeTab === "aging"      && <AgingTab from={dateRange.from} to={dateRange.to} agentId={agentId || undefined} />}
        {activeTab === "agent"      && <AgentActivityTab from={dateRange.from} to={dateRange.to} agentId={agentId || undefined} />}
        {activeTab === "pipeline"   && <PipelineTab from={dateRange.from} to={dateRange.to} agentId={agentId || undefined} />}
        {activeTab === "source"     && <SourcePerformanceTab from={dateRange.from} to={dateRange.to} />}
      </div>
    </div>
  );
}
