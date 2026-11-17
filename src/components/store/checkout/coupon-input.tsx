"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/stores/cart";
import { validateCoupon } from "@/app/(store)/_actions/cart";
import { cn } from "@/lib/utils";

export function CouponInput({ subtotal, error, description }: { subtotal: number; error?: string | null; description?: string | null }) {
  const code = useCart((s) => s.couponCode);
  const setCoupon = useCart((s) => s.setCoupon);
  const [value, setValue] = useState("");
  const [pending, start] = useTransition();
  const [localError, setLocalError] = useState<string | null>(null);

  if (code) {
    return (
      <div className={cn("flex items-center gap-2 rounded-xl border px-3 py-2.5", error ? "border-destructive/40 bg-destructive/5" : "border-success/30 bg-success/5")}>
        <Tag className={cn("size-4", error ? "text-destructive" : "text-success")} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{code}</p>
          <p className={cn("truncate text-xs", error ? "text-destructive" : "text-muted-foreground")}>{error ?? description ?? "Applied"}</p>
        </div>
        <button type="button" aria-label="Remove promo code" onClick={() => setCoupon(null)} className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const c = value.trim().toUpperCase();
        if (!c) return;
        start(async () => {
          const res = await validateCoupon(c, subtotal);
          if (res.ok) {
            setCoupon(res.code);
            setValue("");
            setLocalError(null);
            toast.success(`Promo code ${res.code} applied`);
          } else setLocalError(res.error);
        });
      }}
    >
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setLocalError(null);
          }}
          placeholder="Promo code"
          aria-label="Promo code"
          className="h-10 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm uppercase outline-none placeholder:normal-case focus-visible:ring-3 focus-visible:ring-ring/40"
        />
        <button type="submit" disabled={pending || !value.trim()} className="inline-flex h-10 items-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-50">
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : "Apply"}
        </button>
      </div>
      {localError && <p className="mt-1.5 text-xs text-destructive">{localError}</p>}
    </form>
  );
}
