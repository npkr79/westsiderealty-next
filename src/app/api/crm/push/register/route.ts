import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export async function POST(req: NextRequest) {
  const { userId, token } = await req.json();
  if (!userId || !token) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const supabase = createServiceClient();
  // Delete all existing tokens for this user, then insert fresh — prevents stale/duplicate tokens
  await supabase.from("crm_push_tokens").delete().eq("user_id", userId);
  await supabase.from("crm_push_tokens").insert({ user_id: userId, token, updated_at: new Date().toISOString() });
  return NextResponse.json({ success: true });
}
