import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleDollarSign, Layers, Loader, Package, Palette, Search, Shirt, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderProgress } from "@/components/shared/order-timeline";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { ProductCard } from "@/components/store/product-card";
import { OrderListItem } from "@/components/account/order-list-item";
import { Panel } from "@/components/account/section";
import { requireUser } from "@/lib/auth";
import { getProducts } from "@/lib/catalog";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { statusMeta } from "@/lib/order-status";

export const metadata: Metadata = { title: "My account" };
export const dynamic = "force-dynamic";

const ACTIVE = ["PENDING", "ARTWORK_REVIEW", "IN_PRODUCTION", "QUALITY_CHECK", "READY", "SHIPPED"];

export default async function AccountOverviewPage() {
  const user = await requireUser("/account");
  const [orderCount, spend, activeCount, designCount, recent, activeOrder, recommended] = await Promise.all([
    db.order.count({ where: { userId: user.id } }),
    db.order.aggregate({ where: { userId: user.id, paymentStatus: "PAID" }, _sum: { total: true } }),
    db.order.count({ where: { userId: user.id, status: { in: ACTIVE } } }),
    db.savedDesign.count({ where: { userId: user.id } }),
    db.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: { select: { id: true, name: true, image: true, quantity: true } } },
    }),
    db.order.findFirst({
      where: { userId: user.id, status: { in: ACTIVE } },
      orderBy: { createdAt: "desc" },
      include: { items: { select: { id: true, name: true } } },
    }),
    getProducts({ where: { featured: true }, orderBy: { sortOrder: "asc" }, take: 4 }),
  ]);

  const stats = [
    { label: "Total orders", value: String(orderCount), icon: Package, tint: "text-primary bg-primary/10" },
    { label: "Lifetime spend", value: formatMoney(spend._sum.total ?? 0), icon: CircleDollarSign, tint: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400" },
    { label: "In progress", value: String(activeCount), icon: Loader, tint: "text-amber-600 bg-amber-500/10 dark:text-amber-400" },
    { label: "Saved designs", value: String(designCount), icon: Palette, tint: "text-ink-magenta bg-ink-magenta/10" },
  ];

  const quick = [
    { href: "/gang-sheet-builder", title: "Build a gang sheet", body: "Auto-pack designs on a 22\" sheet", icon: Layers },
    { href: "/design-studio", title: "Design apparel", body: "Tees, hoodies & crewnecks", icon: Shirt },
    { href: "/track", title: "Track an order", body: "Live production status", icon: Search },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tint }) => (
          <div key={label} className="rounded-2xl border bg-card p-4 sm:p-5">
            <div className={`mb-3 grid size-9 place-items-center rounded-xl ${tint}`}>
              <Icon className="size-4.5" />
            </div>
            <p className="font-heading text-2xl font-bold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {activeOrder && (
        <section className="relative overflow-hidden rounded-2xl border bg-card p-5 sm:p-6">
          <div className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-primary uppercase">Active order</p>
              <h3 className="mt-1 flex flex-wrap items-center gap-3 text-xl font-bold">
                <span className="font-mono">{activeOrder.number}</span>
                <OrderStatusBadge status={activeOrder.status} />
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Placed {formatDate(activeOrder.createdAt)} · {activeOrder.items.map((i) => i.name).join(", ")}
              </p>
              <p className="mt-2 text-sm">{statusMeta(activeOrder.status).description}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              {activeOrder.trackingNumber && (
                <Button asChild variant="outline" className="h-10 rounded-xl">
                  <Link href={`/account/orders/${activeOrder.number}`}>
                    <Truck data-icon="inline-start" /> Track
                  </Link>
                </Button>
              )}
              <Button asChild className="h-10 rounded-xl">
                <Link href={`/account/orders/${activeOrder.number}`}>
                  View order <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </div>
          <OrderProgress status={activeOrder.status} className="relative mt-6" />
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Panel
          title="Recent orders"
          action={
            <Button asChild variant="ghost" size="sm" className="rounded-lg">
              <Link href="/account/orders">
                View all <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          }
          bodyClassName="p-2"
        >
          {recent.length ? (
            <div className="flex min-w-0 flex-col divide-y">
              {recent.map((o) => (
                <OrderListItem key={o.id} order={o} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="No orders yet"
              description="When you place an order it will show up here with live production tracking."
              action={
                <Button asChild className="rounded-xl">
                  <Link href="/shop">Start shopping</Link>
                </Button>
              }
              className="m-3"
            />
          )}
        </Panel>

        <div className="grid content-start gap-3">
          {quick.map(({ href, title, body, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-premium"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block truncate text-xs text-muted-foreground">{body}</span>
              </span>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>

      {recommended.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h3 className="text-xl font-bold">Recommended for you</h3>
              <p className="text-sm text-muted-foreground">Popular with shops like yours</p>
            </div>
            <Link href="/shop" className="text-sm font-medium text-primary hover:underline">
              Shop all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {recommended.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
