import Link from "next/link";
import { Download, ShoppingBag } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ORDER_STATUSES, ORDER_STATUS_META } from "@/lib/order-status";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { SegmentedLinks, withParams } from "@/components/admin/segmented-links";
import { PaginationBar } from "@/components/admin/table-helpers";
import { EmptyState } from "@/components/shared/empty-state";
import { ORDER_DATE_RANGES, orderOrderBy, orderWhere, orderWhereBase, readOrderParams } from "../../_lib/order-filters";
import { OrdersTable } from "./orders-table";
import { OrdersFilters } from "./orders-filters";

export const metadata = { title: "Orders" };
const PAGE_SIZE = 20;

export default async function OrdersPage(props: PageProps<"/admin/orders">) {
  await requireAdmin();
  const raw = await props.searchParams;
  const params = readOrderParams(raw);
  const page = Math.max(1, Number(params.page) || 1);
  const status = params.status ?? "all";

  const [orders, total, grouped, openCount] = await Promise.all([
    db.order.findMany({
      where: orderWhere(params),
      orderBy: orderOrderBy(params),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        number: true,
        customerName: true,
        email: true,
        status: true,
        paymentStatus: true,
        total: true,
        createdAt: true,
        isRush: true,
        shippingMethod: true,
        items: { select: { image: true, artworkUrl: true, quantity: true }, take: 3 },
        _count: { select: { items: true } },
      },
    }),
    db.order.count({ where: orderWhere(params) }),
    db.order.groupBy({ by: ["status"], where: orderWhereBase(params), _count: { _all: true } }),
    db.order.count({ where: orderWhere({ ...params, status: "open" }) }),
  ]);
  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));
  const all = grouped.reduce((s, g) => s + g._count._all, 0);
  const current = { ...params } as Record<string, string | undefined>;
  const tabStatuses = ["ARTWORK_REVIEW", "IN_PRODUCTION", "QUALITY_CHECK", "READY", "SHIPPED", "DELIVERED", "PENDING", "CANCELLED", "REFUNDED"];

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Orders"
        description="Track, fulfil and manage every order."
        actions={
          <Button asChild variant="outline">
            <a href={withParams("/api/admin/orders/export", current, { page: undefined })}>
              <Download /> Export CSV
            </a>
          </Button>
        }
      />
      <SegmentedLinks
        className="mb-4"
        active={status}
        items={[
          { key: "all", label: "All", count: all, href: withParams("/admin/orders", current, { status: undefined, page: undefined }) },
          { key: "open", label: "Open", count: openCount, href: withParams("/admin/orders", current, { status: "open", page: undefined }) },
          ...tabStatuses
            .filter((s) => (ORDER_STATUSES as readonly string[]).includes(s))
            .map((s) => ({
              key: s,
              label: ORDER_STATUS_META[s as keyof typeof ORDER_STATUS_META].label,
              count: counts[s] ?? 0,
              href: withParams("/admin/orders", current, { status: s, page: undefined }),
            })),
        ]}
      />
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <OrdersFilters params={current} ranges={ORDER_DATE_RANGES.map((r) => ({ key: r.key, label: r.label }))} />
        {orders.length ? (
          <>
            <OrdersTable
              params={current}
              orders={orders.map((o) => ({
                id: o.id,
                number: o.number,
                customerName: o.customerName,
                email: o.email,
                status: o.status,
                paymentStatus: o.paymentStatus,
                total: o.total,
                createdAt: o.createdAt.toISOString(),
                isRush: o.isRush,
                shippingMethod: o.shippingMethod,
                itemCount: o._count.items,
                thumbs: o.items.map((i) => i.artworkUrl || i.image).filter(Boolean) as string[],
              }))}
            />
            <PaginationBar page={page} pageSize={PAGE_SIZE} total={total} base="/admin/orders" params={current} />
          </>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={ShoppingBag}
              title="No orders match"
              description="Try a different status, search term or date range."
              action={
                <Button asChild variant="outline">
                  <Link href="/admin/orders">Clear filters</Link>
                </Button>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
