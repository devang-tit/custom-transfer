import "server-only";
import { after } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { parseJson } from "@/lib/json";
import { trackingUrl } from "@/lib/tracking";
import { siteConfig } from "@/config/site";
import type { AddressInput, StoreSettings } from "@/lib/types";
import { emailTransportInfo, sendMail, type MailResult } from "./mailer";
import {
  absoluteUrl,
  adminNewOrderEmail,
  artworkChangesEmail,
  orderConfirmationEmail,
  orderStatusEmail,
  orderUpdateEmail,
  passwordChangedEmail,
  passwordResetEmail,
  testEmail,
  type EmailBrand,
  type EmailOrder,
  type RenderedEmail,
} from "./templates";

/**
 * Order notification service.
 *
 * Call sites (checkout, Stripe webhook, admin actions) use the `notify*` functions, which
 * schedule work with `after()` so a slow mail server never delays the response. Every
 * attempt is recorded in EmailLog (visible in Admin → Email log and on the order page).
 */

/** Status emails wait briefly and are skipped if the status changed again (e.g. Undo on the production board). */
export const STATUS_EMAIL_DELAY_MS = 10_000;

const ORDER_INCLUDE = { items: { include: { product: { select: { slug: true } } } } } as const;
type LoadedOrder = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

function loadOrder(orderId: string) {
  return db.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
}

function brandFrom(settings: StoreSettings): EmailBrand {
  return {
    storeName: settings.storeName,
    supportEmail: settings.supportEmail,
    supportPhone: settings.supportPhone,
    siteUrl: siteConfig.url,
    address: siteConfig.contact.address,
  };
}

function toEmailOrder(order: LoadedOrder, settings: StoreSettings): EmailOrder {
  const method = settings.shippingMethods.find((m) => m.id === order.shippingMethod);
  return {
    id: order.id,
    number: order.number,
    customerName: order.customerName,
    email: order.email,
    phone: order.phone,
    status: order.status,
    createdAt: order.createdAt,
    shippingMethodLabel: method?.label ?? order.shippingMethod,
    isPickup: order.shippingMethod === "pickup",
    address: parseJson<AddressInput | null>(order.shippingAddress, null),
    items: order.items.map((i) => ({
      name: i.name,
      variantLabel: i.variantLabel,
      quantity: i.quantity,
      total: i.total,
      image: i.artworkUrl ?? i.image,
      productSlug: i.product?.slug ?? null,
      artworkStatus: i.artworkStatus,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    couponCode: order.couponCode,
    shipping: order.shipping,
    rushFee: order.rushFee,
    tax: order.tax,
    total: order.total,
    isRush: order.isRush,
    carrier: order.carrier,
    trackingNumber: order.trackingNumber,
    trackingUrl: trackingUrl(order.carrier, order.trackingNumber),
    notes: order.notes,
  };
}

async function deliver(args: {
  to: string;
  email: RenderedEmail;
  template: string;
  orderId?: string | null;
  settings: StoreSettings;
  /** HTML to store in EmailLog instead of the sent HTML (e.g. with secrets redacted) */
  logHtml?: string;
}): Promise<MailResult> {
  const res = await sendMail({
    to: args.to,
    subject: args.email.subject,
    html: args.email.html,
    text: args.email.text,
    replyTo: args.settings.supportEmail,
    fromName: args.settings.storeName,
  });
  await db.emailLog
    .create({
      data: {
        orderId: args.orderId ?? null,
        to: args.to,
        subject: args.email.subject,
        template: args.template,
        status: res.status,
        error: res.error ?? null,
        messageId: res.messageId ?? null,
        html: args.logHtml ?? args.email.html,
      },
    })
    .catch((e) => console.error("[email] could not write EmailLog", e));
  return res;
}

/** Run after the response is sent; falls back to fire-and-forget outside a request scope. */
function schedule(task: () => Promise<unknown>, delayMs = 0) {
  const run = async () => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    try {
      await task();
    } catch (e) {
      console.error("[email] notification failed", e);
    }
  };
  try {
    after(run);
  } catch {
    void run();
  }
}

// ---------------- senders (awaitable) ----------------

type SendOutcome = { sent: boolean; reason?: string; result?: MailResult };

/** Customer receipt. Deduped per order unless `force` (admin "Resend"). */
export async function sendOrderConfirmation(orderId: string, opts: { force?: boolean } = {}): Promise<SendOutcome> {
  const settings = await getSettings();
  if (!opts.force && !settings.notifications.customerOrderConfirmation) return { sent: false, reason: "Order confirmations are turned off" };
  const order = await loadOrder(orderId);
  if (!order) return { sent: false, reason: "Order not found" };
  if (!opts.force) {
    const already = await db.emailLog.count({ where: { orderId, template: "order_confirmation", status: { in: ["SENT", "OUTBOX"] } } });
    if (already) return { sent: false, reason: "Confirmation already sent" };
  }
  const email = orderConfirmationEmail(toEmailOrder(order, settings), brandFrom(settings));
  const result = await deliver({ to: order.email, email, template: "order_confirmation", orderId, settings });
  return { sent: result.status !== "FAILED", result, reason: result.error };
}

export async function sendAdminNewOrder(orderId: string): Promise<SendOutcome> {
  const settings = await getSettings();
  if (!settings.notifications.adminNewOrder) return { sent: false, reason: "New-order alerts are turned off" };
  const to = settings.notifications.adminEmail.trim() || settings.supportEmail;
  if (!to) return { sent: false, reason: "No admin email configured" };
  const order = await loadOrder(orderId);
  if (!order) return { sent: false, reason: "Order not found" };
  const already = await db.emailLog.count({ where: { orderId, template: "admin_new_order", status: { in: ["SENT", "OUTBOX"] } } });
  if (already) return { sent: false, reason: "Alert already sent" };
  const email = adminNewOrderEmail(toEmailOrder(order, settings), brandFrom(settings), { adminUrl: absoluteUrl(siteConfig.url, `/admin/orders/${order.id}`) });
  const result = await deliver({ to, email, template: "admin_new_order", orderId, settings });
  return { sent: result.status !== "FAILED", result };
}

/**
 * Status update to the customer. Skipped when status emails are off, the status isn't in
 * `statusEmailFor`, a READY order isn't local pickup (shipped orders get the SHIPPED email),
 * or the order has since moved to a different status.
 */
export async function sendStatusUpdate(orderId: string, status: string, opts: { message?: string | null; force?: boolean } = {}): Promise<SendOutcome> {
  const settings = await getSettings();
  const n = settings.notifications;
  const order = await loadOrder(orderId);
  if (!order) return { sent: false, reason: "Order not found" };
  if (!opts.force) {
    if (!n.customerStatusUpdates) return { sent: false, reason: "Status emails are turned off" };
    if (!n.statusEmailFor.includes(status)) return { sent: false, reason: "No email for this status" };
    if (status === "READY" && order.shippingMethod !== "pickup") return { sent: false, reason: "Ready emails are for pickup orders" };
    if (order.status !== status) return { sent: false, reason: "Status changed again" };
  }
  const email = orderStatusEmail(toEmailOrder(order, settings), brandFrom(settings), { status, message: opts.message });
  const result = await deliver({ to: order.email, email, template: "order_status", orderId, settings });
  return { sent: result.status !== "FAILED", result };
}

export async function sendTestEmail(to: string): Promise<MailResult> {
  const settings = await getSettings();
  const info = emailTransportInfo();
  const mode = info.mode === "smtp" ? `SMTP via ${info.host} · from ${info.from}` : "Dev outbox: saved to storage/emails (no SMTP_HOST set)";
  return deliver({ to, email: testEmail(brandFrom(settings), { mode }), template: "test", settings });
}

// ---------------- notify (scheduled, never throw) ----------------

/** Order just became paid: customer receipt + store alert. */
export function notifyOrderPaid(orderId: string) {
  schedule(async () => {
    await sendOrderConfirmation(orderId);
    await sendAdminNewOrder(orderId);
  });
}

/** Staff changed the status with "notify customer" on. */
export function notifyStatusChange(orderId: string, status: string, message?: string | null) {
  schedule(() => sendStatusUpdate(orderId, status, { message }), STATUS_EMAIL_DELAY_MS);
}

export function notifyArtworkChanges(orderId: string, itemName: string, note: string) {
  schedule(async () => {
    const settings = await getSettings();
    if (!settings.notifications.customerArtworkChanges) return;
    const order = await loadOrder(orderId);
    if (!order) return;
    const email = artworkChangesEmail(toEmailOrder(order, settings), brandFrom(settings), { itemName, note });
    await deliver({ to: order.email, email, template: "artwork_changes", orderId, settings });
  });
}

export function notifyOrderUpdate(orderId: string, message: string, author: string) {
  schedule(async () => {
    const settings = await getSettings();
    if (!settings.notifications.customerOrderUpdates) return;
    const order = await loadOrder(orderId);
    if (!order) return;
    const email = orderUpdateEmail(toEmailOrder(order, settings), brandFrom(settings), { message, author: `${author} at ${settings.storeName}` });
    await deliver({ to: order.email, email, template: "order_update", orderId, settings });
  });
}

// ---------------- account security emails (always on) ----------------

/** Sends the reset link. The token is redacted from the stored EmailLog copy. */
export function notifyPasswordReset(userId: string, rawToken: string, minutes: number) {
  schedule(async () => {
    const [settings, user] = await Promise.all([getSettings(), db.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })]);
    if (!user) return;
    const url = absoluteUrl(siteConfig.url, `/reset-password?token=${encodeURIComponent(rawToken)}`);
    const email = passwordResetEmail(brandFrom(settings), { name: user.name, url, minutes });
    await deliver({ to: user.email, email, template: "password_reset", settings, logHtml: email.html.split(rawToken).join("REDACTED") });
  });
}

export function notifyPasswordChanged(userId: string, via: "reset" | "account") {
  schedule(async () => {
    const [settings, user] = await Promise.all([getSettings(), db.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })]);
    if (!user) return;
    const email = passwordChangedEmail(brandFrom(settings), { name: user.name, when: new Date(), via, forgotUrl: absoluteUrl(siteConfig.url, "/forgot-password") });
    await deliver({ to: user.email, email, template: "password_changed", settings });
  });
}
