import { NextRequest, NextResponse } from "next/server";

const LOGIN = "/login";
const DASHBOARD = "/dashboard";

/** Lightweight middleware: only checks for session cookie to avoid pulling auth/prisma into Edge (1 MB limit). */
/** NextAuth v5 (Auth.js) uses authjs.session-token (dev) / __Secure-authjs.session-token (HTTPS). */
export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isLoginPage = pathname === LOGIN;
  const sessionCookie =
    req.cookies.get("authjs.session-token") ??
    req.cookies.get("__Secure-authjs.session-token") ??
    req.cookies.get("next-auth.session-token") ??
    req.cookies.get("__Secure-next-auth.session-token");
  const hasSession = !!sessionCookie?.value;

  if (isLoginPage && hasSession) return NextResponse.redirect(new URL(DASHBOARD, req.url));
  if (!isLoginPage && !hasSession) return NextResponse.redirect(new URL(LOGIN, req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
