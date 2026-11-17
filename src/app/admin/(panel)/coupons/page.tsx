import { TicketPercent } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CouponDialog, CouponRowActions, type CouponForm } from "./coupon-client";
import { cn } from "@/lib/utils";

export const metadata = { title: "Coupons" };

function couponState(c: { active: boolean; startsAt: Date | null; expiresAt: Date | null; maxUses: number | null; usedCount: number }) {
  const now = new Date();
  if (!c.active) return { key: "paused", label: "Paused", cls: "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-400" };
  if (c.expiresAt && c.expiresAt < now) return { key: "expired", label: "Expired", cls: "bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:text-rose-400" };
  if (c.startsAt && c.startsAt > now) return { key: "scheduled", label: "Scheduled", cls: "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-400" };
  if (c.maxUses && c.usedCount >= c.maxUses) return { key: "used", label: "Used up", cls: "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-400" };
  return { key: "active", label: "Active", cls: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-400" };
}

const toLocalInput = (d: Date | null) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export default async function CouponsPage() {
  await requireAdmin();
  const [coupons, usage] = await Promise.all([
    db.coupon.findMany({ orderBy: [{ active: "desc" }, { createdAt: "desc" }] }),
    db.order.groupBy({ by: ["couponCode"], where: { couponCode: { not: null }, paymentStatus: "PAID" }, _sum: { discount: true, total: true }, _count: { _all: true } }),
  ]);
  const useMap = new Map(usage.map((u) => [u.couponCode, u]));

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Coupons" description="Discount codes customers can apply at checkout." actions={<CouponDialog />} />
      <div data-admin-card className="overflow-hidden rounded-xl bg-card">
        {coupons.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-4">Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="text-right">Orders · revenue</TableHead>
                  <TableHead>Valid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12 pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => {
                  const st = couponState(c);
                  const u = useMap.get(c.code);
                  const pct = c.maxUses ? Math.min(100, (c.usedCount / c.maxUses) * 100) : null;
                  const form: CouponForm = {
                    id: c.id,
                    code: c.code,
                    description: c.description ?? "",
                    type: c.type as CouponForm["type"],
                    value: c.type === "FIXED" ? (c.value / 100).toFixed(2) : String(c.value),
                    minSubtotal: (c.minSubtotal / 100).toFixed(2),
                    maxUses: c.maxUses ? String(c.maxUses) : "",
                    startsAt: toLocalInput(c.startsAt),
                    expiresAt: toLocalInput(c.expiresAt),
                    active: c.active,
                  };
                  return (
                    <TableRow key={c.id} className={cn(st.key !== "active" && "text-muted-foreground")}>
                      <TableCell className="pl-4">
                        <p className="font-mono text-sm font-semibold tracking-wide text-foreground">{c.code}</p>
                        {c.description && <p className="max-w-64 truncate text-xs text-muted-foreground">{c.description}</p>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="font-medium text-foreground">
                          {c.type === "PERCENT" ? `${c.value}% off` : c.type === "FIXED" ? `${formatMoney(c.value)} off` : "Free shipping"}
                        </span>
                        {c.minSubtotal > 0 && <p className="text-xs text-muted-foreground">Min. {formatMoney(c.minSubtotal)}</p>}
                      </TableCell>
                      <TableCell className="min-w-40">
                        <p className="text-sm tabular-nums">
                          <span className="font-medium text-foreground">{formatNumber(c.usedCount)}</span>
                          {c.maxUses ? <span className="text-muted-foreground"> / {formatNumber(c.maxUses)}</span> : <span className="text-muted-foreground"> uses</span>}
                        </p>
                        {pct !== null && (
                          <span className="mt-1 block h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                            <span className={cn("block h-full rounded-full", pct >= 90 ? "bg-rose-500" : "bg-primary")} style={{ width: `${pct}%` }} />
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className="text-foreground">{u?._count._all ?? 0}</span>
                        <span className="block text-xs text-muted-foreground">{formatMoney(u?._sum.total ?? 0)}</span>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {c.startsAt || c.expiresAt ? (
                          <>
                            {c.startsAt ? formatDate(c.startsAt) : "Now"} → {c.expiresAt ? formatDate(c.expiresAt) : "No end"}
                          </>
                        ) : (
                          "Always"
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", st.cls)}>{st.label}</span>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <CouponRowActions coupon={form} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState icon={TicketPercent} title="No coupons yet" description="Create a code to run a promotion." action={<CouponDialog />} />
          </div>
        )}
      </div>
    </div>
  );
}
