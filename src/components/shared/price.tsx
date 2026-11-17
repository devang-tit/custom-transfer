import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

export function Price({
  amount,
  compareAt,
  prefix,
  className,
}: {
  amount: number;
  compareAt?: number | null;
  prefix?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-1.5 tabular-nums", className)}>
      {prefix && <span className="text-xs font-normal text-muted-foreground">{prefix}</span>}
      <span className="font-semibold">{formatMoney(amount)}</span>
      {compareAt && compareAt > amount ? (
        <span className="text-sm text-muted-foreground line-through">{formatMoney(compareAt)}</span>
      ) : null}
    </span>
  );
}
