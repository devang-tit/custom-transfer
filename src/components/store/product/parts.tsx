"use client";

import { Minus, Plus, TrendingDown, Check } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { nextTier, tierDiscountPct } from "@/lib/pricing";
import type { PriceTier, PricedOption, SizeOption } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OptionLabel({ step, title, hint, right }: { step?: number; title: string; hint?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {step != null && (
          <span className="grid size-6 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background">{step}</span>
        )}
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

export function SizePicker({ sizes, value, onChange, compact }: { sizes: SizeOption[]; value: string; onChange: (id: string) => void; compact?: boolean }) {
  return (
    <div role="radiogroup" className={cn("grid gap-2", compact ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-3")}>
      {sizes.map((s) => {
        const on = s.id === value;
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(s.id)}
            className={cn(
              "relative rounded-xl border bg-card px-3 py-2.5 text-left transition-all hover:border-primary/50",
              on && "border-primary bg-primary/5 ring-1 ring-primary"
            )}
          >
            {on && (
              <span className="absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-2.5" strokeWidth={3} />
              </span>
            )}
            <span className="block pr-4 text-sm leading-tight font-semibold">{s.label}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground tabular-nums">{formatMoney(s.price)}{compact ? "" : " / ea"}</span>
          </button>
        );
      })}
    </div>
  );
}

export function FinishPicker({ finishes, value, onChange }: { finishes: PricedOption[]; value: string; onChange: (id: string) => void }) {
  return (
    <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
      {finishes.map((f) => {
        const on = f.id === value;
        return (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(f.id)}
            className={cn(
              "rounded-xl border bg-card px-3 py-2.5 text-left transition-all hover:border-primary/50",
              on && "border-primary bg-primary/5 ring-1 ring-primary"
            )}
          >
            <span className="flex items-center justify-between text-sm font-semibold">
              {f.label}
              <span className="text-xs font-medium text-muted-foreground">{f.price ? `+${formatMoney(f.price)}` : "Included"}</span>
            </span>
            {f.description && <span className="mt-0.5 block text-xs text-muted-foreground">{f.description}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function QuantityStepper({ value, onChange, min = 1, max = 9999 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  const set = (n: number) => onChange(Math.max(min, Math.min(max, Math.floor(n) || min)));
  return (
    <div className="inline-flex h-11 items-center rounded-xl border bg-card">
      <button type="button" aria-label="Decrease" disabled={value <= min} onClick={() => set(value - 1)} className="grid h-full w-11 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40">
        <Minus className="size-4" />
      </button>
      <input
        aria-label="Quantity"
        inputMode="numeric"
        value={value}
        onChange={(e) => set(Number(e.target.value.replace(/\D/g, "")))}
        className="h-full w-16 bg-transparent text-center font-semibold tabular-nums outline-none"
      />
      <button type="button" aria-label="Increase" disabled={value >= max} onClick={() => set(value + 1)} className="grid h-full w-11 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40">
        <Plus className="size-4" />
      </button>
    </div>
  );
}

/** Per-piece price at each quantity tier for the current unit price. */
export function TierTable({ tiers, baseUnit, quantity, onPick, unitLabel = "pcs" }: { tiers: PriceTier[]; baseUnit: number; quantity: number; onPick?: (q: number) => void; unitLabel?: string }) {
  const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);
  if (sorted.length < 2) return null;
  const activePct = tierDiscountPct(sorted, quantity);
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${sorted.length}, minmax(0,1fr))` }}>
        {sorted.map((t, i) => {
          const on = t.discountPct === activePct && quantity >= t.minQty && (i === sorted.length - 1 || quantity < sorted[i + 1]!.minQty);
          return (
            <button
              key={t.minQty}
              type="button"
              onClick={() => onPick?.(t.minQty)}
              className={cn("border-r px-1 py-2 text-center last:border-r-0 transition-colors hover:bg-muted/60", on && "bg-primary text-primary-foreground hover:bg-primary")}
            >
              <span className={cn("block text-[11px]", on ? "text-primary-foreground/80" : "text-muted-foreground")}>{t.minQty}+ {unitLabel}</span>
              <span className="block text-sm font-semibold tabular-nums">{formatMoney(Math.round(baseUnit * (1 - t.discountPct / 100)))}</span>
              {t.discountPct > 0 && <span className={cn("block text-[10px] font-semibold", on ? "text-primary-foreground" : "text-success")}>−{t.discountPct}%</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TierNudge({ tiers, quantity, onPick }: { tiers: PriceTier[]; quantity: number; onPick: (q: number) => void }) {
  const nt = nextTier(tiers, quantity);
  if (!nt || nt.discountPct <= 0) return null;
  const need = nt.minQty - quantity;
  return (
    <button
      type="button"
      onClick={() => onPick(nt.minQty)}
      className="flex w-full items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-left text-xs font-medium text-success transition-colors hover:bg-success/15"
    >
      <TrendingDown className="size-4 shrink-0" />
      Add {need} more to unlock {nt.discountPct}% off every piece
      <span className="ml-auto font-semibold underline-offset-2 hover:underline">Apply</span>
    </button>
  );
}
