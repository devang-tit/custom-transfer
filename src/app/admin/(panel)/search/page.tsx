import Link from "next/link";
import { Package, Search, ShoppingBag, Users, TicketPercent } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatMoney, initials } from "@/lib/format";
import { PRODUCT_TYPE_LABELS, type ProductType } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { sp } from "../../_lib/ranges";

export const metadata = { title: "Search" };

export default async function AdminSearchPage(props: PageProps<"/admin/search">) {
  await requireAdmin();
  const raw = await props.searchParams;
  const q = (sp(raw.q) ?? "").trim();
  if (!q) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Search" />
        <EmptyState icon={Search} title="Search everything" description="Find orders by number, email or tracking; customers by name or company; products by name or SKU." />
      </div>
    );
  }
  const [orders, customers, products, coupons] = await Promise.all([
    db.order.findMany({
      where: { OR: [{ number: { contains: q } }, { email: { contains: q } }, { customerName: { contains: q } }, { trackingNumber: { contains: q } }] },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, number: true, customerName: true, email: true, status: true, total: true, createdAt: true },
    }),
    db.user.findMany({
      where: { OR: [{ name: { contains: q } }, { email: { contains: q } }, { company: { contains: q } }, { phone: { contains: q } }] },
      take: 8,
      select: { id: true, name: true, email: true, company: true, role: true },
    }),
    db.product.findMany({
      where: { OR: [{ name: { contains: q } }, { sku: { contains: q } }, { slug: { contains: q } }] },
      take: 8,
      select: { id: true, name: true, sku: true, type: true, images: true, active: true },
    }),
    db.coupon.findMany({ where: { code: { contains: q.toUpperCase() } }, take: 5, select: { id: true, code: true, description: true } }),
  ]);
  const total = orders.length + customers.length + products.length + coupons.length;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={`Results for “${q}”`} description={`${total} match${total === 1 ? "" : "es"}`} />
      {total === 0 ? (
        <EmptyState icon={Search} title="No matches" description="Try an order number like IF-10012, an email address, or a product SKU." />
      ) : (
        <div className="space-y-4">
          {orders.length > 0 && (
            <Panel title={<Head icon={ShoppingBag}>Orders</Head>} bodyClassName="p-0">
              <ul className="divide-y">
                {orders.map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/50">
                      <span className="w-20 font-medium">{o.number}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{o.customerName}</span>
                        <span className="block truncate text-xs text-muted-foreground">{o.email}</span>
                      </span>
                      <OrderStatusBadge status={o.status} />
                      <span className="hidden w-24 text-right text-xs text-muted-foreground sm:block">{formatDate(o.createdAt)}</span>
                      <span className="w-20 text-right font-semibold tabular-nums">{formatMoney(o.total)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {customers.length > 0 && (
              <Panel title={<Head icon={Users}>People</Head>} bodyClassName="p-0">
                <ul className="divide-y">
                  {customers.map((u) => (
                    <li key={u.id}>
                      <Link href={`/admin/customers/${u.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50">
                        <Avatar size="sm">
                          <AvatarFallback className="bg-accent text-[11px] font-semibold text-accent-foreground">{initials(u.name)}</AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{u.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{u.email}{u.company ? ` · ${u.company}` : ""}</span>
                        </span>
                        {u.role !== "CUSTOMER" && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase">{u.role}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
            {products.length > 0 && (
              <Panel title={<Head icon={Package}>Products</Head>} bodyClassName="p-0">
                <ul className="divide-y">
                  {products.map((p) => {
                    const img = (JSON.parse(p.images) as string[])[0];
                    return (
                      <li key={p.id}>
                        <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {img ? <img src={img} alt="" className="size-9 rounded-lg border object-cover" /> : <span className="size-9 rounded-lg bg-muted" />}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{p.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">{PRODUCT_TYPE_LABELS[p.type as ProductType]} · {p.sku ?? "no SKU"}</span>
                          </span>
                          {!p.active && <span className="text-xs text-muted-foreground">Hidden</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            )}
            {coupons.length > 0 && (
              <Panel title={<Head icon={TicketPercent}>Coupons</Head>} bodyClassName="p-0">
                <ul className="divide-y">
                  {coupons.map((c) => (
                    <li key={c.id}>
                      <Link href="/admin/coupons" className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50">
                        <span className="font-mono text-sm font-semibold">{c.code}</span>
                        <span className="truncate text-xs text-muted-foreground">{c.description}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Head({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground" /> {children}
    </span>
  );
}
