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

function responseBadgeStyle(avgMins: number | null): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 500,
  };
  if (avgMins === null) return { ...base, background: "transparent", color: "var(--color-text-secondary)" };
  if (avgMins < 15)
    return { ...base, background: "var(--color-background-success)", color: "var(--color-text-success)" };
  if (avgMins <= 30)
    return { ...base, background: "var(--color-background-warning)", color: "var(--color-text-warning)" };
  return { ...base, background: "var(--color-background-danger)", color: "var(--color-text-danger)" };
}

// ---------------------------------------------------------------------------
// Shimmer skeleton
// ---------------------------------------------------------------------------

const SHIMMER_STYLE = `
  @keyframes shimmer {
    0%   { background-position: 200% 0 }
    100% { background-position: -200% 0 }
  }
  .dmc-shimmer {
    background: linear-gradient(
      90deg,
      var(--color-background-secondary) 25%,
      var(--color-background-tertiary) 50%,
      var(--color-background-secondary) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: var(--border-radius-lg, 12px);
    border: 1px solid var(--color-border-tertiary);
  }
`;

function SkeletonCard({ h = 88 }: { h?: number }) {
  return <div className="dmc-shimmer" style={{ height: h }} />;
}

// ---------------------------------------------------------------------------
// Card primitives
// ---------------------------------------------------------------------------

const CARD_BASE: React.CSSProperties = {
  background: "var(--color-background-primary)",
  border: "1px solid var(--color-border-tertiary)",
  borderRadius: "var(--border-radius-lg, 12px)",
  padding: "1.25rem 1.5rem",
  transition: "border-color 0.15s",
  cursor: "pointer",
};

interface MetricCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  onClick: () => void;
  accentLeft?: "danger" | "success";
}

function MetricCard({ label, value, subtext, onClick, accentLeft }: MetricCardProps) {
  const [hovered, setHovered] = useState(false);

  const style: React.CSSProperties = {
    ...CARD_BASE,
    borderColor: hovered ? "var(--color-border-secondary)" : "var(--color-border-tertiary)",
    borderLeft: accentLeft
      ? `3px solid var(--color-border-${accentLeft})`
      : `1px solid ${hovered ? "var(--color-border-secondary)" : "var(--color-border-tertiary)"}`,
  };

  const valueColor =
    accentLeft === "danger"
      ? "var(--color-text-danger)"
      : accentLeft === "success"
      ? "var(--color-text-success)"
      : "var(--color-text-primary)";

  return (
    <div
      style={style}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p
        style={{
          fontSize: 13,
          fontWeight: 400,
          color: "var(--color-text-secondary)",
          margin: "0 0 8px",
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 600, color: valueColor, lineHeight: 1, margin: 0 }}>
        {value}
      </p>
      {subtext && (
        <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "6px 0 0" }}>
          {subtext}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline stage card (needs its own hover state)
// ---------------------------------------------------------------------------

function StageCard({
  stage,
  onClick,
}: {
  stage: StageWithCount;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...CARD_BASE,
        padding: "1rem 1.25rem",
        textAlign: "center",
        borderColor: hovered ? "var(--color-border-secondary)" : "var(--color-border-tertiary)",
      }}
    >
      <p
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: "var(--color-text-primary)",
          margin: "0 0 4px",
          lineHeight: 1,
        }}
      >
        {stage.count}
      </p>
      <p
        style={{
          fontSize: 12,
          color: "var(--color-text-secondary)",
          margin: 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {stage.name}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section label
// ---------------------------------------------------------------------------

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: "var(--color-text-tertiary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  margin: "24px 0 10px",
};

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

        const agentsQuery =
          scope === "all"
            ? supabase.from("crm_users").select("id, full_name").eq("is_active", true)
            : Promise.resolve({ data: [] as AgentRow[], error: null });

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
          .filter(
            (l) => l.first_contact_at && l.created_at && l.first_contact_at >= todayIso
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
  // Render — skeleton
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <>
        <style>{SHIMMER_STYLE}</style>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ height: 34 }} /> {/* section label placeholder */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
            }}
            className="dmc-snapshot-grid"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} h={96} />
            ))}
          </div>
          <div style={{ height: 34 }} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: 10,
            }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} h={72} />
            ))}
          </div>
          <div style={{ height: 34 }} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
            }}
            className="dmc-panel-grid"
          >
            <SkeletonCard h={200} />
            <SkeletonCard h={200} />
          </div>
        </div>
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Render — full UI
  // ---------------------------------------------------------------------------

  const panel: React.CSSProperties = {
    ...CARD_BASE,
    cursor: "default",
  };

  const countBadge = (variant: "danger" | "info" | "neutral"): React.CSSProperties => ({
    display: "inline-block",
    background:
      variant === "danger"
        ? "var(--color-background-danger)"
        : variant === "info"
        ? "var(--color-background-info)"
        : "var(--color-background-tertiary)",
    color:
      variant === "danger"
        ? "var(--color-text-danger)"
        : variant === "info"
        ? "var(--color-text-info)"
        : "var(--color-text-secondary)",
    padding: "2px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
  });

  const rowBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 0",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
    cursor: "pointer",
    borderRadius: 0,
    transition: "background 0.1s, border-radius 0.1s, padding 0.1s",
  };

  return (
    <>
      <style>{`
        ${SHIMMER_STYLE}
        @media (max-width: 768px) {
          .dmc-snapshot-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .dmc-panel-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .dmc-snapshot-grid { grid-template-columns: 1fr !important; }
        }
        .dmc-row:hover {
          background: var(--color-background-secondary) !important;
          border-radius: 6px !important;
          padding: 10px 8px !important;
          border-bottom-color: transparent !important;
        }
        .dmc-table-row:hover td {
          background: var(--color-background-secondary);
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column" }}>

        {/* ------------------------------------------------------------------ */}
        {/* Section 1 — Today's snapshot                                        */}
        {/* ------------------------------------------------------------------ */}
        <p style={SECTION_LABEL}>Today&rsquo;s snapshot</p>
        <div
          className="dmc-snapshot-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
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
            accentLeft={contactedToday > 0 ? "success" : undefined}
            onClick={() => router.push("/leads?filter=contacted_today")}
          />
          <MetricCard
            label="Pending contact"
            value={pendingContact}
            accentLeft={pendingContact > 0 ? "danger" : undefined}
            subtext={pendingContact > 0 ? "Needs follow-up" : undefined}
            onClick={() => router.push("/leads?filter=pending_contact")}
          />
          <MetricCard
            label="Bookings this month"
            value={bookingsThisMonth}
            onClick={() => router.push("/leads?filter=bookings_month")}
          />
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Section 2 — Pipeline by stage                                       */}
        {/* ------------------------------------------------------------------ */}
        {pipelineStages.length > 0 && (
          <>
            <p style={SECTION_LABEL}>Pipeline by stage</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                gap: 10,
              }}
            >
              {pipelineStages.map((stage) => (
                <StageCard
                  key={stage.id}
                  stage={stage}
                  onClick={() => router.push(`/leads?filter=stage_${stage.id}`)}
                />
              ))}
            </div>
          </>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Section 3 — Site visits + Overdue tasks                             */}
        {/* ------------------------------------------------------------------ */}
        <p style={SECTION_LABEL}>Activity</p>
        <div
          className="dmc-panel-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
          }}
        >
          {/* Site visits */}
          <div style={panel}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
                Site visits — next 7 days
              </p>
              <span
                style={countBadge("info")}
                onClick={() => router.push("/leads?filter=visits_upcoming")}
              >
                {upcomingVisits.length}
              </span>
            </div>
            {upcomingVisits.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
                No upcoming visits.
              </p>
            ) : (
              upcomingVisits.slice(0, 4).map((visit, idx) => (
                <div
                  key={visit.id}
                  className="dmc-row"
                  style={{
                    ...rowBase,
                    borderBottom:
                      idx === Math.min(upcomingVisits.length, 4) - 1
                        ? "none"
                        : "0.5px solid var(--color-border-tertiary)",
                  }}
                  onClick={() => router.push(`/leads/${visit.id}`)}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: "var(--color-background-info)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--color-text-info)",
                    }}
                  >
                    {getInitials(visit.name)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        margin: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {visit.name || "—"}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-secondary)",
                        margin: "2px 0 0",
                      }}
                    >
                      {stages.find((s) => s.id === visit.stage_id)?.name ?? "—"}
                    </p>
                  </div>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--color-text-tertiary)",
                      marginLeft: "auto",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {visit.created_at
                      ? new Date(visit.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })
                      : "—"}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Overdue tasks */}
          <div style={panel}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Overdue tasks</p>
              <span
                style={countBadge(overdueTasks.length > 0 ? "danger" : "neutral")}
                onClick={() => router.push("/tasks?filter=overdue")}
              >
                {overdueTasks.length}
              </span>
            </div>
            {overdueTasks.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
                No overdue tasks.
              </p>
            ) : (
              overdueTasks.slice(0, 4).map((task, idx) => (
                <div
                  key={task.id}
                  className="dmc-row"
                  style={{
                    ...rowBase,
                    borderBottom:
                      idx === Math.min(overdueTasks.length, 4) - 1
                        ? "none"
                        : "0.5px solid var(--color-border-tertiary)",
                  }}
                  onClick={() => task.lead_id && router.push(`/leads/${task.lead_id}`)}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        margin: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {task.title || "Untitled task"}
                    </p>
                  </div>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--color-text-danger)",
                      marginLeft: "auto",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {formatOverdue(task.due_date)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Section 4 — Agent performance (scope=all only)                      */}
        {/* ------------------------------------------------------------------ */}
        {scope === "all" && agentPerf.length > 0 && (
          <>
            <p style={SECTION_LABEL}>Agent performance — today</p>
            <div
              style={{
                ...CARD_BASE,
                cursor: "default",
                padding: 0,
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--color-border-tertiary)",
                    }}
                  >
                    {["Agent", "Leads today", "Contacted", "Avg response", "Overdue"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "8px 12px",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 500,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--color-text-tertiary)",
                          borderBottom: "1px solid var(--color-border-tertiary)",
                          background: "var(--color-background-primary)",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agentPerf.map((row, idx) => (
                    <tr
                      key={row.agentId}
                      className="dmc-table-row"
                      onClick={() => router.push(`/leads?filter=agent_${row.agentId}`)}
                      style={{
                        cursor: "pointer",
                        borderBottom:
                          idx < agentPerf.length - 1
                            ? "0.5px solid var(--color-border-tertiary)"
                            : "none",
                      }}
                    >
                      <td style={{ padding: "12px", fontWeight: 500, color: "var(--color-text-primary)" }}>
                        {row.agentName}
                      </td>
                      <td style={{ padding: "12px", color: "var(--color-text-primary)" }}>
                        {row.leadsToday}
                      </td>
                      <td style={{ padding: "12px", color: "var(--color-text-primary)" }}>
                        {row.contactedToday}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {row.avgResponseMins !== null ? (
                          <span style={responseBadgeStyle(row.avgResponseMins)}>
                            {row.avgResponseMins}m
                          </span>
                        ) : (
                          <span style={{ color: "var(--color-text-tertiary)" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {row.overdueTaskCount > 0 ? (
                          <span style={responseBadgeStyle(999)}>
                            {row.overdueTaskCount}
                          </span>
                        ) : (
                          <span style={{ color: "var(--color-text-tertiary)" }}>0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>
    </>
  );
}
