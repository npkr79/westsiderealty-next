import { NextResponse } from "next/server";
import { requireCrmUser } from "@/lib/crm/auth";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import type { SimulationRequest } from "@/services/crmSimulationEngine";
import { runCrmSimulation } from "@/services/crmSimulationEngine";
import { getSimulationSchemaMap } from "@/services/crmSimulationSchema";

const defaultPayload: SimulationRequest = {
  days: 30,
  timeTravelMinutes: 3,
  leadsPerDay: 20,
  locations: ["Kokapet", "Narsingi", "Financial District", "Gachibowli"],
  budgetDistribution: { low: 35, mid: 45, high: 20 },
  buyerTypeDistribution: { end_user: 65, investor: 35 },
  sourceDistribution: { meta: 45, google: 35, portal: 20 },
  agentProductivityDistribution: { high: 25, medium: 55, low: 20 },
  missedFollowupRate: 25,
  funnel: { siteVisitRate: 50, negotiationRate: 35, closureRate: 18 },
  behavior: { pricingViewRate: 45, brochureDownloadRate: 28, repeatVisitRate: 40 },
  whatsapp: { replyRate: 30, followupRate: 55 },
};

const sanitizePercentRecord = (value: unknown, fallback: Record<string, number>): Record<string, number> => {
  if (!value || typeof value !== "object") return fallback;
  const output: Record<string, number> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === "number" && Number.isFinite(item)) output[key] = item;
  }
  return Object.keys(output).length ? output : fallback;
};

export async function GET() {
  await requireCrmUser(["admin"]);
  const supabase = createServiceClient();
  const schema = await getSimulationSchemaMap();
  const { data } = await supabase
    .from("crm_lead_activities")
    .select("id,activity_type,notes,created_at")
    .in("activity_type", ["simulation_run", "simulation_log"])
    .order("created_at", { ascending: false })
    .limit(200);

  return NextResponse.json({ logs: data || [], schema });
}

export async function POST(request: Request) {
  await requireCrmUser(["admin"]);
  try {
    const body = await request.json().catch(() => ({}));
    const payload: SimulationRequest = {
      days: typeof body?.days === "number" ? body.days : defaultPayload.days,
      timeTravelMinutes: typeof body?.timeTravelMinutes === "number" ? body.timeTravelMinutes : defaultPayload.timeTravelMinutes,
      leadsPerDay: typeof body?.leadsPerDay === "number" ? body.leadsPerDay : defaultPayload.leadsPerDay,
      locations: Array.isArray(body?.locations) ? body.locations.filter((v: unknown) => typeof v === "string") : defaultPayload.locations,
      budgetDistribution: sanitizePercentRecord(body?.budgetDistribution, defaultPayload.budgetDistribution),
      buyerTypeDistribution: sanitizePercentRecord(body?.buyerTypeDistribution, defaultPayload.buyerTypeDistribution),
      sourceDistribution: sanitizePercentRecord(body?.sourceDistribution, defaultPayload.sourceDistribution),
      agentProductivityDistribution: sanitizePercentRecord(body?.agentProductivityDistribution, defaultPayload.agentProductivityDistribution),
      missedFollowupRate: typeof body?.missedFollowupRate === "number" ? body.missedFollowupRate : defaultPayload.missedFollowupRate,
      funnel: {
        siteVisitRate: typeof body?.funnel?.siteVisitRate === "number" ? body.funnel.siteVisitRate : defaultPayload.funnel.siteVisitRate,
        negotiationRate:
          typeof body?.funnel?.negotiationRate === "number" ? body.funnel.negotiationRate : defaultPayload.funnel.negotiationRate,
        closureRate: typeof body?.funnel?.closureRate === "number" ? body.funnel.closureRate : defaultPayload.funnel.closureRate,
      },
      behavior: {
        pricingViewRate:
          typeof body?.behavior?.pricingViewRate === "number" ? body.behavior.pricingViewRate : defaultPayload.behavior.pricingViewRate,
        brochureDownloadRate:
          typeof body?.behavior?.brochureDownloadRate === "number"
            ? body.behavior.brochureDownloadRate
            : defaultPayload.behavior.brochureDownloadRate,
        repeatVisitRate:
          typeof body?.behavior?.repeatVisitRate === "number" ? body.behavior.repeatVisitRate : defaultPayload.behavior.repeatVisitRate,
      },
      whatsapp: {
        replyRate: typeof body?.whatsapp?.replyRate === "number" ? body.whatsapp.replyRate : defaultPayload.whatsapp.replyRate,
        followupRate: typeof body?.whatsapp?.followupRate === "number" ? body.whatsapp.followupRate : defaultPayload.whatsapp.followupRate,
      },
    };

    const result = await runCrmSimulation(payload);
    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Simulation failed." },
      { status: 500 }
    );
  }
}
