import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay (UPI, cards, netbanking, wallets) via its REST API — no SDK needed.
 *
 * Env (Vercel → Settings → Environment Variables):
 *   RAZORPAY_KEY_ID          rzp_test_… / rzp_live_…  (public; sent to the browser checkout)
 *   RAZORPAY_KEY_SECRET      secret                    (server only)
 *   RAZORPAY_WEBHOOK_SECRET  secret you choose in Razorpay Dashboard → Webhooks
 *
 * Without the key pair the store runs a clearly-labelled demo payment instead.
 */

export function razorpayEnabled(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim());
}

export function razorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID?.trim() ?? "";
}

export function razorpayMode(): "live" | "test" | "off" {
  const id = razorpayKeyId();
  if (!razorpayEnabled()) return "off";
  return id.startsWith("rzp_live_") ? "live" : "test";
}

type RazorpayOrder = { id: string; amount: number; currency: string; receipt: string; status: string };

/** Creates a Razorpay order for `amount` paise. */
export async function createRazorpayOrder(input: { amount: number; receipt: string; notes?: Record<string, string> }): Promise<RazorpayOrder> {
  const auth = Buffer.from(`${razorpayKeyId()}:${process.env.RAZORPAY_KEY_SECRET!.trim()}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: input.amount, currency: "INR", receipt: input.receipt.slice(0, 40), notes: input.notes ?? {} }),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as Partial<RazorpayOrder> & { error?: { description?: string } };
  if (!res.ok || !json.id) throw new Error(json.error?.description ?? `Razorpay order failed (${res.status})`);
  return json as RazorpayOrder;
}

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Checkout handler signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret || !orderId || !paymentId || !signature) return false;
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook signature: HMAC_SHA256(raw body, webhook secret) in the X-Razorpay-Signature header. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
