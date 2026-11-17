"use client";

import { useEffect, useState } from "react";
import { getPricingProducts } from "@/app/(store)/_actions/cart";
import type { PricingProduct } from "@/lib/types";

const cache = new Map<string, PricingProduct>();

/** Loads (and caches) pricing data for the given product ids. */
export function usePricingProducts(ids: string[]) {
  const key = [...new Set(ids)].sort().join(",");
  const [, force] = useState(0);
  useEffect(() => {
    const missing = key.split(",").filter((id) => id && !cache.has(id));
    if (!missing.length) return;
    let alive = true;
    getPricingProducts(missing)
      .then((rows) => {
        rows.forEach((r) => cache.set(r.id, r));
        if (alive) force((n) => n + 1);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [key]);
  return cache;
}
