import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Calendar, Mail, MapPin, Phone, Palette, Heart, Star, Megaphone } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatMoney, formatNumber, initials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ShoppingBag } from "lucide-react";
import { RoleSelect } from "./role-select";

export async function generateMetadata(props: PageProps<"/admin/customers/[id]">) {
  const { id } = await props.params;
  const u = await db.user.findUnique({ where: { id }, select: { name: true } });
  return { title: u?.name ?? "Customer" };
}

export default async function CustomerDetailPage(props: PageProps<"/admin/customers/[id]">) {
  const me = await requireAdmin();
  const { id } = await props.params;
  const user = await db.user.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: { isDefault: "desc" } },
      orders: { orderBy: { createdAt: "desc" }, include: { _count: { select: { items: true } } } },
      _count: { select: { designs: true, wishlist: true, reviews: true } },
    },
  });
  if (!user) notFound();
  const paid = user.orders.filter((o) => o.paymentStatus === "PAID");
  const ltv = paid.reduce((s, o) => s + o.total, 0);
  const aov = paid.length ? Math.round(ltv / paid.length) : 0;
  const lastOrder = user.orders[0]?.createdAt;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader back={{ href: "/admin/customers", label: "Customers" }} title={user.name} description={user.email} />
      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Panel>
            <div className="flex flex-col items-center text-center">
              <Avatar size="lg" className="size-16">
                <AvatarFallback className="bg-ink-gradient text-lg font-semibold text-white">{initials(user.name)}</AvatarFallback>
              </Avatar>
              <p className="mt-3 font-heading text-lg font-semibold">{user.name}</p>
              {user.company && <p className="text-sm text-muted-foreground">{user.company}</p>}
            </div>
            <ul className="mt-5 space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5"><Mail className="size-4 text-muted-foreground" /><a href={`mailto:${user.email}`} className="hover:text-primary">{user.email}</a></li>
              {user.phone && <li className="flex items-center gap-2.5"><Phone className="size-4 text-muted-foreground" />{user.phone}</li>}
              {user.company && <li className="flex items-center gap-2.5"><Building2 className="size-4 text-muted-foreground" />{user.company}</li>}
              <li className="flex items-center gap-2.5"><Calendar className="size-4 text-muted-foreground" />Joined {formatDate(user.createdAt)}</li>
              <li className="flex items-center gap-2.5"><Megaphone className="size-4 text-muted-foreground" />{user.marketingOptIn ? "Subscribed to marketing" : "Not subscribed to marketing"}</li>
            </ul>
            <div className="mt-5 border-t pt-4">
              <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Role</p>
              <RoleSelect userId={user.id} role={user.role} canEdit={me.role === "ADMIN"} isSelf={me.id === user.id} />
            </div>
          </Panel>
          <Panel title="Addresses">
            {user.addresses.length ? (
              <ul className="space-y-3">
                {user.addresses.map((a) => (
                  <li key={a.id} className="flex gap-2.5 text-sm">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {a.label} {a.isDefault && <span className="ml-1 rounded bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary uppercase">Default</span>}
                      </p>
                      <p className="text-muted-foreground">
                        {a.line1}
                        {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} – {a.zip}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No saved addresses.</p>
            )}
          </Panel>
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="Lifetime value" value={formatMoney(ltv)} />
            <Metric label="Paid orders" value={formatNumber(paid.length)} />
            <Metric label="Avg. order" value={formatMoney(aov)} />
            <Metric label="Last order" value={lastOrder ? formatDate(lastOrder) : "—"} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MiniStat icon={Palette} label="Saved designs" value={user._count.designs} />
            <MiniStat icon={Heart} label="Wishlist" value={user._count.wishlist} />
            <MiniStat icon={Star} label="Reviews" value={user._count.reviews} />
          </div>
          <Panel title="Orders" description={`${user.orders.length} total`} bodyClassName="p-0">
            {user.orders.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-5">Order</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="pr-5 text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="pl-5 font-medium"><Link href={`/admin/orders/${o.id}`} className="hover:text-primary">{o.number}</Link></TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                        <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                        <TableCell><PaymentStatusBadge status={o.paymentStatus} /></TableCell>
                        <TableCell className="text-right tabular-nums">{o._count.items}</TableCell>
                        <TableCell className="pr-5 text-right font-semibold tabular-nums">{formatMoney(o.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-5"><EmptyState icon={ShoppingBag} title="No orders yet" /></div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div data-admin-card className="rounded-xl bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div data-admin-card className="flex items-center gap-3 rounded-xl bg-card p-3">
      <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground"><Icon className="size-4" /></span>
      <div>
        <p className="font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
