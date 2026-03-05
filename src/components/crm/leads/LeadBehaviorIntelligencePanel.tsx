"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Flame, Radar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CrmBehaviorEvent } from "@/lib/crm/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LeadBehaviorIntelligencePanelProps {
  leadId: string;
}

const BEHAVIOR_SELECT_VARIANTS = [
  "id,lead_id,event_name,event_type,event_score,source,device,session_id,metadata,created_at",
  "id,lead_id,event_name,session_id,metadata,created_at",
] as const;

const INTEREST_WEIGHTS: Record<string, number> = {
  page_view: 5,
  project_view: 20,
  pricing_view: 35,
  brochure_download: 45,
  lead_submitted: 15,
};

const getProjectKey = (event: CrmBehaviorEvent): string | null => {
  const metadata = event.metadata && typeof event.metadata === "object" ? event.metadata : null;
  const projectId = metadata && typeof metadata.project_id === "string" ? metadata.project_id : null;
  const projectSlug = metadata && typeof metadata.project_slug === "string" ? metadata.project_slug : null;
  return projectId || projectSlug || null;
};

const isRepeatSignal = (event: CrmBehaviorEvent): boolean => {
  const type = String(event.event_type || "").toLowerCase();
  if (type.includes("repeat")) return true;
  const metadata = event.metadata && typeof event.metadata === "object" ? event.metadata : null;
  if (!metadata) return false;
  const repeatByFlag = metadata.is_repeat_visit === true;
  const repeatByCount = typeof metadata.visit_count === "number" && metadata.visit_count > 1;
  return repeatByFlag || repeatByCount;
};

const formatTimeAgo = (value?: string): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export default function LeadBehaviorIntelligencePanel({ leadId }: LeadBehaviorIntelligencePanelProps) {
  const supabase = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<CrmBehaviorEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBehaviorEvents = useCallback(async (): Promise<CrmBehaviorEvent[]> => {
    let lastError: string | null = null;
    for (const selectClause of BEHAVIOR_SELECT_VARIANTS) {
      const { data, error: queryError } = await supabase
        .from("crm_behavior_events")
        .select(selectClause)
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(400);

      if (!queryError) {
        return (data as CrmBehaviorEvent[]) || [];
      }

      lastError = queryError.message || "Unable to load behavior intelligence.";
      const looksLikeSchemaMiss = /column .* does not exist/i.test(lastError);
      if (!looksLikeSchemaMiss) break;
    }
    throw new Error(lastError || "Unable to load behavior intelligence.");
  }, [leadId, supabase]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await loadBehaviorEvents();
        setEvents(data);
      } catch (queryError) {
        setError(queryError instanceof Error ? queryError.message : "Unable to load behavior intelligence.");
      } finally {
        setLoading(false);
      }
    };

    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [loadBehaviorEvents]);

  useEffect(() => {
    const channel = supabase
      .channel(`crm-behavior-${leadId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_behavior_events", filter: `lead_id=eq.${leadId}` }, () => {
        void (async () => {
          try {
            const data = await loadBehaviorEvents();
            setEvents(data);
          } catch {
            // Keep current UI state if realtime refresh fails due to transient schema/network issues.
          }
        })();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, loadBehaviorEvents, supabase]);

  const intentScore = useMemo(() => {
    let score = 0;
    for (const event of events.slice(0, 40)) {
      const weighted = typeof event.event_score === "number" ? event.event_score : INTEREST_WEIGHTS[event.event_name] || 2;
      score += weighted;
      if (isRepeatSignal(event)) score += 5;
    }
    return Math.min(100, score);
  }, [events]);

  const recentActivity = useMemo(() => events.slice(0, 5), [events]);

  const topSource = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of events) {
      if (!event.source) continue;
      counts.set(event.source, (counts.get(event.source) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  }, [events]);

  const topDevice = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of events) {
      if (!event.device) continue;
      counts.set(event.device, (counts.get(event.device) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  }, [events]);

  const highInterestProjects = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of events) {
      const projectKey = getProjectKey(event);
      if (!projectKey) continue;
      const weighted = typeof event.event_score === "number" ? event.event_score : INTEREST_WEIGHTS[event.event_name] || 1;
      map.set(projectKey, (map.get(projectKey) || 0) + weighted);
    }
    return Array.from(map.entries())
      .map(([projectId, points]) => ({ projectId, points }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  }, [events]);

  const alerts = useMemo(() => {
    const now = Date.now();
    const list: string[] = [];
    const pricingToday = events.find((event) => {
      if (event.event_name !== "pricing_view" || !event.created_at) return false;
      return now - new Date(event.created_at).getTime() < 24 * 60 * 60 * 1000;
    });
    if (pricingToday) list.push("Lead viewed pricing today.");

    const brochure = events.find((event) => event.event_name === "brochure_download");
    if (brochure) list.push("Brochure downloaded recently.");

    const repeat = events.find((event) => isRepeatSignal(event));
    if (repeat) list.push("Repeat visits detected.");

    return list;
  }, [events]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Behavior intelligence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <p className="text-sm">Loading behavior intelligence...</p> : null}
        {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Intent score</p>
            <p className="mt-1 text-2xl font-semibold">{intentScore}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Weighted from recent behavior timeline.</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Sessions tracked</p>
            <p className="mt-1 text-2xl font-semibold">{new Set(events.map((e) => e.session_id).filter(Boolean)).size}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Across repeat and fresh visits.</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Recent events</p>
            <p className="mt-1 text-2xl font-semibold">{events.length}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Behavior signals linked to this lead.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Top source</p>
            <p className="mt-1 text-lg font-semibold">{topSource}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Auto-derived from available event source values.</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Top device</p>
            <p className="mt-1 text-lg font-semibold">{topDevice}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Falls back to N/A when device data is absent.</p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-md border p-3">
            <p className="mb-2 flex items-center gap-1 text-sm font-semibold">
              <Radar className="h-4 w-4" />
              Behavior timeline
            </p>
            <div className="space-y-2">
              {events.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No behavior events mapped yet.</p>
              ) : (
                events.slice(0, 8).map((event) => (
                  <div key={event.id} className="flex items-center justify-between rounded border px-2 py-1.5 text-xs">
                    <span>{event.event_name}</span>
                    <span className="text-slate-500 dark:text-slate-400">{formatTimeAgo(event.created_at)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-md border p-3">
            <p className="mb-2 flex items-center gap-1 text-sm font-semibold">
              <Flame className="h-4 w-4" />
              High-interest projects
            </p>
            <div className="space-y-2">
              {highInterestProjects.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No project-level behavior yet.</p>
              ) : (
                highInterestProjects.map((item) => (
                  <div key={item.projectId} className="flex items-center justify-between rounded border px-2 py-1.5 text-xs">
                    <span>{item.projectId}</span>
                    <Badge variant="secondary">{item.points} pts</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-md border p-3">
          <p className="mb-2 flex items-center gap-1 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Intent alerts
          </p>
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No high-intent alerts at the moment.</p>
          ) : (
            <div className="space-y-1">
              {alerts.map((alert) => (
                <p key={alert} className="text-sm text-amber-700 dark:text-amber-300">• {alert}</p>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-md border p-3">
          <p className="mb-2 text-sm font-semibold">Recent activity</p>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity yet.</p>
          ) : (
            recentActivity.map((event) => (
              <div key={event.id} className="mb-1 flex items-center justify-between text-sm">
                <span>{event.event_name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{formatTimeAgo(event.created_at)}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
