"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/json";
import type { PriceTier, PricingProduct, ProductOptions } from "@/lib/types";
import { findValidCoupon } from "./coupon-lib";

/** Pricing data for re-pricing cart lines on the client. */
export async function getPricingProducts(ids: string[]): Promise<PricingProduct[]> {
  const parsed = z.array(z.string().max(64)).max(100).safeParse(ids);
  if (!parsed.success || !parsed.data.length) return [];
  const rows = await db.product.findMany({
    where: { id: { in: parsed.data } },
    select: { id: true, type: true, basePrice: true, options: true, tiers: true },
  });
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    basePrice: r.basePrice,
    options: parseJson<ProductOptions>(r.options, {}),
    tiers: parseJson<PriceTier[]>(r.tiers, []),
  }));
}

export type CouponResult =
  | { ok: true; code: string; type: string; value: number; minSubtotal: number; description: string | null }
  | { ok: false; error: string };

export async function validateCoupon(code: string, subtotal: number): Promise<CouponResult> {
  const input = z.object({ code: z.string().max(40), subtotal: z.number().int().min(0) }).safeParse({ code, subtotal });
  if (!input.success) return { ok: false, error: "Invalid request." };
  const res = await findValidCoupon(input.data.code, input.data.subtotal);
  if (!res.coupon) return { ok: false, error: res.error };
  const c = res.coupon;
  return { ok: true, code: c.code, type: c.type, value: c.value, minSubtotal: c.minSubtotal, description: c.description };
}
