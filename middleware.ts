// Auth gate for everything under /admin/*.
//
// Next.js runs middleware on the Edge runtime (a stripped-down V8 isolate,
// not Node), so this file can only use APIs that work there — that's why
// the session helper uses Web Crypto instead of Node's crypto module.
//
// The matcher at the bottom limits which routes hit this code at all;
// inside, we let /admin/login through unauthenticated so the user can
// actually reach the password form.

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/app/_lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // /admin/login is the one /admin/* route that's always reachable.
  if (pathname === "/admin/login") return NextResponse.next();

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(cookie);
  if (!session) {
    // Bounce the visitor to the login page, remembering where they were
    // trying to go via ?next= so we could redirect back there after login
    // (we don't currently use it, but it's there if we ever want to).
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
