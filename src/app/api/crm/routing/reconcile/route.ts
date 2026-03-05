import { NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { reconcilePendingLeadRouting } from "@/services/crmLeadRoutingService";

const allowedRoles = new Set(["admin", "sales_head", "team_lead"]);

export async function POST(request: Request) {
  try {
    const session = await getCrmSessionResult();
    if (!session.user || !allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const limitRaw = Number(body?.limit ?? 100);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, limitRaw)) : 100;
    const result = await reconcilePendingLeadRouting(limit);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected reconciliation error." },
      { status: 500 }
    );
  }
}
