"use client";

import { useEffect, useState } from "react";
import { validateCoupon, type CouponResult } from "@/app/(store)/_actions/cart";
import { useCart } from "@/stores/cart";
import type { CouponLike } from "@/lib/types";

/** Validates the cart's stored promo code against the current subtotal. */
export function useCoupon(subtotal: number) {
  const code = useCart((s) => s.couponCode);
  const [checked, setChecked] = useState<{ key: string; result: CouponResult } | null>(null);
  const key = `${code}:${subtotal}`;
  useEffect(() => {
    if (!code) return;
    let alive = true;
    validateCoupon(code, subtotal)
      .then((r) => alive && setChecked({ key: `${code}:${subtotal}`, result: r }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [code, subtotal]);
  // Only trust a result computed for the current code + subtotal.
  const result = code && checked?.key === key ? checked.result : null;
  const coupon: CouponLike | null = result?.ok ? { code: result.code, type: result.type, value: result.value, minSubtotal: result.minSubtotal } : null;
  return { code, coupon, description: result?.ok ? result.description : null, error: result && !result.ok ? result.error : null };
}
