"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CrmTask } from "@/lib/crm/types";

export function useTasks({
  status,
  assignedTo,
}: {
  status?: string;
  assignedTo?: string;
} = {}) {
  const supabase = useMemo(() => createClient(), []);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("crm_tasks")
        .select("id,title,description,status,priority,due_date,assigned_to,lead_id,created_at,updated_at")
        .order("due_date", { ascending: true, nullsFirst: false });

      if (status) query = query.eq("status", status);
      if (assignedTo) query = query.eq("assigned_to", assignedTo);

      const { data, error: queryError } = await query.limit(200);
      if (queryError) throw queryError;
      setTasks((data as CrmTask[]) || []);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, [assignedTo, status, supabase]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const channel = supabase
      .channel("crm-tasks-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_tasks" }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks, supabase]);

  return { tasks, loading, error, refetch: fetchTasks };
}

