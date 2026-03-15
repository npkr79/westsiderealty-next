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
  new:         { label: "New",         bg: "var(--color-background-secondary)", color: "var(--color-text-secondary)" },
  contacted:   { label: "Contacted",   bg: "var(--color-background-info)",      color: "var(--color-text-info)" },
  qualified:   { label: "Qualified",   bg: "var(--color-background-success)",   color: "var(--color-text-success)" },
  site_visit:  { label: "Site Visit",  bg: "var(--color-background-warning)",   color: "var(--color-text-warning)" },
  negotiation: { label: "Negotiation", bg: "var(--color-background-warning)",   color: "var(--color-text-warning)" },
  converted:   { label: "Converted",   bg: "var(--color-background-success)",   color: "var(--color-text-success)" },
  lost:        { label: "Lost",        bg: "var(--color-background-danger)",    color: "var(--color-text-danger)" },
};

const priorityConfig: Record<string, { label: string; bg: string; color: string }> = {
  serious_buyer: { label: "Serious",    bg: "var(--color-background-danger)",    color: "var(--color-text-danger)" },
  evaluating:    { label: "Evaluating", bg: "var(--color-background-warning)",   color: "var(--color-text-warning)" },
  early_stage:   { label: "Early Stage",bg: "var(--color-background-secondary)", color: "var(--color-text-secondary)" },
  hot:           { label: "Serious",    bg: "var(--color-background-danger)",    color: "var(--color-text-danger)" },
  warm:          { label: "Evaluating", bg: "var(--color-background-warning)",   color: "var(--color-text-warning)" },
  cold:          { label: "Early Stage",bg: "var(--color-background-secondary)", color: "var(--color-text-secondary)" },
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
  const [sort, setSort] = useState<LeadsSort>({ key: "last_activity_at", ascending: false });
  const [hotOnly, setHotOnly] = useState(false);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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
      setFilters((prev) => ({ ...prev, stageName: "visit" }));
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
    } else if (filter === "overdue") {
      router.push("/tasks?filter=overdue");
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const statuses = useMemo(() => ["new", "contacted", "qualified", "proposal", "won", "lost"], []);

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
                  { key: "last_activity_at", label: "Last Activity" },
                ].map((col) => (
                  <TableHead key={col.key} className={"className" in col ? col.className : undefined}>
                    {col.key === "name" || col.key === "status" || col.key === "last_activity_at" ? (
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
                  <TableCell colSpan={isAgent ? 9 : 10}>Loading leads...</TableCell>
                </TableRow>
              ) : visibleLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAgent ? 9 : 10}>No leads found.</TableCell>
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
