"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type RawRow = Record<string, unknown>;

interface LeadProjectActivityTabProps {
  leadId: string;
  currentUserId: string;
  assignedAgentId: string | null;
}

interface ProjectInteractionRow {
  id: string;
  projectId: string | null;
  projectName: string;
  location: string;
  assetType: string;
  interactionType: string;
  source: string;
  createdAt: string | null;
  metadata: Record<string, unknown> | null;
}

const asText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const asIso = (value: unknown): string | null => {
  const text = asText(value);
  if (!text) return null;
  const dt = new Date(text);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
};

const asObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const getDateOnly = (iso: string | null): string => {
  if (!iso) return "";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function LeadProjectActivityTab({ leadId, currentUserId, assignedAgentId }: LeadProjectActivityTabProps) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<ProjectInteractionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetClassFilter, setAssetClassFilter] = useState("all");
  const [interactionFilter, setInteractionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [addingNote, setAddingNote] = useState(false);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const selectVariants = [
        "id,lead_id,project_id,interaction_type,source,metadata,created_at",
        "id,lead_id,listing_id,interaction_type,source,metadata,created_at",
        "id,lead_id,project_slug,event_name,source,metadata,created_at",
        "*",
      ];

      let logRows: RawRow[] = [];
      let queryError: string | null = null;
      for (const selectClause of selectVariants) {
        const { data, error: loadError } = await supabase
          .from("crm_listing_interactions")
          .select(selectClause)
          .eq("lead_id", leadId)
          .order("created_at", { ascending: false })
          .limit(1000);
        if (!loadError) {
          logRows = (data as RawRow[]) || [];
          queryError = null;
          break;
        }
        queryError = loadError.message || "Failed to load project activity.";
        if (!/column .* does not exist/i.test(queryError)) break;
      }

      if (queryError) {
        setError(queryError);
        setLoading(false);
        return;
      }

      const projectIds = Array.from(
        new Set(
          logRows
            .map((row) => asText(row.project_id) || asText(row.listing_id))
            .filter((id): id is string => Boolean(id))
        )
      );

      const projectMap = new Map<string, { name: string; location: string; assetType: string }>();
      if (projectIds.length > 0) {
        const rawProjectVariants = [
          { table: "raw_projects", select: "id,project_name,micro_market,property_type" },
          { table: "projects", select: "id,name,location,asset_type" },
        ] as const;

        for (const variant of rawProjectVariants) {
          const { data } = await supabase
            .from(variant.table)
            .select(variant.select)
            .in("id", projectIds);
          for (const row of (data as RawRow[]) || []) {
            const id = asText(row.id);
            if (!id) continue;
            const name = asText(row.project_name) || asText(row.name) || id;
            const location = asText(row.location) || asText(row.micro_market) || "Unknown location";
            const assetType = asText(row.asset_type) || asText(row.property_type) || "Unknown asset class";
            projectMap.set(id, { name, location, assetType });
          }
        }
      }

      const mapped = logRows.map((row) => {
        const metadata = asObject(row.metadata);
        const projectId = asText(row.project_id) || asText(row.listing_id) || asText(row.project_slug);
        const projectMeta = projectId ? projectMap.get(projectId) : null;
        return {
          id: asText(row.id) || crypto.randomUUID(),
          projectId,
          projectName:
            projectMeta?.name ||
            asText(row.project_name) ||
            asText(metadata?.project_name) ||
            asText(row.project_slug) ||
            "Unknown project",
          location:
            projectMeta?.location ||
            asText(row.location) ||
            asText(metadata?.location) ||
            "Unknown location",
          assetType:
            projectMeta?.assetType ||
            asText(row.asset_type) ||
            asText(metadata?.asset_type) ||
            "Unknown asset class",
          interactionType:
            asText(row.interaction_type) ||
            asText(row.event_name) ||
            asText(row.action) ||
            "interaction",
          source:
            asText(row.source) ||
            asText(row.channel) ||
            asText(metadata?.source) ||
            "unknown",
          createdAt:
            asIso(row.created_at) ||
            asIso(row.occurred_at) ||
            asIso(row.updated_at),
          metadata,
        } satisfies ProjectInteractionRow;
      });

      setRows(mapped.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
      setLoading(false);
    };

    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    const channel = supabase
      .channel(`crm-project-activity-${leadId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_listing_interactions", filter: `lead_id=eq.${leadId}` }, () => {
        void load();
      })
      .subscribe();

    return () => {
      window.clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [leadId, supabase]);

  const assetClassOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.assetType))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const interactionOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.interactionType))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
    return rows.filter((row) => {
      if (assetClassFilter !== "all" && row.assetType !== assetClassFilter) return false;
      if (interactionFilter !== "all" && row.interactionType !== interactionFilter) return false;
      if (row.createdAt && (fromDate || toDate)) {
        const created = new Date(row.createdAt);
        if (fromDate && created < fromDate) return false;
        if (toDate && created > toDate) return false;
      }
      return true;
    });
  }, [assetClassFilter, dateFrom, dateTo, interactionFilter, rows]);

  const summary = useMemo(() => {
    const assetMap = new Map<string, number>();
    const locationMap = new Map<string, number>();
    const viewedProjects = new Set<string>();
    const shortlistedProjects = new Set<string>();

    for (const row of filteredRows) {
      assetMap.set(row.assetType, (assetMap.get(row.assetType) || 0) + 1);
      locationMap.set(row.location, (locationMap.get(row.location) || 0) + 1);
      if (/view/i.test(row.interactionType) && row.projectName) viewedProjects.add(row.projectName);
      if (/shortlist/i.test(row.interactionType) && row.projectName) shortlistedProjects.add(row.projectName);
    }

    const mostViewedAssetClass = Array.from(assetMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
    const mostViewedLocation = Array.from(locationMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    return {
      mostViewedAssetClass,
      mostViewedLocation,
      totalProjectsViewed: viewedProjects.size,
      shortlistedProjects: shortlistedProjects.size,
    };
  }, [filteredRows]);

  const addLeadActivity = async (activityType: string, notes: string) => {
    const { error: insertError } = await supabase.from("crm_lead_activities").insert({
      lead_id: leadId,
      activity_type: activityType,
      notes,
      created_by: currentUserId,
    });
    if (insertError) {
      setActionMessage(insertError.message || "Action failed.");
      return;
    }
    setActionMessage("Action completed.");
  };

  const createTaskAction = async (title: string, description: string) => {
    const { error: taskError } = await supabase.from("crm_tasks").insert({
      lead_id: leadId,
      assigned_to: assignedAgentId,
      title,
      description,
      status: "pending",
      priority: "high",
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    if (taskError) {
      setActionMessage(taskError.message || "Task creation failed.");
      return;
    }
    setActionMessage("Task created.");
  };

  if (loading) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading project activity...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Most viewed asset class</p><p className="text-lg font-semibold">{summary.mostViewedAssetClass}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Most viewed location</p><p className="text-lg font-semibold">{summary.mostViewedLocation}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Total projects viewed</p><p className="text-3xl font-semibold">{summary.totalProjectsViewed}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Shortlisted projects</p><p className="text-3xl font-semibold">{summary.shortlistedProjects}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-4">
          <Select value={assetClassFilter} onValueChange={setAssetClassFilter}>
            <SelectTrigger><SelectValue placeholder="Asset class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All asset classes</SelectItem>
              {assetClassOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={interactionFilter} onValueChange={setInteractionFilter}>
            <SelectTrigger><SelectValue placeholder="Interaction type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All interaction types</SelectItem>
              {interactionOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void createTaskAction("Send similar projects", "Share similar projects based on recent interactions.")}>
              Send similar projects
            </Button>
            <Button type="button" variant="outline" onClick={() => void addLeadActivity("shortlist_created", "Shortlist created from project activity tab.")}>
              Create shortlist
            </Button>
            <Button type="button" variant="outline" onClick={() => setAddingNote((prev) => !prev)}>
              Add note
            </Button>
          </div>
          {addingNote ? (
            <div className="space-y-2">
              <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a lead note..." />
              <Button
                type="button"
                onClick={() => {
                  if (!noteText.trim()) return;
                  void addLeadActivity("note", noteText.trim());
                  setNoteText("");
                  setAddingNote(false);
                }}
              >
                Save note
              </Button>
            </div>
          ) : null}
          {actionMessage ? <p className="text-sm text-slate-600 dark:text-slate-300">{actionMessage}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Website Activity</CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pages and projects this lead viewed on westsiderealty.in
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
          {filteredRows.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No website activity recorded yet.</p>
          ) : (
            filteredRows.map((row) => (
              <div key={row.id} className="rounded-md border-l-4 border-slate-300 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{row.projectName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}
                  </p>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary">{row.interactionType}</Badge>
                  <Badge variant="outline">{row.assetType}</Badge>
                  <span className="text-slate-500 dark:text-slate-400">Source: {row.source}</span>
                  <span className="text-slate-500 dark:text-slate-400">Location: {row.location}</span>
                </div>
                {row.metadata ? (
                  <pre className="mt-2 overflow-auto rounded bg-slate-100 p-2 text-[11px] dark:bg-slate-950">
                    {JSON.stringify(row.metadata, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

