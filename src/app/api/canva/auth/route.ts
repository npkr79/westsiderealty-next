import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function GET() {
  const codeVerifier = base64url(randomBytes(96));
  const codeChallenge = base64url(
    createHash("sha256").update(codeVerifier).digest()
  );
  const state = base64url(randomBytes(16));

  console.log("[canva-auth] CANVA_REDIRECT_URI:", process.env.CANVA_REDIRECT_URI);

  const params = new URLSearchParams({
    code_challenge_method: "s256",
    response_type: "code",
    client_id: process.env.CANVA_CLIENT_ID!,
    code_challenge: codeChallenge,
    redirect_uri: "http://127.0.0.1:3000/api/canva/callback",
    state,
    scope: "design:content:read design:content:write design:meta:read asset:read asset:write profile:read brandtemplate:content:read brandtemplate:meta:read",
  });

  const authUrl = `https://www.canva.com/api/oauth/authorize?${params.toString()}`;

  const cookieStore = await cookies();
  cookieStore.set("canva_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  cookieStore.set("canva_oauth_state", state, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(authUrl);
}
