"use client";

import Link from "next/link";
import { BellRing } from "lucide-react";
import { useNotifications, type CrmNotification } from "@/hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AgentAlertCenterProps {
  userId: string;
}

const getAlertType = (item: CrmNotification): "investor" | "stage_change" | "hot_lead" | "other" => {
  const title = (item.title || "").toLowerCase();
  const message = (item.message || item.body || "").toLowerCase();
  const text = `${title} ${message}`;
  if (/investor/.test(text)) return "investor";
  if (/stage|pipeline/.test(text)) return "stage_change";
  if (/hot|priority|pricing|brochure|repeat|intent/.test(text)) return "hot_lead";
  return "other";
};

const alertTypeLabel = (value: ReturnType<typeof getAlertType>): string => {
  if (value === "investor") return "Investor activity";
  if (value === "stage_change") return "Stage change";
  if (value === "hot_lead") return "Hot lead";
  return "Alert";
};

const isUnread = (item: CrmNotification): boolean => item.read !== true && item.is_read !== true && !item.read_at;

export default function AgentAlertCenter({ userId }: AgentAlertCenterProps) {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId);

  const alerts = notifications
    .filter((item) => {
      const type = getAlertType(item);
      return type === "investor" || type === "stage_change" || type === "hot_lead";
    })
    .slice(0, 12);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="inline-flex items-center gap-2">
            <BellRing className="h-4 w-4" />
            Agent Alert Center
          </span>
          <span className="inline-flex items-center gap-2">
            <Badge variant={unreadCount > 0 ? "default" : "secondary"}>{unreadCount} unread</Badge>
            <Button type="button" variant="outline" size="sm" onClick={() => void markAllAsRead()} disabled={unreadCount === 0}>
              Mark all read
            </Button>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading alerts...</p> : null}
        {!loading && alerts.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No high-priority alerts right now.</p>
        ) : null}

        {alerts.map((alert) => {
          const type = getAlertType(alert);
          const unread = isUnread(alert);
          return (
            <div key={alert.id} className="rounded-md border p-2">
              <Link
                href={alert.lead_id ? `/leads/${alert.lead_id}` : "/leads"}
                onClick={() => {
                  if (unread) void markAsRead(alert.id);
                }}
                className="block hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="font-medium">{alert.title || "Alert"}</p>
                  <span className="inline-flex items-center gap-2">
                    <Badge variant="outline">{alertTypeLabel(type)}</Badge>
                    {unread ? <Badge>Unread</Badge> : <Badge variant="secondary">Read</Badge>}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{alert.message || alert.body || "-"}</p>
              </Link>
              <div className="mt-2 flex justify-end">
                <Button type="button" size="sm" variant="ghost" disabled={!unread} onClick={() => void markAsRead(alert.id)}>
                  Mark as read
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

