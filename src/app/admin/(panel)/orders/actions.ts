"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES, statusMeta } from "@/lib/order-status";
import {
  notifyArtworkChanges,
  notifyOrderPaid,
  notifyOrderUpdate,
  notifyStatusChange,
  sendOrderConfirmation,
  sendStatusUpdate,
} from "@/lib/email/notify";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const DEFAULT_MESSAGES: Record<string, string> = {
  PENDING: "Order set to awaiting payment",
  ARTWORK_REVIEW: "Artwork sent to prepress review",
  IN_PRODUCTION: "Artwork approved — your order is printing",
  QUALITY_CHECK: "Printed and cured — quality check in progress",
  READY: "Packed and ready for carrier pickup",
  SHIPPED: "Your order has shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Order cancelled",
  REFUNDED: "Payment refunded",
};

function revalidateOrder(id?: string) {
  revalidatePath("/admin/orders");
  revalidatePath("/admin/production");
  revalidatePath("/admin");
  if (id) revalidatePath(`/admin/orders/${id}`);
}

const statusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(ORDER_STATUSES),
  message: z.string().trim().max(500).optional(),
  notify: z.boolean().default(true),
});

export async function updateOrderStatus(input: z.input<typeof statusSchema>): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid status update" };
  const { orderId, status, message, notify } = parsed.data;
  const order = await db.order.findUnique({ where: { id: orderId }, select: { status: true, paymentStatus: true } });
  if (!order) return { ok: false, error: "Order not found" };

  await db.$transaction([
    db.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === "REFUNDED" ? { paymentStatus: "REFUNDED" } : {}),
        ...(status !== "PENDING" && status !== "CANCELLED" && status !== "REFUNDED" && order.paymentStatus === "UNPAID" ? {} : {}),
      },
    }),
    db.orderEvent.create({
      data: {
        orderId,
        status,
        message: message || DEFAULT_MESSAGES[status] || statusMeta(status).label,
        author: admin.name,
        visible: notify,
      },
    }),
  ]);
  if (notify && status !== order.status) notifyStatusChange(orderId, status, message || null);
  revalidateOrder(orderId);
  return { ok: true, message: `Moved to ${statusMeta(status).label}${notify && status !== order.status ? " · customer will be emailed" : ""}` };
}

const bulkSchema = z.object({ ids: z.array(z.string().min(1)).min(1).max(200), status: z.enum(ORDER_STATUSES) });

export async function bulkUpdateStatus(input: z.input<typeof bulkSchema>): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = bulkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Select at least one order" };
  const { ids, status } = parsed.data;
  const before = await db.order.findMany({ where: { id: { in: ids } }, select: { id: true, status: true } });
  await db.$transaction([
    db.order.updateMany({
      where: { id: { in: ids } },
      data: { status, ...(status === "REFUNDED" ? { paymentStatus: "REFUNDED" } : {}) },
    }),
    db.orderEvent.createMany({
      data: ids.map((orderId) => ({ orderId, status, message: DEFAULT_MESSAGES[status] ?? status, author: admin.name, visible: true })),
    }),
  ]);
  for (const o of before) if (o.status !== status) notifyStatusChange(o.id, status);
  revalidateOrder();
  return { ok: true, message: `${ids.length} order${ids.length === 1 ? "" : "s"} moved to ${statusMeta(status).label}` };
}

const artworkSchema = z.object({
  itemId: z.string().min(1),
  decision: z.enum(["APPROVED", "NEEDS_CHANGES", "PENDING"]),
  note: z.string().trim().max(1000).optional(),
});

export async function setArtworkStatus(input: z.input<typeof artworkSchema>): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = artworkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid artwork decision" };
  const { itemId, decision, note } = parsed.data;
  if (decision === "NEEDS_CHANGES" && !note) return { ok: false, error: "Add a note telling the customer what to change" };
  const item = await db.orderItem.findUnique({ where: { id: itemId }, select: { orderId: true, name: true } });
  if (!item) return { ok: false, error: "Item not found" };

  await db.$transaction([
    db.orderItem.update({ where: { id: itemId }, data: { artworkStatus: decision, artworkNote: note || null } }),
    db.orderEvent.create({
      data: {
        orderId: item.orderId,
        message:
          decision === "APPROVED"
            ? `Artwork approved for ${item.name}`
            : decision === "NEEDS_CHANGES"
              ? `Artwork changes requested for ${item.name}: ${note}`
              : `Artwork for ${item.name} reset to pending review`,
        author: admin.name,
        visible: decision !== "PENDING",
      },
    }),
  ]);

  if (decision === "NEEDS_CHANGES" && note) notifyArtworkChanges(item.orderId, item.name, note);

  // Auto-advance to production when every item's artwork is approved.
  const items = await db.orderItem.findMany({ where: { orderId: item.orderId }, select: { artworkStatus: true } });
  const order = await db.order.findUnique({ where: { id: item.orderId }, select: { status: true } });
  let advanced = false;
  if (order?.status === "ARTWORK_REVIEW" && items.every((i) => i.artworkStatus === "APPROVED")) {
    await db.$transaction([
      db.order.update({ where: { id: item.orderId }, data: { status: "IN_PRODUCTION" } }),
      db.orderEvent.create({
        data: { orderId: item.orderId, status: "IN_PRODUCTION", message: DEFAULT_MESSAGES.IN_PRODUCTION!, author: "system", visible: true },
      }),
    ]);
    advanced = true;
    notifyStatusChange(item.orderId, "IN_PRODUCTION");
  }
  revalidateOrder(item.orderId);
  return {
    ok: true,
    message: decision === "APPROVED" ? (advanced ? "Approved — all artwork approved, moved to production" : "Artwork approved") : decision === "NEEDS_CHANGES" ? "Changes requested" : "Reset to pending",
  };
}

const shippingSchema = z.object({
  orderId: z.string().min(1),
  carrier: z.string().trim().max(40).optional(),
  trackingNumber: z.string().trim().max(80).optional(),
  markShipped: z.boolean().default(false),
});

export async function updateShipping(input: z.input<typeof shippingSchema>): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = shippingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid shipping details" };
  const { orderId, carrier, trackingNumber, markShipped } = parsed.data;
  if (markShipped && !trackingNumber) return { ok: false, error: "Add a tracking number before marking as shipped" };
  await db.$transaction([
    db.order.update({
      where: { id: orderId },
      data: { carrier: carrier || null, trackingNumber: trackingNumber || null, ...(markShipped ? { status: "SHIPPED" } : {}) },
    }),
    ...(markShipped
      ? [
          db.orderEvent.create({
            data: { orderId, status: "SHIPPED", message: `Shipped via ${carrier || "carrier"} · tracking ${trackingNumber}`, author: admin.name, visible: true },
          }),
        ]
      : []),
  ]);
  if (markShipped) notifyStatusChange(orderId, "SHIPPED");
  revalidateOrder(orderId);
  return { ok: true, message: markShipped ? "Marked as shipped · customer will be emailed" : "Shipping details saved" };
}

const notesSchema = z.object({ orderId: z.string().min(1), internalNotes: z.string().max(5000) });

export async function saveInternalNotes(input: z.input<typeof notesSchema>): Promise<Result> {
  await requireAdmin();
  const parsed = notesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Notes are too long" };
  await db.order.update({ where: { id: parsed.data.orderId }, data: { internalNotes: parsed.data.internalNotes || null } });
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  return { ok: true, message: "Notes saved" };
}

const noteEventSchema = z.object({ orderId: z.string().min(1), message: z.string().trim().min(1).max(1000), visible: z.boolean().default(false) });

export async function addOrderNote(input: z.input<typeof noteEventSchema>): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = noteEventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Write a note first" };
  await db.orderEvent.create({ data: { ...parsed.data, author: admin.name } });
  if (parsed.data.visible) notifyOrderUpdate(parsed.data.orderId, parsed.data.message, admin.name);
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  return { ok: true, message: parsed.data.visible ? "Update sent to customer by email" : "Internal note added" };
}

const payloadSchema = z.object({ orderId: z.string().min(1) });

export async function markOrderPaid(input: z.input<typeof payloadSchema>): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = payloadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid order" };
  const order = await db.order.findUnique({ where: { id: parsed.data.orderId }, select: { status: true, paymentStatus: true } });
  if (!order) return { ok: false, error: "Order not found" };
  if (order.paymentStatus === "PAID") return { ok: false, error: "Order is already paid" };
  await db.$transaction([
    db.order.update({
      where: { id: parsed.data.orderId },
      data: { paymentStatus: "PAID", paymentMethod: "manual", ...(order.status === "PENDING" ? { status: "ARTWORK_REVIEW" } : {}) },
    }),
    db.orderEvent.create({
      data: {
        orderId: parsed.data.orderId,
        status: order.status === "PENDING" ? "ARTWORK_REVIEW" : null,
        message: "Payment received (marked paid manually)",
        author: admin.name,
        visible: true,
      },
    }),
  ]);
  notifyOrderPaid(parsed.data.orderId);
  revalidateOrder(parsed.data.orderId);
  return { ok: true, message: "Marked as paid" };
}

const resendSchema = z.object({ orderId: z.string().min(1), kind: z.enum(["confirmation", "status"]) });

/** Admin "Resend" buttons: sends immediately (bypasses dedupe and notification toggles). */
export async function resendOrderEmail(input: z.input<typeof resendSchema>): Promise<Result> {
  await requireAdmin();
  const parsed = resendSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };
  const { orderId, kind } = parsed.data;
  const order = await db.order.findUnique({ where: { id: orderId }, select: { status: true, email: true, paymentStatus: true } });
  if (!order) return { ok: false, error: "Order not found" };
  if (kind === "confirmation" && order.paymentStatus !== "PAID") return { ok: false, error: "Order isn’t paid yet" };
  const out = kind === "confirmation" ? await sendOrderConfirmation(orderId, { force: true }) : await sendStatusUpdate(orderId, order.status, { force: true });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/emails");
  if (!out.sent) return { ok: false, error: out.reason ?? out.result?.error ?? "Email failed" };
  return { ok: true, message: out.result?.status === "OUTBOX" ? `Saved to dev outbox (no SMTP configured)` : `Email sent to ${order.email}` };
}
