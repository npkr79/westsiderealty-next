"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { useLeads, type LeadsFilters, type LeadsSort } from "@/hooks/useLeads";
import { getPriorityLabel } from "@/lib/crm/leadPriority";
import type { CrmRole } from "@/lib/crm/types";
import InvestorLeadIntakeModal from "@/components/crm/leads/InvestorLeadIntakeModal";

// ── Display helpers ──────────────────────────────────────────────────────────

function formatSourceName(s: string | null | undefined): string {
  if (!s) return "—";
  const map: Record<string, string> = {
    facebook_lead_ads: "Facebook Ads",
    meta_ads: "Meta Ads",
    meta: "Meta",
    website_form: "Website",
    website: "Website",
    organic_landing: "Organic",
    google_ads: "Google Ads",
    referral: "Referral",
    channel: "Channel Partner",
    manual: "Manual",
    landing_page: "Landing Page",
  };
  return map[s] ?? s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  new:           { label: "New",           bg: "rgba(100,116,139,0.15)", color: "#94a3b8" },
  not_connected: { label: "Not Connected", bg: "rgba(100,116,139,0.15)", color: "#94a3b8" },
  contacted:     { label: "Contacted",     bg: "rgba(59,130,246,0.15)",  color: "#93c5fd" },
  qualified:     { label: "Qualified",     bg: "rgba(34,197,94,0.15)",   color: "#86efac" },
  site_visit:    { label: "Site Visit",    bg: "rgba(245,158,11,0.15)",  color: "#fcd34d" },
  negotiation:   { label: "Negotiation",  bg: "rgba(245,158,11,0.15)",  color: "#fcd34d" },
  converted:     { label: "Converted",    bg: "rgba(34,197,94,0.15)",   color: "#86efac" },
  lost:          { label: "Lost",         bg: "rgba(239,68,68,0.15)",   color: "#fca5a5" },
};

const priorityConfig: Record<string, { label: string; bg: string; color: string }> = {
  serious_buyer: { label: "Serious",     bg: "rgba(239,68,68,0.15)",   color: "#fca5a5" },
  evaluating:    { label: "Evaluating",  bg: "rgba(245,158,11,0.15)",  color: "#fcd34d" },
  early_stage:   { label: "Early Stage", bg: "rgba(100,116,139,0.15)", color: "#94a3b8" },
  hot:           { label: "Serious",     bg: "rgba(239,68,68,0.15)",   color: "#fca5a5" },
  warm:          { label: "Evaluating",  bg: "rgba(245,158,11,0.15)",  color: "#fcd34d" },
  cold:          { label: "Early Stage", bg: "rgba(100,116,139,0.15)", color: "#94a3b8" },
};

function fmt(v: number | null | undefined): string | null {
  if (!v) return null;
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(0)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`;
  return `₹${v.toLocaleString("en-IN")}`;
}

function fmtBudget(min: number | null | undefined, max: number | null | undefined): string {
  const a = fmt(min);
  const b = fmt(max);
  if (a && b) return `${a} – ${b}`;
  if (a) return `≥ ${a}`;
  if (b) return `≤ ${b}`;
  return "—";
}

function toIST(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

const pageSize = 20;

interface AgentOption {
  id: string;
  full_name: string | null;
}

interface VisitActivityRow {
  activity_id: string;
  lead_id: string;
  lead_name: string;
  phone: string;
  assigned_to: string | null;
  status: string | null;
  priority: string | null;
  project_name: string;
  visit_date: string | null;
  visit_status: string;
}

interface LeadsTableViewProps {
  currentUserRole?: CrmRole;
  currentUserId?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function LeadsTableView({ currentUserRole, currentUserId }: LeadsTableViewProps) {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const router = useRouter();
  const isAgent = currentUserRole === "agent";
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<LeadsFilters>(
    isAgent && currentUserId ? { assignedAgentId: currentUserId } : {}
  );
  const [sort, setSort] = useState<LeadsSort>({ key: "created_at", ascending: false });
  const [datePreset, setDatePreset] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [hotOnly, setHotOnly] = useState(false);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [visitActivities, setVisitActivities] = useState<VisitActivityRow[]>([]);
  const [visitLoading, setVisitLoading] = useState(false);
  const isVisitsFilter = searchParams.get("filter") === "visits_upcoming";

  // Apply filter from ?filter= URL param
  useEffect(() => {
    const filter = searchParams.get("filter");
    if (!filter) return;

    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(Date.now() + IST_OFFSET_MS);
    nowIST.setUTCHours(0, 0, 0, 0);
    const todayMidnightUTC = new Date(nowIST.getTime() - IST_OFFSET_MS).toISOString();

    const firstOfMonthIST = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), 1));
    const firstOfMonthUTC = new Date(firstOfMonthIST.getTime() - IST_OFFSET_MS).toISOString();

    if (filter === "today") {
      setFilters((prev) => ({ ...prev, createdFrom: todayMidnightUTC }));
    } else if (filter === "pending_contact") {
      setFilters((prev) => ({ ...prev, createdFrom: todayMidnightUTC, pendingContact: true }));
    } else if (filter === "contacted_today") {
      setFilters((prev) => ({ ...prev, contactedFrom: todayMidnightUTC }));
    } else if (filter === "bookings_month") {
      setFilters((prev) => ({ ...prev, stageName: "book", createdFrom: firstOfMonthUTC }));
    } else if (filter === "visits_upcoming") {
      // Handled by the specialized visits view — no useLeads filter needed
    } else if (filter.startsWith("stage_")) {
      const stageId = filter.slice("stage_".length);
      setFilters((prev) => ({ ...prev, stageId }));
    } else if (filter.startsWith("agent_")) {
      const agentId = filter.slice("agent_".length);
      setFilters((prev) => ({ ...prev, assignedAgentId: agentId }));
    } else if (filter === "cold_leads") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      setFilters((prev) => ({
        ...prev,
        lastActivityBefore: sevenDaysAgo,
        excludeStatuses: ["lost", "won", "converted"],
      }));
    } else if (filter === "not_connected") {
      setFilters((prev) => ({ ...prev, status: "not_connected" }));
    } else if (filter === "overdue") {
      router.push("/tasks?filter=overdue");
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Date range logic
  const dateRange = useMemo(() => {
    const IST = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(Date.now() + IST);
    nowIST.setUTCHours(0, 0, 0, 0);
    const todayUTC = new Date(nowIST.getTime() - IST);
    const tomorrowUTC = new Date(todayUTC.getTime() + 86400_000);
    switch (datePreset) {
      case "today":     return { from: todayUTC.toISOString(), to: tomorrowUTC.toISOString() };
      case "yesterday": return { from: new Date(todayUTC.getTime() - 86400_000).toISOString(), to: todayUTC.toISOString() };
      case "last7":     return { from: new Date(todayUTC.getTime() - 7 * 86400_000).toISOString(), to: tomorrowUTC.toISOString() };
      case "last14":    return { from: new Date(todayUTC.getTime() - 14 * 86400_000).toISOString(), to: tomorrowUTC.toISOString() };
      case "last30":    return { from: new Date(todayUTC.getTime() - 30 * 86400_000).toISOString(), to: tomorrowUTC.toISOString() };
      case "this_month": {
        const f = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), 1) - IST);
        return { from: f.toISOString(), to: tomorrowUTC.toISOString() };
      }
      case "last_month": {
        const f = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth() - 1, 1) - IST);
        const t = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), 1) - IST);
        return { from: f.toISOString(), to: t.toISOString() };
      }
      case "custom":    return { from: customFrom ? new Date(customFrom).toISOString() : undefined, to: customTo ? new Date(new Date(customTo).getTime() + 86400_000).toISOString() : undefined };
      default:          return { from: undefined, to: undefined };
    }
  }, [datePreset, customFrom, customTo]);

  // Apply date range into filters
  useEffect(() => {
    setFilters(prev => ({ ...prev, createdFrom: dateRange.from, createdTo: dateRange.to }));
    setPage(1);
  }, [dateRange.from, dateRange.to]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeFilterCount = useMemo(() => {
    return [
      filters.source,
      filters.status,
      filters.budgetMin,
      filters.budgetMax,
      filters.assignedAgentId,
      filters.location,
      filters.buyerType,
      hotOnly ? "hot" : null,
    ].filter(Boolean).length;
  }, [filters, hotOnly]);

  const coldLeadsActive = searchParams.get("filter") === "cold_leads";
  const { leads, loading, total, error, refetch } = useLeads({ page, pageSize, search, filters, sort });
  const canCreateLead = currentUserRole ? ["admin", "sales_head", "team_lead", "agent"].includes(currentUserRole) : false;
  const visibleLeads = useMemo(() => (hotOnly ? leads.filter((lead) => getPriorityLabel(lead.priority) === "Serious Buyer") : leads), [hotOnly, leads]);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const statuses = useMemo(() => ["new", "not_connected", "contacted", "qualified", "proposal", "won", "lost"], []);

  useEffect(() => {
    const loadAgents = async () => {
      const { data } = await supabase
        .from("crm_users")
        .select("id,full_name")
        .eq("is_active", true)
        .order("full_name", { ascending: true });
      setAgents((data as AgentOption[]) || []);
    };
    loadAgents();
  }, [supabase]);

  // Fetch visit activities when visits_upcoming filter is active
  useEffect(() => {
    if (!isVisitsFilter) return;
    setVisitLoading(true);
    const loadVisits = async () => {
      const now = new Date();
      const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const nowStr = now.toISOString().slice(0, 16);
      const next7Str = next7Days.slice(0, 16);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: visitData } = await (supabase as any)
        .from("crm_lead_activities")
        .select("id, lead_id, description, metadata, crm_leads!crm_lead_activities_lead_id_fkey(id, name, phone, assigned_to, status, priority)")
        .eq("activity_type", "site_visit")
        .ilike("description", "%Scheduled%");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows: VisitActivityRow[] = ((visitData ?? []) as any[])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((a: any) => {
          const meta = (a.metadata || {}) as Record<string, unknown>;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const lead = a.crm_leads as any;
          let projectName = (meta.project_name as string) || null;
          if (!projectName && a.description) {
            const match = (a.description as string).match(/Site visit at (.+?) —/i);
            if (match) projectName = match[1].trim();
          }
          return {
            activity_id: a.id as string,
            lead_id: a.lead_id as string,
            lead_name: (lead?.name as string) || "—",
            phone: (lead?.phone as string) || "—",
            assigned_to: (lead?.assigned_to as string) || null,
            status: (lead?.status as string) || null,
            priority: (lead?.priority as string) || null,
            project_name: projectName || "Not specified",
            visit_date: (meta.visit_date as string) || null,
            visit_status: (meta.status as string) || "Scheduled",
          };
        })
        .filter((v: VisitActivityRow) => {
          if (!v.visit_date) return true;
          return v.visit_date >= nowStr && v.visit_date <= next7Str;
        })
        .sort((a: VisitActivityRow, b: VisitActivityRow) => {
          if (!a.visit_date) return 1;
          if (!b.visit_date) return -1;
          return a.visit_date.localeCompare(b.visit_date);
        });

      setVisitActivities(rows);
      setVisitLoading(false);
    };
    void loadVisits();
  }, [isVisitsFilter, supabase]);

  // ── Pagination footer (shared) ─────────────────────────────────────────────

  const paginationFooter = (
    <div className="flex items-center justify-between">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Page {page} of {pageCount} · {total} leads
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
          Previous
        </Button>
        <Button variant="outline" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page >= pageCount}>
          Next
        </Button>
      </div>
    </div>
  );

  // ── Specialized site visits view ─────────────────────────────────────────
  if (isVisitsFilter) {
    const filteredVisits = search
      ? visitActivities.filter(
          (v) =>
            v.lead_name.toLowerCase().includes(search.toLowerCase()) ||
            v.phone.includes(search)
        )
      : visitActivities;

    const fmtVisitDate = (d: string | null) =>
      d
        ? new Date(d).toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—";

    const visitStatusStyle = (s: string) =>
      s.toLowerCase() === "completed"
        ? { background: "rgba(34,197,94,0.15)", color: "#86efac" }
        : { background: "rgba(59,130,246,0.15)", color: "#93c5fd" };

    return (
      <div style={{ color: "#e2e8f0" }}>
        {/* Back link */}
        <button
          type="button"
          onClick={() => router.push("/leads")}
          className="mb-4 flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          ← Back to all leads
        </button>

        {/* Title row */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-none">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
            Site Visits — Next 7 Days
          </h2>
          {!visitLoading && (
            <span style={{
              padding: "2px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600,
              background: "rgba(59,130,246,0.18)", color: "#93c5fd",
              border: "1px solid rgba(59,130,246,0.3)",
            }}>
              {filteredVisits.length} scheduled
            </span>
          )}
        </div>

        {/* Search bar */}
        <div className="relative mb-5" style={{ maxWidth: "320px" }}>
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4" style={{ color: "#64748b" }} />
          <input
            placeholder="Search name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", paddingLeft: "36px", paddingRight: "12px",
              paddingTop: "8px", paddingBottom: "8px",
              background: "#1e293b", border: "1px solid #334155",
              borderRadius: "8px", color: "#e2e8f0", fontSize: "14px", outline: "none",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#475569"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#334155"; }}
          />
        </div>

        {/* Loading state */}
        {visitLoading && (
          <p style={{ color: "#64748b", fontSize: "14px", textAlign: "center", padding: "40px 0" }}>
            Loading site visits…
          </p>
        )}

        {/* Empty state */}
        {!visitLoading && filteredVisits.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 0", color: "#475569" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginBottom: "16px" }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#64748b", margin: 0 }}>No site visits scheduled</p>
            <p style={{ fontSize: "12px", color: "#475569", marginTop: "4px" }}>No site visits scheduled in the next 7 days</p>
          </div>
        )}

        {/* Desktop table — xl+ */}
        {!visitLoading && filteredVisits.length > 0 && (
          <div className="hidden md:block mb-4">
            <div style={{ borderRadius: "12px", border: "1px solid #1e293b", overflow: "hidden", background: "#0f172a" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e293b", background: "#0f172a" }}>
                    {[
                      { label: "Name",       w: "auto" },
                      { label: "Phone",      w: "140px" },
                      { label: "Project",    w: "auto" },
                      { label: "Visit Date", w: "120px" },
                      { label: "Status",     w: "110px" },
                      ...(!isAgent ? [{ label: "Agent", w: "120px" }] : []),
                      { label: "Priority",   w: "110px" },
                    ].map(({ label, w }) => (
                      <th key={label} style={{
                        width: w, padding: "10px 14px", textAlign: "left",
                        fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
                        letterSpacing: "0.06em", color: "#64748b", whiteSpace: "nowrap",
                      }}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.map((visit, idx) => {
                    const priorityKey = (visit.priority ?? "early_stage").toLowerCase().replace(/[\s-]+/g, "_");
                    const pCfg = priorityConfig[priorityKey] ?? priorityConfig.early_stage;
                    const vsStyle = visitStatusStyle(visit.visit_status);
                    const agentName = agents.find((a) => a.id === visit.assigned_to)?.full_name || "—";
                    return (
                      <tr
                        key={visit.activity_id}
                        onClick={() => router.push(`/leads/${visit.lead_id}`)}
                        style={{
                          borderBottom: idx < filteredVisits.length - 1 ? "1px solid #1e293b" : "none",
                          background: "#0f172a", cursor: "pointer", transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#1e293b"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#0f172a"; }}
                      >
                        <td style={{ padding: "12px 14px", fontSize: "14px", fontWeight: 500, color: "#f1f5f9", whiteSpace: "nowrap" }}>
                          {visit.lead_name}
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: "13px", color: "#94a3b8", whiteSpace: "nowrap" }}>
                          {visit.phone}
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: "13px", color: "#93c5fd", fontWeight: 500 }}>
                          {visit.project_name}
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: "13px", color: "#cbd5e1", whiteSpace: "nowrap" }}>
                          {fmtVisitDate(visit.visit_date)}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ padding: "2px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, ...vsStyle }}>
                            {visit.visit_status}
                          </span>
                        </td>
                        {!isAgent && (
                          <td style={{ padding: "12px 14px", fontSize: "13px", color: "#94a3b8" }}>
                            {agentName}
                          </td>
                        )}
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ padding: "2px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, background: pCfg.bg, color: pCfg.color }}>
                            {pCfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mobile cards — below md */}
        {!visitLoading && filteredVisits.length > 0 && (
          <div className="md:hidden space-y-3 mb-4">
            {filteredVisits.map((visit) => {
              const priorityKey = (visit.priority ?? "early_stage").toLowerCase().replace(/[\s-]+/g, "_");
              const pCfg = priorityConfig[priorityKey] ?? priorityConfig.early_stage;
              const vsStyle = visitStatusStyle(visit.visit_status);
              const agentName = agents.find((a) => a.id === visit.assigned_to)?.full_name || "—";
              return (
                <div
                  key={visit.activity_id}
                  onClick={() => router.push(`/leads/${visit.lead_id}`)}
                  style={{
                    borderRadius: "12px", padding: "16px", cursor: "pointer",
                    border: "1px solid #334155", background: "#1e293b",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = "#475569";
                    el.style.background = "#253347";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = "#334155";
                    el.style.background = "#1e293b";
                  }}
                >
                  {/* Top row: name + status */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#f1f5f9", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {visit.lead_name}
                    </div>
                    <span style={{ padding: "2px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, flexShrink: 0, marginLeft: "10px", ...vsStyle }}>
                      {visit.visit_status}
                    </span>
                  </div>
                  {/* Phone */}
                  <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>{visit.phone}</div>
                  {/* Project */}
                  <div style={{ fontSize: "13px", color: "#93c5fd", fontWeight: 500, marginBottom: "12px" }}>
                    {visit.project_name}
                  </div>
                  {/* Meta grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", paddingTop: "10px", borderTop: "1px solid #1e293b" }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>Visit Date</div>
                      <div style={{ fontSize: "13px", color: "#cbd5e1", fontWeight: 500 }}>{fmtVisitDate(visit.visit_date)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>Agent</div>
                      <div style={{ fontSize: "13px", color: "#cbd5e1", fontWeight: 500 }}>{agentName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>Priority</div>
                      <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, background: pCfg.bg, color: pCfg.color }}>
                        {pCfg.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer count */}
        {!visitLoading && (
          <p style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>
            Showing {filteredVisits.length} site visit{filteredVisits.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    );
  }

  // ── Default leads view ────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <InvestorLeadIntakeModal disabled={!canCreateLead} onCreated={() => refetch()} />
      </div>

      {coldLeadsActive && (
        <div className="flex items-center gap-2.5 rounded-lg border border-amber-800/50 bg-amber-950/30 px-4 py-2.5 text-sm text-amber-300">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-none opacity-80">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>
            <span className="font-semibold">Gone Cold</span> — leads with no activity in 7+ days, excluding Lost / Won / Converted. Call or message them to re-engage.
          </span>
        </div>
      )}

      {/* Date range filter */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "all", label: "All time" },
          { key: "today", label: "Today" },
          { key: "yesterday", label: "Yesterday" },
          { key: "last7", label: "Last 7 days" },
          { key: "last14", label: "Last 14 days" },
          { key: "last30", label: "Last 30 days" },
          { key: "this_month", label: "This month" },
          { key: "last_month", label: "Last month" },
          { key: "custom", label: "Custom" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setDatePreset(key); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${datePreset === key ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}
          >
            {label}
          </button>
        ))}
        {datePreset === "custom" && (
          <>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="px-2 py-1 text-xs border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
            <span className="text-xs text-slate-400">to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="px-2 py-1 text-xs border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
          </>
        )}
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1 md:max-w-xs">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search name or phone"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            className="pl-8"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800"
        >
          <SlidersHorizontal size={15} />
          {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : "Filters"}
        </button>
      </div>

      {/* Collapsible filters */}
      <div className={`grid gap-2 grid-cols-1 md:grid-cols-8 ${showFilters ? "grid" : "hidden md:grid"}`}>
        <Select
          value={filters.source || "all"}
          onValueChange={(value) => {
            setPage(1);
            setFilters((prev) => ({ ...prev, source: value === "all" ? undefined : value }));
          }}
        >
          <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="facebook_lead_ads">Facebook Ads</SelectItem>
            <SelectItem value="meta">Meta</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="channel">Channel Partner</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.status || "all"}
          onValueChange={(value) => {
            setPage(1);
            setFilters((prev) => ({ ...prev, status: value === "all" ? undefined : value }));
          }}
        >
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Budget min"
          value={filters.budgetMin || ""}
          onChange={(e) => { setPage(1); setFilters((prev) => ({ ...prev, budgetMin: e.target.value || undefined })); }}
        />
        <Input
          placeholder="Budget max"
          value={filters.budgetMax || ""}
          onChange={(e) => { setPage(1); setFilters((prev) => ({ ...prev, budgetMax: e.target.value || undefined })); }}
        />
        {!isAgent && (
          <Select
            value={filters.assignedAgentId || "all"}
            onValueChange={(value) => {
              setPage(1);
              setFilters((prev) => ({ ...prev, assignedAgentId: value === "all" ? undefined : value }));
            }}
          >
            <SelectTrigger><SelectValue placeholder="Assigned agent" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.full_name || agent.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input
          placeholder="Location"
          value={filters.location || ""}
          onChange={(e) => { setPage(1); setFilters((prev) => ({ ...prev, location: e.target.value || undefined })); }}
        />
        <Input
          placeholder="Buyer type"
          value={filters.buyerType || ""}
          onChange={(e) => { setPage(1); setFilters((prev) => ({ ...prev, buyerType: e.target.value || undefined })); }}
        />
        <Select value={hotOnly ? "hot" : "all"} onValueChange={(value) => setHotOnly(value === "hot")}>
          <SelectTrigger><SelectValue placeholder="Priority filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="hot">HOT only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <p className="text-sm text-rose-600 dark:text-rose-300">Unable to load leads: {error}</p>
      ) : null}

      {/* ── Mobile cards — visible only on small screens ─────────────────────── */}
      <div className="md:hidden">
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">Loading leads...</p>
        ) : visibleLeads.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">No leads found.</p>
        ) : (
          visibleLeads.map((lead) => {
            const priorityKey = (lead.priority ?? "early_stage").toLowerCase().replace(/[\s-]+/g, "_");
            const pCfg = priorityConfig[priorityKey] ?? priorityConfig.early_stage;
            const sCfg = statusConfig[lead.status ?? "new"] ?? statusConfig.new;
            return (
              <div
                key={lead.id}
                onClick={() => router.push(`/leads/${lead.id}`)}
                style={{
                  borderRadius: "12px",
                  marginBottom: "12px",
                  padding: "16px",
                  cursor: "pointer",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "rgba(255,255,255,0.15)",
                  backgroundColor: "rgba(255,255,255,0.05)",
                }}
              >
                {/* Header: Name + Status pill */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div style={{
                    fontSize: "16px", fontWeight: 600,
                    color: "var(--color-text-primary)",
                    flex: 1, minWidth: 0,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {lead.name || "Unknown"}
                  </div>
                  <span style={{
                    padding: "3px 10px", borderRadius: "20px", fontSize: "12px",
                    fontWeight: 500, flexShrink: 0, marginLeft: "8px",
                    background: sCfg.bg, color: sCfg.color,
                  }}>
                    {sCfg.label}
                  </span>
                </div>

                {/* Phone row */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>Phone</span>
                  <a
                    href={`tel:${lead.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: "14px", color: "var(--color-text-info)", textDecoration: "none", fontWeight: 500 }}
                  >
                    {lead.phone}
                  </a>
                </div>

                {/* Divider */}
                <div style={{ height: "0.5px", background: "var(--color-border-secondary)", marginBottom: "10px" }} />

                {/* 2-col data grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Agent</div>
                    <div style={{ fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 500 }}>
                      {lead.assigned_agent_name || "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Source</div>
                    <div style={{ fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 500 }}>
                      {formatSourceName(lead.source_type || lead.source_channel)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Budget</div>
                    <div style={{ fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 500 }}>
                      {(lead.budget_min || lead.budget_max)
                        ? `${fmt(lead.budget_min) ?? "?"} – ${fmt(lead.budget_max) ?? "?"}`
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Buyer profile</div>
                    <span style={{
                      padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 500,
                      background: pCfg.bg, color: pCfg.color,
                    }}>
                      {pCfg.label}
                    </span>
                  </div>
                </div>

                {/* Last activity footer */}
                {lead.last_activity_at && (
                  <div style={{
                    marginTop: "10px",
                    paddingTop: "8px",
                    borderTop: "0.5px solid var(--color-border-secondary)",
                    fontSize: "11px",
                    color: "var(--color-text-tertiary)",
                  }}>
                    Last activity · {toIST(lead.last_activity_at)}
                  </div>
                )}
              </div>
            );
          })
        )}
        {paginationFooter}
      </div>

      {/* ── Desktop table — visible only on md+ screens ───────────────────────── */}
      <div className="hidden md:block">
        <div className="rounded-xl border bg-white dark:bg-slate-950" style={{ backgroundColor: "#0f172a" }}>
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  { key: "name",             label: "Name",         className: "min-w-[140px] whitespace-nowrap" },
                  { key: "phone",            label: "Phone",        className: "min-w-[120px] whitespace-nowrap" },
                  { key: "priority",         label: "Priority" },
                  { key: "source",           label: "Source" },
                  { key: "budget_range",     label: "Budget" },
                  { key: "location",         label: "Location" },
                  { key: "buyer_type",       label: "Buyer Type" },
                  { key: "status",           label: "Status" },
                  ...(!isAgent ? [{ key: "assigned_agent", label: "Agent" }] : []),
                  { key: "created_at", label: "Created" },
                  { key: "last_activity_at", label: "Last Activity" },
                ].map((col) => (
                  <TableHead key={col.key} className={"className" in col ? col.className : undefined}>
                    {col.key === "name" || col.key === "status" || col.key === "last_activity_at" || col.key === "created_at" ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1"
                        onClick={() => {
                          const nextAscending = sort.key === col.key ? !sort.ascending : true;
                          setSort({ key: col.key as LeadsSort["key"], ascending: nextAscending });
                        }}
                      >
                        {col.label}
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    ) : (
                      col.label
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isAgent ? 10 : 11}>Loading leads...</TableCell>
                </TableRow>
              ) : visibleLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAgent ? 10 : 11}>No leads found.</TableCell>
                </TableRow>
              ) : (
                visibleLeads.map((lead) => {
                  const priorityKey = (lead.priority ?? "early_stage").toLowerCase().replace(/[\s-]+/g, "_");
                  const pCfg = priorityConfig[priorityKey] ?? priorityConfig.early_stage;
                  const sCfg = statusConfig[lead.status ?? "new"] ?? statusConfig.new;
                  return (
                    <TableRow key={lead.id} style={{ WebkitTransform: "translateZ(0)", backgroundColor: "#0f172a" } as React.CSSProperties}>
                      <TableCell className="font-medium min-w-[140px] whitespace-nowrap">
                        <Link href={`/leads/${lead.id}`} className="hover:underline" style={{ display: "block", color: "#ffffff", fontSize: "14px", fontWeight: 500 }}>
                          {lead.name}
                        </Link>
                      </TableCell>
                      <TableCell className="min-w-[120px] whitespace-nowrap">
                        <span style={{ color: "#94a3b8", fontSize: "13px" }}>{lead.phone}</span>
                      </TableCell>
                      <TableCell>
                        <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 500, background: pCfg.bg, color: pCfg.color }}>
                          {pCfg.label}
                        </span>
                      </TableCell>
                      <TableCell style={{ color: "#94a3b8", fontSize: "13px" }}>{formatSourceName(lead.source_channel || lead.source_type)}</TableCell>
                      <TableCell style={{ color: "#94a3b8", fontSize: "13px" }}>{fmtBudget(lead.budget_min, lead.budget_max)}</TableCell>
                      <TableCell style={{ color: "#94a3b8", fontSize: "13px" }}>{lead.location || "—"}</TableCell>
                      <TableCell style={{ color: "#94a3b8", fontSize: "13px" }}>{lead.buyer_type || "—"}</TableCell>
                      <TableCell>
                        <span style={{ padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 500, background: sCfg.bg, color: sCfg.color }}>
                          {sCfg.label}
                        </span>
                      </TableCell>
                      {!isAgent && <TableCell style={{ color: "#94a3b8", fontSize: "13px" }}>{lead.assigned_agent_name || "—"}</TableCell>}
                      <TableCell style={{ color: "#94a3b8", fontSize: "13px" }}>{toIST(lead.created_at)}</TableCell>
                      <TableCell style={{ color: "#94a3b8", fontSize: "13px" }}>{toIST(lead.last_activity_at)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        {paginationFooter}
      </div>
    </div>
  );
}
