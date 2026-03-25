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
  const cutoff30m = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  let query = supabase
    .from("crm_leads")
    .select("id, name, phone, status, created_at, last_activity_at, assigned_to")
    .not("status", "in", "(won,lost,converted)")
    .or(`last_activity_at.lt.${cutoff30m},and(last_activity_at.is.null,created_at.lt.${cutoff30m})`)
    .order("last_activity_at", { ascending: true });

  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lt("created_at", dateTo);
  if (agentId) query = query.eq("assigned_to", agentId);

  const { data: leads, error: leadsErr } = await query;
  if (leadsErr) return NextResponse.json({ error: leadsErr.message }, { status: 500 });

  // Fetch agent names
  const { data: agents } = await supabase
    .from("crm_users")
    .select("id, full_name");
  const agentMap = Object.fromEntries((agents ?? []).map((a: { id: string; full_name: string | null }) => [a.id, a.full_name]));

  const enriched = (leads ?? []).map((lead: Record<string, unknown>) => ({
    ...lead,
    agent_name: lead.assigned_to ? (agentMap[lead.assigned_to as string] ?? "Unknown") : "Unassigned",
  }));

  return NextResponse.json({ leads: enriched });
}
