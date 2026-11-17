"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight, Lock } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart, cartCount, cartSubtotal } from "@/stores/cart";
import { formatMoney } from "@/lib/format";
import { CartLine } from "./cart-line";
import { FreeShippingBar } from "./free-shipping-bar";
import { usePricingProducts } from "./use-pricing";
import { useHydrated } from "./use-hydrated";

export function CartDrawer({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const isOpen = useCart((s) => s.isOpen);
  const setOpen = useCart((s) => s.setOpen);
  const pricing = usePricingProducts(isOpen ? items.map((i) => i.productId) : []);
  const list = hydrated ? items : [];
  const subtotal = cartSubtotal(list);

  return (
    <Sheet open={hydrated && isOpen} onOpenChange={setOpen}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2 font-heading text-lg">
            Your cart
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{cartCount(list)}</span>
          </SheetTitle>
          <SheetDescription className="sr-only">Items in your shopping cart</SheetDescription>
        </SheetHeader>

        {list.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="relative grid size-20 place-items-center rounded-3xl bg-accent">
              <ShoppingBag className="size-8 text-accent-foreground" />
              <span className="absolute -top-1 -right-1 size-4 rounded-full bg-ink-magenta" />
              <span className="absolute -bottom-1 -left-1 size-3 rounded-full bg-ink-cyan" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold">Your cart is empty</p>
              <p className="mt-1 text-sm text-muted-foreground">Upload a design or build a gang sheet to get started.</p>
            </div>
            <div className="flex w-full flex-col gap-2">
              <Button asChild className="h-11 rounded-xl" onClick={() => setOpen(false)}>
                <Link href="/gang-sheet-builder">Build a gang sheet</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-xl" onClick={() => setOpen(false)}>
                <Link href="/shop">Browse transfers</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 pt-4">
              <FreeShippingBar subtotal={subtotal} threshold={freeShippingThreshold} />
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <ul className="divide-y px-5">
                {list.map((item) => (
                  <li key={item.id} className="py-4">
                    <CartLine item={item} pricing={pricing.get(item.productId)} size="sm" />
                  </li>
                ))}
              </ul>
            </ScrollArea>
            <SheetFooter className="gap-3 border-t bg-muted/30 px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-heading text-lg font-semibold tabular-nums">{formatMoney(subtotal)}</span>
              </div>
              <p className="-mt-2 text-xs text-muted-foreground">Shipping, taxes and discounts calculated at checkout.</p>
              <Button asChild className="h-12 rounded-xl text-base shadow-glow" onClick={() => setOpen(false)}>
                <Link href="/checkout">
                  <Lock className="size-4" /> Secure checkout <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="h-10 rounded-xl" onClick={() => setOpen(false)}>
                <Link href="/cart">View full cart</Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
