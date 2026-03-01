import { NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { runScheduledWhatsAppAutomation } from "@/services/whatsappAutomationService";

const allowedRoles = new Set(["admin", "sales_head", "team_lead"]);

export async function POST() {
  try {
    const session = await getCrmSessionResult();
    if (!session.user || !allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runScheduledWhatsAppAutomation(new Date().toISOString(), session.user.id);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected automation run error." },
      { status: 500 }
    );
  }
}
