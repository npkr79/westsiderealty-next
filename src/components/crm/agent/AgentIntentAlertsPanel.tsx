"use client";

import Link from "next/link";
import { BellRing } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AgentIntentAlertsPanelProps {
  userId: string;
}

export default function AgentIntentAlertsPanel({ userId }: AgentIntentAlertsPanelProps) {
  const { notifications, loading } = useNotifications(userId);

  const intentAlerts = notifications
    .filter((item) => {
      const title = (item.title || "").toLowerCase();
      const message = (item.message || item.body || "").toLowerCase();
      return (
        /pricing|brochure|repeat|sla|overdue|follow-up|follow up|missed/.test(title) ||
        /pricing|brochure|repeat|sla|overdue|follow-up|follow up|missed/.test(message)
      );
    })
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BellRing className="h-4 w-4" />
          Real-time intent alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading alerts...</p> : null}
        {intentAlerts.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No fresh intent/SLA alerts.</p>
        ) : (
          intentAlerts.map((alert) => (
            <Link
              key={alert.id}
              href={alert.lead_id ? `/leads/${alert.lead_id}` : "/leads"}
              className="block rounded-md border p-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <div className="mb-1 flex items-center justify-between">
                <p className="font-medium">{alert.title || "Intent signal"}</p>
                <Badge variant="outline">{alert.severity || alert.type || "info"}</Badge>
              </div>
              <p className="text-slate-600 dark:text-slate-300">{alert.message || alert.body || "-"}</p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
