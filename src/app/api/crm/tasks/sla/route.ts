import { NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { getTaskSlaSummary, runTaskSlaMonitor } from "@/services/taskSlaMonitoringService";

const allowedRoles = new Set(["admin", "sales_head", "team_lead"]);

export async function GET() {
  try {
    const session = await getCrmSessionResult();
    if (!session.user || !allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const summary = await getTaskSlaSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load task SLA summary." },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getCrmSessionResult();
    if (!session.user || !allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const result = await runTaskSlaMonitor();
    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute task SLA monitor." },
      { status: 500 }
    );
  }
}
