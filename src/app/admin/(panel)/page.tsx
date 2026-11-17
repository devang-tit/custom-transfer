import Link from "next/link";
import Image from "next/image";
import {
  CircleDollarSign,
  ShoppingBag,
  Receipt,
  UserRound,
  Palette,
  Zap,
  Package,
  Mail,
  Star,
  ArrowRight,
  Clock,
  CircleCheck,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { formatMoney, formatMoneyCompact, formatNumber, formatDate } from "@/lib/format";
import { ORDER_STATUS_META, type OrderStatus } from "@/lib/order-status";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/status-badge";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { SegmentedLinks } from "@/components/admin/segmented-links";
import { BarList } from "@/components/admin/bar-list";
import { RevenueOrdersChart, DonutChart } from "@/components/admin/charts";
import { relativeAge } from "@/components/admin/table-helpers";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDashboardData } from "../_lib/metrics";
import { parseRange, RANGES } from "../_lib/ranges";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

const STATUS_COLORS: Record<string, string> = {
  PENDING: "oklch(0.7 0.01 275)",
  ARTWORK_REVIEW: "oklch(0.78 0.16 75)",
  IN_PRODUCTION: "var(--chart-1)",
  QUALITY_CHECK: "oklch(0.7 0.13 235)",
  READY: "var(--chart-2)",
  SHIPPED: "oklch(0.58 0.18 265)",
  DELIVERED: "var(--chart-5)",
  CANCELLED: "var(--chart-3)",
  REFUNDED: "oklch(0.75 0.12 10)",
};
const TYPE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "oklch(0.7 0.01 275)"];

export default async function AdminDashboard(props: PageProps<"/admin">) {
  const user = await requireAdmin();
  const searchParams = await props.searchParams;
  const range = parseRange(searchParams.range);
  const data = await getDashboardData(range);
  const rangeLabel = RANGES.find((r) => r.key === range)!.label.toLowerCase();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const totalStatus = Object.values(data.statusCounts).reduce((a, b) => a + b, 0);
  const typeTotal = data.typeMix.reduce((s, t) => s + t.revenue, 0);

  const attention = [
    { label: "Artwork awaiting review", value: data.attention.artwork, href: "/admin/orders?status=ARTWORK_REVIEW", icon: Palette, tone: "text-amber-600 bg-amber-500/10 dark:text-amber-400" },
    { label: "Rush orders in progress", value: data.attention.rush, href: "/admin/orders?rush=1&status=open", icon: Zap, tone: "text-rose-600 bg-rose-500/10 dark:text-rose-400" },
    { label: "Awaiting payment", value: data.attention.awaitingPayment, href: "/admin/orders?status=PENDING", icon: Clock, tone: "text-zinc-600 bg-zinc-500/10 dark:text-zinc-300" },
    { label: "Unread messages", value: data.attention.unread, href: "/admin/inbox", icon: Mail, tone: "text-sky-600 bg-sky-500/10 dark:text-sky-400" },
    { label: "Reviews to moderate", value: data.attention.pendingReviews, href: "/admin/reviews", icon: Star, tone: "text-violet-600 bg-violet-500/10 dark:text-violet-400" },
  ];

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title={`${greeting}, ${user.name.split(" ")[0]}`}
        description={`Here's how ${rangeLabel === "12 months" ? "the last 12 months" : `the last ${rangeLabel}`} are looking.`}
        actions={
          <SegmentedLinks
            active={range}
            items={RANGES.map((r) => ({ key: r.key, label: r.key.toUpperCase(), href: `/admin?range=${r.key}` }))}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" icon={CircleDollarSign} value={formatMoney(data.kpis.revenue.value)} delta={data.kpis.revenue.delta} series={data.kpis.revenue.series} hint="vs prev." />
        <StatCard label="Orders" icon={ShoppingBag} value={formatNumber(data.kpis.orders.value)} delta={data.kpis.orders.delta} series={data.kpis.orders.series} hint="vs prev." color="var(--chart-2)" />
        <StatCard label="Avg. order value" icon={Receipt} value={formatMoney(data.kpis.aov.value)} delta={data.kpis.aov.delta} series={data.kpis.aov.series} hint="vs prev." color="var(--chart-3)" />
        <StatCard label="New customers" icon={UserRound} value={formatNumber(data.kpis.customers.value)} delta={data.kpis.customers.delta} hint="vs prev." />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Revenue & orders"
          description={`Paid revenue and order volume · ${range === "12m" ? "by month" : "by day"}`}
          action={
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-1" />Revenue</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-2" />Orders</span>
            </div>
          }
        >
          <RevenueOrdersChart data={data.series} />
        </Panel>
        <Panel title="Orders by status" description={`${totalStatus} orders placed`}>
          <DonutChart
            centerLabel="orders"
            centerValue={formatNumber(totalStatus)}
            data={Object.entries(data.statusCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([s, v]) => ({ name: ORDER_STATUS_META[s as OrderStatus]?.label ?? s, value: v, color: STATUS_COLORS[s] ?? "var(--chart-4)" }))}
          />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="Needs attention" description="Work waiting on your team" bodyClassName="p-2">
          <ul>
            {attention.map((a) => (
              <li key={a.label}>
                <Link href={a.href} className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted">
                  <span className={cn("grid size-8 place-items-center rounded-lg", a.tone)}>
                    <a.icon className="size-4" />
                  </span>
                  <span className="flex-1 text-sm">{a.label}</span>
                  <span className={cn("font-heading text-lg font-semibold tabular-nums", !a.value && "text-muted-foreground/50")}>{a.value}</span>
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mx-3 mt-1 mb-2 rounded-lg border border-dashed p-3">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <Package className="size-3.5" /> Low stock
            </p>
            {data.attention.lowStock.length ? (
              <ul className="space-y-1.5">
                {data.attention.lowStock.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <Link href={`/admin/products/${p.id}`} className="truncate hover:underline">{p.name}</Link>
                    <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums", (p.stock ?? 0) <= 5 ? "bg-rose-500/10 text-rose-700 dark:text-rose-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400")}>
                      {p.stock} left
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><CircleCheck className="size-4 text-emerald-500" /> All stocked up</p>
            )}
          </div>
        </Panel>

        <Panel title="Top products" description="By paid revenue" action={<Link href="/admin/products" className="text-xs font-medium text-primary hover:underline">All products</Link>}>
          {data.topProducts.length ? (
            <BarList
              format={formatMoney}
              items={data.topProducts.map((p) => ({
                key: p.id ?? p.name,
                value: p.revenue,
                label: (
                  <>
                    {p.image && <Image src={p.image} alt="" width={24} height={24} className="size-6 shrink-0 rounded-md object-cover" unoptimized />}
                    <span className="truncate">{p.name}</span>
                  </>
                ),
                extra: <span className="hidden text-xs text-muted-foreground sm:inline">{formatNumber(p.units)} u</span>,
              }))}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No sales in this period.</p>
          )}
        </Panel>

        <Panel title="Sales by product type" description={`${formatMoneyCompact(typeTotal)} across ${data.typeMix.length} lines`} className="lg:col-span-2 xl:col-span-1">
          <DonutChart
            centerLabel="revenue"
            centerValue={formatMoneyCompact(typeTotal)}
            valueFormat="money"
            data={data.typeMix.map((t, i) => ({ name: t.label, value: t.revenue, color: TYPE_COLORS[i % TYPE_COLORS.length]! }))}
          />
        </Panel>
      </div>

      <Panel
        className="mt-4"
        title="Recent orders"
        bodyClassName="p-0"
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/orders">
              View all <ArrowRight />
            </Link>
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="pr-5 text-right">Placed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentOrders.map((o) => (
                <TableRow key={o.id} className="group">
                  <TableCell className="pl-5 font-medium">
                    <Link href={`/admin/orders/${o.id}`} className="inline-flex items-center gap-1.5 hover:text-primary">
                      {o.number}
                      {o.isRush && <Zap className="size-3.5 fill-amber-400 text-amber-500" aria-label="Rush" />}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="leading-tight">
                      <p className="font-medium">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{o.email}</p>
                    </div>
                  </TableCell>
                  <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                  <TableCell><PaymentStatusBadge status={o.paymentStatus} /></TableCell>
                  <TableCell className="text-right tabular-nums">{o._count.items}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatMoney(o.total)}</TableCell>
                  <TableCell className="pr-5 text-right text-muted-foreground" title={formatDate(o.createdAt)}>{relativeAge(o.createdAt)} ago</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </div>
  );
}
