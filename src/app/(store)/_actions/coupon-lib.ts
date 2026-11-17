import "server-only";
import { db } from "@/lib/db";
import type { Coupon } from "@prisma/client";

export type CouponCheck = { coupon: Coupon; error?: undefined } | { coupon?: undefined; error: string };

/** Authoritative coupon validation shared by cart + checkout. */
export async function findValidCoupon(rawCode: string, subtotal: number): Promise<CouponCheck> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { error: "Enter a promo code." };
  const coupon = await db.coupon.findUnique({ where: { code } });
  const now = new Date();
  if (!coupon || !coupon.active) return { error: "That code isn’t valid." };
  if (coupon.startsAt && coupon.startsAt > now) return { error: "That code isn’t active yet." };
  if (coupon.expiresAt && coupon.expiresAt < now) return { error: "That code has expired." };
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return { error: "That code has reached its usage limit." };
  if (subtotal < coupon.minSubtotal) {
    return { error: `Add ${((coupon.minSubtotal - subtotal) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })} more to use ${code}.` };
  }
  return { coupon };
}
