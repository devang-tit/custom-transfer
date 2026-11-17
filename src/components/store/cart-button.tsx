"use client";

import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, cartCount } from "@/stores/cart";
import { useHydrated } from "./use-hydrated";

export function CartButton() {
  const hydrated = useHydrated();
  const count = useCart((s) => cartCount(s.items));
  const open = useCart((s) => s.open);
  const shown = hydrated ? count : 0;
  return (
    <Button variant="ghost" size="icon" className="relative size-9 rounded-xl" onClick={open} aria-label={`Open cart (${shown} items)`}>
      <ShoppingBag className="size-[1.15rem]" />
      {shown > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background tabular-nums">
          {shown > 99 ? "99+" : shown}
        </span>
      )}
    </Button>
  );
}
