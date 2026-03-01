import { NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { runStageAutomation } from "@/services/stageAutomationService";
import { sanitizeLeadPayload } from "@/lib/crm/sanitizeLeadPayload";

const allowedRoles = new Set(["admin", "sales_head", "team_lead", "agent"]);

export async function POST(request: Request) {
  try {
    const session = await getCrmSessionResult();
    if (!session.user || !allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const leadId = String(body?.leadId || "");
    const toStageId = String(body?.toStageId || "");

    if (!leadId || !toStageId) {
      return NextResponse.json({ error: "leadId and toStageId are required." }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: existing } = await supabase.from("crm_leads").select("id,stage_id").eq("id", leadId).maybeSingle();
    if (!existing?.id) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    const fromStageId = existing.stage_id ? String(existing.stage_id) : null;
    if (fromStageId === toStageId) {
      return NextResponse.json({ success: true, skipped: true, reason: "same_stage" });
    }

    const safePatch = sanitizeLeadPayload({ stage_id: toStageId, updated_at: new Date().toISOString() });
    const { error: updateError } = await supabase
      .from("crm_leads")
      .update(safePatch)
      .eq("id", leadId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message || "Failed to update stage." }, { status: 500 });
    }

    const automation = await runStageAutomation({
      leadId,
      fromStageId,
      toStageId,
    });

    return NextResponse.json({
      success: true,
      leadId,
      fromStageId,
      toStageId,
      automation,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected stage update error." },
      { status: 500 }
    );
  }
}
