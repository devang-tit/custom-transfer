import Link from "next/link";
import { CircleDollarSign, Receipt, Repeat, Zap, ShoppingBag } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { formatMoney, formatMoneyCompact, formatNumber } from "@/lib/format";
import { statusMeta } from "@/lib/order-status";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { BarList } from "@/components/admin/bar-list";
import { AovTrendChart, DonutChart, MonthlyRevenueChart } from "@/components/admin/charts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAnalyticsData } from "../../_lib/metrics";
import { cn } from "@/lib/utils";

export const metadata = { title: "Analytics" };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TYPE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "oklch(0.7 0.01 275)"];

export default async function AnalyticsPage() {
  await requireAdmin();
  const [data, settings] = await Promise.all([getAnalyticsData(), getSettings()]);
  const heatMax = Math.max(1, ...data.heat.flat());
  const funnelMax = Math.max(1, data.funnel[0]?.count ?? 1);
  const bestMonth = [...data.months].sort((a, b) => b.revenue - a.revenue)[0];
  const typeTotal = data.typeMix.reduce((s, t) => s + t.revenue, 0);
  // Order hours as 6am → 5am so the business day reads left to right.
  const hours = Array.from({ length: 24 }, (_, i) => (i + 6) % 24);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Analytics" description="Trailing 12 months of sales, customers and operations." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue (12 mo)" icon={CircleDollarSign} value={formatMoneyCompact(data.totals.revenue)} hint={bestMonth ? `Best: ${bestMonth.label} ${formatMoneyCompact(bestMonth.revenue)}` : undefined} series={data.months.map((m) => m.revenue)} />
        <StatCard label="Paid orders" icon={ShoppingBag} value={formatNumber(data.totals.paidCount)} hint={`${formatNumber(data.totals.orders)} placed · ${data.totals.cancelled} cancelled`} series={data.months.map((m) => m.orders)} color="var(--chart-2)" />
        <StatCard label="Avg. order value" icon={Receipt} value={formatMoney(data.totals.aov)} series={data.months.map((m) => m.aov)} color="var(--chart-3)" />
        <StatCard label="Repeat customers" icon={Repeat} value={`${data.totals.repeatRate.toFixed(0)}%`} hint={`of ${formatNumber(data.topCustomers.length ? data.totals.customers : 0)} accounts`} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Revenue by month" description="Paid orders, trailing 12 months">
          <MonthlyRevenueChart data={data.months} />
        </Panel>
        <Panel title="Product mix" description={`${formatMoneyCompact(typeTotal)} by product type`}>
          <DonutChart
            centerLabel="revenue"
            centerValue={formatMoneyCompact(typeTotal)}
            valueFormat="money"
            className="sm:flex-col"
            data={data.typeMix.map((t, i) => ({ name: t.label, value: t.revenue, color: TYPE_COLORS[i % TYPE_COLORS.length]! }))}
          />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="When customers order" description="Orders by weekday and hour (local time)">
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[36px_repeat(24,minmax(0,1fr))] gap-[3px]">
                <span />
                {hours.map((h) => (
                  <span key={h} className="text-center text-[10px] text-muted-foreground tabular-nums">
                    {h % 3 === 0 ? (h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`) : ""}
                  </span>
                ))}
                {DAYS.map((d, di) => (
                  <div key={d} className="contents">
                    <span className="self-center text-[11px] text-muted-foreground">{d}</span>
                    {hours.map((h) => {
                      const v = data.heat[di]![h]!;
                      const t = v / heatMax;
                      return (
                        <span
                          key={h}
                          title={`${d} ${h}:00 — ${v} order${v === 1 ? "" : "s"}`}
                          className="aspect-square rounded-[3px]"
                          style={{ background: v ? `color-mix(in oklch, var(--chart-1) ${Math.round(12 + t * 88)}%, transparent)` : "var(--muted)" }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
                Fewer
                {[0.12, 0.35, 0.6, 0.85, 1].map((t) => (
                  <span key={t} className="size-3 rounded-[3px]" style={{ background: `color-mix(in oklch, var(--chart-1) ${Math.round(t * 100)}%, transparent)` }} />
                ))}
                More
              </div>
            </div>
          </div>
        </Panel>
        <Panel title="Order funnel" description="How far orders progress through production">
          <ol className="space-y-2.5">
            {data.funnel.map((f, i) => {
              const pct = (f.count / funnelMax) * 100;
              const prev = data.funnel[i - 1]?.count;
              return (
                <li key={f.stage}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{f.stage === "PENDING" ? "Placed" : statusMeta(f.stage).label}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatNumber(f.count)}
                      {prev ? <span className="ml-1.5">({Math.round((f.count / prev) * 100)}%)</span> : null}
                    </span>
                  </div>
                  <span className="block h-2 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-ink-gradient" style={{ width: `${pct}%` }} />
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{data.totals.cancelled}</span> cancelled or refunded ·{" "}
            <span className="font-medium text-foreground">{data.totals.rushShare.toFixed(0)}%</span> of orders chose rush <Zap className="inline size-3 fill-amber-400 text-amber-500" />
          </p>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Average order value" description="By month">
          <AovTrendChart data={data.months} />
        </Panel>
        <Panel title="Top customers" description="By paid revenue" bodyClassName="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Customer</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="pr-5 text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topCustomers.map((c, i) => (
                <TableRow key={c.email}>
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-2">
                      <span className={cn("grid size-5 place-items-center rounded text-[10px] font-bold", i < 3 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>{i + 1}</span>
                      {c.userId ? (
                        <Link href={`/admin/customers/${c.userId}`} className="truncate font-medium hover:text-primary">{c.name}</Link>
                      ) : (
                        <span className="truncate font-medium">{c.name} <span className="text-xs font-normal text-muted-foreground">guest</span></span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.orders}</TableCell>
                  <TableCell className="pr-5 text-right font-semibold tabular-nums">{formatMoney(c.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
        <div className="space-y-4">
          <Panel title="Coupon performance" description="Orders using each code (12 mo)">
            <BarList
              format={(v) => `${formatNumber(v)} orders`}
              items={data.coupons.map((c) => ({
                key: c.code,
                value: c.ordersInPeriod,
                label: <span className={cn("font-mono text-xs", !c.active && "text-muted-foreground line-through")}>{c.code}</span>,
                extra: c.discountGiven ? <span className="text-xs text-muted-foreground">−{formatMoneyCompact(c.discountGiven)}</span> : undefined,
              }))}
            />
          </Panel>
          <Panel title="Shipping methods" description="Share of orders">
            <BarList
              color="bg-chart-2/20"
              format={(v) => formatNumber(v)}
              items={data.shipMix.map((m) => ({
                key: m.id,
                value: m.count,
                label: settings.shippingMethods.find((x) => x.id === m.id)?.label ?? m.id,
              }))}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
