import { NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { assignLeadManually } from "@/services/crmLeadRoutingService";

const allowedRoles = new Set(["admin", "sales_head", "team_lead"]);

export async function POST(request: Request) {
  try {
    const session = await getCrmSessionResult();
    if (!session.user || !allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const leadIds = Array.isArray(body?.leadIds) ? body.leadIds.map((value: unknown) => String(value)).filter(Boolean) : [];
    const agentId = String(body?.agentId || "");
    const note = typeof body?.note === "string" ? body.note : null;

    if (!leadIds.length || !agentId) {
      return NextResponse.json({ error: "leadIds and agentId are required." }, { status: 400 });
    }

    let assigned = 0;
    let failed = 0;
    for (const leadId of leadIds) {
      const result = await assignLeadManually({
        leadId,
        agentId,
        note,
        assignedBy: session.user.id,
      });
      if (result.assigned) assigned += 1;
      else failed += 1;
    }

    return NextResponse.json({ success: true, assigned, failed, total: leadIds.length });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected bulk assignment error." },
      { status: 500 }
    );
  }
}
