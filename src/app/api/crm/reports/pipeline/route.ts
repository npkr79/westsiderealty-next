import { NextRequest, NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { createServiceClient } from "@/lib/supabase/serviceClient";

const STAGE_ORDER = ["new", "not_connected", "contacted", "qualified", "site_visit", "negotiation", "converted", "won", "lost"];

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

  let query = supabase
    .from("crm_leads")
    .select("status, assigned_to");
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lt("created_at", dateTo);
  if (agentId) query = query.eq("assigned_to", agentId);

  const { data: leads, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const countMap: Record<string, number> = {};
  for (const lead of leads ?? []) {
    const s = (lead as { status: string | null }).status ?? "new";
    countMap[s] = (countMap[s] ?? 0) + 1;
  }

  const total = Object.values(countMap).reduce((s, c) => s + c, 0);
  const stages = STAGE_ORDER.map(s => ({
    status: s,
    label: s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    count: countMap[s] ?? 0,
    pct: total > 0 ? parseFloat(((countMap[s] ?? 0) / total * 100).toFixed(1)) : 0,
  }));

  return NextResponse.json({ stages, total });
}
