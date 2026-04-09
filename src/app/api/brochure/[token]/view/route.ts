import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";

// Increment view count when a client opens the brochure
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createServiceClient();
  await supabase.rpc("increment_brochure_view", { p_token: token }).maybeSingle();
  return NextResponse.json({ ok: true });
}
