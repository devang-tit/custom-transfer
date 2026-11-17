import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatMoney } from "@/lib/format";
import { PLACEHOLDER_IMAGE } from "@/lib/products";

export type OrderListItemData = {
  number: string;
  createdAt: Date;
  status: string;
  total: number;
  items: { id: string; name: string; image: string | null; quantity: number }[];
};

export function OrderListItem({ order }: { order: OrderListItemData }) {
  const thumbs = order.items.slice(0, 3);
  const extra = order.items.length - thumbs.length;
  const pieces = order.items.reduce((n, i) => n + i.quantity, 0);
  return (
    <Link
      href={`/account/orders/${order.number}`}
      className="group flex min-w-0 items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-muted/60 sm:px-4"
    >
      <div className="flex shrink-0 -space-x-3">
        {thumbs.map((it) => (
          <div key={it.id} className="relative size-12 overflow-hidden rounded-xl border-2 border-card bg-muted shadow-sm">
            <Image src={it.image ?? PLACEHOLDER_IMAGE} alt={it.name} fill sizes="48px" className="object-cover" unoptimized />
          </div>
        ))}
        {extra > 0 && (
          <div className="grid size-12 place-items-center rounded-xl border-2 border-card bg-muted text-xs font-semibold text-muted-foreground">
            +{extra}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono text-sm font-semibold">{order.number}</span>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {formatDate(order.createdAt)} · {order.items.length} {order.items.length === 1 ? "item" : "items"} · {pieces} pcs
          <span className="hidden sm:inline"> · {order.items.map((i) => i.name).join(", ")}</span>
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold tabular-nums">{formatMoney(order.total)}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
