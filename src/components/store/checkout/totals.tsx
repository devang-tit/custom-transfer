import { formatMoney } from "@/lib/format";
import type { CartTotals } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function TotalsTable({ totals, shippingLabel = "Shipping", estimate = false, taxRate, className }: { totals: CartTotals; shippingLabel?: string; estimate?: boolean; taxRate?: number; className?: string }) {
  const row = "flex items-center justify-between gap-4";
  return (
    <dl className={cn("space-y-2.5 text-sm", className)}>
      <div className={row}>
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="font-medium tabular-nums">{formatMoney(totals.subtotal)}</dd>
      </div>
      {totals.discount > 0 && (
        <div className={row}>
          <dt className="text-muted-foreground">Discount</dt>
          <dd className="font-medium text-success tabular-nums">−{formatMoney(totals.discount)}</dd>
        </div>
      )}
      <div className={row}>
        <dt className="text-muted-foreground">{shippingLabel}{estimate && " (est.)"}</dt>
        <dd className="font-medium tabular-nums">{totals.shipping === 0 ? <span className="text-success">Free</span> : formatMoney(totals.shipping)}</dd>
      </div>
      {totals.rushFee > 0 && (
        <div className={row}>
          <dt className="text-muted-foreground">Rush production</dt>
          <dd className="font-medium tabular-nums">{formatMoney(totals.rushFee)}</dd>
        </div>
      )}
      <div className={row}>
        <dt className="text-muted-foreground">Tax{taxRate != null && ` (${taxRate}%)`}{estimate && " (est.)"}</dt>
        <dd className="font-medium tabular-nums">{formatMoney(totals.tax)}</dd>
      </div>
      <div className={cn(row, "border-t pt-3")}>
        <dt className="font-semibold">Total</dt>
        <dd className="font-heading text-2xl font-extrabold tabular-nums">{formatMoney(totals.total)}</dd>
      </div>
    </dl>
  );
}
