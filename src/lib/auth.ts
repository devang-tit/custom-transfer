import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
  isStaffRole,
  type SessionPayload,
} from "@/lib/session-token";

export async function createSession(
  user: { id: string; role: string; name: string; email: string; passwordChangedAt?: Date | null }
) {
  // Stamp the new session at/after the password-change cutoff (see isSessionCurrent).
  const cutoff = user.passwordChangedAt ? Math.ceil(user.passwordChangedAt.getTime() / 1000) : undefined;
  const issuedAt = cutoff && cutoff > Math.floor(Date.now() / 1000) ? cutoff : undefined;
  const token = await signSession({ sub: user.id, role: user.role, name: user.name, email: user.email }, issuedAt);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Decoded session from cookie (no DB hit). */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
});

/** Full user row for the current session, or null. */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: {
      passwordChangedAt: true,
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      company: true,
      avatarUrl: true,
      marketingOptIn: true,
      createdAt: true,
    },
  });
  if (!user) return null;
  // A password reset/change signs out every session issued before it.
  if (!isSessionCurrent(session.iat, user.passwordChangedAt)) return null;
  const { passwordChangedAt: _changed, ...safe } = user;
  void _changed;
  return safe;
});

/**
 * Sessions must be issued at or after the (rounded-up) password-change second. jose `iat` has
 * whole-second precision, so createSession() stamps post-change sessions with that same second.
 */
export function isSessionCurrent(iat: number | undefined, passwordChangedAt: Date | null): boolean {
  if (!passwordChangedAt) return true;
  if (!iat) return false;
  return iat >= Math.ceil(passwordChangedAt.getTime() / 1000);
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Use in account pages/actions. Redirects to login if not signed in. */
export async function requireUser(next = "/account"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Use in every admin page/action. Redirects non-staff users. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/admin`);
  if (!isStaffRole(user.role)) redirect("/");
  return user;
}
