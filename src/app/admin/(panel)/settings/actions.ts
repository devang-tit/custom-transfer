"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { saveSettings } from "@/lib/settings";
import { ORDER_STATUSES } from "@/lib/order-status";
import { findState, isValidGstin } from "@/lib/india";
import { sendTestEmail } from "@/lib/email/notify";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const schema = z.object({
  storeName: z.string().trim().min(2).max(60),
  supportEmail: z.email("Enter a valid support email"),
  supportPhone: z.string().trim().max(40),
  orderPrefix: z.string().trim().min(1).max(6).regex(/^[A-Z0-9]+$/, "Order prefix: uppercase letters/numbers only"),
  taxRate: z.number().min(0).max(28),
  pricesIncludeTax: z.boolean(),
  legalName: z.string().trim().max(120),
  gstin: z.string().trim().toUpperCase().refine((v) => !v || isValidGstin(v), "Enter a valid 15-character GSTIN"),
  storeState: z.string().refine((v) => !!findState(v), "Choose your state"),
  chargesGstRate: z.number().min(0).max(28),
  codEnabled: z.boolean(),
  codFee: z.number().int().min(0),
  codMaxOrder: z.number().int().min(0),
  freeShippingThreshold: z.number().int().min(0),
  rushFeePct: z.number().min(0).max(200),
  announcement: z.string().trim().max(200),
  announcementEnabled: z.boolean(),
  shippingMethods: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(30).regex(/^[a-z0-9-]+$/, "Shipping id: lowercase letters, numbers, dashes"),
        label: z.string().trim().min(1).max(40),
        description: z.string().trim().max(80),
        price: z.number().int().min(0),
        freeEligible: z.boolean().optional(),
      })
    )
    .min(1, "Keep at least one shipping method")
    .refine((list) => new Set(list.map((m) => m.id)).size === list.length, "Shipping method ids must be unique"),
  notifications: z.object({
    customerOrderConfirmation: z.boolean(),
    customerStatusUpdates: z.boolean(),
    statusEmailFor: z.array(z.enum(ORDER_STATUSES)).max(ORDER_STATUSES.length),
    customerArtworkChanges: z.boolean(),
    customerOrderUpdates: z.boolean(),
    adminNewOrder: z.boolean(),
    adminEmail: z.union([z.literal(""), z.email("Enter a valid alert email")]),
  }),
});

export async function saveStoreSettings(input: z.input<typeof schema>): Promise<Result> {
  const me = await requireAdmin();
  if (me.role !== "ADMIN") return { ok: false, error: "Only administrators can change store settings" };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid settings" };
  await saveSettings(parsed.data);
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved" };
}

const testSchema = z.object({ to: z.email("Enter a valid email address") });

/** Sends a test email using the current delivery setup (SMTP or dev outbox). */
export async function sendTestEmailAction(input: z.input<typeof testSchema>): Promise<Result> {
  const me = await requireAdmin();
  if (me.role !== "ADMIN") return { ok: false, error: "Only administrators can send test emails" };
  const parsed = testSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid email" };
  const res = await sendTestEmail(parsed.data.to);
  revalidatePath("/admin/emails");
  if (res.status === "FAILED") return { ok: false, error: `Sending failed: ${res.error ?? "unknown error"}` };
  return { ok: true, message: res.status === "OUTBOX" ? (res.error ?? "Saved to the dev outbox. See Admin → Email log") : `Test email sent to ${parsed.data.to}` };
}
