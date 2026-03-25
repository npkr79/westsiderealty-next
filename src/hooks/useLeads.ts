"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CrmLead } from "@/lib/crm/types";
import { getPriorityRank } from "@/lib/crm/leadPriority";
import { toBudgetNumber } from "@/lib/crm/budget";

export interface LeadsFilters {
  source?: string;
  budgetMin?: string;
  budgetMax?: string;
  location?: string;
  buyerType?: string;
  status?: string;
  assignmentStatus?: string;
  assignedAgentId?: string;
  unassignedOnly?: boolean;
  stageId?: string;
  stageName?: string;            // ilike match on stage_name column
  createdFrom?: string;          // ISO string — gte created_at
  createdTo?: string;            // ISO string — lt created_at
  pendingContact?: boolean;      // is(first_contact_at, null)
  contactedFrom?: string;        // ISO string — gte first_contact_at
  lastActivityBefore?: string;   // ISO string — lt last_activity_at
  excludeStatuses?: string[];    // not in these statuses
}

export interface LeadsSort {
  key: "name" | "created_at" | "updated_at" | "status" | "last_activity_at";
  ascending: boolean;
}

const mapLeadRow = (row: Record<string, unknown>): CrmLead => {
  const getString = (value: unknown): string | null =>
    typeof value === "string" && value.trim().length > 0 ? value : null;

  return {
    id: String(row.id ?? ""),
    name: getString(row.name) ?? "Unnamed lead",
    phone: getString(row.phone) ?? "-",
    source: getString(row.source) ?? getString(row.source_name),
    source_type: getString(row.source_type),
    source_channel: getString(row.source_channel),
    source_name: getString(row.source_name),
    project_id: getString(row.project_id),
    budget_min: toBudgetNumber(row.budget_min),
    budget_max: toBudgetNumber(row.budget_max),
    location: getString(row.location),
    buyer_type: getString(row.buyer_type),
    status: getString(row.status),
    priority: getString(row.priority) ?? getString(row.lead_priority),
    assignment_status: getString(row.assignment_status),
    assigned_to: getString(row.assigned_to),
    assigned_agent_id: getString(row.assigned_agent_id),
    stage_id: getString(row.stage_id),
    stage_name: getString(row.stage_name),
    campaign_name: getString(row.campaign_name),
    campaign_id: getString(row.campaign_id),
    utm_source: getString(row.utm_source),
    utm_medium: getString(row.utm_medium),
    utm_campaign: getString(row.utm_campaign),
    utm_term: getString(row.utm_term),
    utm_content: getString(row.utm_content),
    gclid: getString(row.gclid),
    fbclid: getString(row.fbclid),
    landing_page_url: getString(row.landing_page_url),
    micro_market: getString(row.micro_market),
    created_at: getString(row.created_at) ?? undefined,
    updated_at: getString(row.updated_at) ?? undefined,
    last_activity_at: getString(row.last_activity_at) ?? getString(row.updated_at),
    assigned_agent_name: getString(row.assigned_agent_name),
  };
};

export function useLeads({
  page = 1,
  pageSize = 20,
  search = "",
  filters = {},
  sort = { key: "updated_at", ascending: false },
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: LeadsFilters;
  sort?: LeadsSort;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const runQuery = async (useAssignedToColumn: boolean) => {
        let query = supabase
          .from("crm_leads_view")
          .select("*", {
            count: "exact",
          });

        if (search.trim()) {
          const term = search.trim();
          query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
        }
        if (filters.source) {
          // Match against source_type (meta imports), source_channel (facebook_lead_ads), or source_name (legacy)
          query = query.or(`source_type.eq.${filters.source},source_channel.eq.${filters.source}`);
        }
        if (filters.budgetMin) {
          const min = Number(filters.budgetMin);
          if (Number.isFinite(min)) query = query.gte("budget_min", min);
        }
        if (filters.budgetMax) {
          const max = Number(filters.budgetMax);
          if (Number.isFinite(max)) query = query.lte("budget_max", max);
        }
        if (filters.location) query = query.ilike("location", `%${filters.location}%`);
        if (filters.buyerType) query = query.eq("buyer_type", filters.buyerType);
        if (filters.status) query = query.eq("status", filters.status);
        if (filters.assignmentStatus) query = query.eq("assignment_status", filters.assignmentStatus);
        if (filters.assignedAgentId) {
          query = query.eq("assigned_to", filters.assignedAgentId);
        }
        if (filters.unassignedOnly) {
          query = useAssignedToColumn ? query.is("assigned_to", null) : query.is("assigned_agent_id", null);
        }
        if (filters.stageId) query = query.eq("stage_id", filters.stageId);
        if (filters.stageName) query = query.ilike("stage_name", `%${filters.stageName}%`);
        if (filters.createdFrom) query = query.gte("created_at", filters.createdFrom);
        if (filters.createdTo) query = query.lt("created_at", filters.createdTo);
        if (filters.pendingContact) query = query.is("first_contact_at", null);
        if (filters.contactedFrom) query = query.gte("first_contact_at", filters.contactedFrom);
        if (filters.lastActivityBefore) query = query.lt("last_activity_at", filters.lastActivityBefore);
        if (filters.excludeStatuses?.length) {
          query = query.not("status", "in", `(${filters.excludeStatuses.join(",")})`);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        return query
          .order(sort.key, { ascending: sort.ascending, nullsFirst: false })
          .range(from, to);
      };

      let { data, count, error: queryError } = await runQuery(true);
      if (queryError && filters.unassignedOnly && /assigned_to/.test(queryError.message || "")) {
        const fallback = await runQuery(false);
        data = fallback.data;
        count = fallback.count;
        queryError = fallback.error;
      }

      if (queryError) {
        throw new Error(`Schema validation failed for crm_leads_view query: ${queryError.message || "Unknown query error."}`);
      }

      const mapped = ((data as Record<string, unknown>[] | null) || [])
        .map(mapLeadRow)
        .sort((a, b) => getPriorityRank(a.priority) - getPriorityRank(b.priority));
      setLeads(mapped);
      setTotal(count || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch leads");
      setLeads([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    filters.assignedAgentId,
    filters.assignmentStatus,
    filters.budgetMax,
    filters.budgetMin,
    filters.buyerType,
    filters.contactedFrom,
    filters.createdFrom,
    filters.createdTo,
    filters.location,
    filters.pendingContact,
    filters.source,
    filters.stageId,
    filters.stageName,
    filters.status,
    filters.unassignedOnly,
    filters.lastActivityBefore,
    (filters.excludeStatuses ?? []).join(","),
    page,
    pageSize,
    search,
    sort.ascending,
    sort.key,
    supabase,
  ]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    const channel = supabase
      .channel("crm-leads-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_leads" }, () => {
        fetchLeads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeads, supabase]);

  return { leads, total, loading, error, refetch: fetchLeads };
}

