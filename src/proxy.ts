import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession, isStaffRole } from "@/lib/session-token";

/**
 * Optimistic route protection. Pages and actions still call requireUser()/requireAdmin()
 * for the authoritative check.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  const needsAuth = pathname.startsWith("/account") || pathname.startsWith("/admin");
  if (needsAuth && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/admin") && session && !isStaffRole(session.role)) {
    return NextResponse.redirect(new URL("/account", request.url));
  }
  if ((pathname === "/login" || pathname === "/register") && session) {
    return NextResponse.redirect(new URL(isStaffRole(session.role) ? "/admin" : "/account", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/login", "/register"],
};
