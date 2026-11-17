import "server-only";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/**
 * Password reset tokens.
 * - 256-bit random token, sent only in the email link; the DB stores its SHA-256 hash.
 * - Single use, expires after RESET_TOKEN_TTL_MINUTES, and a new request replaces older links.
 * - At most MAX_REQUESTS_PER_HOUR links per account per hour (stops inbox flooding).
 */
export const RESET_TOKEN_TTL_MINUTES = 60;
const MAX_REQUESTS_PER_HOUR = 3;
const TOKEN_FORMAT = /^[A-Za-z0-9_-]{43}$/; // 32 bytes, base64url

export function hashResetToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Creates a fresh token for the user, or returns null when rate-limited. */
export async function issueResetToken(userId: string): Promise<string | null> {
  const recent = await db.passwordResetToken.count({
    where: { userId, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (recent >= MAX_REQUESTS_PER_HOUR) return null;

  const raw = randomBytes(32).toString("base64url");
  const now = new Date();
  await db.$transaction([
    // Housekeeping: drop day-old rows (kept until then so the hourly rate limit can count them).
    db.passwordResetToken.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } }),
    // Only the newest link works: expire older live links for this user.
    db.passwordResetToken.updateMany({ where: { userId, usedAt: null, expiresAt: { gt: now } }, data: { expiresAt: now } }),
    db.passwordResetToken.create({
      data: { userId, tokenHash: hashResetToken(raw), expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000) },
    }),
  ]);
  return raw;
}

/** Looks up an unused, unexpired token without consuming it (for rendering the reset page). */
export async function findValidResetToken(raw: string | undefined | null) {
  if (!raw || !TOKEN_FORMAT.test(raw)) return null;
  const token = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(raw) },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!token || token.usedAt || token.expiresAt < new Date()) return null;
  return token;
}

/**
 * Consumes the token and sets the new password. Returns the updated user, or null if the
 * token is invalid, expired or already used. Safe against double submits: the token is
 * claimed with a conditional update before the password changes.
 */
export async function resetPasswordWithToken(raw: string, newPassword: string) {
  const token = await findValidResetToken(raw);
  if (!token) return null;
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const now = new Date();
  return db.$transaction(async (tx) => {
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: token.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return null;
    const user = await tx.user.update({
      where: { id: token.userId },
      data: { passwordHash, passwordChangedAt: now },
      select: { id: true, email: true, name: true, role: true, passwordChangedAt: true },
    });
    await tx.passwordResetToken.deleteMany({ where: { userId: token.userId, id: { not: token.id } } });
    return user;
  });
}
