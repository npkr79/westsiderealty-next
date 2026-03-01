"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CrmActivity } from "@/lib/crm/types";

export function useActivities(leadId?: string) {
  const supabase = useMemo(() => createClient(), []);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!leadId) {
      setActivities([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from("crm_lead_activities")
        .select("id,lead_id,activity_type,notes,created_by,created_at")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(300);
      if (queryError) throw queryError;
      setActivities((data as CrmActivity[]) || []);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch activities");
    } finally {
      setLoading(false);
    }
  }, [leadId, supabase]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    if (!leadId) return;
    const channel = supabase
      .channel(`crm-activities-live-${leadId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "crm_lead_activities", filter: `lead_id=eq.${leadId}` },
        () => {
          fetchActivities();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActivities, leadId, supabase]);

  return { activities, loading, error, refetch: fetchActivities };
}

