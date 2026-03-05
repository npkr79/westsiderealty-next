"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeadBudgetValue } from "@/lib/crm/budget";

type LeadRow = Record<string, unknown>;

const COLORS = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1"];

const str = (value: unknown, fallback = ""): string => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
};

const num = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.toLowerCase().replace(/,/g, "");
    const parsed = Number(cleaned.replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(parsed)) return 0;
    if (cleaned.includes("cr")) return parsed * 10000000;
    if (cleaned.includes("lakh") || /\bl\b/.test(cleaned)) return parsed * 100000;
    return parsed;
  }
  return 0;
};

const isWon = (status: string): boolean => /won|converted|closed_won|booked/.test(status.toLowerCase());
const isInvestor = (buyerType: string): boolean => /investor|institution|fund|hni|commercial/.test(buyerType.toLowerCase());

export default function CapitalFlowAnalyticsDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data, error: queryError } = await supabase
        .from("crm_leads_view")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (queryError) {
        setError(queryError.message || "Unable to load capital flow analytics.");
        setLoading(false);
        return;
      }
      setLeads((data as LeadRow[]) || []);
      setLoading(false);
    };

    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    const channel = supabase
      .channel("crm-capital-flow-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_leads" }, () => {
        void load();
      })
      .subscribe();

    return () => {
      window.clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const budgetVsConversion = useMemo(() => {
    const buckets = [
      { key: "Low", min: 0, max: 10000000, total: 0, won: 0 },
      { key: "Mid", min: 10000000, max: 30000000, total: 0, won: 0 },
      { key: "High", min: 30000000, max: 60000000, total: 0, won: 0 },
      { key: "Ultra", min: 60000000, max: Number.MAX_SAFE_INTEGER, total: 0, won: 0 },
    ];

    for (const row of leads) {
      const budget = getLeadBudgetValue({
        budget_min: row.budget_min,
        budget_max: row.budget_max,
      });
      const status = str(row.status);
      const bucket = buckets.find((b) => budget >= b.min && budget < b.max);
      if (!bucket) continue;
      bucket.total += 1;
      if (isWon(status)) bucket.won += 1;
    }

    return buckets.map((bucket) => ({
      band: bucket.key,
      leads: bucket.total,
      conversion: bucket.total > 0 ? Math.round((bucket.won / bucket.total) * 100) : 0,
    }));
  }, [leads]);

  const microMarketInflow = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const row of leads) {
      const market = str(row.micro_market, "unclassified");
      const budget = getLeadBudgetValue({
        budget_min: row.budget_min,
        budget_max: row.budget_max,
      });
      grouped.set(market, (grouped.get(market) || 0) + budget);
    }
    return Array.from(grouped.entries())
      .map(([microMarket, inflow]) => ({ microMarket, inflow: Math.round(inflow) }))
      .sort((a, b) => b.inflow - a.inflow)
      .slice(0, 10);
  }, [leads]);

  const developerSuccess = useMemo(() => {
    const grouped = new Map<string, { total: number; won: number }>();
    for (const row of leads) {
      const name =
        str(row.developer_name) ||
        str(row.developer) ||
        str(row.developer_id) ||
        "Unknown developer";
      const status = str(row.status);
      const current = grouped.get(name) || { total: 0, won: 0 };
      current.total += 1;
      if (isWon(status)) current.won += 1;
      grouped.set(name, current);
    }
    return Array.from(grouped.entries())
      .map(([developer, stats]) => ({
        developer,
        total: stats.total,
        success: stats.total > 0 ? Math.round((stats.won / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.success - a.success)
      .slice(0, 10);
  }, [leads]);

  const investorBehavior = useMemo(() => {
    const stats = {
      investor: { count: 0, won: 0, capital: 0 },
      endUser: { count: 0, won: 0, capital: 0 },
    };

    for (const row of leads) {
      const buyerType = str(row.buyer_type, "other");
      const status = str(row.status);
      const budget = getLeadBudgetValue({
        budget_min: row.budget_min,
        budget_max: row.budget_max,
      });
      const key = isInvestor(buyerType) ? "investor" : "endUser";
      stats[key].count += 1;
      stats[key].capital += budget;
      if (isWon(status)) stats[key].won += 1;
    }

    return [
      {
        segment: "Investor",
        leads: stats.investor.count,
        conversion: stats.investor.count ? Math.round((stats.investor.won / stats.investor.count) * 100) : 0,
        capital: Math.round(stats.investor.capital),
      },
      {
        segment: "End User",
        leads: stats.endUser.count,
        conversion: stats.endUser.count ? Math.round((stats.endUser.won / stats.endUser.count) * 100) : 0,
        capital: Math.round(stats.endUser.capital),
      },
    ];
  }, [leads]);

  if (loading) return <p className="text-sm">Loading capital flow analytics...</p>;
  if (error) return <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Budget vs conversion</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVsConversion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="band" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="conversion" fill="#0f172a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Micro-market capital inflow</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={microMarketInflow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="microMarket" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="inflow" fill="#334155" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Developer success rates</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={developerSuccess}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="developer" width={150} />
                <Tooltip />
                <Bar dataKey="success" fill="#64748b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Investor behavior</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={investorBehavior} dataKey="capital" nameKey="segment" outerRadius={110} label>
                  {investorBehavior.map((entry, index) => (
                    <Cell key={entry.segment} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
