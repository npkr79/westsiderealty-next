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

    const body = await request.json();
    const leadId = String(body?.leadId || "");
    const agentId = String(body?.agentId || "");
    const note = typeof body?.note === "string" ? body.note : null;

    if (!leadId || !agentId) {
      return NextResponse.json({ error: "leadId and agentId are required." }, { status: 400 });
    }

    const result = await assignLeadManually({
      leadId,
      agentId,
      note,
      assignedBy: session.user.id,
    });

    if (!result.assigned) {
      return NextResponse.json({ error: "Assignment failed.", reason: result.reason }, { status: 500 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected assignment error." },
      { status: 500 }
    );
  }
}
