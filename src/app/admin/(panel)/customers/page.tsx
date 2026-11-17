import Link from "next/link";
import { Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatMoney, formatNumber, initials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/admin/page-header";
import { SegmentedLinks, withParams } from "@/components/admin/segmented-links";
import { PaginationBar, SortHeader } from "@/components/admin/table-helpers";
import { StatCard } from "@/components/admin/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { sp } from "../../_lib/ranges";
import { SearchBox } from "./search-box";
import { UserRound, Repeat, CircleDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Customers" };
const PAGE_SIZE = 25;

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-primary/10 text-primary ring-primary/20",
  STAFF: "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-400",
  CUSTOMER: "bg-muted text-muted-foreground ring-border",
};

export default async function CustomersPage(props: PageProps<"/admin/customers">) {
  await requireAdmin();
  const raw = await props.searchParams;
  const params = { q: sp(raw.q), role: sp(raw.role), sort: sp(raw.sort), dir: sp(raw.dir), page: sp(raw.page) };
  const page = Math.max(1, Number(params.page) || 1);
  const role = params.role ?? "CUSTOMER";

  const [users, stats, roleCounts] = await Promise.all([
    db.user.findMany({
      where: {
        ...(role !== "all" ? { role } : {}),
        ...(params.q ? { OR: [{ name: { contains: params.q } }, { email: { contains: params.q } }, { company: { contains: params.q } }] } : {}),
      },
      select: { id: true, name: true, email: true, company: true, role: true, createdAt: true, marketingOptIn: true },
    }),
    db.order.groupBy({
      by: ["userId"],
      where: { userId: { not: null }, paymentStatus: "PAID" },
      _sum: { total: true },
      _count: { _all: true },
      _max: { createdAt: true },
    }),
    db.user.groupBy({ by: ["role"], _count: { _all: true } }),
  ]);
  const statMap = new Map(stats.map((s) => [s.userId, s]));
  const rows = users.map((u) => {
    const s = statMap.get(u.id);
    return { ...u, orders: s?._count._all ?? 0, ltv: s?._sum.total ?? 0, lastOrder: s?._max.createdAt ?? null };
  });
  const dir = params.dir === "asc" ? 1 : -1;
  const sortKey = params.sort ?? "ltv";
  rows.sort((a, b) => {
    const av = sortKey === "name" ? a.name.toLowerCase() : sortKey === "orders" ? a.orders : sortKey === "createdAt" ? +a.createdAt : sortKey === "lastOrder" ? +(a.lastOrder ?? 0) : a.ltv;
    const bv = sortKey === "name" ? b.name.toLowerCase() : sortKey === "orders" ? b.orders : sortKey === "createdAt" ? +b.createdAt : sortKey === "lastOrder" ? +(b.lastOrder ?? 0) : b.ltv;
    return av < bv ? -dir : av > bv ? dir : 0;
  });
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rc = Object.fromEntries(roleCounts.map((r) => [r.role, r._count._all]));
  const customerStats = stats.length;
  const repeat = stats.filter((s) => s._count._all > 1).length;
  const totalLtv = stats.reduce((s, x) => s + (x._sum.total ?? 0), 0);
  const current = { ...params, sort: params.sort ?? "ltv" } as Record<string, string | undefined>;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Customers" description="Everyone who has an account with your store." />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Customers" icon={UserRound} value={formatNumber(rc.CUSTOMER ?? 0)} hint={`${customerStats} have purchased`} />
        <StatCard label="Repeat purchase rate" icon={Repeat} value={`${customerStats ? Math.round((repeat / customerStats) * 100) : 0}%`} hint={`${repeat} repeat buyers`} />
        <StatCard label="Avg. lifetime value" icon={CircleDollarSign} value={formatMoney(customerStats ? Math.round(totalLtv / customerStats) : 0)} hint="per buying customer" />
      </div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedLinks
          active={role}
          items={[
            { key: "CUSTOMER", label: "Customers", count: rc.CUSTOMER ?? 0, href: withParams("/admin/customers", current, { role: undefined, page: undefined }) },
            { key: "STAFF", label: "Staff", count: rc.STAFF ?? 0, href: withParams("/admin/customers", current, { role: "STAFF", page: undefined }) },
            { key: "ADMIN", label: "Admins", count: rc.ADMIN ?? 0, href: withParams("/admin/customers", current, { role: "ADMIN", page: undefined }) },
            { key: "all", label: "Everyone", href: withParams("/admin/customers", current, { role: "all", page: undefined }) },
          ]}
        />
        <SearchBox placeholder="Search name, email, company…" />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        {pageRows.length ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="pl-4"><SortHeader label="Customer" field="name" base="/admin/customers" params={current} /></TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right"><SortHeader label="Orders" field="orders" base="/admin/customers" params={current} className="justify-end" /></TableHead>
                    <TableHead className="text-right"><SortHeader label="Lifetime value" field="ltv" base="/admin/customers" params={current} className="justify-end" /></TableHead>
                    <TableHead><SortHeader label="Last order" field="lastOrder" base="/admin/customers" params={current} /></TableHead>
                    <TableHead><SortHeader label="Joined" field="createdAt" base="/admin/customers" params={current} /></TableHead>
                    <TableHead className="pr-4">Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="pl-4">
                        <Link href={`/admin/customers/${u.id}`} className="group flex items-center gap-3">
                          <Avatar size="sm">
                            <AvatarFallback className="bg-accent text-[11px] font-semibold text-accent-foreground">{initials(u.name)}</AvatarFallback>
                          </Avatar>
                          <span className="min-w-0">
                            <span className="block font-medium group-hover:text-primary">{u.name}</span>
                            <span className="block text-xs text-muted-foreground">{u.email}</span>
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.company ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{u.orders}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatMoney(u.ltv)}</TableCell>
                      <TableCell className="text-muted-foreground">{u.lastOrder ? formatDate(u.lastOrder) : "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                      <TableCell className="pr-4">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset", ROLE_BADGE[u.role] ?? ROLE_BADGE.CUSTOMER)}>
                          {u.role.toLowerCase()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationBar page={page} pageSize={PAGE_SIZE} total={rows.length} base="/admin/customers" params={current} />
          </>
        ) : (
          <div className="p-6">
            <EmptyState icon={Users} title="No customers found" description="Try a different search." />
          </div>
        )}
      </div>
    </div>
  );
}
