import { cn } from "@/lib/utils";
import { ARTWORK_STATUS_META, PAYMENT_STATUS_META, statusMeta } from "@/lib/order-status";

/** Semantic tone per status (used by the admin theme; the storefront keeps its own colors). */
type Tone = "default" | "success" | "caution" | "warning" | "critical" | "info";
const ORDER_TONE: Record<string, Tone> = {
  PENDING: "warning",
  ARTWORK_REVIEW: "caution",
  IN_PRODUCTION: "info",
  QUALITY_CHECK: "info",
  READY: "info",
  SHIPPED: "default",
  DELIVERED: "success",
  CANCELLED: "default",
  REFUNDED: "default",
};
const PAYMENT_TONE: Record<string, Tone> = { PAID: "default", UNPAID: "warning", REFUNDED: "default", FAILED: "critical" };
const ARTWORK_TONE: Record<string, Tone> = { PENDING: "caution", APPROVED: "success", NEEDS_CHANGES: "critical" };

const pill = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap";

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  const m = statusMeta(status);
  return (
    <span data-slot="status-badge" data-tone={ORDER_TONE[status] ?? "default"} className={cn(pill, m.badge, className)}>
      <span data-dot className={cn("size-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

export function PaymentStatusBadge({ status, className }: { status: string; className?: string }) {
  const m = PAYMENT_STATUS_META[status] ?? PAYMENT_STATUS_META.UNPAID!;
  return <span data-slot="status-badge" data-tone={PAYMENT_TONE[status] ?? "default"} className={cn(pill, m.badge, className)}>{m.label}</span>;
}

export function ArtworkStatusBadge({ status, className }: { status: string; className?: string }) {
  const m = ARTWORK_STATUS_META[status] ?? ARTWORK_STATUS_META.PENDING!;
  return <span data-slot="status-badge" data-tone={ARTWORK_TONE[status] ?? "default"} className={cn(pill, m.badge, className)}>{m.label}</span>;
}
