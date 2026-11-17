import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Email delivery.
 * - SMTP_HOST set → real delivery through any SMTP provider (Gmail, SES, Resend, Postmark, Mailgun…).
 * - Otherwise → "outbox" mode: the email is saved to storage/emails/*.html (and to the admin
 *   Email log) instead of being sent. Handy for local development.
 */

export type MailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Display name used when EMAIL_FROM has no name part */
  fromName?: string;
};

export type MailResult = { status: "SENT" | "OUTBOX" | "FAILED"; messageId?: string; error?: string };

export const OUTBOX_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "storage", "emails");

export function emailTransportInfo(): { mode: "smtp" | "outbox"; host?: string; from: string } {
  const host = process.env.SMTP_HOST?.trim();
  return { mode: host ? "smtp" : "outbox", host: host || undefined, from: process.env.EMAIL_FROM?.trim() || "no-reply@localhost" };
}

function fromField(fromName?: string): string | { name: string; address: string } {
  const raw = process.env.EMAIL_FROM?.trim();
  if (raw?.includes("<")) return raw; // already "Name <address>"
  return { name: fromName ?? "Store", address: raw || "no-reply@localhost" };
}

const globalForMail = globalThis as unknown as { mailTransport?: { key: string; transport: Transporter } };

function getTransport(): Transporter {
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;
  const key = [process.env.SMTP_HOST, port, secure, process.env.SMTP_USER].join("|");
  if (globalForMail.mailTransport?.key === key) return globalForMail.mailTransport.transport;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  globalForMail.mailTransport = { key, transport };
  return transport;
}

export async function sendMail(input: MailInput): Promise<MailResult> {
  const { mode } = emailTransportInfo();
  if (mode === "outbox") {
    // Serverless hosts (Vercel) have a read-only filesystem: keep the email in the EmailLog only.
    if (process.env.VERCEL) {
      console.info(`[email:outbox] to=${input.to} subject="${input.subject}" (no SMTP configured; saved to Email log only)`);
      return { status: "OUTBOX" };
    }
    try {
      await mkdir(OUTBOX_DIR, { recursive: true });
      const slug = input.subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
      const file = path.join(/*turbopackIgnore: true*/ OUTBOX_DIR, `${Date.now()}-${slug}.html`);
      await writeFile(file, input.html, "utf8");
      console.info(`[email:outbox] to=${input.to} subject="${input.subject}" → ${path.relative(process.cwd(), file)}`);
      return { status: "OUTBOX" };
    } catch (e) {
      return { status: "FAILED", error: e instanceof Error ? e.message : String(e) };
    }
  }
  try {
    const info = await getTransport().sendMail({
      from: fromField(input.fromName),
      to: input.to,
      replyTo: input.replyTo,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { status: "SENT", messageId: info.messageId };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error(`[email] SMTP send failed to=${input.to}: ${error}`);
    return { status: "FAILED", error };
  }
}
