import { cn } from "@/lib/utils";
import { ARTWORK_STATUS_META, PAYMENT_STATUS_META, statusMeta } from "@/lib/order-status";

const pill = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap";

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  const m = statusMeta(status);
  return (
    <span className={cn(pill, m.badge, className)}>
      <span className={cn("size-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

export function PaymentStatusBadge({ status, className }: { status: string; className?: string }) {
  const m = PAYMENT_STATUS_META[status] ?? PAYMENT_STATUS_META.UNPAID!;
  return <span className={cn(pill, m.badge, className)}>{m.label}</span>;
}

export function ArtworkStatusBadge({ status, className }: { status: string; className?: string }) {
  const m = ARTWORK_STATUS_META[status] ?? ARTWORK_STATUS_META.PENDING!;
  return <span className={cn(pill, m.badge, className)}>{m.label}</span>;
}
