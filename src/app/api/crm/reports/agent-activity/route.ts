import { NextRequest, NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export async function GET(req: NextRequest) {
  const session = await getCrmSessionResult();
  if (!session.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");
  const agentId = searchParams.get("agentId");

  const supabase = createServiceClient();

  // Fetch active agents
  let agentsQuery = supabase
    .from("crm_users")
    .select("id, full_name")
    .eq("is_active", true)
    .order("full_name");
  if (agentId) agentsQuery = agentsQuery.eq("id", agentId);
  const { data: agents } = await agentsQuery;

  // Fetch leads in date range
  let leadsQuery = supabase
    .from("crm_leads")
    .select("id, assigned_to, status, created_at");
  if (dateFrom) leadsQuery = leadsQuery.gte("created_at", dateFrom);
  if (dateTo) leadsQuery = leadsQuery.lt("created_at", dateTo);
  const { data: leads } = await leadsQuery;

  // Fetch activities in date range
  let activitiesQuery = supabase
    .from("crm_lead_activities")
    .select("id, lead_id, activity_type, created_at");
  if (dateFrom) activitiesQuery = activitiesQuery.gte("created_at", dateFrom);
  if (dateTo) activitiesQuery = activitiesQuery.lt("created_at", dateTo);
  const { data: activities } = await activitiesQuery;

  // Build lead → assigned_to map for activity lookup
  const leadAgentMap = Object.fromEntries(
    (leads ?? []).map((l: { id: string; assigned_to: string | null }) => [l.id, l.assigned_to])
  );

  const stats = (agents ?? []).map((agent: { id: string; full_name: string | null }) => {
    const agentLeads = (leads ?? []).filter(
      (l: { assigned_to: string | null }) => l.assigned_to === agent.id
    );
    const agentActivities = (activities ?? []).filter(
      (a: { lead_id: string }) => leadAgentMap[a.lead_id] === agent.id
    );
    const calls = agentActivities.filter(
      (a: { activity_type: string }) => a.activity_type?.toLowerCase().includes("call")
    ).length;
    const siteVisits = agentLeads.filter(
      (l: { status: string | null }) => l.status === "site_visit"
    ).length;

    return {
      agent_id: agent.id,
      agent_name: agent.full_name ?? "Unknown",
      total_leads: agentLeads.length,
      total_activities: agentActivities.length,
      calls_logged: calls,
      site_visits: siteVisits,
    };
  });

  return NextResponse.json({ agents: stats.sort((a, b) => b.total_leads - a.total_leads) });
}
