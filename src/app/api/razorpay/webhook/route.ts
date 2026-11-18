import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { markOrderPaid } from "@/app/(store)/_actions/payment-lib";

export const dynamic = "force-dynamic";

type RazorpayEvent = {
  event: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; status?: string } };
    order?: { entity?: { id?: string; status?: string } };
  };
};

/**
 * Razorpay → POST events (configure in Razorpay Dashboard → Webhooks with RAZORPAY_WEBHOOK_SECRET;
 * events: payment.captured, order.paid, payment.failed). Backup to the checkout handler, so orders
 * are confirmed even if the customer closes the tab right after paying.
 */
export async function POST(request: Request) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET?.trim()) return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });
  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  let event: RazorpayEvent;
  try {
    event = JSON.parse(raw) as RazorpayEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  const rzpOrderId = payment?.order_id ?? event.payload?.order?.entity?.id;
  if (!rzpOrderId) return NextResponse.json({ received: true });
  const order = await db.order.findFirst({ where: { paymentRef: rzpOrderId }, select: { id: true } });
  if (!order) return NextResponse.json({ received: true });

  if (event.event === "payment.captured" || event.event === "order.paid") {
    await markOrderPaid(order.id, rzpOrderId);
  } else if (event.event === "payment.failed") {
    await db.orderEvent
      .create({ data: { orderId: order.id, message: "Online payment attempt failed", author: "system", visible: false } })
      .catch(() => {});
  }
  return NextResponse.json({ received: true });
}
