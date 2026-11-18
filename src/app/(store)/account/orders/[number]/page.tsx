import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Copy, CreditCard, Download, FileText, MapPin, MessageSquare, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderProgress, OrderTimeline } from "@/components/shared/order-timeline";
import { ArtworkStatusBadge, OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/status-badge";
import { ReorderButton } from "@/components/account/reorder-button";
import { Panel } from "@/components/account/section";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, formatMoney } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/order-display";
import { parseJson } from "@/lib/json";
import { PLACEHOLDER_IMAGE } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { statusMeta } from "@/lib/order-status";
import type { AddressInput, LineSelection } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/account/orders/[number]">): Promise<Metadata> {
  const { number } = await params;
  return { title: `Order ${number}` };
}

export default async function OrderDetailPage({ params }: PageProps<"/account/orders/[number]">) {
  const { number } = await params;
  const user = await requireUser(`/account/orders/${number}`);
  const [order, settings] = await Promise.all([
    db.order.findFirst({
      where: { number, userId: user.id },
      include: {
        items: true,
        events: { where: { visible: true }, orderBy: { createdAt: "desc" } },
      },
    }),
    getSettings(),
  ]);
  if (!order) notFound();

  const address = parseJson<Partial<AddressInput>>(order.shippingAddress, {});
  const method = settings.shippingMethods.find((m) => m.id === order.shippingMethod);
  const needsChanges = order.items.some((i) => i.artworkStatus === "NEEDS_CHANGES");
  const cancelled = order.status === "CANCELLED" || order.status === "REFUNDED";

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link href="/account/orders" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> All orders
          </Link>
          <h2 className="flex flex-wrap items-center gap-3 text-2xl font-bold sm:text-[1.75rem]">
            <span className="font-mono">{order.number}</span>
            <OrderStatusBadge status={order.status} />
            {order.isRush && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ink-magenta/10 px-2.5 py-0.5 text-xs font-semibold text-ink-magenta">
                <Zap className="size-3" /> Rush
              </span>
            )}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="h-10 rounded-xl px-4">
            <Link href={`/account/orders/${order.number}/invoice`}>
              <FileText data-icon="inline-start" /> Invoice
            </Link>
          </Button>
          <ReorderButton number={order.number} />
        </div>
      </div>

      {needsChanges && (
        <div className="flex flex-col gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 sm:flex-row sm:items-center">
          <AlertTriangle className="size-5 shrink-0 text-destructive" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-destructive">Action needed: artwork changes requested</p>
            <p className="text-muted-foreground">Our prepress team flagged an issue with one or more files. See the notes below and reply with an updated file.</p>
          </div>
          <Button asChild variant="outline" className="h-9 rounded-xl">
            <Link href={`/contact?order=${order.number}`}>
              <MessageSquare data-icon="inline-start" /> Contact us
            </Link>
          </Button>
        </div>
      )}

      {!cancelled && (
        <Panel>
          <p className="mb-5 text-sm">
            <span className="font-semibold">{statusMeta(order.status).label}.</span>{" "}
            <span className="text-muted-foreground">{statusMeta(order.status).description}</span>
          </p>
          <OrderProgress status={order.status} />
          {order.trackingNumber && (
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-muted/60 px-4 py-3 text-sm">
              <Truck className="size-4 text-primary" />
              <span>
                {order.carrier ?? "Carrier"} tracking: <span className="font-mono font-semibold">{order.trackingNumber}</span>
              </span>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(`${order.carrier ?? ""} ${order.trackingNumber}`)}`}
                target="_blank"
                rel="noreferrer"
                className="ml-auto font-medium text-primary hover:underline"
              >
                Track package →
              </a>
            </div>
          )}
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid content-start gap-6">
          <Panel title={`Items (${order.items.length})`} bodyClassName="p-0">
            <ul className="divide-y">
              {order.items.map((item) => {
                const sel = parseJson<LineSelection>(item.selection, { quantity: item.quantity });
                const sizes = sel.apparelSizes ? Object.entries(sel.apparelSizes).filter(([, q]) => q > 0) : [];
                return (
                  <li key={item.id} className="flex gap-4 p-5">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border bg-checker">
                      <Image src={item.artworkUrl && !item.artworkUrl.endsWith(".pdf") ? item.artworkUrl : (item.image ?? PLACEHOLDER_IMAGE)} alt={item.name} fill sizes="80px" className="object-contain" unoptimized />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-semibold">{item.name}</p>
                          {item.variantLabel && <p className="text-sm text-muted-foreground">{item.variantLabel}</p>}
                        </div>
                        <p className="font-semibold tabular-nums sm:text-right">{formatMoney(item.total)}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Qty {item.quantity} × {formatMoney(item.unitPrice)}
                        {sizes.length > 0 && <> · {sizes.map(([s, q]) => `${s}:${q}`).join("  ")}</>}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        {item.artworkUrl && <ArtworkStatusBadge status={item.artworkStatus} />}
                        {item.artworkUrl && (
                          <a href={item.artworkUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                            <Download className="size-3" /> Artwork
                          </a>
                        )}
                      </div>
                      {item.artworkStatus === "NEEDS_CHANGES" && item.artworkNote && (
                        <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm">
                          <p className="font-medium text-destructive">Prepress note</p>
                          <p className="text-muted-foreground">{item.artworkNote}</p>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Order activity">
            {order.events.length ? <OrderTimeline events={order.events} /> : <p className="text-sm text-muted-foreground">No activity yet.</p>}
          </Panel>
        </div>

        <div className="grid content-start gap-6">
          <Panel title="Summary">
            <dl className="grid gap-2.5 text-sm">
              <Row label="Subtotal" value={formatMoney(order.subtotal)} />
              {order.discount > 0 && <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`−${formatMoney(order.discount)}`} accent />}
              <Row label={`Shipping${method ? ` · ${method.label}` : ""}`} value={order.shipping ? formatMoney(order.shipping) : "Free"} />
              {order.rushFee > 0 && <Row label="Rush production" value={formatMoney(order.rushFee)} />}
              {order.codFee > 0 && <Row label="Cash on Delivery fee" value={formatMoney(order.codFee)} />}
              <div className="my-1 h-px bg-border" />
              <div className="flex items-center justify-between">
                <dt className="font-semibold">Total</dt>
                <dd className="text-xl font-bold tabular-nums">{formatMoney(order.total)}</dd>
              </div>
              {order.tax > 0 && <p className="text-right text-xs text-muted-foreground">{settings.pricesIncludeTax ? `Includes ${formatMoney(order.tax)} GST` : `GST ${formatMoney(order.tax)}`}</p>}
            </dl>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5 text-sm">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <CreditCard className="size-4" /> {paymentMethodLabel(order.paymentMethod)}
              </span>
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
          </Panel>

          <Panel title="Delivery">
            <div className="grid gap-4 text-sm">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <address className="not-italic">
                  <p className="font-medium">{address.name ?? order.customerName}</p>
                  {address.company && <p>{address.company}</p>}
                  <p className="text-muted-foreground">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                  </p>
                  <p className="text-muted-foreground">
                    {[address.city, address.state].filter(Boolean).join(", ")}{address.zip ? ` – ${address.zip}` : ""}, India
                  </p>
                </address>
              </div>
              <div className="flex gap-3">
                <Truck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p>
                  {method?.label ?? order.shippingMethod}
                  {method?.description && <span className="block text-muted-foreground">{method.description}</span>}
                </p>
              </div>
              {order.notes && (
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Your note</p>
                  <p>{order.notes}</p>
                </div>
              )}
            </div>
          </Panel>

          <div className="rounded-2xl border border-dashed p-5 text-sm">
            <p className="font-semibold">Need help with this order?</p>
            <p className="mt-1 text-muted-foreground">Reference <span className="font-mono">{order.number}</span> and we&apos;ll get back to you within one business day.</p>
            <Button asChild variant="outline" className="mt-3 h-9 w-full rounded-xl">
              <Link href={`/contact?order=${order.number}`}>
                <Copy data-icon="inline-start" /> Contact support
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={accent ? "font-medium text-emerald-600 tabular-nums dark:text-emerald-400" : "tabular-nums"}>{value}</dd>
    </div>
  );
}
