import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/residential-intelligence")) {
    return NextResponse.next();
  }

  if (pathname === "/residential-intelligence") {
    const url = req.nextUrl.clone();
    url.pathname = "/residential-intelligence/hyderabad";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/residential-intelligence/:path*"],
};
