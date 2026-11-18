"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Lock, ShieldCheck, ShoppingBag, Truck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { useCart, cartCount, cartSubtotal } from "@/stores/cart";
import { computeTotals } from "@/lib/pricing";
import { formatMoney } from "@/lib/format";
import type { StoreSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CartLine } from "../cart-line";
import { FreeShippingBar } from "../free-shipping-bar";
import { usePricingProducts } from "../use-pricing";
import { useHydrated } from "../use-hydrated";
import { CouponInput } from "../checkout/coupon-input";
import { TotalsTable } from "../checkout/totals";
import { useCoupon } from "../checkout/use-coupon";
import { PaymentBadges } from "../social-icons";

export function CartView({ settings }: { settings: StoreSettings }) {
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const list = hydrated ? items : [];
  const pricing = usePricingProducts(list.map((i) => i.productId));
  const subtotal = cartSubtotal(list);
  const { coupon, description, error } = useCoupon(subtotal);
  const shipMethods = settings.shippingMethods;
  const [method, setMethod] = useState(shipMethods[0]?.id ?? "standard");
  const totals = computeTotals({ subtotal, settings, shippingMethodId: method, coupon });

  if (!hydrated) {
    return <div className="container-page min-h-[50vh] py-16"><div className="h-10 w-48 animate-pulse rounded-xl bg-muted" /></div>;
  }

  if (!list.length) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Upload your artwork on any product page or build a gang sheet — it’ll show up here."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild className="h-11 rounded-xl px-5"><Link href="/gang-sheet-builder">Build a gang sheet</Link></Button>
              <Button asChild variant="outline" className="h-11 rounded-xl px-5"><Link href="/shop">Shop transfers</Link></Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Your cart</h1>
          <p className="mt-1 text-muted-foreground">{cartCount(list)} piece{cartCount(list) === 1 ? "" : "s"} · {list.length} line item{list.length > 1 ? "s" : ""}</p>
        </div>
        <Button asChild variant="ghost" className="h-10 rounded-xl">
          <Link href="/shop"><ArrowLeft className="size-4" /> Continue shopping</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          <FreeShippingBar subtotal={subtotal - totals.discount} threshold={settings.freeShippingThreshold} />
          <ul className="divide-y rounded-3xl border bg-card px-4 sm:px-6">
            {list.map((item) => (
              <li key={item.id} className="py-5">
                <CartLine item={item} pricing={pricing.get(item.productId)} />
                {item.notes && <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">Note: {item.notes}</p>}
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <button type="button" onClick={() => clear()} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive">
              <RotateCcw className="size-3.5" /> Clear cart
            </button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-5 rounded-3xl border bg-card p-5 shadow-premium sm:p-6">
            <h2 className="font-heading text-xl font-semibold">Order summary</h2>
            <CouponInput subtotal={subtotal} error={error} description={description} />
            <div>
              <p className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Estimate shipping</p>
              <div className="space-y-1.5">
                {shipMethods.map((m) => {
                  const free = m.freeEligible && subtotal - totals.discount >= settings.freeShippingThreshold;
                  return (
                    <label key={m.id} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-colors", method === m.id ? "border-primary bg-primary/5" : "hover:bg-muted/50")}>
                      <input type="radio" name="ship" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="accent-[var(--primary)]" />
                      <span className="flex-1">
                        <span className="font-medium">{m.label}</span> <span className="text-xs text-muted-foreground">· {m.description}</span>
                      </span>
                      <span className="font-medium tabular-nums">{m.price === 0 || free ? "Free" : formatMoney(m.price)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <TotalsTable totals={totals} estimate />
            <Button asChild className="h-12 w-full rounded-xl text-base shadow-glow">
              <Link href="/checkout"><Lock className="size-4" /> Checkout securely <ArrowRight className="size-4" /></Link>
            </Button>
            <PaymentBadges className="flex justify-center" />
          </div>
          <ul className="mt-4 space-y-2 px-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Every file checked by a human before printing</li>
            <li className="flex items-center gap-2"><Truck className="size-4 text-primary" /> Same-day production on orders before 2 pm IST</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
