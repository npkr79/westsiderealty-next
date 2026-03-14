"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useLeads, type LeadsFilters, type LeadsSort } from "@/hooks/useLeads";
import { getPriorityBadgeClassName, getPriorityLabel } from "@/lib/crm/leadPriority";
import type { CrmRole } from "@/lib/crm/types";
import InvestorLeadIntakeModal from "@/components/crm/leads/InvestorLeadIntakeModal";
import { formatBudgetRange } from "@/lib/crm/budget";

const SOURCE_LABELS: Record<string, string> = {
  facebook_lead_ads: "Facebook Ads",
  meta: "Meta",
  website: "Website",
  referral: "Referral",
  channel: "Channel Partner",
};
function formatSource(val: string | null | undefined): string {
  if (!val) return "-";
  return SOURCE_LABELS[val] ?? val;
}

function toIST(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "Invalid date";
  }
}

const pageSize = 20;

interface AgentOption {
  id: string;
  full_name: string | null;
}

interface LeadsTableViewProps {
  currentUserRole?: CrmRole;
  currentUserId?: string;
}

export default function LeadsTableView({ currentUserRole, currentUserId }: LeadsTableViewProps) {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
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

  // Apply filter from URL param (e.g. ?filter=agent_<id> or ?filter=stage_<id>)
  useEffect(() => {
    const filter = searchParams.get("filter");
    if (!filter) return;
    if (filter.startsWith("agent_")) {
      const agentId = filter.slice("agent_".length);
      setFilters((prev) => ({ ...prev, assignedAgentId: agentId }));
    } else if (filter.startsWith("stage_")) {
      const stageId = filter.slice("stage_".length);
      setFilters((prev) => ({ ...prev, stageId }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const { leads, loading, total, error, refetch } = useLeads({ page, pageSize, search, filters, sort });
  const canCreateLead = currentUserRole ? ["admin", "sales_head", "team_lead", "agent"].includes(currentUserRole) : false;
  const visibleLeads = useMemo(() => (hotOnly ? leads.filter((lead) => getPriorityLabel(lead.priority) === "HOT") : leads), [hotOnly, leads]);
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <InvestorLeadIntakeModal disabled={!canCreateLead} onCreated={() => refetch()} />
      </div>
      {/* Search row — always visible. Filter toggle only shows on mobile */}
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

      {/* Collapsible filters — hidden on mobile until toggled, always shown md+ */}
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

      <div className="rounded-xl border bg-white dark:bg-slate-950" style={{ backgroundColor: '#0f172a' }}>
        {error ? (
          <div className="border-b px-4 py-2 text-sm text-rose-600 dark:text-rose-300">
            Unable to load leads: {error}
          </div>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow>
              {[
                { key: "name", label: "Name", className: "min-w-[140px] whitespace-nowrap" },
                { key: "phone", label: "Phone", className: "min-w-[120px] whitespace-nowrap" },
                { key: "priority", label: "Priority" },
                { key: "source", label: "Source" },
                { key: "budget_range", label: "Budget" },
                { key: "location", label: "Location" },
                { key: "buyer_type", label: "Buyer Type" },
                { key: "status", label: "Status" },
                ...(!isAgent ? [{ key: "assigned_agent", label: "Assigned Agent" }] : []),
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
              visibleLeads.map((lead) => (
                <TableRow key={lead.id} style={{ WebkitTransform: "translateZ(0)", backgroundColor: "#0f172a" } as React.CSSProperties}>
                  <TableCell className="font-medium min-w-[140px] whitespace-nowrap">
                    <Link href={`/leads/${lead.id}`} className="hover:underline" style={{ display: "block", minWidth: 0, color: "#ffffff", fontSize: "14px", fontWeight: 500 }}>
                      {lead.name}
                    </Link>
                  </TableCell>
                  <TableCell className="min-w-[120px] whitespace-nowrap">
                    <span style={{ display: "block", minWidth: 0, color: "#94a3b8", fontSize: "13px" }}>{lead.phone}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityBadgeClassName(lead.priority)}>{getPriorityLabel(lead.priority)}</Badge>
                  </TableCell>
                  <TableCell style={{ color: "#94a3b8" }}>{formatSource(lead.source_channel || lead.source_type)}</TableCell>
                  <TableCell style={{ color: "#94a3b8" }}>{formatBudgetRange(lead.budget_min, lead.budget_max)}</TableCell>
                  <TableCell style={{ color: "#94a3b8" }}>{lead.location || "-"}</TableCell>
                  <TableCell style={{ color: "#94a3b8" }}>{lead.buyer_type || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{lead.status || "new"}</Badge>
                  </TableCell>
                  {!isAgent && <TableCell style={{ color: "#94a3b8" }}>{lead.assigned_agent_name || "-"}</TableCell>}
                  <TableCell style={{ color: "#94a3b8" }}>{toIST(lead.last_activity_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
    </div>
  );
}

