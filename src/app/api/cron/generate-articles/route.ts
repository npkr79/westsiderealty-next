import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { runArticleGeneration } from "@/services/articleGenerationService";

export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev fallback
  return authHeader === `Bearer ${secret}`;
}

async function handler(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const supabase = createServiceClient();

  try {
    console.log("[generate-articles] Starting daily article generation");
    const result = await runArticleGeneration(supabase);

    console.log(
      `[generate-articles] Done — ${result.articlesGenerated} articles for ${result.cities.join(", ")}`
    );

    return NextResponse.json({
      success: true,
      ...result,
      durationMs: Date.now() - startedAt,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[generate-articles] Fatal error:", err);
    return NextResponse.json(
      { success: false, error: msg, durationMs: Date.now() - startedAt },
      { status: 500 }
    );
  }
}

export const GET = handler;
export const POST = handler;
