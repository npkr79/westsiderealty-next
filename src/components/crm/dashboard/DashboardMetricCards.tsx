"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/browserClient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LeadRow = {
  id: string;
  created_at: string | null;
  first_contact_at: string | null; // ⚠️ See flag at bottom of file
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

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatOverdue(dueDateIso: string | null): string {
  if (!dueDateIso) return "overdue";
  const diffMs = Date.now() - new Date(dueDateIso).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `${diffHours}h overdue`;
  return `${Math.floor(diffHours / 24)}d overdue`;
}

function responseColor(avgMins: number | null): string {
  if (avgMins === null) return "inherit";
  if (avgMins < 15) return "#22c55e";
  if (avgMins <= 30) return "#f59e0b";
  return "#ef4444";
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

const skeletonStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  borderRadius: "10px",
  animation: "pulse 1.5s ease-in-out infinite",
};

function SkeletonBlock({ h = 80, w = "100%" }: { h?: number; w?: string }) {
  return <div style={{ ...skeletonStyle, height: h, width: w }} />;
}

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

interface MetricCardProps {
  label: string;
  value: number | string;
  onClick: () => void;
  accentColor?: string; // left border colour
}

function MetricCard({ label, value, onClick, accentColor }: MetricCardProps) {
  const [hovered, setHovered] = useState(false);

  const cardStyle: React.CSSProperties = {
    background: hovered
      ? "var(--color-background-primary, #0d0d0d)"
      : "var(--color-background-secondary, #131313)",
    border: hovered
      ? "0.5px solid var(--color-border-secondary, rgba(255,255,255,0.15))"
      : "0.5px solid transparent",
    borderLeft: accentColor ? `3px solid ${accentColor}` : undefined,
    borderRadius: "var(--border-radius-md, 10px)",
    padding: "14px 16px",
    cursor: "pointer",
    position: "relative",
    transition: "background 0.15s, border 0.15s",
  };

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p
        style={{
          fontSize: 12,
          color: "var(--color-text-secondary, #94a3b8)",
          marginBottom: 6,
          marginTop: 0,
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 26, fontWeight: 500, margin: 0 }}>{value}</p>
      {hovered && (
        <span
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            fontSize: 14,
            color: "var(--color-text-secondary, #94a3b8)",
          }}
        >
          →
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DashboardMetricCards({
  scope,
  userId,
  userRole,
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

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // -----------------------------------------------------------------------
      // Query B — stages first (needed to find site visit stage id)
      // -----------------------------------------------------------------------
      const { data: stagesData } = await supabase
        .from("crm_lead_stages")
        .select("id, name, position")
        .order("position");
      const stagesResult: StageRow[] = (stagesData as StageRow[]) ?? [];
      setStages(stagesResult);

      // -----------------------------------------------------------------------
      // Query A — leads summary
      // -----------------------------------------------------------------------
      let leadsQuery = supabase
        .from("crm_leads")
        .select("id, created_at, first_contact_at, stage_id, assigned_to, name");
      if (scope === "assigned") leadsQuery = leadsQuery.eq("assigned_to", userId);
      const { data: leadsData } = await leadsQuery;
      setLeads((leadsData as LeadRow[]) ?? []);

      // -----------------------------------------------------------------------
      // Query C — overdue tasks
      // -----------------------------------------------------------------------
      let taskQuery = supabase
        .from("crm_tasks")
        .select("id, title, due_date, lead_id, assigned_to")
        .lt("due_date", new Date().toISOString())
        .neq("status", "completed");
      if (scope === "assigned") taskQuery = taskQuery.eq("assigned_to", userId);
      const { data: taskData } = await taskQuery;
      setOverdueTasks((taskData as TaskRow[]) ?? []);

      // -----------------------------------------------------------------------
      // Query D — upcoming site visits (leads in site-visit-scheduled stage)
      // -----------------------------------------------------------------------
      const siteVisitStage = stagesResult.find(
        (s) =>
          /visit.*scheduled/i.test(s.name) ||
          /site.*visit/i.test(s.name)
      );
      if (siteVisitStage) {
        const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        let visitQuery = supabase
          .from("crm_leads")
          .select("id, name, phone, assigned_to, stage_id, created_at")
          .eq("stage_id", siteVisitStage.id)
          .lte("created_at", next7Days);
        if (scope === "assigned") visitQuery = visitQuery.eq("assigned_to", userId);
        const { data: visitData } = await visitQuery;
        setUpcomingVisits((visitData as VisitRow[]) ?? []);
      }

      // -----------------------------------------------------------------------
      // Query E — agents (admin / scope=all only)
      // -----------------------------------------------------------------------
      if (scope === "all") {
        const { data: agentData } = await supabase
          .from("crm_users")
          .select("id, full_name")
          .eq("is_active", true);
        setAgents((agentData as AgentRow[]) ?? []);
      }

      setLoading(false);
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

  const bookingStageId = stages.find((s) =>
    s.name.toLowerCase().includes("book")
  )?.id;

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

        // Avg response time in minutes for leads contacted today
        const responseTimes = agentLeads
          .filter(
            (l) =>
              l.first_contact_at &&
              l.created_at &&
              l.first_contact_at >= todayIso
          )
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

        const overdueTaskCount = overdueTasks.filter(
          (t) => t.assigned_to === agent.id
        ).length;

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
  // Render — loading skeleton
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: "2rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} h={78} />)}
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto" }}>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} h={60} w="120px" />)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <SkeletonBlock h={180} />
            <SkeletonBlock h={180} />
          </div>
        </div>
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Render — full UI
  // ---------------------------------------------------------------------------

  const sectionLabel: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "var(--color-text-secondary, #64748b)",
    marginBottom: 8,
    marginTop: 0,
  };

  const panel: React.CSSProperties = {
    background: "var(--color-background-secondary, #131313)",
    border: "0.5px solid rgba(255,255,255,0.08)",
    borderRadius: "var(--border-radius-md, 10px)",
    padding: 16,
  };

  const panelHeader: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  };

  const badge = (color: string): React.CSSProperties => ({
    display: "inline-block",
    background: color,
    color: "#fff",
    borderRadius: 99,
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    cursor: "pointer",
  });

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 0",
    borderBottom: "0.5px solid rgba(255,255,255,0.06)",
    cursor: "pointer",
  };

  return (
    <>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: "2rem" }}>

        {/* ------------------------------------------------------------------ */}
        {/* Section 1 — Today's snapshot                                        */}
        {/* ------------------------------------------------------------------ */}
        <div>
          <p style={sectionLabel}>Today&rsquo;s snapshot</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <MetricCard
              label="Leads today"
              value={leadsToday}
              onClick={() => router.push("/leads?filter=today")}
            />
            <MetricCard
              label="Contacted today"
              value={contactedToday}
              onClick={() => router.push("/leads?filter=contacted_today")}
              accentColor={contactedToday > 0 ? "#22c55e" : undefined}
            />
            <MetricCard
              label="Pending contact"
              value={pendingContact}
              onClick={() => router.push("/leads?filter=pending_contact")}
              accentColor={pendingContact > 0 ? "#ef4444" : undefined}
            />
            <MetricCard
              label="Bookings this month"
              value={bookingsThisMonth}
              onClick={() => router.push("/leads?filter=bookings_month")}
            />
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Section 2 — Pipeline by stage                                       */}
        {/* ------------------------------------------------------------------ */}
        {pipelineStages.length > 0 && (
          <div>
            <p style={sectionLabel}>Pipeline by stage</p>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              {pipelineStages.map((stage) => (
                <div
                  key={stage.id}
                  onClick={() => router.push(`/leads?filter=stage_${stage.id}`)}
                  style={{
                    flexShrink: 0,
                    background: "var(--color-background-secondary, #131313)",
                    border: "0.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    textAlign: "center",
                    cursor: "pointer",
                    minWidth: 100,
                  }}
                >
                  <p style={{ fontSize: 20, fontWeight: 500, margin: "0 0 4px" }}>{stage.count}</p>
                  <p style={{ fontSize: 11, color: "var(--color-text-secondary, #94a3b8)", margin: 0 }}>
                    {stage.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Section 3 — Site visits + Overdue tasks                             */}
        {/* ------------------------------------------------------------------ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          {/* Left — Site visits */}
          <div style={panel}>
            <div style={panelHeader}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
                Site visits — next 7 days
              </p>
              <span
                style={badge("#2563eb")}
                onClick={() => router.push("/leads?filter=visits_upcoming")}
              >
                {upcomingVisits.length}
              </span>
            </div>
            {upcomingVisits.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--color-text-secondary, #64748b)", margin: 0 }}>
                No upcoming visits.
              </p>
            ) : (
              upcomingVisits.slice(0, 3).map((visit) => (
                <div
                  key={visit.id}
                  style={rowStyle}
                  onClick={() => router.push(`/leads/${visit.id}`)}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "rgba(37,99,235,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#60a5fa",
                    }}
                  >
                    {getInitials(visit.name)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {visit.name || "—"}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--color-text-secondary, #64748b)", margin: "2px 0 0" }}>
                      {stages.find((s) => s.id === visit.stage_id)?.name ?? "—"}
                    </p>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--color-text-secondary, #64748b)", marginLeft: "auto", whiteSpace: "nowrap" }}>
                    {visit.created_at
                      ? new Date(visit.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                      : "—"}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Right — Overdue tasks */}
          <div style={panel}>
            <div style={panelHeader}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Overdue tasks</p>
              <span
                style={badge(overdueTasks.length > 0 ? "#ef4444" : "#64748b")}
                onClick={() => router.push("/tasks?filter=overdue")}
              >
                {overdueTasks.length}
              </span>
            </div>
            {overdueTasks.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--color-text-secondary, #64748b)", margin: 0 }}>
                No overdue tasks.
              </p>
            ) : (
              overdueTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  style={rowStyle}
                  onClick={() => task.lead_id && router.push(`/leads/${task.lead_id}`)}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {task.title || "Untitled task"}
                    </p>
                  </div>
                  <p style={{ fontSize: 11, color: "#f87171", marginLeft: "auto", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {formatOverdue(task.due_date)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Section 4 — Agent performance table (scope=all only)                */}
        {/* ------------------------------------------------------------------ */}
        {scope === "all" && agentPerf.length > 0 && (
          <div>
            <p style={sectionLabel}>Agent performance — today</p>
            <div
              style={{
                ...panel,
                padding: 0,
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {["Agent", "Leads today", "Contacted", "Avg response", "Overdue tasks"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
                          color: "var(--color-text-secondary, #64748b)",
                          borderBottom: "0.5px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agentPerf.map((row) => (
                    <tr
                      key={row.agentId}
                      onClick={() => router.push(`/leads?filter=agent_${row.agentId}`)}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td style={{ padding: "10px 14px", fontWeight: 500, borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                        {row.agentName}
                      </td>
                      <td style={{ padding: "10px 14px", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                        {row.leadsToday}
                      </td>
                      <td style={{ padding: "10px 14px", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                        {row.contactedToday}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          color: responseColor(row.avgResponseMins),
                          borderBottom: "0.5px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        {row.avgResponseMins !== null ? `${row.avgResponseMins}m` : "—"}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          color: row.overdueTaskCount > 0 ? "#f87171" : "inherit",
                          borderBottom: "0.5px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        {row.overdueTaskCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
