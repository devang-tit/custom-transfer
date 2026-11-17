import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripe, markOrderPaid, stripeEnabled } from "@/app/(store)/_actions/payment-lib";

export const dynamic = "force-dynamic";

/** Stripe → POST checkout.session.* events. Configure STRIPE_WEBHOOK_SECRET. */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeEnabled() || !secret) return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 501 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId && session.payment_status === "paid") {
      await markOrderPaid(orderId, typeof session.payment_intent === "string" ? session.payment_intent : session.id);
    }
  } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await db.order.updateMany({
        where: { id: orderId, paymentStatus: "UNPAID" },
        data: { paymentStatus: event.type === "checkout.session.expired" ? "UNPAID" : "FAILED" },
      });
      await db.orderEvent.create({ data: { orderId, message: "Payment was not completed", author: "system" } }).catch(() => {});
    }
  }
  return NextResponse.json({ received: true });
}
