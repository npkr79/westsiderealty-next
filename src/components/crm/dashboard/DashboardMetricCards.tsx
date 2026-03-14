"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/browserClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LeadRow = {
  id: string;
  created_at: string | null;
  first_contact_at: string | null;
  stage_id: string | null;
  assigned_to: string | null;
  name: string | null;
};

type StageRow = {
  id: string;
  name: string;
  position: number;
};

type StageWithCount = StageRow & { count: number };

type TaskRow = {
  id: string;
  title: string | null;
  due_date: string | null;
  lead_id: string | null;
  assigned_to: string | null;
};

type VisitRow = {
  id: string;
  name: string | null;
  phone: string | null;
  assigned_to: string | null;
  stage_id: string | null;
  created_at: string | null;
};

type AgentRow = {
  id: string;
  full_name: string | null;
};

type AgentPerf = {
  agentId: string;
  agentName: string;
  leadsToday: number;
  contactedToday: number;
  avgResponseMins: number | null;
  overdueTaskCount: number;
};

interface DashboardMetricCardsProps {
  scope: "all" | "assigned";
  userId: string;
  userRole: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatOverdue(dueDateIso: string | null): string {
  if (!dueDateIso) return "overdue";
  const diffMs = Date.now() - new Date(dueDateIso).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `${diffHours}h overdue`;
  return `${Math.floor(diffHours / 24)}d overdue`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DashboardMetricCards({
  scope,
  userId,
}: DashboardMetricCardsProps) {
  const router = useRouter();
  const supabase = getBrowserClient();

  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [stages, setStages] = useState<StageRow[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<TaskRow[]>([]);
  const [upcomingVisits, setUpcomingVisits] = useState<VisitRow[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        let leadsQuery = supabase
          .from("crm_leads")
          .select("id, created_at, first_contact_at, stage_id, assigned_to, name");
        if (scope === "assigned") leadsQuery = leadsQuery.eq("assigned_to", userId);

        let taskQuery = supabase
          .from("crm_tasks")
          .select("id, title, due_date, lead_id, assigned_to")
          .lt("due_date", new Date().toISOString())
          .neq("status", "completed");
        if (scope === "assigned") taskQuery = taskQuery.eq("assigned_to", userId);

        const stagesQuery = supabase
          .from("crm_lead_stages")
          .select("id, name, position")
          .order("position");

        const agentsQuery = supabase
          .from("crm_users")
          .select("id, full_name")
          .eq("is_active", true);

        const [stagesRes, leadsRes, taskRes, agentsRes] = await Promise.all([
          stagesQuery,
          leadsQuery,
          taskQuery,
          agentsQuery,
        ]);

        const stagesResult: StageRow[] = (stagesRes.data as StageRow[]) ?? [];

        const siteVisitStage = stagesResult.find(
          (s) => /visit.*scheduled/i.test(s.name) || /site.*visit/i.test(s.name)
        );
        let visitsResult: VisitRow[] = [];
        if (siteVisitStage) {
          const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          let visitQuery = supabase
            .from("crm_leads")
            .select("id, name, phone, assigned_to, stage_id, created_at")
            .eq("stage_id", siteVisitStage.id)
            .lte("created_at", next7Days);
          if (scope === "assigned") visitQuery = visitQuery.eq("assigned_to", userId);
          const { data: visitData } = await visitQuery;
          visitsResult = (visitData as VisitRow[]) ?? [];
        }

        setStages(stagesResult);
        setLeads((leadsRes.data as LeadRow[]) ?? []);
        setOverdueTasks((taskRes.data as TaskRow[]) ?? []);
        setUpcomingVisits(visitsResult);
        setAgents((agentsRes.data as AgentRow[]) ?? []);
      } catch (err) {
        console.error("DashboardMetricCards fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    void fetchAll();
  }, [scope, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Derived metrics
  // ---------------------------------------------------------------------------

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  const leadsToday = leads.filter((l) => l.created_at && l.created_at >= todayIso).length;

  const contactedToday = leads.filter(
    (l) => l.first_contact_at && l.first_contact_at >= todayIso
  ).length;

  const pendingContact = leads.filter(
    (l) => !l.first_contact_at && l.created_at && l.created_at >= todayIso
  ).length;

  const bookingStageId = stages.find((s) => s.name.toLowerCase().includes("book"))?.id;

  const bookingsThisMonth = leads.filter(
    (l) => l.stage_id === bookingStageId && l.created_at && l.created_at >= firstDayOfMonth
  ).length;

  const stageCounts: StageWithCount[] = stages.map((stage) => ({
    ...stage,
    count: leads.filter((l) => l.stage_id === stage.id).length,
  }));

  const pipelineStages = stageCounts.filter(
    (s) => s.position > 1 && !s.name.toLowerCase().includes("lost")
  );

  const agentMap = new Map(agents.map((a) => [a.id, a.full_name?.trim() || "Unknown"]));

  // ---------------------------------------------------------------------------
  // Agent performance (scope=all only)
  // ---------------------------------------------------------------------------

  const agentPerf: AgentPerf[] = (() => {
    if (scope !== "all" || agents.length === 0) return [];

    return agents
      .map((agent) => {
        const agentLeads = leads.filter((l) => l.assigned_to === agent.id);
        const agentLeadsToday = agentLeads.filter(
          (l) => l.created_at && l.created_at >= todayIso
        );
        const agentContactedToday = agentLeads.filter(
          (l) => l.first_contact_at && l.first_contact_at >= todayIso
        );
        const responseTimes = agentLeads
          .filter((l) => l.first_contact_at && l.created_at && l.first_contact_at >= todayIso)
          .map((l) => {
            const created = new Date(l.created_at!).getTime();
            const contacted = new Date(l.first_contact_at!).getTime();
            return (contacted - created) / (1000 * 60);
          })
          .filter((ms) => ms >= 0);

        const avgResponseMins =
          responseTimes.length > 0
            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
            : null;

        const overdueTaskCount = overdueTasks.filter((t) => t.assigned_to === agent.id).length;

        return {
          agentId: agent.id,
          agentName: agent.full_name?.trim() || "Unknown",
          leadsToday: agentLeadsToday.length,
          contactedToday: agentContactedToday.length,
          avgResponseMins,
          overdueTaskCount,
        };
      })
      .filter((a) => a.leadsToday > 0 || a.overdueTaskCount > 0)
      .sort((a, b) => b.leadsToday - a.leadsToday);
  })();

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) return <p className="text-sm">Loading dashboard metrics...</p>;

  return (
    <div className="space-y-4">

      {/* -------------------------------------------------------------------- */}
      {/* Today's snapshot — 4 metric cards                                     */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="cursor-pointer" onClick={() => router.push("/leads?filter=today")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Leads today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{leadsToday}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer" onClick={() => router.push("/leads?filter=contacted_today")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contacted today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{contactedToday}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer" onClick={() => router.push("/leads?filter=pending_contact")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pending contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-semibold">{pendingContact}</p>
              {pendingContact > 0 && (
                <Badge variant="outline" className="border-rose-400 text-rose-500">
                  Urgent
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer" onClick={() => router.push("/leads?filter=bookings_month")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bookings this month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{bookingsThisMonth}</p>
          </CardContent>
        </Card>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Pipeline by stage                                                      */}
      {/* -------------------------------------------------------------------- */}
      {pipelineStages.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pipeline by stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}
            >
              {pipelineStages.map((stage) => (
                <div
                  key={stage.id}
                  className="rounded border p-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => router.push(`/leads?filter=stage_${stage.id}`)}
                >
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mb-1">
                    {stage.name}
                  </p>
                  <p className="text-lg font-semibold">{stage.count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Site visits + Overdue tasks                                            */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Site visits — next 7 days</CardTitle>
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => router.push("/leads?filter=visits_upcoming")}
              >
                {upcomingVisits.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingVisits.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming visits.</p>
            ) : (
              upcomingVisits.slice(0, 4).map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between rounded border p-2 text-sm cursor-pointer"
                  onClick={() => router.push(`/leads/${visit.id}`)}
                >
                  <div>
                    <p className="font-medium">{visit.name || "—"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {stages.find((s) => s.id === visit.stage_id)?.name ?? "—"}
                    </p>
                  </div>
                  {visit.created_at && (
                    <Badge variant="outline">
                      {new Date(visit.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Overdue tasks</CardTitle>
              <Badge
                variant={overdueTasks.length > 0 ? "destructive" : "secondary"}
                className="cursor-pointer"
                onClick={() => router.push("/tasks?filter=overdue")}
              >
                {overdueTasks.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueTasks.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No overdue tasks.</p>
            ) : (
              overdueTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded border p-2 text-sm cursor-pointer"
                  onClick={() => task.lead_id && router.push(`/leads/${task.lead_id}`)}
                >
                  <div>
                    <p className="font-medium">{task.title || "Untitled task"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {task.assigned_to ? (agentMap.get(task.assigned_to) ?? "Unknown") : "Unassigned"}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-rose-400 text-rose-500">
                    {formatOverdue(task.due_date)}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Agent performance — today (scope=all only)                             */}
      {/* -------------------------------------------------------------------- */}
      {scope === "all" && agentPerf.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Agent performance — today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agentPerf.map((row) => (
              <div
                key={row.agentId}
                className="rounded border p-2 text-sm cursor-pointer"
                onClick={() => router.push(`/leads?filter=agent_${row.agentId}`)}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{row.agentName}</p>
                  <Badge variant="secondary">{row.leadsToday} leads today</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Contacted: {row.contactedToday} · Avg response:{" "}
                  {row.avgResponseMins !== null ? `${row.avgResponseMins}m` : "—"} · Overdue tasks:{" "}
                  {row.overdueTaskCount}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
