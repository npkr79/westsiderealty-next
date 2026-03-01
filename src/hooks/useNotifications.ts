"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface CrmNotification {
  id: string;
  lead_id?: string | null;
  recipient_user_id?: string | null;
  user_id?: string | null;
  title?: string | null;
  message?: string | null;
  body?: string | null;
  severity?: string | null;
  type?: string | null;
  read?: boolean | null;
  is_read?: boolean | null;
  read_at?: string | null;
  created_at?: string;
}

export function useNotifications(userId?: string) {
  const supabase = useMemo(() => createClient(), []);
  const [notifications, setNotifications] = useState<CrmNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schemaMode, setSchemaMode] = useState<"recipient_user_id" | "user_id">("recipient_user_id");

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const candidates = [
      supabase
        .from("crm_notifications")
        .select("id,lead_id,recipient_user_id,title,message,severity,read,created_at")
        .eq("recipient_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("crm_notifications")
        .select("id,lead_id,user_id,title,body,type,is_read,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
    ];

    for (const [index, query] of candidates.entries()) {
      const { data, error: queryError } = await query;
      if (!queryError) {
        setSchemaMode(index === 0 ? "recipient_user_id" : "user_id");
        setNotifications((data as CrmNotification[]) || []);
        setLoading(false);
        return;
      }
      setError(queryError.message || "Failed to load notifications.");
    }
    setLoading(false);
  }, [supabase, userId]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!notificationId) return false;
      const payloads =
        schemaMode === "recipient_user_id"
          ? [{ read: true }, { read: true, read_at: new Date().toISOString() }]
          : [{ is_read: true }, { is_read: true, read_at: new Date().toISOString() }];
      for (const payload of payloads) {
        const { error: updateError } = await supabase.from("crm_notifications").update(payload).eq("id", notificationId);
        if (!updateError) {
          setNotifications((prev) =>
            prev.map((item) =>
              item.id === notificationId
                ? {
                    ...item,
                    read: true,
                    is_read: true,
                    read_at: new Date().toISOString(),
                  }
                : item
            )
          );
          return true;
        }
      }
      return false;
    },
    [schemaMode, supabase]
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return false;
    const matcherColumn = schemaMode === "recipient_user_id" ? "recipient_user_id" : "user_id";
    const payloads =
      schemaMode === "recipient_user_id"
        ? [{ read: true }, { read: true, read_at: new Date().toISOString() }]
        : [{ is_read: true }, { is_read: true, read_at: new Date().toISOString() }];
    for (const payload of payloads) {
      const query = supabase.from("crm_notifications").update(payload).eq(matcherColumn, userId);
      const { error: updateError } = await query;
      if (!updateError) {
        setNotifications((prev) =>
          prev.map((item) => ({
            ...item,
            read: true,
            is_read: true,
            read_at: new Date().toISOString(),
          }))
        );
        return true;
      }
    }
    return false;
  }, [schemaMode, supabase, userId]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.read !== true && item.is_read !== true && !item.read_at).length,
    [notifications]
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`crm-notifications-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_notifications" }, fetchNotifications)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, supabase, userId]);

  return { notifications, loading, error, unreadCount, markAsRead, markAllAsRead, refetch: fetchNotifications };
}
