"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLeads } from "@/hooks/useLeads";
import { useTasks } from "@/hooks/useTasks";
import type { CrmUser } from "@/lib/crm/types";
import AgentAlertCenter from "@/components/crm/agent/AgentAlertCenter";
import { getPriorityBadgeClassName, getPriorityLabel } from "@/lib/crm/leadPriority";

interface AgentDashboardRealtimeProps {
  user: CrmUser;
}

const isToday = (value?: string | null): boolean => {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
};

export default function AgentDashboardRealtime({ user }: AgentDashboardRealtimeProps) {
  const { leads } = useLeads({
    page: 1,
    pageSize: 200,
    sort: { key: "created_at", ascending: false },
    filters: { assignedAgentId: user.id },
  });
  const { tasks } = useTasks({ assignedTo: user.id });

  const newLeadsToday = useMemo(() => leads.filter((lead) => isToday(lead.created_at)).length, [leads]);
  const hotLeadsToday = useMemo(
    () => leads.filter((lead) => isToday(lead.created_at) && getPriorityLabel(lead.priority) === "HOT").length,
    [leads]
  );
  const tasksDueToday = useMemo(() => tasks.filter((task) => isToday(task.due_date) && task.status !== "completed").length, [tasks]);
  const upcomingSiteVisits = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (task.title || "").toLowerCase().includes("site visit") &&
          task.status !== "completed"
      ).length,
    [tasks]
  );

  const pipelineSummary = useMemo(() => {
    const total = leads.length;
    const qualified = leads.filter((lead) => /qualified|hot|proposal/i.test(lead.status || "")).length;
    const active = leads.filter((lead) => !/closed|lost|won/i.test(lead.status || "")).length;
    return { total, qualified, active };
  }, [leads]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">New leads today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{newLeadsToday}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tasks due today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{tasksDueToday}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Upcoming site visits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{upcomingSiteVisits}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300">Active leads</span>
              <Badge variant="secondary">{pipelineSummary.active}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300">Qualified</span>
              <Badge variant="secondary">{pipelineSummary.qualified}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300">Total assigned</span>
              <Badge variant="secondary">{pipelineSummary.total}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hot leads today</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <p className="text-3xl font-semibold">{hotLeadsToday}</p>
            <Badge className={getPriorityBadgeClassName("HOT")}>HOT</Badge>
          </CardContent>
        </Card>
      </div>
      <AgentAlertCenter userId={user.id} />
    </div>
  );
}

