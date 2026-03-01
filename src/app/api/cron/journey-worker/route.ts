import { NextRequest, NextResponse } from "next/server";
import { runJourneyQueueWorker } from "@/services/journeyExecutionService";

const isAuthorized = (request: NextRequest): boolean => {
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.JOURNEY_WORKER_API_KEY || process.env.SITEMAP_API_KEY;
  if (!apiKey) return true;
  return authHeader === `Bearer ${apiKey}`;
};

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const limitRaw = Number(body?.limit ?? 100);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, limitRaw)) : 100;
    const result = await runJourneyQueueWorker(limit);
    return NextResponse.json({ success: true, result, executedAt: new Date().toISOString() });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Journey worker execution failed." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}

