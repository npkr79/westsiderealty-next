import { NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { getJourneyQueueMonitoring, runJourneyQueueWorker } from "@/services/journeyExecutionService";

const allowedRoles = new Set(["admin", "sales_head", "team_lead"]);

export async function GET(request: Request) {
  try {
    const session = await getCrmSessionResult();
    if (!session.user || !allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const limitRaw = Number(searchParams.get("limit") || 200);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(1000, limitRaw)) : 200;
    const data = await getJourneyQueueMonitoring(limit);
    return NextResponse.json({ success: true, ...data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load journey monitor." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCrmSessionResult();
    if (!session.user || !allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const limitRaw = Number(body?.limit ?? 100);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, limitRaw)) : 100;
    const result = await runJourneyQueueWorker(limit);
    return NextResponse.json({ success: true, result, executedAt: new Date().toISOString() });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run journey worker." },
      { status: 500 }
    );
  }
}

