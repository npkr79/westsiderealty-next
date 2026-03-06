import { NextRequest, NextResponse } from "next/server";
import { processMetaLead } from "@/services/metaLeadService";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { leadgenId, pageId } = await request.json();
    if (!leadgenId) {
      return NextResponse.json({ error: "leadgenId required" }, { status: 400 });
    }
    const webhookValue = { leadgen_id: leadgenId, page_id: pageId ?? undefined };
    const result = await processMetaLead({ leadgen_id: leadgenId, page_id: pageId }, webhookValue);
    return NextResponse.json({
      success: !result.error,
      crmLeadId: result.crmLeadId,
      error: result.error ?? null,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reprocess failed" },
      { status: 500 }
    );
  }
}
