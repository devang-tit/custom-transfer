import type { Metadata } from "next";
import Link from "next/link";
import { Package, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderListItem } from "@/components/account/order-list-item";
import { AccountPageHeader } from "@/components/account/section";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = { title: "My orders" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { id: "all", label: "All", statuses: null },
  { id: "active", label: "In progress", statuses: ["PENDING", "ARTWORK_REVIEW", "IN_PRODUCTION", "QUALITY_CHECK", "READY"] },
  { id: "shipped", label: "Shipped", statuses: ["SHIPPED"] },
  { id: "delivered", label: "Delivered", statuses: ["DELIVERED"] },
  { id: "cancelled", label: "Cancelled", statuses: ["CANCELLED", "REFUNDED"] },
] as const;

export default async function OrdersPage({ searchParams }: PageProps<"/account/orders">) {
  const user = await requireUser("/account/orders");
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "all";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const filter = FILTERS.find((f) => f.id === status) ?? FILTERS[0];

  const base: Prisma.OrderWhereInput = { userId: user.id };
  const where: Prisma.OrderWhereInput = {
    ...base,
    ...(filter.statuses ? { status: { in: [...filter.statuses] } } : {}),
    ...(q ? { OR: [{ number: { contains: q } }, { items: { some: { name: { contains: q } } } }] } : {}),
  };

  const [orders, counts] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { items: { select: { id: true, name: true, image: true, quantity: true } } },
    }),
    db.order.groupBy({ by: ["status"], where: base, _count: { _all: true } }),
  ]);
  const countFor = (statuses: readonly string[] | null) =>
    counts.filter((c) => !statuses || statuses.includes(c.status)).reduce((n, c) => n + c._count._all, 0);

  const href = (s: string) => {
    const p = new URLSearchParams();
    if (s !== "all") p.set("status", s);
    if (q) p.set("q", q);
    const qs = p.toString();
    return `/account/orders${qs ? `?${qs}` : ""}`;
  };

  return (
    <div>
      <AccountPageHeader title="Orders" description="Track production, download invoices and reorder in one click." />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 no-scrollbar md:mx-0 md:px-0">
          {FILTERS.map((f) => (
            <Link
              key={f.id}
              href={href(f.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                f.id === filter.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
              <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", f.id === filter.id ? "bg-background/20" : "bg-background")}>
                {countFor(f.statuses)}
              </span>
            </Link>
          ))}
        </div>
        <form className="relative md:w-72" action="/account/orders">
          {filter.id !== "all" && <input type="hidden" name="status" value={filter.id} />}
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Search order # or product" className="h-10 rounded-xl pr-9 pl-9" />
          {q && (
            <Link href={href(filter.id).replace(/[?&]q=[^&]*/, "")} className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted" aria-label="Clear search">
              <X className="size-3.5" />
            </Link>
          )}
        </form>
      </div>

      {orders.length ? (
        <div className="flex min-w-0 flex-col divide-y rounded-2xl border bg-card p-2">
          {orders.map((o) => (
            <OrderListItem key={o.id} order={o} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title={q || filter.id !== "all" ? "No matching orders" : "No orders yet"}
          description={q || filter.id !== "all" ? "Try a different filter or search term." : "Your orders will appear here as soon as you check out."}
          action={
            <Button asChild className="rounded-xl">
              <Link href={q || filter.id !== "all" ? "/account/orders" : "/shop"}>{q || filter.id !== "all" ? "Clear filters" : "Start shopping"}</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
