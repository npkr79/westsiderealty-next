import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/serviceClient";

const ERROR_REDIRECT = "/dashboard/admin/content?canva=error";
const SUCCESS_REDIRECT = "/dashboard/admin/content?canva=connected";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const storedState = req.cookies.get("canva_oauth_state")?.value;
  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL(ERROR_REDIRECT, req.url));
  }

  const codeVerifier = req.cookies.get("canva_code_verifier")?.value;
  if (!code || !codeVerifier) {
    return NextResponse.redirect(new URL(ERROR_REDIRECT, req.url));
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    code_verifier: codeVerifier,
    redirect_uri: process.env.CANVA_REDIRECT_URI!,
    client_id: process.env.CANVA_CLIENT_ID!,
    client_secret: process.env.CANVA_CLIENT_SECRET!,
  });

  console.log("[canva-callback] using redirect_uri:", process.env.CANVA_REDIRECT_URI);

  const tokenRes = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const tokenData = await tokenRes.json();
  console.log("[canva-callback] token response status:", tokenRes.status);
  console.log("[canva-callback] token response:", JSON.stringify(tokenData));

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL(ERROR_REDIRECT, req.url));
  }

  const { access_token, refresh_token, expires_in } = tokenData as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
  const supabase = createServiceClient();

  // Replace any existing token row
  await supabase.from("canva_tokens" as never).delete().neq("id" as never, "00000000-0000-0000-0000-000000000000");
  await supabase.from("canva_tokens" as never).insert({
    access_token,
    refresh_token,
    expires_at: expiresAt,
  } as never);

  const cookieStore = await cookies();
  cookieStore.set("canva_code_verifier", "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  cookieStore.set("canva_oauth_state", "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return NextResponse.redirect(new URL(SUCCESS_REDIRECT, req.url));
}
