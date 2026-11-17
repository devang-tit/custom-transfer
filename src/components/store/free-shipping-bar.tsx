import { Truck } from "lucide-react";
import { formatMoney } from "@/lib/format";

export function FreeShippingBar({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  if (!threshold) return null;
  const remaining = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
  return (
    <div className="rounded-xl border bg-muted/40 p-3">
      <p className="flex items-center gap-2 text-xs font-medium">
        <Truck className="size-4 text-primary" />
        {remaining > 0 ? (
          <>
            You’re <span className="font-semibold">{formatMoney(remaining)}</span> away from free standard shipping
          </>
        ) : (
          <>You’ve unlocked free standard shipping 🎉</>
        )}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-ink-gradient transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
