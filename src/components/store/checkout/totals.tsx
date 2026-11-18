import { formatMoney } from "@/lib/format";
import type { CartTotals } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/**
 * Price breakdown. With GST-inclusive prices (India) GST is not a separate charge: the total
 * already contains it, so it's shown as "Includes ₹X GST" (or "Inclusive of all taxes" while estimating).
 */
export function TotalsTable({ totals, shippingLabel = "Shipping", estimate = false, className }: { totals: CartTotals; shippingLabel?: string; estimate?: boolean; className?: string }) {
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
      {totals.codFee > 0 && (
        <div className={row}>
          <dt className="text-muted-foreground">Cash on Delivery fee</dt>
          <dd className="font-medium tabular-nums">{formatMoney(totals.codFee)}</dd>
        </div>
      )}
      {!totals.taxIncluded && (
        <div className={row}>
          <dt className="text-muted-foreground">GST{estimate && " (est.)"}</dt>
          <dd className="font-medium tabular-nums">{formatMoney(totals.tax)}</dd>
        </div>
      )}
      <div className={cn(row, "border-t pt-3")}>
        <dt className="font-semibold">Total</dt>
        <dd className="text-2xl font-bold tabular-nums">{formatMoney(totals.total)}</dd>
      </div>
      {totals.taxIncluded && (
        <p className="-mt-1 text-right text-xs text-muted-foreground">
          {estimate || totals.tax <= 0 ? "Inclusive of all taxes" : `Includes ${formatMoney(totals.tax)} GST`}
        </p>
      )}
    </dl>
  );
}
