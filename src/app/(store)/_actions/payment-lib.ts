import "server-only";
import { db } from "@/lib/db";
import { notifyOrderPaid } from "@/lib/email/notify";

/** Status an order moves to once confirmed: prepress review if any line has artwork to check. */
export function paidStatusFor(items: { artworkUrl: string | null; designId: string | null }[]) {
  return items.some((i) => i.artworkUrl || i.designId) ? "ARTWORK_REVIEW" : "IN_PRODUCTION";
}

/**
 * Idempotently marks an online-paid order as PAID (Razorpay checkout handler, Razorpay webhook,
 * demo payments). Sends the receipt + store alert the first time.
 */
export async function markOrderPaid(orderId: string, paymentRef: string | null) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: { select: { artworkUrl: true, designId: true } } } });
  if (!order || order.paymentStatus === "PAID") return order;
  const status = paidStatusFor(order.items);
  const updated = await db.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "PAID",
      status: order.status === "PENDING" ? status : order.status,
      paymentRef: paymentRef ?? order.paymentRef,
      events: {
        create: {
          status,
          message: status === "ARTWORK_REVIEW" ? "Payment received — artwork sent to prepress review" : "Payment received — queued for production",
          author: "system",
        },
      },
    },
  });
  notifyOrderPaid(orderId);
  return updated;
}
