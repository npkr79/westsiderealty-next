import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export async function POST(req: NextRequest) {
  const { userId, token } = await req.json();
  if (!userId || !token) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const supabase = createServiceClient();
  await supabase
    .from("crm_push_tokens")
    .upsert(
      { user_id: userId, token, updated_at: new Date().toISOString() },
      { onConflict: "user_id,token" }
    );
  return NextResponse.json({ success: true });
}
