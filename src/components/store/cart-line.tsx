"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, Paintbrush, Paperclip } from "lucide-react";
import { useCart, type CartItem } from "@/stores/cart";
import { priceLine } from "@/lib/pricing";
import { formatMoney } from "@/lib/format";
import { PRODUCT_TYPE_LABELS } from "@/lib/types";
import type { PricingProduct } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CartLine({
  item,
  pricing,
  size = "md",
}: {
  item: CartItem;
  pricing?: PricingProduct;
  size?: "sm" | "md";
}) {
  const updateItem = useCart((s) => s.updateItem);
  const removeItem = useCart((s) => s.removeItem);
  const isApparel = item.type === "APPAREL";
  const minQty = pricing ? minQuantityFor(pricing) : 1;

  function setQty(q: number) {
    if (!pricing || isApparel) return;
    const quantity = Math.max(minQty, Math.min(9999, Math.floor(q) || minQty));
    const p = priceLine(pricing, { ...item.selection, quantity });
    updateItem(item.id, { quantity, selection: { ...item.selection, quantity }, unitPrice: p.unitPrice, total: p.total });
  }

  const sizes = Object.entries(item.selection.apparelSizes ?? {}).filter(([, q]) => q > 0);

  return (
    <div className="flex gap-3.5">
      <Link
        href={`/products/${item.slug}`}
        className={cn("relative shrink-0 overflow-hidden rounded-xl border bg-checker", size === "sm" ? "size-20" : "size-24")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image} alt={item.name} className="size-full object-contain" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {PRODUCT_TYPE_LABELS[item.type] ?? item.type}
            </p>
            <Link href={`/products/${item.slug}`} className="line-clamp-2 text-sm leading-snug font-semibold hover:underline">
              {item.name}
            </Link>
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(item.total)}</p>
        </div>
        {item.variantLabel && <p className="mt-0.5 text-xs text-muted-foreground">{item.variantLabel}</p>}
        {sizes.length > 0 && (
          <p className="mt-0.5 text-xs text-muted-foreground">{sizes.map(([s, q]) => `${s}×${q}`).join(" · ")}</p>
        )}
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {item.designId && (
            <span className="inline-flex items-center gap-1 text-primary">
              <Paintbrush className="size-3" /> Custom design
            </span>
          )}
          {item.artworkName && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <Paperclip className="size-3 shrink-0" />
              <span className="truncate">{item.artworkName}</span>
            </span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          {isApparel ? (
            <span className="text-xs text-muted-foreground">
              {item.quantity} pcs · {formatMoney(item.unitPrice)}/ea
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <div className="inline-flex h-8 items-center rounded-lg border bg-background">
                <button
                  type="button"
                  className="grid h-full w-8 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                  onClick={() => setQty(item.quantity - 1)}
                  disabled={!pricing || item.quantity <= minQty}
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-3.5" />
                </button>
                <input
                  aria-label="Quantity"
                  inputMode="numeric"
                  className="h-full w-10 bg-transparent text-center text-sm tabular-nums outline-none"
                  value={item.quantity}
                  disabled={!pricing}
                  onChange={(e) => setQty(Number(e.target.value.replace(/\D/g, "")))}
                />
                <button
                  type="button"
                  className="grid h-full w-8 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                  onClick={() => setQty(item.quantity + 1)}
                  disabled={!pricing}
                  aria-label="Increase quantity"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              <span className="hidden text-xs text-muted-foreground sm:inline">{formatMoney(item.unitPrice)}/ea</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export function minQuantityFor(p: Pick<PricingProduct, "tiers">): number {
  const first = [...(p.tiers ?? [])].sort((a, b) => a.minQty - b.minQty)[0];
  return first && first.minQty > 1 ? first.minQty : 1;
}
