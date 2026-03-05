import { NextResponse } from "next/server";
import { CRM_TEST_ADMIN_COOKIE, isCrmTestLoginEnabled } from "@/lib/crm/test-login";

export async function POST() {
  if (!isCrmTestLoginEnabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CRM_TEST_ADMIN_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
