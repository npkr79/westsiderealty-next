"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/browserClient";

const toIST = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LeadRow = {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  first_contact_at: string | null;
  stage_id: string | null;
  assigned_to: string | null;
  name: string | null;
  status: string | null;
  last_activity_at: string | null;
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
  id: string;           // activity id
  lead_id: string;
  lead_name: string | null;
  project_name: string | null;
  visit_date: string | null;
  status: string | null;
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

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function urgencyColor(dueDateIso: string | null): string {
  if (!dueDateIso) return "#ef4444";
  const diffHours = Math.floor((Date.now() - new Date(dueDateIso).getTime()) / (1000 * 60 * 60));
  if (diffHours > 48) return "#ef4444";
  if (diffHours > 24) return "#f97316";
  return "#eab308";
}

// ---------------------------------------------------------------------------
// Inline SVG icons — zero external dependency
// ---------------------------------------------------------------------------

const IcoUsers = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IcoPhone = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const IcoClock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IcoTrophy = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="8 22 12 22 16 22"/><line x1="12" y1="17" x2="12" y2="22"/>
    <path d="M17 2H7l1 9c0 2.76 1.79 5 4 5s4-2.24 4-5l1-9z"/>
    <path d="M7 2H2v3c0 2.21 2.24 4 5 4"/><path d="M17 2h5v3c0 2.21-2.24 4-5 4"/>
  </svg>
);

const IcoSnowflake = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="2" x2="12" y2="22"/><path d="m17 7-5 5-5-5"/><path d="m17 17-5-5-5 5"/>
    <line x1="2" y1="12" x2="22" y2="12"/><path d="m7 7 5 5 5-5"/><path d="m7 17 5-5 5 5"/>
  </svg>
);

const IcoCalendar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IcoAlert = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

// ---------------------------------------------------------------------------
// Empty state illustrations
// ---------------------------------------------------------------------------

const EmptyCalendar = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
    <rect x="6" y="10" width="44" height="40" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
    <rect x="6" y="10" width="44" height="11" rx="4" fill="#1e293b"/>
    <rect x="6" y="16" width="44" height="5" fill="#334155"/>
    <line x1="18" y1="6" x2="18" y2="16" stroke="#475569" strokeWidth="2" strokeLinecap="round"/>
    <line x1="38" y1="6" x2="38" y2="16" stroke="#475569" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="18" cy="30" r="2.5" fill="#334155"/><circle cx="28" cy="30" r="2.5" fill="#334155"/>
    <circle cx="38" cy="30" r="2.5" fill="#334155"/><circle cx="18" cy="40" r="2.5" fill="#334155"/>
    <circle cx="28" cy="40" r="2.5" fill="#334155"/>
  </svg>
);

const EmptyCheck = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
    <circle cx="28" cy="28" r="22" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
    <path d="M17 28l7 7 15-14" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ---------------------------------------------------------------------------
// SnapshotCard sub-component
// ---------------------------------------------------------------------------

interface SnapshotCardProps {
  label: string;
  value: number;
  accentColor: string;
  statusText: string;
  statusUrgent?: boolean;
  icon: ReactNode;
  onClick: () => void;
}

function SnapshotCard({ label, value, accentColor, statusText, statusUrgent, icon, onClick }: SnapshotCardProps) {
  const dotColor = statusUrgent && value > 0 ? "#ef4444" : value > 0 ? accentColor : "#475569";
  const textColor = statusUrgent && value > 0 ? "#fca5a5" : "#64748b";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative rounded-xl border border-slate-800 bg-slate-900 p-4 text-left hover:border-slate-700 hover:bg-slate-800/70 active:scale-[0.97] transition-all duration-100 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600"
      style={{ borderLeft: `3px solid ${accentColor}`, minHeight: "100px" }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</span>
        <span className="opacity-50 group-hover:opacity-80 transition-opacity" style={{ color: accentColor }}>
          {icon}
        </span>
      </div>
      <p className="text-[2rem] font-semibold leading-none tracking-tight text-slate-100 mb-2.5">
        {value}
      </p>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full flex-none" style={{ backgroundColor: dotColor }} />
        <span className="text-[11px] leading-none" style={{ color: textColor }}>{statusText}</span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DashboardMetricCards({ scope, userId }: DashboardMetricCardsProps) {
  const router = useRouter();
  const supabase = getBrowserClient();

  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [stages, setStages] = useState<StageRow[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<TaskRow[]>([]);
  const [upcomingVisits, setUpcomingVisits] = useState<VisitRow[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      let leadsQuery = supabase
        .from("crm_leads")
        .select("id, created_at, updated_at, first_contact_at, stage_id, assigned_to, name, status, last_activity_at");
      if (scope === "assigned") leadsQuery = leadsQuery.eq("assigned_to", userId);

      let taskQuery = supabase
        .from("crm_tasks")
        .select("id, title, due_date, lead_id, assigned_to")
        .lt("due_date", new Date().toISOString())
        .neq("status", "completed");
      if (scope === "assigned") taskQuery = taskQuery.eq("assigned_to", userId);

      const stagesQuery = supabase.from("crm_lead_stages").select("id, name, position").order("position");
      const agentsQuery = supabase.from("crm_users").select("id, full_name").eq("is_active", true);

      const [stagesRes, leadsRes, taskRes, agentsRes] = await Promise.all([
        stagesQuery, leadsQuery, taskQuery, agentsQuery,
      ]);

      const stagesResult: StageRow[] = (stagesRes.data as StageRow[]) ?? [];

      // Fetch upcoming site visits from crm_lead_activities
      const now = new Date().toISOString();
      const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let visitQuery: any = supabase
        .from("crm_lead_activities")
        .select("id, lead_id, description, metadata, created_at, crm_leads!crm_lead_activities_lead_id_fkey(id, name, assigned_to)")
        .eq("activity_type", "site_visit")
        .ilike("description", "%Scheduled%")
        .order("created_at", { ascending: false })
        .limit(20);

      if (scope === "assigned") {
        visitQuery = visitQuery.eq("crm_leads.assigned_to", userId);
      }

      const { data: visitData } = await visitQuery;

      const visitsResult: VisitRow[] = (visitData ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((row: any) => {
          const meta = (row.metadata || {}) as Record<string, unknown>;
          const lead = row.crm_leads as { id: string; name: string | null; assigned_to: string | null } | null;
          const visitDate = (meta.visit_date as string) || null;
          let projectName = (meta.project_name as string) || null;
          if (!projectName && row.description) {
            const match = (row.description as string).match(/Site visit at (.+?) —/i);
            if (match) projectName = match[1].trim();
          }
          return {
            id: row.id as string,
            lead_id: row.lead_id as string,
            lead_name: lead?.name || null,
            project_name: projectName,
            visit_date: visitDate,
            status: (meta.status as string) || "Scheduled",
          };
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((v: any) => {
          if (!v.visit_date) return true;
          return v.visit_date >= now.slice(0, 16) && v.visit_date <= next7Days.slice(0, 16);
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => {
          if (!a.visit_date) return 1;
          if (!b.visit_date) return -1;
          return a.visit_date.localeCompare(b.visit_date);
        });

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
  }, [scope, userId, supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // Realtime subscription — re-fetch whenever any crm_leads row changes
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-metrics-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_leads" }, () => {
        void fetchAll();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll, supabase]);

  // ---------------------------------------------------------------------------
  // Derived metrics
  // ---------------------------------------------------------------------------

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  const leadsToday = leads.filter((l) => l.created_at && l.created_at >= todayIso).length;
  const contactedToday = leads.filter(
    (l) => l.status === "contacted" && (l.updated_at ?? l.created_at) >= todayIso
  ).length;
  const pendingContact = leads.filter(
    (l) => (l.status === "new" || !l.status) && l.created_at && l.created_at >= todayIso
  ).length;

  const bookingStageId = stages.find((s) => s.name.toLowerCase().includes("book"))?.id;
  const bookingsThisMonth = leads.filter(
    (l) => l.stage_id === bookingStageId && l.created_at && l.created_at >= firstDayOfMonth
  ).length;

  const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const coldLeadsCount = leads.filter((l) =>
    l.last_activity_at &&
    l.last_activity_at < sevenDaysAgoIso &&
    !["lost", "won", "converted"].includes((l.status ?? "").toLowerCase())
  ).length;

  const notConnectedCount = leads.filter(
    (l) => (l.status ?? "").toLowerCase() === "not_connected"
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
        const agentLeadsToday = agentLeads.filter((l) => l.created_at && l.created_at >= todayIso);
        const agentContactedToday = agentLeads.filter(
          (l) => l.status === "contacted" && (l.updated_at ?? l.created_at) >= todayIso
        );
        const responseTimes = agentLeads
          .filter((l) => l.first_contact_at && l.created_at && l.first_contact_at >= todayIso)
          .map((l) => (new Date(l.first_contact_at!).getTime() - new Date(l.created_at!).getTime()) / (1000 * 60))
          .filter((ms) => ms >= 0);
        const avgResponseMins =
          responseTimes.length > 0
            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
            : null;
        return {
          agentId: agent.id,
          agentName: agent.full_name?.trim() || "Unknown",
          leadsToday: agentLeadsToday.length,
          contactedToday: agentContactedToday.length,
          avgResponseMins,
          overdueTaskCount: overdueTasks.filter((t) => t.assigned_to === agent.id).length,
        };
      })
      .filter((a) => a.leadsToday > 0 || a.overdueTaskCount > 0)
      .sort((a, b) => b.leadsToday - a.leadsToday);
  })();

  // ---------------------------------------------------------------------------
  // Skeleton loading
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 grid-cols-2 xl:grid-cols-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 p-4 animate-pulse" style={{ minHeight: "100px" }}>
              <div className="h-2.5 w-20 rounded bg-slate-800 mb-4" />
              <div className="h-8 w-10 rounded bg-slate-800 mb-3" />
              <div className="h-2 w-16 rounded bg-slate-800" />
            </div>
          ))}
        </div>
        <div className="h-14 rounded-xl border border-slate-800 bg-slate-900 animate-pulse" />
        <div className="grid gap-3 xl:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 animate-pulse" style={{ minHeight: "160px" }}>
              <div className="border-b border-slate-800 px-4 py-3">
                <div className="h-3 w-32 rounded bg-slate-800" />
              </div>
              <div className="p-3 space-y-2">
                {[0, 1, 2].map((j) => <div key={j} className="h-12 rounded-lg bg-slate-800" />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-4">

      {/* -------------------------------------------------------------------- */}
      {/* Today's snapshot — 2×2 on mobile, 5-col on desktop                   */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid gap-3 grid-cols-2 xl:grid-cols-6">
        <SnapshotCard
          label="Leads today"
          value={leadsToday}
          accentColor="#3b82f6"
          statusText={leadsToday === 0 ? "None yet today" : leadsToday === 1 ? "1 new lead" : `${leadsToday} new leads`}
          icon={<IcoUsers />}
          onClick={() => router.push("/leads?filter=today")}
        />
        <SnapshotCard
          label="Contacted"
          value={contactedToday}
          accentColor="#22c55e"
          statusText={contactedToday === 0 ? "None reached" : `${contactedToday} reached today`}
          icon={<IcoPhone />}
          onClick={() => router.push("/leads?filter=contacted_today")}
        />
        <SnapshotCard
          label="Pending contact"
          value={pendingContact}
          accentColor={pendingContact > 0 ? "#ef4444" : "#475569"}
          statusText={pendingContact === 0 ? "All clear" : "Needs immediate action"}
          statusUrgent={pendingContact > 0}
          icon={<IcoClock />}
          onClick={() => router.push("/leads?filter=pending_contact")}
        />
        <SnapshotCard
          label="Bookings / month"
          value={bookingsThisMonth}
          accentColor="#a855f7"
          statusText={bookingsThisMonth === 0 ? "None this month" : bookingsThisMonth === 1 ? "1 booking" : `${bookingsThisMonth} bookings`}
          icon={<IcoTrophy />}
          onClick={() => router.push("/leads?filter=bookings_month")}
        />
        <SnapshotCard
          label="Gone cold"
          value={coldLeadsCount}
          accentColor={coldLeadsCount > 0 ? "#f97316" : "#475569"}
          statusText={coldLeadsCount === 0 ? "All active" : "No activity in 7+ days"}
          statusUrgent={coldLeadsCount > 0}
          icon={<IcoSnowflake />}
          onClick={() => router.push("/leads?filter=cold_leads")}
        />
        <SnapshotCard
          label="Not Connected"
          value={notConnectedCount}
          accentColor="#64748b"
          statusText={notConnectedCount === 0 ? "None pending" : "Call not answered"}
          icon={<IcoPhone />}
          onClick={() => router.push("/leads?filter=not_connected")}
        />
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Pipeline — horizontal scrollable pill chips                           */}
      {/* -------------------------------------------------------------------- */}
      {pipelineStages.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Pipeline by stage
          </p>
          <div
            className="flex gap-2 overflow-x-auto pb-0.5"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {pipelineStages.map((stage) => (
              <button
                key={stage.id}
                type="button"
                onClick={() => router.push(`/leads?filter=stage_${stage.id}`)}
                className="flex-none inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 text-xs font-medium text-slate-300 hover:border-slate-600 hover:bg-slate-700/80 active:scale-[0.96] transition-all select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-600"
                style={{ height: "36px", whiteSpace: "nowrap" }}
              >
                <span className="max-w-[88px] truncate">{stage.name}</span>
                <span
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 border border-slate-700 text-[11px] font-bold text-slate-200"
                  style={{ minWidth: "20px", height: "20px", padding: "0 5px" }}
                >
                  {stage.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Site visits + Overdue tasks — side-by-side on xl                      */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid gap-3 xl:grid-cols-2">

        {/* Site visits */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-400"><IcoCalendar /></span>
              <span className="text-sm font-semibold text-slate-200">Site visits · next 7 days</span>
            </div>
            <button
              type="button"
              onClick={() => router.push("/leads?filter=visits_upcoming")}
              className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-800 px-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
              style={{ minHeight: "28px", minWidth: "28px" }}
            >
              {upcomingVisits.length}
            </button>
          </div>

          {upcomingVisits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <EmptyCalendar />
              <p className="mt-3 text-sm font-medium text-slate-500">No visits scheduled</p>
              <p className="mt-0.5 text-xs text-slate-600">Leads in the site-visit stage will appear here</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {upcomingVisits.slice(0, 4).map((visit) => (
                <button
                  key={visit.id}
                  type="button"
                  className="w-full flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5 text-left hover:border-slate-700 hover:bg-slate-800/70 active:scale-[0.99] transition-all select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-600"
                  style={{ minHeight: "52px" }}
                  onClick={() => visit.lead_id && router.push(`/leads/${visit.lead_id}`)}
                >
                  {/* Avatar */}
                  <div
                    className="flex-none flex items-center justify-center rounded-full bg-slate-700 text-[11px] font-bold text-slate-200"
                    style={{ width: "34px", height: "34px" }}
                  >
                    {getInitials(visit.lead_name)}
                  </div>
                  {/* Name + project */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{visit.lead_name || "—"}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {visit.project_name || "Project not specified"}
                    </p>
                  </div>
                  {/* Visit date chip */}
                  {visit.visit_date && (
                    <span className="flex-none rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
                      {new Date(visit.visit_date).toLocaleDateString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Overdue tasks */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className={overdueTasks.length > 0 ? "text-rose-400" : "text-slate-400"}>
                <IcoAlert />
              </span>
              <span className="text-sm font-semibold text-slate-200">Overdue tasks</span>
            </div>
            <button
              type="button"
              onClick={() => router.push("/tasks?filter=overdue")}
              className="inline-flex items-center justify-center rounded-full px-2.5 text-xs font-semibold transition-all active:scale-95 focus-visible:outline-none"
              style={{
                minHeight: "28px",
                minWidth: "28px",
                backgroundColor: overdueTasks.length > 0 ? "rgba(127,29,29,0.4)" : "#1e293b",
                border: `1px solid ${overdueTasks.length > 0 ? "rgba(127,29,29,0.7)" : "#334155"}`,
                color: overdueTasks.length > 0 ? "#fca5a5" : "#94a3b8",
              }}
            >
              {overdueTasks.length}
            </button>
          </div>

          {overdueTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <EmptyCheck />
              <p className="mt-3 text-sm font-medium text-slate-500">You&apos;re all caught up</p>
              <p className="mt-0.5 text-xs text-slate-600">No overdue tasks right now</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {overdueTasks.slice(0, 4).map((task) => {
                const uc = urgencyColor(task.due_date);
                return (
                  <div
                    key={task.id}
                    className="flex rounded-lg border border-slate-800 overflow-hidden cursor-pointer hover:border-slate-700 active:scale-[0.99] transition-all select-none"
                    style={{ minHeight: "52px" }}
                    onClick={() => task.lead_id && router.push(`/leads/${task.lead_id}`)}
                  >
                    {/* Left urgency bar */}
                    <div className="w-[3px] flex-none" style={{ backgroundColor: uc }} />
                    {/* Content */}
                    <div className="flex flex-1 items-center justify-between bg-slate-900/50 hover:bg-slate-800/60 px-3 py-2.5 transition-colors min-w-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {task.title || "Untitled task"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {task.assigned_to ? (agentMap.get(task.assigned_to) ?? "Unknown") : "Unassigned"}
                        </p>
                      </div>
                      <span
                        className="flex-none ml-2 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          backgroundColor: `${uc}1a`,
                          border: `1px solid ${uc}50`,
                          color: uc,
                        }}
                      >
                        {formatOverdue(task.due_date)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Agent performance — compact on mobile, table on desktop               */}
      {/* -------------------------------------------------------------------- */}
      {scope === "all" && agentPerf.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-800 px-4 py-3">
            <p className="text-sm font-semibold text-slate-200">Agent performance — today</p>
          </div>

          {/* Mobile: top 3 compact rows */}
          <div className="xl:hidden divide-y divide-slate-800">
            {agentPerf.slice(0, 3).map((row, idx) => (
              <button
                key={row.agentId}
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/60 active:scale-[0.99] transition-all select-none focus-visible:outline-none"
                style={{ minHeight: "52px" }}
                onClick={() => router.push(`/leads?filter=agent_${row.agentId}`)}
              >
                <span className="flex-none w-4 text-xs font-bold text-slate-600">{idx + 1}</span>
                <div
                  className="flex-none flex items-center justify-center rounded-full bg-slate-700 text-[11px] font-bold text-slate-200"
                  style={{ width: "32px", height: "32px" }}
                >
                  {getInitials(row.agentName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{row.agentName}</p>
                  <p className="text-xs text-slate-500">
                    {row.leadsToday} leads · {row.contactedToday} contacted
                    {row.overdueTaskCount > 0 && (
                      <span className="text-rose-400"> · {row.overdueTaskCount} overdue</span>
                    )}
                  </p>
                </div>
                <span
                  className="flex-none rounded-full border border-slate-700 bg-slate-800 px-2 text-[11px] font-semibold text-slate-400"
                  style={{ minHeight: "22px", lineHeight: "22px" }}
                >
                  {row.avgResponseMins !== null ? `${row.avgResponseMins}m` : "—"}
                </span>
              </button>
            ))}
          </div>

          {/* Desktop: full table */}
          <div className="hidden xl:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {["Agent", "Leads today", "Contacted", "Avg response", "Overdue"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${i === 0 ? "text-left" : "text-right"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {agentPerf.map((row) => (
                  <tr
                    key={row.agentId}
                    className="cursor-pointer hover:bg-slate-800/60 active:scale-[0.995] transition-colors"
                    onClick={() => router.push(`/leads?filter=agent_${row.agentId}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex-none flex items-center justify-center rounded-full bg-slate-700 text-[11px] font-bold text-slate-200"
                          style={{ width: "28px", height: "28px" }}
                        >
                          {getInitials(row.agentName)}
                        </div>
                        <span className="font-medium text-slate-200">{row.agentName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center justify-center rounded-full border border-blue-900/50 bg-blue-950/40 px-2.5 text-xs font-semibold text-blue-300" style={{ minHeight: "22px" }}>
                        {row.leadsToday}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">{row.contactedToday}</td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {row.avgResponseMins !== null ? `${row.avgResponseMins}m` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.overdueTaskCount > 0 ? (
                        <span className="inline-flex items-center justify-center rounded-full border border-rose-900/50 bg-rose-950/40 px-2.5 text-xs font-semibold text-rose-300" style={{ minHeight: "22px" }}>
                          {row.overdueTaskCount}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
