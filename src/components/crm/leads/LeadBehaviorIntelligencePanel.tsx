"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Flame, Radar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CrmBehaviorEvent } from "@/lib/crm/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Behavior intelligence</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {loading ? <p className="text-sm text-slate-400">Loading...</p> : null}
        {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}

        {/* 2×2 compact stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-100 dark:bg-slate-800/50 px-3 py-2">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Intent Score</p>
            <p className="text-xl font-bold mt-0.5">{intentScore}</p>
          </div>
          <div className="rounded-lg bg-slate-100 dark:bg-slate-800/50 px-3 py-2">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Sessions</p>
            <p className="text-xl font-bold mt-0.5">{new Set(events.map((e) => e.session_id).filter(Boolean)).size}</p>
          </div>
          <div className="rounded-lg bg-slate-100 dark:bg-slate-800/50 px-3 py-2">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Events</p>
            <p className="text-xl font-bold mt-0.5">{events.length}</p>
          </div>
          <div className="rounded-lg bg-slate-100 dark:bg-slate-800/50 px-3 py-2">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Top Source</p>
            <p className="text-sm font-semibold mt-0.5 truncate">{topSource}</p>
          </div>
        </div>

        {!loading && events.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-2">No behavior data yet.</p>
        ) : (
          <>
            {alerts.length > 0 && (
              <div className="space-y-1">
                {alerts.map((alert) => (
                  <p key={alert} className="text-xs text-amber-700 dark:text-amber-300">• {alert}</p>
                ))}
              </div>
            )}

            {highInterestProjects.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Flame className="h-3 w-3" /> Projects
                </p>
                {highInterestProjects.map((item) => (
                  <div key={item.projectId} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="truncate text-slate-700 dark:text-slate-300">{item.projectId}</span>
                    <span className="text-slate-400 ml-2 shrink-0">{item.points} pts</span>
                  </div>
                ))}
              </div>
            )}

            {recentActivity.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Radar className="h-3 w-3" /> Recent
                </p>
                {recentActivity.map((event) => (
                  <div key={event.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-slate-700 dark:text-slate-300">{event.event_name}</span>
                    <span className="text-slate-400">{formatTimeAgo(event.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
