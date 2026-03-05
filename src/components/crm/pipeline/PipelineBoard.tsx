"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DndContext, type DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CrmLead } from "@/lib/crm/types";
import { getPriorityBadgeClassName, getPriorityLabel, getPriorityRank } from "@/lib/crm/leadPriority";
import { formatBudgetRange, toBudgetNumber } from "@/lib/crm/budget";

interface CrmLeadStage {
  id: string;
  name: string | null;
  is_active?: boolean | null;
  position?: number | null;
}

interface SupabaseLikeError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

const isSupabaseLikeError = (value: unknown): value is SupabaseLikeError =>
  Boolean(value) && typeof value === "object" && "message" in (value as Record<string, unknown>);

const formatError = (err: unknown): string => {
  if (isSupabaseLikeError(err)) {
    const code = err.code ? `code=${err.code} ` : "";
    const details = err.details ? ` details=${err.details}` : "";
    const hint = err.hint ? ` hint=${err.hint}` : "";
    return `${code}${err.message || "Unknown Supabase error."}${details}${hint}`.trim();
  }
  if (err instanceof Error) return err.message;
  return "Failed to load pipeline";
};

function LeadCard({ lead }: { lead: CrmLead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lead-${lead.id}`,
    data: { leadId: lead.id },
  });

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className="w-full rounded-md border bg-white p-3 text-left shadow-sm transition hover:border-slate-300 dark:bg-slate-950 dark:hover:border-slate-700"
      {...listeners}
      {...attributes}
    >
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{lead.name}</p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">{formatBudgetRange(lead.budget_min, lead.budget_max)}</p>
        <div className="flex items-center gap-1.5">
          <Badge className={getPriorityBadgeClassName(lead.priority)}>{getPriorityLabel(lead.priority)}</Badge>
          <Badge variant="outline" className={isDragging ? "opacity-60" : ""}>
            {lead.status || "new"}
          </Badge>
        </div>
      </div>
    </button>
  );
}

function StageColumn({
  stage,
  leads,
  fallbackLabel,
}: {
  stage: CrmLeadStage;
  leads: CrmLead[];
  fallbackLabel: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[420px] w-[280px] shrink-0 rounded-xl border bg-slate-50 p-3 dark:bg-slate-900 ${
        isOver ? "border-slate-900 dark:border-slate-100" : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">{stage.name || fallbackLabel}</p>
        <Badge variant="secondary">{leads.length}</Badge>
      </div>
      <div className="space-y-2">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

export default function PipelineBoard() {
  const supabase = useMemo(() => createClient(), []);
  const [stages, setStages] = useState<CrmLeadStage[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<"all" | "hot">("all");

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: stagesData, error: stagesError } = await supabase
        .from("crm_lead_stages")
        .select("id,name,position,is_active")
        .eq("is_active", true)
        .order("position", { ascending: true, nullsFirst: false });
      if (stagesError) throw new Error(`Schema validation failed for crm_lead_stages query: ${stagesError.message || "Unknown query error."}`);

      const activeStages = ((stagesData as CrmLeadStage[]) || []).sort((a, b) => {
        const aPos = typeof a.position === "number" ? a.position : Number.MAX_SAFE_INTEGER;
        const bPos = typeof b.position === "number" ? b.position : Number.MAX_SAFE_INTEGER;
        if (aPos !== bPos) return aPos - bPos;
        const aName = (a.name || "").toLowerCase();
        const bName = (b.name || "").toLowerCase();
        return aName.localeCompare(bName);
      });
      setStages(activeStages);

      if (activeStages.length === 0) {
        console.warn("[PipelineBoard] No active stages found in crm_lead_stages.");
        setLeads([]);
        return;
      }

      const stageIds = activeStages.map((stage) => stage.id);
      const leadSelectVariants = [
        "id,name,budget_min,budget_max,status,stage_id,priority",
        "id,name,budget_min,budget_max,status,stage_id,lead_priority",
        "id,name,budget_min,budget_max,status,stage_id",
      ];
      let loadedLeads: CrmLead[] = [];
      let loaded = false;
      let lastError: string | null = null;
      for (const selectClause of leadSelectVariants) {
        const { data: leadsData, error: leadsError } = await supabase
          .from("crm_leads_view")
          .select(selectClause)
          .in("stage_id", stageIds)
          .order("updated_at", { ascending: false })
          .limit(1000);
        if (!leadsError) {
          loadedLeads = ((leadsData as Array<Record<string, unknown>>) || []).map((row) => ({
            id: String(row.id || ""),
            name: String(row.name || "Unnamed lead"),
            budget_min: toBudgetNumber(row.budget_min),
            budget_max: toBudgetNumber(row.budget_max),
            status: typeof row.status === "string" ? row.status : null,
            stage_id: typeof row.stage_id === "string" ? row.stage_id : null,
            priority:
              typeof row.priority === "string"
                ? row.priority
                : typeof row.lead_priority === "string"
                  ? row.lead_priority
                  : null,
            phone: "-",
            source: null,
            location: null,
            buyer_type: null,
            assigned_agent_id: null,
          }));
          loaded = true;
          break;
        }
        lastError = leadsError.message || "Unknown query error.";
        if (!/column .* does not exist/i.test(lastError || "")) break;
      }
      if (!loaded) throw new Error(`Schema validation failed for crm_leads_view pipeline query: ${lastError || "Unknown query error."}`);
      const missingStageIdCount = loadedLeads.filter((lead) => !lead.stage_id).length;
      if (missingStageIdCount > 0) {
        console.warn(`[PipelineBoard] ${missingStageIdCount} lead(s) missing stage_id were excluded from kanban.`);
      }
      setLeads(loadedLeads);
    } catch (err: unknown) {
      const errorMessage = formatError(err);
      console.error("[PipelineBoard] Failed to load pipeline board data.", {
        raw: err,
        message: errorMessage,
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  useEffect(() => {
    const channel = supabase
      .channel("crm-pipeline-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_leads" }, fetchBoard)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_lead_stages" }, fetchBoard)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBoard, supabase]);

  const leadsByStage = useMemo(() => {
    const grouped: Record<string, CrmLead[]> = {};
    for (const stage of stages) grouped[stage.id] = [];
    for (const lead of leads) {
      if (priorityFilter === "hot" && getPriorityLabel(lead.priority) !== "HOT") continue;
      if (lead.stage_id && grouped[lead.stage_id]) {
        grouped[lead.stage_id].push(lead);
      }
    }
    for (const stageId of Object.keys(grouped)) {
      grouped[stageId].sort((a, b) => getPriorityRank(a.priority) - getPriorityRank(b.priority));
    }
    return grouped;
  }, [leads, priorityFilter, stages]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const activeId = String(event.active.id || "");
      const overId = String(event.over?.id || "");
      if (!activeId.startsWith("lead-") || !overId.startsWith("stage-")) return;

      const leadId = activeId.replace("lead-", "");
      const nextStageId = overId.replace("stage-", "");
      const lead = leads.find((item) => item.id === leadId);
      if (!lead || lead.stage_id === nextStageId) return;

      const previousStageId = lead.stage_id || null;
      setUpdatingLeadId(leadId);
      setLeads((prev) => prev.map((item) => (item.id === leadId ? { ...item, stage_id: nextStageId } : item)));

      const response = await fetch("/api/crm/pipeline/update-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, toStageId: nextStageId }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const reason = payload?.error || "Unable to update lead stage";
        console.error("[PipelineBoard] Failed to update lead stage.", { leadId, nextStageId, error: reason });
        setLeads((prev) => prev.map((item) => (item.id === leadId ? { ...item, stage_id: previousStageId } : item)));
        setError(reason);
      }
      setUpdatingLeadId(null);
    },
    [leads]
  );

  if (loading) {
    return <Card><CardContent className="pt-6 text-sm">Loading pipeline...</CardContent></Card>;
  }

  if (error) {
    return <Card><CardContent className="pt-6 text-sm text-rose-600 dark:text-rose-300">{error}</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">Lead pipeline board</CardTitle>
          <Select value={priorityFilter} onValueChange={(value: "all" | "hot") => setPriorityFilter(value)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Priority filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="hot">HOT only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {updatingLeadId ? (
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Updating stage...</p>
        ) : null}
        <DndContext onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {stages.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-slate-500 dark:text-slate-400">
                No active stages configured. Add active rows in `crm_lead_stages` to render kanban columns.
              </div>
            ) : (
              stages.map((stage, index) => (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  fallbackLabel={`Stage ${index + 1}`}
                  leads={leadsByStage[stage.id] || []}
                />
              ))
            )}
          </div>
        </DndContext>
      </CardContent>
    </Card>
  );
}
