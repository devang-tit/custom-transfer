import "server-only";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { notifyOrderPaid } from "@/lib/email/notify";

export function stripeEnabled() {
  return !!process.env.STRIPE_SECRET_KEY;
}

let client: Stripe | null = null;
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

/** Status an order moves to once paid: prepress review if any line has artwork to check. */
export function paidStatusFor(items: { artworkUrl: string | null; designId: string | null }[]) {
  return items.some((i) => i.artworkUrl || i.designId) ? "ARTWORK_REVIEW" : "IN_PRODUCTION";
}

/** Idempotently marks an order paid (used by Stripe webhook and success-page fallback). */
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
