export const ORDER_STATUSES = [
  "PENDING",
  "ARTWORK_REVIEW",
  "IN_PRODUCTION",
  "QUALITY_CHECK",
  "READY",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Happy-path order used for progress timelines and the production board. */
export const ORDER_FLOW: OrderStatus[] = [
  "PENDING",
  "ARTWORK_REVIEW",
  "IN_PRODUCTION",
  "QUALITY_CHECK",
  "READY",
  "SHIPPED",
  "DELIVERED",
];

/** Columns on the admin production board */
export const PRODUCTION_COLUMNS: OrderStatus[] = ["ARTWORK_REVIEW", "IN_PRODUCTION", "QUALITY_CHECK", "READY", "SHIPPED"];

type Meta = {
  label: string;
  description: string;
  /** Tailwind classes for a subtle pill: bg + text + ring */
  badge: string;
  /** Solid dot color class */
  dot: string;
};

export const ORDER_STATUS_META: Record<OrderStatus, Meta> = {
  PENDING: {
    label: "Awaiting payment",
    description: "We’re waiting for payment to be confirmed.",
    badge: "bg-zinc-500/10 text-zinc-700 ring-zinc-500/20 dark:text-zinc-300",
    dot: "bg-zinc-400",
  },
  ARTWORK_REVIEW: {
    label: "Artwork review",
    description: "Our prepress team is checking your files for print quality.",
    badge: "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  IN_PRODUCTION: {
    label: "In production",
    description: "Your transfers are printing on our DTF line.",
    badge: "bg-violet-500/10 text-violet-700 ring-violet-500/25 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  QUALITY_CHECK: {
    label: "Quality check",
    description: "Every sheet is inspected and cured before packing.",
    badge: "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  READY: {
    label: "Ready to ship",
    description: "Packed and waiting for carrier pickup.",
    badge: "bg-cyan-500/10 text-cyan-700 ring-cyan-500/25 dark:text-cyan-300",
    dot: "bg-cyan-500",
  },
  SHIPPED: {
    label: "Shipped",
    description: "On the way! Track your package with the link below.",
    badge: "bg-indigo-500/10 text-indigo-700 ring-indigo-500/25 dark:text-indigo-300",
    dot: "bg-indigo-500",
  },
  DELIVERED: {
    label: "Delivered",
    description: "Your order has been delivered. Happy pressing!",
    badge: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  CANCELLED: {
    label: "Cancelled",
    description: "This order was cancelled.",
    badge: "bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  REFUNDED: {
    label: "Refunded",
    description: "This order was refunded.",
    badge: "bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:text-rose-300",
    dot: "bg-rose-400",
  },
};

export function statusMeta(status: string): Meta {
  return ORDER_STATUS_META[status as OrderStatus] ?? ORDER_STATUS_META.PENDING;
}

export const PAYMENT_STATUS_META: Record<string, { label: string; badge: string }> = {
  UNPAID: { label: "Unpaid", badge: "bg-zinc-500/10 text-zinc-700 ring-zinc-500/20 dark:text-zinc-300" },
  PAID: { label: "Paid", badge: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300" },
  REFUNDED: { label: "Refunded", badge: "bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:text-rose-300" },
  FAILED: { label: "Failed", badge: "bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:text-rose-300" },
};

export const ARTWORK_STATUS_META: Record<string, { label: string; badge: string }> = {
  PENDING: { label: "Pending review", badge: "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300" },
  APPROVED: { label: "Approved", badge: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300" },
  NEEDS_CHANGES: { label: "Needs changes", badge: "bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:text-rose-300" },
};
