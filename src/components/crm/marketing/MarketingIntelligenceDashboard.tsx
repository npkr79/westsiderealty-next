"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type GenericRow = Record<string, unknown>;

const num = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const str = (value: unknown, fallback = ""): string => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const classifySegment = (buyerType: string): "Investor" | "End User" | "Other" => {
  const norm = buyerType.toLowerCase();
  if (/investor|institution|fund|hni|commercial/i.test(norm)) return "Investor";
  if (/end|self|family|residential|home/i.test(norm)) return "End User";
  return "Other";
};

const COLORS = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1"];

export default function MarketingIntelligenceDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const [crmLeads, setCrmLeads] = useState<GenericRow[]>([]);
  const [campaignRows, setCampaignRows] = useState<GenericRow[]>([]);
  const [creativeRows, setCreativeRows] = useState<GenericRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: leadsData, error: leadsError } = await supabase
          .from("crm_leads_view")
          .select("id,source_name,source_type,status,micro_market,campaign_name,campaign_id,buyer_type,budget_min,budget_max,created_at")
          .order("created_at", { ascending: false })
          .limit(2000);
        if (leadsError) throw new Error(`Schema validation failed for crm_leads_view: ${leadsError.message || "Unknown query error."}`);
        setCrmLeads((leadsData || []) as GenericRow[]);

        const { data: campaignData, error: campaignError } = await supabase.from("crm_campaign_performance").select("*").limit(500);
        if (campaignError) {
          throw new Error(`Schema validation failed for crm_campaign_performance: ${campaignError.message || "Unknown query error."}`);
        }
        setCampaignRows((campaignData || []) as GenericRow[]);

        const { data: creativeData, error: creativeError } = await supabase.from("crm_creative_performance").select("*").limit(500);
        if (creativeError) {
          throw new Error(`Schema validation failed for crm_creative_performance: ${creativeError.message || "Unknown query error."}`);
        }
        setCreativeRows((creativeData || []) as GenericRow[]);
      } catch (loadError: unknown) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load marketing intelligence.");
      } finally {
        setLoading(false);
      }
    };

    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [supabase]);

  const leadsBySource = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of crmLeads) {
      const source = str(row.source_name) || str(row.source_type) || "unknown";
      map.set(source, (map.get(source) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([source, leads]) => ({ source, leads }))
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 10);
  }, [crmLeads]);

  const conversionByMicroMarket = useMemo(() => {
    const map = new Map<string, { total: number; converted: number }>();
    for (const row of crmLeads) {
      const market = str(row.micro_market, "unclassified");
      const existing = map.get(market) || { total: 0, converted: 0 };
      existing.total += 1;
      const status = str(row.status).toLowerCase();
      if (status === "won" || status === "converted" || status === "closed_won") {
        existing.converted += 1;
      }
      map.set(market, existing);
    }
    return Array.from(map.entries())
      .map(([micro_market, values]) => ({
        micro_market,
        conversion_pct: values.total > 0 ? Math.round((values.converted / values.total) * 100) : 0,
        converted: values.converted,
        total: values.total,
      }))
      .sort((a, b) => b.conversion_pct - a.conversion_pct)
      .slice(0, 10);
  }, [crmLeads]);

  const campaignPerformance = useMemo(() => {
    return campaignRows
      .map((row) => ({
        campaign: str(row.campaign_name) || str(row.name) || str(row.campaign_id) || "unnamed",
        spend: num(row.spend) || num(row.budget_spent),
        revenue: num(row.revenue) || num(row.realized_revenue),
        leads: num(row.leads) || num(row.total_leads),
        qualified: num(row.qualified_leads) || num(row.mql),
      }))
      .slice(0, 12);
  }, [campaignRows]);

  const cplByCampaign = useMemo(() => {
    return campaignPerformance
      .map((row) => ({
        campaign: row.campaign,
        cpl: row.qualified > 0 ? Math.round(row.spend / row.qualified) : 0,
      }))
      .sort((a, b) => a.cpl - b.cpl)
      .slice(0, 10);
  }, [campaignPerformance]);

  const budgetVsRevenue = useMemo(
    () =>
      campaignPerformance
        .map((row) => ({
          campaign: row.campaign,
          spend: Math.round(row.spend),
          revenue: Math.round(row.revenue),
        }))
        .slice(0, 10),
    [campaignPerformance]
  );

  const topCreatives = useMemo(() => {
    return creativeRows
      .map((row) => ({
        creative: str(row.creative_name) || str(row.name) || "Creative",
        score: num(row.performance_score) || num(row.conversions) || num(row.qualified_leads),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [creativeRows]);

  const segmentation = useMemo(() => {
    const segmentMap = new Map<string, number>();
    for (const row of crmLeads) {
      const segment = classifySegment(str(row.buyer_type, "other"));
      segmentMap.set(segment, (segmentMap.get(segment) || 0) + 1);
    }
    return Array.from(segmentMap.entries()).map(([segment, value]) => ({ segment, value }));
  }, [crmLeads]);

  const qualifiedLeads = useMemo(() => {
    let count = 0;
    for (const row of crmLeads) {
      const status = str(row.status).toLowerCase();
      if (status === "qualified" || status === "proposal" || status === "won") count += 1;
    }
    return count;
  }, [crmLeads]);

  if (loading) return <p className="text-sm">Loading marketing intelligence...</p>;
  if (error) return <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Total leads</p><p className="text-3xl font-semibold">{crmLeads.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Qualified leads</p><p className="text-3xl font-semibold">{qualifiedLeads}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Active campaigns</p><p className="text-3xl font-semibold">{campaignPerformance.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Tracked micro-markets</p><p className="text-3xl font-semibold">{conversionByMicroMarket.length}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Leads by source</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsBySource}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="source" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="leads" fill="#0f172a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Cost per qualified lead</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cplByCampaign}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="campaign" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cpl" fill="#334155" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Conversion by micro-market</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionByMicroMarket}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="micro_market" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="conversion_pct" fill="#64748b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Campaign performance</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={campaignPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="campaign" hide />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke="#0f172a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="qualified" stroke="#64748b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Budget vs revenue</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVsRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="campaign" hide />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="spend" fill="#475569" />
                <Bar dataKey="revenue" fill="#0f172a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top performing creatives</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={topCreatives}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="creative" width={140} />
                <Tooltip />
                <Bar dataKey="score" fill="#1e293b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Investor vs end-user segmentation</CardTitle>
          <Badge variant="outline">Marketing quality mix</Badge>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={segmentation} dataKey="value" nameKey="segment" outerRadius={120} label>
                {segmentation.map((entry, index) => (
                  <Cell key={entry.segment} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
