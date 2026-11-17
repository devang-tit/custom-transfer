import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ExternalLink, Mail, MapPin, Phone, StickyNote, Zap, Truck, CreditCard, UserRound, Layers } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { parseJson } from "@/lib/json";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import type { AddressInput, LineSelection } from "@/lib/types";
import { PRODUCT_TYPE_LABELS, type ProductType } from "@/lib/types";
import { ArtworkStatusBadge, OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/status-badge";
import { OrderProgress, OrderTimeline } from "@/components/shared/order-timeline";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { EMAIL_TEMPLATE_LABELS } from "@/lib/email/templates";
import { EmailPreviewButton, EmailStatusPill, ResendEmailButtons } from "@/components/admin/email-ui";
import { ArtworkActions, InternalNotesForm, NoteComposer, OrderActionsMenu, ShippingForm, StatusUpdater } from "./order-controls";

export async function generateMetadata(props: PageProps<"/admin/orders/[id]">) {
  const { id } = await props.params;
  const o = await db.order.findUnique({ where: { id }, select: { number: true } });
  return { title: o ? `Order ${o.number}` : "Order" };
}

export default async function OrderDetailPage(props: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { id: true, slug: true, options: true } } } },
      events: { orderBy: { createdAt: "desc" } },
      emails: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, to: true, subject: true, template: true, status: true, error: true, createdAt: true } },
      user: { select: { id: true, name: true, email: true, company: true, createdAt: true } },
    },
  });
  if (!order) notFound();

  const settings = await getSettings();
  const [customerStats] = await Promise.all([
    db.order.aggregate({
      where: order.userId ? { userId: order.userId, paymentStatus: "PAID" } : { email: order.email, paymentStatus: "PAID" },
      _sum: { total: true },
      _count: { _all: true },
    }),
  ]);
  const address = parseJson<Partial<AddressInput>>(order.shippingAddress, {});
  const method = settings.shippingMethods.find((m) => m.id === order.shippingMethod);
  const pendingArtwork = order.items.filter((i) => i.artworkUrl && i.artworkStatus !== "APPROVED").length;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        back={{ href: "/admin/orders", label: "Orders" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {order.number}
            {order.isRush && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold tracking-wide text-amber-700 uppercase dark:text-amber-400">
                <Zap className="size-3 fill-current" /> Rush
              </span>
            )}
            <OrderStatusBadge status={order.status} className="text-xs" />
            <PaymentStatusBadge status={order.paymentStatus} />
          </span>
        }
        description={`Placed ${formatDateTime(order.createdAt)} · ${order.items.length} item${order.items.length === 1 ? "" : "s"} · ${formatMoney(order.total)}`}
        actions={<OrderActionsMenu orderId={order.id} status={order.status} paymentStatus={order.paymentStatus} />}
      />

      <div data-admin-card className="mb-4 rounded-xl bg-card p-5">
        <OrderProgress status={order.status} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <Panel
            title="Items"
            description={pendingArtwork ? `${pendingArtwork} artwork file${pendingArtwork === 1 ? "" : "s"} awaiting review` : "All artwork approved"}
            bodyClassName="p-0"
          >
            <ul className="divide-y">
              {order.items.map((item) => {
                const sel = parseJson<LineSelection>(item.selection, { quantity: item.quantity });
                const opts = parseJson<{ printLocations?: { id: string; label: string }[]; finishes?: { id: string; label: string }[] }>(item.product?.options, {});
                const locations = (sel.printLocations ?? []).map((l) => opts.printLocations?.find((p) => p.id === l)?.label ?? l);
                const finish = sel.finishId && sel.finishId !== "standard" ? (opts.finishes?.find((f) => f.id === sel.finishId)?.label ?? sel.finishId) : null;
                const preview = item.artworkUrl || item.image;
                return (
                  <li key={item.id} className="flex flex-col gap-4 p-5 sm:flex-row">
                    <a
                      href={preview ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative block size-28 shrink-0 overflow-hidden rounded-lg border bg-checker"
                      title="Open full size"
                    >
                      {preview && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview} alt={item.name} className="size-full object-contain transition-transform group-hover:scale-105" />
                      )}
                    </a>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            {PRODUCT_TYPE_LABELS[item.type as ProductType] ?? item.type}
                          </p>
                          <p className="font-medium">
                            {item.product ? (
                              <Link href={`/admin/products/${item.product.id}`} className="hover:text-primary">{item.name}</Link>
                            ) : (
                              item.name
                            )}
                          </p>
                          {item.variantLabel && <p className="text-sm text-muted-foreground">{item.variantLabel}</p>}
                        </div>
                        <div className="text-right text-sm tabular-nums">
                          <p className="font-semibold">{formatMoney(item.total)}</p>
                          <p className="text-muted-foreground">
                            {formatNumber(item.quantity)} × {formatMoney(item.unitPrice)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {sel.color && <Chip>Color: {sel.color}</Chip>}
                        {locations.length > 0 && <Chip>Print: {locations.join(", ")}</Chip>}
                        {finish && <Chip>Finish: {finish}</Chip>}
                        {sel.apparelSizes &&
                          Object.entries(sel.apparelSizes)
                            .filter(([, q]) => q > 0)
                            .map(([s, q]) => (
                              <Chip key={s} mono>
                                {s} × {q}
                              </Chip>
                            ))}
                        {item.designId && (
                          <Chip>
                            <Layers className="size-3" /> Design {item.designId.slice(-6)}
                          </Chip>
                        )}
                      </div>
                      {item.artworkUrl ? (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <ArtworkStatusBadge status={item.artworkStatus} />
                          <a
                            href={item.artworkUrl}
                            download
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            <Download className="size-3.5" /> Download artwork
                          </a>
                          <a href={item.artworkUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                            <ExternalLink className="size-3.5" /> Open
                          </a>
                          <div className="ml-auto">
                            <ArtworkActions itemId={item.id} status={item.artworkStatus} />
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No artwork required</p>
                      )}
                      {item.artworkNote && item.artworkStatus === "NEEDS_CHANGES" && (
                        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">Note to customer: {item.artworkNote}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <dl className="space-y-1.5 border-t bg-muted/30 px-5 py-4 text-sm">
              <Row label="Subtotal" value={formatMoney(order.subtotal)} />
              {order.discount > 0 && <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`−${formatMoney(order.discount)}`} accent />}
              {order.couponCode && order.discount === 0 && <Row label={`Coupon (${order.couponCode})`} value="Free shipping" accent />}
              <Row label={`Shipping · ${method?.label ?? order.shippingMethod}`} value={order.shipping ? formatMoney(order.shipping) : "Free"} />
              {order.rushFee > 0 && <Row label="Rush production" value={formatMoney(order.rushFee)} />}
              <Row label="Tax" value={formatMoney(order.tax)} />
              <div className="mt-2 flex items-center justify-between border-t pt-3 text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatMoney(order.total)}</span>
              </div>
            </dl>
          </Panel>

          <Panel title="Activity" description="Customer-visible updates and internal notes">
            <NoteComposer orderId={order.id} />
            <div className="mt-6">
              <OrderTimeline
                events={order.events.map((e) => ({
                  id: e.id,
                  status: e.status,
                  message: e.visible ? e.message : `🔒 ${e.message}`,
                  author: e.author,
                  createdAt: e.createdAt,
                }))}
              />
            </div>
          </Panel>

          <Panel
            title={<span className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" /> Emails</span>}
            description="Notifications sent for this order"
            action={<ResendEmailButtons orderId={order.id} paid={order.paymentStatus === "PAID"} />}
            bodyClassName="p-0"
          >
            {order.emails.length ? (
              <ul className="divide-y">
                {order.emails.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{EMAIL_TEMPLATE_LABELS[m.template] ?? m.template}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.to} · {formatDateTime(m.createdAt)}
                      </p>
                      {m.error && <p className="truncate text-xs text-destructive" title={m.error}>{m.error}</p>}
                    </div>
                    <EmailStatusPill status={m.status} error={m.error} />
                    <EmailPreviewButton id={m.id} subject={m.subject} to={m.to} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 text-sm text-muted-foreground">No emails sent for this order yet.</p>
            )}
          </Panel>
        </div>

        <aside className="space-y-4">
          <Panel title="Update status">
            <StatusUpdater orderId={order.id} status={order.status} />
          </Panel>

          <Panel title={<span className="flex items-center gap-2"><UserRound className="size-4 text-muted-foreground" /> Customer</span>}>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">{initials(order.customerName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                {order.user ? (
                  <Link href={`/admin/customers/${order.user.id}`} className="font-medium hover:text-primary">{order.customerName}</Link>
                ) : (
                  <p className="font-medium">{order.customerName} <span className="text-xs font-normal text-muted-foreground">(guest)</span></p>
                )}
                {order.user?.company && <p className="text-xs text-muted-foreground">{order.user.company}</p>}
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <a href={`mailto:${order.email}?subject=${encodeURIComponent(`Your order ${order.number}`)}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <Mail className="size-4" /> {order.email}
              </a>
              {order.phone && (
                <a href={`tel:${order.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <Phone className="size-4" /> {order.phone}
                </a>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Paid orders</p>
                <p className="font-heading text-lg font-semibold tabular-nums">{customerStats._count._all}</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Lifetime value</p>
                <p className="font-heading text-lg font-semibold tabular-nums">{formatMoney(customerStats._sum.total ?? 0)}</p>
              </div>
            </div>
          </Panel>

          <Panel title={<span className="flex items-center gap-2"><Truck className="size-4 text-muted-foreground" /> Shipping</span>}>
            <div className="mb-4 flex gap-2 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <address className="not-italic leading-relaxed">
                <span className="font-medium">{address.name}</span>
                {address.company && <><br />{address.company}</>}
                <br />
                {address.line1}
                {address.line2 && <>, {address.line2}</>}
                <br />
                {address.city}, {address.state} {address.zip}
                <br />
                {address.country}
              </address>
            </div>
            <p className="mb-4 text-sm">
              <span className="text-muted-foreground">Method:</span> <span className="font-medium">{method?.label ?? order.shippingMethod}</span>
              {method?.description && <span className="text-muted-foreground"> · {method.description}</span>}
            </p>
            <ShippingForm orderId={order.id} carrier={order.carrier} trackingNumber={order.trackingNumber} status={order.status} />
          </Panel>

          <Panel title={<span className="flex items-center gap-2"><CreditCard className="size-4 text-muted-foreground" /> Payment</span>}>
            <dl className="space-y-1.5 text-sm">
              <Row label="Status" value={<PaymentStatusBadge status={order.paymentStatus} />} />
              <Row label="Method" value={order.paymentMethod ? order.paymentMethod.toUpperCase() : "—"} />
              {order.paymentRef && <Row label="Reference" value={<span className="font-mono text-xs">{order.paymentRef}</span>} />}
              <Row label="Total" value={<span className="font-semibold">{formatMoney(order.total)}</span>} />
            </dl>
          </Panel>

          {order.notes && (
            <Panel title={<span className="flex items-center gap-2"><StickyNote className="size-4 text-muted-foreground" /> Customer note</span>}>
              <p className="rounded-lg bg-amber-500/10 p-3 text-sm leading-relaxed text-amber-900 dark:text-amber-200">{order.notes}</p>
            </Panel>
          )}

          <Panel title="Internal notes" description="Only visible to your team">
            <InternalNotesForm orderId={order.id} initial={order.internalNotes ?? ""} />
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={accent ? "font-medium text-emerald-600 tabular-nums dark:text-emerald-400" : "tabular-nums"}>{value}</dd>
    </div>
  );
}

function Chip({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-muted-foreground ${mono ? "font-mono" : ""}`}>
      {children}
    </span>
  );
}
