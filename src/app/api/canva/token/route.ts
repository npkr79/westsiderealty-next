import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";

const FIVE_MINUTES = 5 * 60 * 1000;

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data: token } = await supabase
      .from("canva_tokens" as never)
      .select("id, access_token, refresh_token, expires_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle() as { data: { id: string; access_token: string; refresh_token: string; expires_at: string } | null };

    if (!token) {
      return NextResponse.json({ valid: false });
    }

    const expiresAt = new Date(token.expires_at).getTime();
    const needsRefresh = expiresAt < Date.now() + FIVE_MINUTES;

    if (!needsRefresh) {
      return NextResponse.json({ valid: true, access_token: token.access_token });
    }

    // Refresh
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refresh_token,
      client_id: process.env.CANVA_CLIENT_ID!,
      client_secret: process.env.CANVA_CLIENT_SECRET!,
    });

    const refreshRes = await fetch("https://api.canva.com/rest/v1/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!refreshRes.ok) {
      console.error("[canva-token] refresh failed:", await refreshRes.text());
      return NextResponse.json({ valid: false, error: "Token refresh failed" });
    }

    const refreshData = await refreshRes.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();

    await supabase
      .from("canva_tokens" as never)
      .update({
        access_token: refreshData.access_token,
        refresh_token: refreshData.refresh_token,
        expires_at: newExpiresAt,
      } as never)
      .eq("id" as never, token.id);

    return NextResponse.json({ valid: true, access_token: refreshData.access_token });
  } catch (err) {
    console.error("[canva-token] error:", err);
    return NextResponse.json({ valid: false, error: String(err) });
  }
}
