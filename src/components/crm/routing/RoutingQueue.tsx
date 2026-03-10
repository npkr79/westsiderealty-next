"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLeads, type LeadsFilters } from "@/hooks/useLeads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBudgetRange, getLeadBudgetValue } from "@/lib/crm/budget";

interface AgentOption {
  id: string;
  full_name: string | null;
}

interface InsightLeadRow {
  assigned_to: string | null;
  assigned_agent_name: string | null;
  stage_name: string | null;
  stage_id: string | null;
  status: string | null;
}

interface AgentWorkload {
  total: number;
  activeDeals: number;
}

const SLA_WARNING_MINUTES = 45;
const SLA_BREACH_MINUTES = 120;

const MINUTE = 60 * 1000;

const getLeadAgeMinutes = (createdAt: string | undefined, nowMs: number): number | null => {
  if (!createdAt) return null;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return null;
  return Math.max(0, Math.floor((nowMs - created.getTime()) / MINUTE));
};

const getTimelineKey = (createdAt?: string): "today" | "yesterday" | "this_week" | "older" => {
  if (!createdAt) return "older";
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return "older";
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  if (diffMs < 24 * 60 * MINUTE) return "today";
  if (diffMs < 48 * 60 * MINUTE) return "yesterday";
  if (diffMs < 7 * 24 * 60 * MINUTE) return "this_week";
  return "older";
};

const formatAge = (minutes: number | null): string => {
  if (minutes === null) return "-";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return `${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
};

const normalizeStatus = (value: string | null | undefined): string => {
  const raw = (value || "").toLowerCase().replace(/[\s-]+/g, "_");
  return raw || "unknown";
};

const isActiveDealStatus = (value: string | null | undefined): boolean => {
  const normalized = normalizeStatus(value);
  return !["won", "lost", "closed", "dropped", "cancelled", "canceled"].includes(normalized);
};

export default function RoutingQueue() {
  const supabase = useMemo(() => createClient(), []);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<LeadsFilters>({ unassignedOnly: true });
  const [timeline, setTimeline] = useState<string>("all");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Record<string, boolean>>({});
  const [bulkAgentId, setBulkAgentId] = useState<string>("none");
  const [bulkNote, setBulkNote] = useState("");
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [selectedAgentByLead, setSelectedAgentByLead] = useState<Record<string, string>>({});
  const [noteByLead, setNoteByLead] = useState<Record<string, string>>({});
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [assigningLeadId, setAssigningLeadId] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [insightRows, setInsightRows] = useState<InsightLeadRow[]>([]);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileMessage, setReconcileMessage] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState<number>(0);

  const { leads, loading, error, refetch } = useLeads({
    page: 1,
    pageSize: 200,
    search,
    filters,
    sort: { key: "created_at", ascending: false },
  });

  useEffect(() => {
    const initTimer = window.setTimeout(() => setNowTick(Date.now()), 0);
    const timer = window.setInterval(() => setNowTick(Date.now()), MINUTE);
    return () => {
      window.clearTimeout(initTimer);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const loadAgents = async () => {
      const { data } = await supabase
        .from("crm_users")
        .select("id,full_name,crm_roles(name)")
        .eq("is_active", true)
        .order("full_name", { ascending: true });

      const filtered = ((data || []) as Array<{ id: string; full_name: string | null; crm_roles: { name: string } | { name: string }[] | null }>)
        .filter((user) => {
          const roleName = Array.isArray(user.crm_roles) ? user.crm_roles[0]?.name : user.crm_roles?.name;
          const normalized = (roleName || "").toLowerCase().replace(/[\s-]+/g, "_");
          return normalized === "agent" || normalized === "team_lead";
        })
        .map((user) => ({ id: user.id, full_name: user.full_name }));

      setAgents(filtered);
    };
    loadAgents();
  }, [supabase]);

  const loadInsights = useCallback(async () => {
    const selectVariants = [
      "assigned_to,assigned_agent_name,status",
      "assigned_to,status",
    ];
    for (const selectClause of selectVariants) {
      const { data, error: queryError } = await supabase.from("crm_leads_view").select(selectClause).limit(5000);
      if (!queryError) {
        setInsightRows((data as InsightLeadRow[]) || []);
        return;
      }
      const message = queryError.message || "";
      if (!/column .* does not exist/i.test(message)) {
        setInsightRows([]);
        return;
      }
    }
    setInsightRows([]);
  }, [supabase]);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  useEffect(() => {
    const channel = supabase
      .channel("crm-routing-insights-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_leads" }, () => {
        void loadInsights();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadInsights, supabase]);

  const filteredLeads = useMemo(() => {
    const minAmount = Number(budgetMin);
    const maxAmount = Number(budgetMax);
    return leads.filter((lead) => {
      if (timeline !== "all" && getTimelineKey(lead.created_at) !== timeline) return false;
      const parsed = getLeadBudgetValue({ budget_min: lead.budget_min, budget_max: lead.budget_max });
      if (Number.isFinite(minAmount) && minAmount > 0 && parsed < minAmount) return false;
      if (Number.isFinite(maxAmount) && maxAmount > 0 && parsed > maxAmount) return false;
      return true;
    });
  }, [budgetMax, budgetMin, leads, timeline]);

  const sourceOptions = useMemo(() => {
    const set = new Set<string>();
    for (const lead of leads) {
      const source = lead.source_channel || lead.source_type || lead.source;
      if (source) set.add(source);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [leads]);

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    for (const lead of leads) {
      if (lead.location) set.add(lead.location);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [leads]);

  const buyerTypeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const lead of leads) {
      if (lead.buyer_type) set.add(lead.buyer_type);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [leads]);

  const activeLead = useMemo(
    () => filteredLeads.find((lead) => lead.id === activeLeadId) || filteredLeads[0] || null,
    [filteredLeads, activeLeadId]
  );

  const activeLeadSafeId =
    activeLead?.id && filteredLeads.some((lead) => lead.id === activeLead.id) ? activeLead.id : (filteredLeads[0]?.id ?? null);

  const slaSummary = useMemo(() => {
    let warning = 0;
    let breach = 0;
    for (const lead of filteredLeads) {
      const age = getLeadAgeMinutes(lead.created_at, nowTick);
      if (age === null) continue;
      if (age >= SLA_BREACH_MINUTES) breach += 1;
      else if (age >= SLA_WARNING_MINUTES) warning += 1;
    }
    return { warning, breach };
  }, [filteredLeads, nowTick]);

  const agentWorkload = useMemo(() => {
    const map = new Map<string, AgentWorkload>();
    for (const row of insightRows) {
      const agentId = row.assigned_to;
      if (!agentId) continue;
      const current = map.get(agentId) || { total: 0, activeDeals: 0 };
      current.total += 1;
      if (isActiveDealStatus(row.status || row.stage_name || row.stage_id)) current.activeDeals += 1;
      map.set(agentId, current);
    }
    return map;
  }, [insightRows]);

  const stageDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of insightRows) {
      const key = row.stage_name || row.stage_id || row.status || "Unstaged";
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [insightRows]);

  const leadsPerAgent = useMemo(() => {
    const map = new Map<string, { agentName: string; count: number }>();
    for (const row of insightRows) {
      if (!row.assigned_to) continue;
      const agentName = row.assigned_agent_name || row.assigned_to;
      const current = map.get(row.assigned_to) || { agentName, count: 0 };
      current.count += 1;
      map.set(row.assigned_to, current);
    }
    return Array.from(map.entries())
      .map(([agentId, value]) => ({ agentId, ...value }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [insightRows]);

  const selectedCount = useMemo(() => filteredLeads.filter((lead) => selectedLeadIds[lead.id]).length, [filteredLeads, selectedLeadIds]);

  const allSelected = filteredLeads.length > 0 && filteredLeads.every((lead) => selectedLeadIds[lead.id]);

  const assignLead = async (leadId: string) => {
    const agentId = selectedAgentByLead[leadId];
    if (!agentId || agentId === "none") {
      setAssignError("Select an agent before assigning.");
      return;
    }
    setAssignError(null);
    setAssigningLeadId(leadId);
    const note = noteByLead[leadId] || "";

    const response = await fetch("/api/crm/routing/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, agentId, note }),
    });

    setAssigningLeadId(null);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setAssignError(payload?.error || "Failed to assign lead.");
      return;
    }
    setSelectedAgentByLead((prev) => ({ ...prev, [leadId]: "none" }));
    setNoteByLead((prev) => ({ ...prev, [leadId]: "" }));
    refetch();
    void loadInsights();
  };

  const assignBulk = async () => {
    const leadIds = filteredLeads.filter((lead) => selectedLeadIds[lead.id]).map((lead) => lead.id);
    if (!leadIds.length) {
      setAssignError("Select at least one lead for bulk assignment.");
      return;
    }
    if (!bulkAgentId || bulkAgentId === "none") {
      setAssignError("Select an agent for bulk assignment.");
      return;
    }
    setAssignError(null);
    setBulkAssigning(true);
    const response = await fetch("/api/crm/routing/bulk-assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadIds, agentId: bulkAgentId, note: bulkNote }),
    });
    setBulkAssigning(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setAssignError(payload?.error || "Bulk assignment failed.");
      return;
    }
    setSelectedLeadIds({});
    setBulkAgentId("none");
    setBulkNote("");
    refetch();
    void loadInsights();
  };

  const reconcileAutoRouting = async () => {
    setReconciling(true);
    setReconcileMessage(null);
    const response = await fetch("/api/crm/routing/reconcile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 200 }),
    });
    setReconciling(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setReconcileMessage(payload?.error || "Auto-routing reconciliation failed.");
      return;
    }
    const payload = await response.json();
    setReconcileMessage(`Processed ${payload.processed} leads • Auto-assigned ${payload.assigned}`);
    refetch();
    void loadInsights();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Lead War Room filters</span>
            <span className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Zap className="h-3.5 w-3.5" />
              Live updates
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-7">
          <Input placeholder="Search name or phone" value={search} onChange={(e) => setSearch(e.target.value)} className="md:col-span-2" />
          <Input placeholder="Budget min (number)" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
          <Input placeholder="Budget max (number)" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
          <Select value={filters.source || "all"} onValueChange={(value) => setFilters((prev) => ({ ...prev, source: value === "all" ? undefined : value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {sourceOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.location || "all"} onValueChange={(value) => setFilters((prev) => ({ ...prev, location: value === "all" ? undefined : value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locationOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.buyerType || "all"} onValueChange={(value) => setFilters((prev) => ({ ...prev, buyerType: value === "all" ? undefined : value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Buyer type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All buyer types</SelectItem>
              {buyerTypeOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeline} onValueChange={setTimeline}>
            <SelectTrigger>
              <SelectValue placeholder="Timeline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All timelines</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="this_week">This week</SelectItem>
              <SelectItem value="older">Older backlog</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-4">
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Queue size</p>
            <p className="mt-1 text-2xl font-semibold">{filteredLeads.length}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">SLA warning</p>
            <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-300">{slaSummary.warning}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">SLA breach</p>
            <p className="mt-1 text-2xl font-semibold text-rose-600 dark:text-rose-300">{slaSummary.breach}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Selected for bulk assign</p>
            <p className="mt-1 text-2xl font-semibold">{selectedCount}</p>
          </div>
          <div className="sm:col-span-3 flex justify-end">
            <Button type="button" variant="outline" onClick={reconcileAutoRouting} disabled={reconciling}>
            {reconciling ? "Reconciling..." : "Run auto-routing now"}
          </Button>
          </div>
        </CardContent>
      </Card>

      {reconcileMessage ? <p className="text-sm text-slate-600 dark:text-slate-300">{reconcileMessage}</p> : null}
      {assignError ? <p className="text-sm text-rose-600 dark:text-rose-300">{assignError}</p> : null}
      {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
      {loading ? <p className="text-sm">Loading routing queue...</p> : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Bulk assignment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-4">
          <Select value={bulkAgentId} onValueChange={setBulkAgentId}>
            <SelectTrigger>
              <SelectValue placeholder="Assign selected leads to" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select agent</SelectItem>
              {agents.map((agent) => {
                const workload = agentWorkload.get(agent.id) || { total: 0, activeDeals: 0 };
                return (
                  <SelectItem key={agent.id} value={agent.id}>
                    {(agent.full_name || agent.id) + ` • ${workload.total} leads • ${workload.activeDeals} active`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Textarea
            className="md:col-span-2"
            placeholder="Bulk assignment note"
            value={bulkNote}
            onChange={(e) => setBulkNote(e.target.value)}
          />
          <Button type="button" disabled={bulkAssigning || selectedCount === 0} onClick={assignBulk}>
            {bulkAssigning ? "Assigning..." : `Assign ${selectedCount} lead(s)`}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Leads per agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leadsPerAgent.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No assigned leads yet.</p>
            ) : (
              leadsPerAgent.map((item) => (
                <div key={item.agentId} className="flex items-center justify-between rounded-md border px-2 py-1.5 text-sm">
                  <span className="truncate pr-2">{item.agentName}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Stage distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stageDistribution.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No stage data yet.</p>
            ) : (
              stageDistribution.map((item) => (
                <div key={item.stage} className="flex items-center justify-between rounded-md border px-2 py-1.5 text-sm">
                  <span className="truncate pr-2">{item.stage}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Agent workload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agents.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No active agents found.</p>
            ) : (
              agents.map((agent) => {
                const workload = agentWorkload.get(agent.id) || { total: 0, activeDeals: 0 };
                return (
                  <div key={agent.id} className="rounded-md border px-2 py-1.5 text-sm">
                    <p className="font-medium">{agent.full_name || agent.id}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{workload.total} total leads • {workload.activeDeals} active deals</p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Unassigned leads</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredLeads.length === 0 ? (
              <p className="py-6 text-sm text-slate-500 dark:text-slate-400">No unassigned leads in queue.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) => {
                          const next = Boolean(checked);
                          setSelectedLeadIds((prev) => {
                            const draft = { ...prev };
                            for (const lead of filteredLeads) draft[lead.id] = next;
                            return draft;
                          });
                        }}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Quick assign</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => {
                    const age = getLeadAgeMinutes(lead.created_at, nowTick);
                    const isWarning = (age ?? 0) >= SLA_WARNING_MINUTES;
                    const isBreach = (age ?? 0) >= SLA_BREACH_MINUTES;
                    return (
                      <TableRow
                        key={lead.id}
                        className={`cursor-pointer ${activeLeadSafeId === lead.id ? "bg-slate-100 dark:bg-slate-800/60" : ""}`}
                        onClick={() => setActiveLeadId(lead.id)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={Boolean(selectedLeadIds[lead.id])}
                            onCheckedChange={(checked) => setSelectedLeadIds((prev) => ({ ...prev, [lead.id]: Boolean(checked) }))}
                          />
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{lead.name || "-"}</p>
                        </TableCell>
                        <TableCell>{lead.phone || "-"}</TableCell>
                        <TableCell>{formatBudgetRange(lead.budget_min, lead.budget_max)}</TableCell>
                        <TableCell>{lead.location || "-"}</TableCell>
                        <TableCell>{lead.source_channel || lead.source_type || lead.source || "-"}</TableCell>
                        <TableCell>{lead.stage_name || lead.status || "-"}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex min-w-56 items-center gap-2">
                            <Select
                              value={selectedAgentByLead[lead.id] || "none"}
                              onValueChange={(value) => setSelectedAgentByLead((prev) => ({ ...prev, [lead.id]: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select agent" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Select agent</SelectItem>
                                {agents.map((agent) => {
                                  const workload = agentWorkload.get(agent.id) || { total: 0, activeDeals: 0 };
                                  return (
                                    <SelectItem key={agent.id} value={agent.id}>
                                      {(agent.full_name || agent.id) + ` • ${workload.total}/${workload.activeDeals}`}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <Button size="sm" type="button" onClick={() => assignLead(lead.id)} disabled={assigningLeadId === lead.id}>
                              {assigningLeadId === lead.id ? "..." : "Assign"}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isBreach ? (
                            <Badge variant="destructive">Breach</Badge>
                          ) : isWarning ? (
                            <Badge className="border-transparent bg-amber-500 text-white hover:bg-amber-500">Warning</Badge>
                          ) : (
                            <Badge variant="secondary">Healthy</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick lead preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeLead ? (
                <>
                  <div>
                    <p className="text-lg font-semibold">{activeLead.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{activeLead.phone}</p>
                  </div>
                  <div className="grid gap-2 text-sm">
                    <p><span className="font-medium">Location:</span> {activeLead.location || "-"}</p>
                    <p><span className="font-medium">Buyer type:</span> {activeLead.buyer_type || "-"}</p>
                    <p><span className="font-medium">Source:</span> {activeLead.source_channel || activeLead.source_type || activeLead.source || "-"}</p>
                    <p><span className="font-medium">Stage:</span> {activeLead.stage_name || activeLead.status || "-"}</p>
                    <p><span className="font-medium">Campaign:</span> {activeLead.campaign_name || activeLead.campaign_id || "-"}</p>
                    <p><span className="font-medium">Micro-market:</span> {activeLead.micro_market || "-"}</p>
                    <p><span className="font-medium">Received:</span> {activeLead.created_at ? new Date(activeLead.created_at).toLocaleString() : "-"}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Select a lead to preview.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Assign lead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!activeLead ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Pick a lead first.</p>
              ) : (
                <>
                  <Select
                    value={selectedAgentByLead[activeLead.id] || "none"}
                    onValueChange={(value) => setSelectedAgentByLead((prev) => ({ ...prev, [activeLead.id]: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select agent</SelectItem>
                      {agents.map((agent) => {
                        const workload = agentWorkload.get(agent.id) || { total: 0, activeDeals: 0 };
                        return (
                          <SelectItem key={agent.id} value={agent.id}>
                            {(agent.full_name || agent.id) + ` • ${workload.total} leads • ${workload.activeDeals} active`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Assignment note"
                    value={noteByLead[activeLead.id] || ""}
                    onChange={(e) => setNoteByLead((prev) => ({ ...prev, [activeLead.id]: e.target.value }))}
                  />
                  <Button type="button" onClick={() => assignLead(activeLead.id)} disabled={assigningLeadId === activeLead.id} className="w-full">
                    {assigningLeadId === activeLead.id ? "Assigning..." : "Assign now"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {slaSummary.breach > 0 ? (
        <Card className="border-rose-300 bg-rose-50/60 dark:border-rose-800 dark:bg-rose-950/20">
          <CardContent className="flex items-center gap-2 pt-6 text-sm text-rose-700 dark:text-rose-300">
            <AlertTriangle className="h-4 w-4" />
            SLA alert: {slaSummary.breach} lead(s) breached response SLA and need immediate routing.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
