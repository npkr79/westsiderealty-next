"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Row = Record<string, unknown>;

interface LeadRow {
  id: string;
  createdAt: string | null;
  updatedAt: string | null;
  status: string;
  source: string;
  agentId: string;
  location: string;
  assetClass: string;
  score: number;
  value: number;
}

interface DealRow {
  id: string;
  leadId: string | null;
  status: string;
  value: number;
  assignedTo: string;
  createdAt: string | null;
  closedAt: string | null;
}

interface ActivityRow {
  leadId: string;
  createdAt: string | null;
}

const FUNNEL_STAGES = [
  "new",
  "contacted",
  "discovery",
  "qualified",
  "capital_ready",
  "deal_evaluation",
  "negotiation",
  "closed",
] as const;

const asText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const asDate = (value: unknown): string | null => {
  const text = asText(value);
  if (!text) return null;
  const dt = new Date(text);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
};

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalize = (value: string | null | undefined): string =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

const formatInrCompact = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const inferAssetClass = (row: Row): string => {
  const direct = asText(row.asset_class) || asText(row.property_type) || asText(row.asset_type);
  if (direct) return direct;
  const source = normalize(asText(row.buyer_type) || asText(row.category));
  if (source.includes("office")) return "Office";
  if (source.includes("logistic") || source.includes("warehouse")) return "Logistics";
  if (source.includes("retail")) return "Retail";
  if (source.includes("residential") || source.includes("villa") || source.includes("apartment")) return "Residential";
  return "Alternatives";
};

const classifyStage = (status: string): string => {
  const key = normalize(status);
  if (key.includes("contact")) return "contacted";
  if (key.includes("discover")) return "discovery";
  if (key.includes("qual")) return "qualified";
  if (key.includes("capital_ready") || key.includes("token")) return "capital_ready";
  if (key.includes("evaluation") || key.includes("eval")) return "deal_evaluation";
  if (key.includes("negoti")) return "negotiation";
  if (key.includes("won") || key.includes("closed") || key.includes("book")) return "closed";
  return "new";
};

const stageProbability = (stage: string): number => {
  if (stage === "closed") return 1;
  if (stage === "negotiation") return 0.8;
  if (stage === "deal_evaluation") return 0.6;
  if (stage === "capital_ready") return 0.5;
  if (stage === "qualified") return 0.35;
  if (stage === "discovery") return 0.25;
  if (stage === "contacted") return 0.15;
  return 0.08;
};

export default function RevenuePipelineDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [assetClassFilter, setAssetClassFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const fmt = (value: Date) =>
      `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
    setDateFrom(fmt(start));
    setDateTo(fmt(now));
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [leadsRes, dealsRes, activitiesRes] = await Promise.all([
          supabase.from("crm_leads_view").select("*").order("created_at", { ascending: false }).limit(5000),
          supabase.from("crm_deals").select("*").order("created_at", { ascending: false }).limit(5000),
          supabase.from("crm_lead_activities").select("lead_id,created_at").order("created_at", { ascending: false }).limit(8000),
        ]);

        if (leadsRes.error) throw new Error(leadsRes.error.message || "Unable to load leads.");
        if (dealsRes.error) throw new Error(dealsRes.error.message || "Unable to load deals.");

        const mappedLeads: LeadRow[] = ((leadsRes.data as Row[]) || []).map((row) => ({
          id: asText(row.id) || crypto.randomUUID(),
          createdAt: asDate(row.created_at),
          updatedAt: asDate(row.updated_at),
          status: asText(row.stage_name) || asText(row.status) || "new",
          source: asText(row.source_channel) || asText(row.source_type) || asText(row.source_id) || "unknown",
          agentId: asText(row.assigned_to) || "unassigned",
          location: asText(row.location_preference) || asText(row.location) || asText(row.micro_market) || "unknown",
          assetClass: inferAssetClass(row),
          score: asNumber(row.score) || asNumber(row.intent_score) || 0,
          value: asNumber(row.budget_max) || asNumber(row.budget_min) || 0,
        }));
        setLeads(mappedLeads);

        const mappedDeals: DealRow[] = ((dealsRes.data as Row[]) || []).map((row) => ({
          id: asText(row.id) || crypto.randomUUID(),
          leadId: asText(row.lead_id),
          status: asText(row.status) || asText(row.stage) || "open",
          value: asNumber(row.value) || asNumber(row.amount) || 0,
          assignedTo: asText(row.assigned_to) || asText(row.owner_id) || "unassigned",
          createdAt: asDate(row.created_at),
          closedAt: asDate(row.closed_at) || asDate(row.updated_at),
        }));
        setDeals(mappedDeals);

        const mappedActivities: ActivityRow[] = ((activitiesRes.data as Row[]) || []).map((row) => ({
          leadId: asText(row.lead_id) || "",
          createdAt: asDate(row.created_at),
        })).filter((row) => row.leadId.length > 0);
        setActivities(mappedActivities);
      } catch (loadError: unknown) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load revenue dashboard.");
      } finally {
        setLoading(false);
      }
    };

    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [supabase]);

  const filteredLeads = useMemo(() => {
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
    return leads.filter((lead) => {
      if (assetClassFilter !== "all" && lead.assetClass !== assetClassFilter) return false;
      if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
      if (agentFilter !== "all" && lead.agentId !== agentFilter) return false;
      if (locationFilter !== "all" && lead.location !== locationFilter) return false;
      if (lead.createdAt && (from || to)) {
        const dt = new Date(lead.createdAt);
        if (from && dt < from) return false;
        if (to && dt > to) return false;
      }
      return true;
    });
  }, [agentFilter, assetClassFilter, dateFrom, dateTo, leads, locationFilter, sourceFilter]);

  const filteredDeals = useMemo(() => {
    const leadIds = new Set(filteredLeads.map((lead) => lead.id));
    return deals.filter((deal) => !deal.leadId || leadIds.has(deal.leadId));
  }, [deals, filteredLeads]);

  const filterOptions = useMemo(() => {
    const assets = Array.from(new Set(leads.map((lead) => lead.assetClass))).sort((a, b) => a.localeCompare(b));
    const sources = Array.from(new Set(leads.map((lead) => lead.source))).sort((a, b) => a.localeCompare(b));
    const agents = Array.from(new Set(leads.map((lead) => lead.agentId))).sort((a, b) => a.localeCompare(b));
    const locations = Array.from(new Set(leads.map((lead) => lead.location))).sort((a, b) => a.localeCompare(b));
    return { assets, sources, agents, locations };
  }, [leads]);

  const topSummary = useMemo(() => {
    const now = new Date();
    const next90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const activeStatuses = new Set(["open", "new", "contacted", "evaluation", "negotiation", "qualified", "discovery"]);
    const pipelineValue = filteredDeals
      .filter((deal) => !/closed|won|lost/i.test(deal.status))
      .reduce((sum, deal) => sum + deal.value, 0);
    const activeInvestors = filteredLeads.filter((lead) => /investor|institution|fund|hni/i.test(lead.assetClass + lead.status)).length;
    const evaluationCount = filteredDeals.filter((deal) => /evaluation|qualified|discovery/i.test(normalize(deal.status))).length;
    const negotiationCount = filteredDeals.filter((deal) => /negoti/i.test(normalize(deal.status))).length;
    const expectedRevenue90 = filteredDeals.reduce((sum, deal) => {
      const stage = classifyStage(deal.status);
      return sum + deal.value * stageProbability(stage);
    }, 0);
    const cycleDays = filteredDeals
      .filter((deal) => /closed|won/.test(normalize(deal.status)) && deal.createdAt && deal.closedAt)
      .map((deal) => {
        const start = new Date(deal.createdAt as string).getTime();
        const end = new Date(deal.closedAt as string).getTime();
        return (end - start) / (1000 * 60 * 60 * 24);
      })
      .filter((value) => Number.isFinite(value) && value >= 0);
    const avgCycle = cycleDays.length ? cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length : 0;

    return {
      pipelineValue,
      activeInvestors,
      evaluationCount,
      negotiationCount,
      expectedRevenue90,
      avgCycle,
      activeDeals: filteredDeals.filter((deal) => activeStatuses.has(normalize(deal.status))).length,
      next90Boundary: next90,
    };
  }, [filteredDeals, filteredLeads]);

  const funnelRows = useMemo(() => {
    const total = filteredLeads.length || 1;
    return FUNNEL_STAGES.map((stage) => {
      const stageLeads = filteredLeads.filter((lead) => classifyStage(lead.status) === stage);
      const value = stageLeads.reduce((sum, lead) => sum + lead.value, 0);
      return {
        stage: stage.replace(/_/g, " "),
        count: stageLeads.length,
        value,
        conversionPct: (stageLeads.length / total) * 100,
      };
    });
  }, [filteredLeads]);

  const sourcePerformance = useMemo(() => {
    const grouped = new Map<string, { leads: number; closed: number; capital: number }>();
    for (const lead of filteredLeads) {
      const row = grouped.get(lead.source) || { leads: 0, closed: 0, capital: 0 };
      row.leads += 1;
      if (classifyStage(lead.status) === "closed") row.closed += 1;
      row.capital += lead.value;
      grouped.set(lead.source, row);
    }
    return Array.from(grouped.entries())
      .map(([source, stats]) => ({
        source,
        leads: stats.leads,
        conversion: stats.leads ? (stats.closed / stats.leads) * 100 : 0,
        capital: stats.capital,
      }))
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 8);
  }, [filteredLeads]);

  const assetCapitalFlow = useMemo(() => {
    const buckets = ["Office", "Logistics", "Retail", "Residential", "Alternatives"];
    const grouped = new Map(buckets.map((bucket) => [bucket, 0]));
    for (const lead of filteredLeads) {
      const key = buckets.includes(lead.assetClass) ? lead.assetClass : "Alternatives";
      grouped.set(key, (grouped.get(key) || 0) + lead.value);
    }
    return buckets.map((bucket) => ({ assetClass: bucket, capital: grouped.get(bucket) || 0 }));
  }, [filteredLeads]);

  const agentPerformance = useMemo(() => {
    const leadByAgent = new Map<string, LeadRow[]>();
    for (const lead of filteredLeads) {
      const list = leadByAgent.get(lead.agentId) || [];
      list.push(lead);
      leadByAgent.set(lead.agentId, list);
    }

    const activityByLead = new Map<string, ActivityRow[]>();
    for (const activity of activities) {
      const list = activityByLead.get(activity.leadId) || [];
      list.push(activity);
      activityByLead.set(activity.leadId, list);
    }

    return Array.from(leadByAgent.entries())
      .map(([agentId, agentLeads]) => {
        const closedDeals = filteredDeals.filter((deal) => deal.assignedTo === agentId && /closed|won/i.test(deal.status)).length;
        const totalDeals = filteredDeals.filter((deal) => deal.assignedTo === agentId).length;
        const pipelineValue = filteredDeals
          .filter((deal) => deal.assignedTo === agentId && !/closed|won|lost/i.test(deal.status))
          .reduce((sum, deal) => sum + deal.value, 0);
        const conversionRate = totalDeals ? (closedDeals / totalDeals) * 100 : 0;

        const responseHours: number[] = [];
        for (const lead of agentLeads) {
          if (!lead.createdAt) continue;
          const all = activityByLead.get(lead.id) || [];
          const first = all
            .map((item) => item.createdAt)
            .filter((value): value is string => Boolean(value))
            .sort((a, b) => a.localeCompare(b))[0];
          if (!first) continue;
          const diff = (new Date(first).getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60);
          if (Number.isFinite(diff) && diff >= 0) responseHours.push(diff);
        }
        const avgResponse = responseHours.length ? responseHours.reduce((a, b) => a + b, 0) / responseHours.length : 0;

        return {
          agentId,
          dealsClosed: closedDeals,
          pipelineValue,
          conversionRate,
          avgResponse,
        };
      })
      .sort((a, b) => b.pipelineValue - a.pipelineValue)
      .slice(0, 12);
  }, [activities, filteredDeals, filteredLeads]);

  const leadAging = useMemo(() => {
    const now = Date.now();
    const inactive7 = filteredLeads.filter((lead) => {
      const updated = lead.updatedAt ? new Date(lead.updatedAt).getTime() : 0;
      return updated > 0 && (now - updated) / (1000 * 60 * 60 * 24) > 7;
    }).length;
    const inactive30 = filteredLeads.filter((lead) => {
      const updated = lead.updatedAt ? new Date(lead.updatedAt).getTime() : 0;
      return updated > 0 && (now - updated) / (1000 * 60 * 60 * 24) > 30;
    }).length;
    const highScoreInactive = filteredLeads.filter((lead) => {
      const updated = lead.updatedAt ? new Date(lead.updatedAt).getTime() : 0;
      const days = updated > 0 ? (now - updated) / (1000 * 60 * 60 * 24) : 0;
      return lead.score >= 70 && days > 7;
    }).length;
    return { inactive7, inactive30, highScoreInactive };
  }, [filteredLeads]);

  const forecast = useMemo(() => {
    const result = { next30: 0, next60: 0, next90: 0 };
    for (const deal of filteredDeals) {
      const stage = classifyStage(deal.status);
      if (/closed|won|lost/i.test(deal.status)) continue;
      const weighted = deal.value * stageProbability(stage);
      if (stage === "negotiation") result.next30 += weighted;
      else if (stage === "deal_evaluation" || stage === "capital_ready") result.next60 += weighted;
      else result.next90 += weighted;
    }
    return result;
  }, [filteredDeals]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-5">
          <div className="grid grid-cols-2 gap-2 md:col-span-2">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <Select value={assetClassFilter} onValueChange={setAssetClassFilter}>
            <SelectTrigger><SelectValue placeholder="Asset class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All asset classes</SelectItem>
              {filterOptions.assets.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {filterOptions.sources.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger><SelectValue placeholder="Agent" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All agents</SelectItem>
                {filterOptions.agents.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {filterOptions.locations.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading revenue dashboard...</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Total pipeline value</p><p className="text-3xl font-semibold">{formatInrCompact(topSummary.pipelineValue)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Active investors</p><p className="text-3xl font-semibold">{topSummary.activeInvestors}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Deals in evaluation</p><p className="text-3xl font-semibold">{topSummary.evaluationCount}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Deals in negotiation</p><p className="text-3xl font-semibold">{topSummary.negotiationCount}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Expected revenue (90d)</p><p className="text-3xl font-semibold">{formatInrCompact(topSummary.expectedRevenue90)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Avg deal cycle time</p><p className="text-3xl font-semibold">{topSummary.avgCycle.toFixed(1)}d</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Pipeline Funnel</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {funnelRows.map((row) => (
            <div key={row.stage} className="rounded-md border p-2 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium capitalize">{row.stage}</p>
                <p>{row.count} · {formatInrCompact(row.value)} · {row.conversionPct.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Leads by source</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourcePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="source" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="leads" fill="#0f172a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Conversion by source</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourcePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="source" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="conversion" fill="#334155" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Capital by source</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourcePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="source" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="capital" fill="#64748b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Asset Class Capital Flow</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={assetCapitalFlow}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="assetClass" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="capital" fill="#1e293b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Agent Performance</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Deals closed</TableHead>
                <TableHead>Pipeline value</TableHead>
                <TableHead>Conversion rate</TableHead>
                <TableHead>Avg response time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentPerformance.length === 0 ? (
                <TableRow><TableCell colSpan={5}>No agent data available.</TableCell></TableRow>
              ) : (
                agentPerformance.map((row) => (
                  <TableRow key={row.agentId} className="cursor-pointer" onClick={() => router.push(`/dashboard/agent?agentId=${encodeURIComponent(row.agentId)}`)}>
                    <TableCell className="font-medium">{row.agentId}</TableCell>
                    <TableCell>{row.dealsClosed}</TableCell>
                    <TableCell>{formatInrCompact(row.pipelineValue)}</TableCell>
                    <TableCell>{row.conversionRate.toFixed(1)}%</TableCell>
                    <TableCell>{row.avgResponse.toFixed(1)}h</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Leads stuck &gt; 7 days</p><p className="text-3xl font-semibold">{leadAging.inactive7}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Leads stuck &gt; 30 days</p><p className="text-3xl font-semibold">{leadAging.inactive30}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">High score but inactive</p><p className="text-3xl font-semibold">{leadAging.highScoreInactive}</p></CardContent></Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Forecast next 30 days</p><p className="text-3xl font-semibold">{formatInrCompact(forecast.next30)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Forecast next 60 days</p><p className="text-3xl font-semibold">{formatInrCompact(forecast.next60)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Forecast next 90 days</p><p className="text-3xl font-semibold">{formatInrCompact(forecast.next90)}</p></CardContent></Card>
      </div>
    </div>
  );
}

