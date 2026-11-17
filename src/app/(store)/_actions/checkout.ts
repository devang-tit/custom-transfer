"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { generateOrderNumber } from "@/lib/orders";
import { computeTotals, priceLine } from "@/lib/pricing";
import { notifyOrderPaid } from "@/lib/email/notify";
import { toJson } from "@/lib/json";
import { toProductDTO, toPricingProduct, productImage } from "@/lib/products";
import { siteConfig } from "@/config/site";
import { findValidCoupon } from "./coupon-lib";
import { getStripe, paidStatusFor, stripeEnabled } from "./payment-lib";
import { isAllowedAssetUrl } from "@/lib/asset-url";
import { cardBrand, DECLINE_CARD, expiryValid, luhnValid } from "@/components/store/checkout/card-utils";

const safePath = z.string().max(300).refine(isAllowedAssetUrl, "Invalid file URL");

const itemSchema = z.object({
  productId: z.string().min(1).max(64),
  selection: z.object({
    sizeId: z.string().max(40).optional(),
    finishId: z.string().max(40).optional(),
    color: z.string().max(60).optional(),
    apparelSizes: z.record(z.string().max(8), z.number().int().min(0).max(5000)).optional(),
    printLocations: z.array(z.string().max(40)).max(10).optional(),
    quantity: z.number().int().min(1).max(10000),
  }),
  artworkUrl: z.string().max(300).optional(),
  artworkName: z.string().max(200).optional(),
  designId: z.string().max(64).optional(),
  image: z.string().max(300).optional(),
  notes: z.string().max(500).optional(),
});

const schema = z.object({
  contact: z.object({
    email: z.email("Enter a valid email").transform((v) => v.trim().toLowerCase()),
    name: z.string().trim().min(2, "Enter your full name").max(120),
    phone: z.string().trim().max(40).optional(),
  }),
  address: z.object({
    name: z.string().trim().min(2, "Required").max(120),
    company: z.string().trim().max(120).optional(),
    line1: z.string().trim().min(3, "Required").max(200),
    line2: z.string().trim().max(200).optional(),
    city: z.string().trim().min(2, "Required").max(100),
    state: z.string().trim().min(2, "Required").max(60),
    zip: z.string().trim().min(3, "Required").max(20),
    country: z.string().trim().length(2),
  }),
  shippingMethod: z.string().max(40),
  rush: z.boolean(),
  notes: z.string().trim().max(1000).optional(),
  couponCode: z.string().trim().max(40).optional(),
  items: z.array(itemSchema).min(1, "Your cart is empty").max(50),
  payment: z.object({
    method: z.enum(["demo", "stripe"]),
    cardNumber: z.string().max(30).optional(),
    expiry: z.string().max(10).optional(),
    cvc: z.string().max(4).optional(),
  }),
});

export type CheckoutPayload = z.input<typeof schema>;
export type PlaceOrderResult = { ok: true; url: string; external?: boolean } | { ok: false; error: string; field?: string };

export async function placeOrder(payload: CheckoutPayload): Promise<PlaceOrderResult> {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Please check your details", field: issue?.path.join(".") };
  }
  const input = parsed.data;
  const [session, settings] = await Promise.all([getSession(), getSettings()]);

  // ---- Re-price every line from the database (never trust client prices) ----
  const ids = [...new Set(input.items.map((i) => i.productId))];
  const rows = await db.product.findMany({ where: { id: { in: ids } }, include: { category: { select: { id: true, name: true, slug: true } } } });
  const products = new Map(rows.map((r) => [r.id, toProductDTO(r)]));
  const designIds = input.items.map((i) => i.designId).filter((d): d is string => !!d);
  const designs = new Set(
    designIds.length ? (await db.savedDesign.findMany({ where: { id: { in: designIds } }, select: { id: true } })).map((d) => d.id) : []
  );

  const lines: (Prisma.OrderItemCreateWithoutOrderInput & { artworkUrl: string | null; designId: string | null })[] = [];
  const stockNeed = new Map<string, number>();
  for (const item of input.items) {
    const product = products.get(item.productId);
    if (!product || !product.active) return { ok: false, error: "An item in your cart is no longer available. Please remove it and try again." };
    const opts = product.options;
    const sel = { ...item.selection };

    if (product.type === "APPAREL") {
      if (opts.colors?.length && !opts.colors.some((c) => c.name === sel.color)) return { ok: false, error: `Choose a valid color for ${product.name}.` };
      const validSizes = new Set((opts.apparelSizes ?? []).map((s) => s.size));
      const sizes = Object.fromEntries(Object.entries(sel.apparelSizes ?? {}).filter(([s, q]) => validSizes.has(s) && q > 0));
      sel.apparelSizes = sizes;
      sel.printLocations = (sel.printLocations ?? []).filter((l) => opts.printLocations?.some((p) => p.id === l));
      sel.quantity = Object.values(sizes).reduce((a, b) => a + b, 0);
      if (!sel.quantity) return { ok: false, error: `Add at least one size for ${product.name}.` };
    } else {
      if (opts.sizes?.length && !opts.sizes.some((s) => s.id === sel.sizeId)) return { ok: false, error: `Choose a valid size for ${product.name}.` };
      if (sel.finishId && !opts.finishes?.some((f) => f.id === sel.finishId)) sel.finishId = undefined;
      const minQty = Math.min(...(product.tiers.length ? product.tiers.map((t) => t.minQty) : [1]));
      if (minQty > 1 && sel.quantity < minQty) return { ok: false, error: `${product.name} has a minimum of ${minQty} pieces.` };
    }

    const artworkUrl = item.artworkUrl && safePath.safeParse(item.artworkUrl).success ? item.artworkUrl : null;
    const designId = item.designId && designs.has(item.designId) ? item.designId : null;
    const needsArt = product.type === "APPAREL" ? (sel.printLocations?.length ?? 0) > 0 : !!opts.requiresArtwork;
    if (needsArt && !artworkUrl && !designId) return { ok: false, error: `Artwork is missing for ${product.name}. Please re-add it to your cart.` };

    const price = priceLine(toPricingProduct(product), sel);
    if (product.stock != null) stockNeed.set(product.id, (stockNeed.get(product.id) ?? 0) + price.quantity);
    const image = item.image && safePath.safeParse(item.image).success ? item.image : productImage(product);
    lines.push({
      product: { connect: { id: product.id } },
      name: product.name,
      type: product.type,
      image,
      variantLabel: price.variantLabel || null,
      selection: toJson({ ...sel, quantity: price.quantity }),
      quantity: price.quantity,
      unitPrice: price.unitPrice,
      total: price.total,
      artworkUrl,
      designId,
      artworkStatus: needsArt ? "PENDING" : "APPROVED",
      artworkNote: item.notes?.trim() || null,
    });
  }
  for (const [id, need] of stockNeed) {
    const p = products.get(id)!;
    if ((p.stock ?? 0) < need) return { ok: false, error: `Only ${Math.max(0, p.stock ?? 0)} of ${p.name} left in stock.` };
  }

  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  let coupon = null;
  if (input.couponCode) {
    const res = await findValidCoupon(input.couponCode, subtotal);
    if (!res.coupon) return { ok: false, error: res.error, field: "couponCode" };
    coupon = res.coupon;
  }
  if (!settings.shippingMethods.some((m) => m.id === input.shippingMethod)) return { ok: false, error: "Choose a delivery method.", field: "shippingMethod" };
  const totals = computeTotals({ subtotal, settings, shippingMethodId: input.shippingMethod, coupon, rush: input.rush });

  // ---- Payment pre-checks ----
  const useStripe = input.payment.method === "stripe" && stripeEnabled();
  if (!useStripe) {
    const num = (input.payment.cardNumber ?? "").replace(/\D/g, "");
    if (!luhnValid(num)) return { ok: false, error: "That card number doesn’t look right.", field: "payment.cardNumber" };
    if (!expiryValid(input.payment.expiry ?? "")) return { ok: false, error: "Check the card expiry date.", field: "payment.expiry" };
    if (!/^\d{3,4}$/.test(input.payment.cvc ?? "")) return { ok: false, error: "Enter the 3–4 digit security code.", field: "payment.cvc" };
    if (num === DECLINE_CARD) return { ok: false, error: "Your card was declined. Try another card.", field: "payment.cardNumber" };
  }

  const number = await generateOrderNumber(settings.orderPrefix);
  const paidNow = !useStripe;
  const paidStatus = paidStatusFor(lines);
  const now = Date.now();
  const card = (input.payment.cardNumber ?? "").replace(/\D/g, "");

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        number,
        userId: session?.sub ?? null,
        email: input.contact.email,
        customerName: input.contact.name,
        phone: input.contact.phone || null,
        status: paidNow ? paidStatus : "PENDING",
        paymentStatus: paidNow ? "PAID" : "UNPAID",
        paymentMethod: useStripe ? "stripe" : "card",
        paymentRef: paidNow ? `demo_${cardBrand(card).toLowerCase()}_${card.slice(-4)}` : null,
        shippingMethod: input.shippingMethod,
        shippingAddress: toJson(input.address),
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping: totals.shipping,
        rushFee: totals.rushFee,
        tax: totals.tax,
        total: totals.total,
        couponCode: coupon?.code ?? null,
        isRush: input.rush,
        notes: input.notes || null,
        items: { create: lines },
        events: {
          create: [
            { status: "PENDING", message: "Order placed", author: "customer", createdAt: new Date(now) },
            ...(paidNow
              ? [
                  {
                    status: paidStatus,
                    message: paidStatus === "ARTWORK_REVIEW" ? "Payment received — artwork sent to prepress review" : "Payment received — queued for production",
                    author: "system",
                    createdAt: new Date(now + 1000),
                  },
                ]
              : []),
          ],
        },
      },
    });
    if (coupon) await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
    for (const [id, need] of stockNeed) await tx.product.update({ where: { id }, data: { stock: { decrement: need } } });
    return created;
  });

  // Receipt + store alert (sent after the response; Stripe orders notify from the webhook instead).
  if (paidNow) notifyOrderPaid(order.id);

  const jar = await cookies();
  jar.set("if_last_order", order.number, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24, secure: process.env.NODE_ENV === "production" });
  revalidatePath("/account/orders");
  revalidatePath("/admin");

  if (useStripe) {
    try {
      const base = siteConfig.url.replace(/\/$/, "");
      const s = await getStripe().checkout.sessions.create({
        mode: "payment",
        customer_email: order.email,
        client_reference_id: order.id,
        metadata: { orderId: order.id, orderNumber: order.number },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: siteConfig.currency.toLowerCase(),
              unit_amount: order.total,
              product_data: { name: `${settings.storeName} order ${order.number}`, description: `${lines.length} item${lines.length > 1 ? "s" : ""}` },
            },
          },
        ],
        success_url: `${base}/checkout/success?order=${order.number}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/checkout?canceled=${order.number}`,
      });
      await db.order.update({ where: { id: order.id }, data: { paymentRef: s.id } });
      return { ok: true, url: s.url!, external: true };
    } catch (e) {
      // Roll back reservations so the customer can retry.
      await db.$transaction(async (tx) => {
        if (coupon) await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { decrement: 1 } } });
        for (const [id, need] of stockNeed) await tx.product.update({ where: { id }, data: { stock: { increment: need } } });
        await tx.order.delete({ where: { id: order.id } });
      });
      console.error("Stripe session error", e);
      return { ok: false, error: "We couldn’t start the secure payment. Please try again." };
    }
  }
  return { ok: true, url: `/checkout/success?order=${order.number}` };
}
