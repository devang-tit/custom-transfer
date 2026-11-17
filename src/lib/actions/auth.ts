"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { isStaffRole } from "@/lib/session-token";
import { issueResetToken, resetPasswordWithToken, RESET_TOKEN_TTL_MINUTES } from "@/lib/password-reset";
import { notifyPasswordChanged, notifyPasswordReset } from "@/lib/email/notify";

export type AuthState = { error?: string; fieldErrors?: Record<string, string[] | undefined> } | undefined;

const loginSchema = z.object({
  email: z.email("Enter a valid email").transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
  next: z.string().optional(),
});

function safeNext(next: string | undefined, fallback: string) {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return fallback;
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { email, password, next } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }
  await createSession(user);
  redirect(safeNext(next, isStaffRole(user.role) ? "/admin" : "/account"));
}

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name"),
    email: z.email("Enter a valid email").transform((v) => v.toLowerCase().trim()),
    password: z.string().min(8, "Use at least 8 characters"),
    company: z.string().trim().optional(),
    marketingOptIn: z.string().optional(),
    next: z.string().optional(),
  });

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { name, email, password, company, marketingOptIn, next } = parsed.data;

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return { fieldErrors: { email: ["An account with this email already exists"] } };

  const user = await db.user.create({
    data: {
      name,
      email,
      company: company || null,
      marketingOptIn: marketingOptIn === "on",
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
  // Attach any guest orders placed with this email.
  await db.order.updateMany({ where: { email, userId: null }, data: { userId: user.id } });
  await createSession(user);
  redirect(safeNext(next, "/account"));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

/**
 * Emails a single-use reset link. Always reports success so the form can't be used to
 * discover which emails have accounts; the email itself is sent after the response.
 */
export async function forgotPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState & { sent?: boolean }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!z.email().safeParse(email).success) return { fieldErrors: { email: ["Enter a valid email"] } };
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (user) {
    const token = await issueResetToken(user.id);
    if (token) notifyPasswordReset(user.id, token, RESET_TOKEN_TTL_MINUTES);
  }
  return { sent: true };
}

export type ResetState = (AuthState & { ok?: boolean; redirectTo?: string }) | undefined;

const resetSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Use at least 8 characters").max(200),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });

/** Sets a new password from a reset link, signs the user in and sends a security notice. */
export async function resetPasswordAction(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const user = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
  if (!user) return { error: "This reset link is invalid, expired or was already used. Request a new one." };
  await createSession(user);
  notifyPasswordChanged(user.id, "reset");
  return { ok: true, redirectTo: isStaffRole(user.role) ? "/admin" : "/account" };
}
