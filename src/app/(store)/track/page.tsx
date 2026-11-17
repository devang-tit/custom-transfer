import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch, SearchX, Truck, MapPin, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { formatDate, formatMoney } from "@/lib/format";
import { statusMeta } from "@/lib/order-status";
import type { AddressInput } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { OrderProgress, OrderTimeline } from "@/components/shared/order-timeline";

import { trackingUrl } from "@/lib/tracking";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Track your order" };

const carrierUrl = trackingUrl;

export default async function TrackPage(props: PageProps<"/track">) {
  const sp = await props.searchParams;
  const number = typeof sp.order === "string" ? sp.order.trim().toUpperCase().slice(0, 30) : "";
  const email = typeof sp.email === "string" ? sp.email.trim().toLowerCase().slice(0, 200) : "";
  const searched = !!(number && email);

  const order = searched
    ? await db.order.findFirst({
        where: { number, email },
        include: { items: true, events: { where: { visible: true }, orderBy: { createdAt: "desc" } } },
      })
    : null;
  const address = order ? parseJson<AddressInput | null>(order.shippingAddress, null) : null;
  const trackUrl = order?.trackingNumber ? carrierUrl(order.carrier, order.trackingNumber) : null;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-grid [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="container-page relative py-12 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow"><PackageSearch className="size-6" /></span>
          <h1 className="mt-6 text-4xl font-bold sm:text-5xl">Track your order</h1>
          <p className="mt-3 text-muted-foreground">Enter the order number from your confirmation email along with the email you used at checkout.</p>
        </div>

        <form method="get" action="/track" className="mx-auto mt-8 grid max-w-2xl gap-3 rounded-3xl border bg-card p-4 shadow-premium sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-5">
          <div className="space-y-1.5">
            <Label htmlFor="order" className="text-xs font-semibold">Order number</Label>
            <Input id="order" name="order" defaultValue={number} placeholder="IF-10123" required className="h-11 rounded-xl font-mono uppercase" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={email} placeholder="you@brand.com" required className="h-11 rounded-xl" />
          </div>
          <Button type="submit" className="h-11 rounded-xl px-6">Track</Button>
        </form>

        {searched && !order && (
          <div className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <SearchX className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold">We couldn’t find that order</p>
              <p className="text-muted-foreground">Double-check the order number and email address. Still stuck? <Link href="/contact" className="font-medium text-primary hover:underline">Contact support</Link>.</p>
            </div>
          </div>
        )}

        {order && (
          <div className="mx-auto mt-10 max-w-4xl space-y-6">
            <section className="rounded-3xl border bg-card p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order <span className="font-mono font-semibold text-foreground">{order.number}</span> · placed {formatDate(order.createdAt)}</p>
                  <h2 className="mt-1 font-heading text-2xl font-bold">{statusMeta(order.status).label}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{statusMeta(order.status).description}</p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              <OrderProgress status={order.status} className="mt-8" />
              {order.trackingNumber && (
                <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl bg-muted/50 p-4">
                  <Truck className="size-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{order.carrier ?? "Carrier"} tracking</p>
                    <p className="font-mono text-sm font-semibold">{order.trackingNumber}</p>
                  </div>
                  {trackUrl && (
                    <Button asChild variant="outline" className="h-9 rounded-xl">
                      <a href={trackUrl} target="_blank" rel="noopener noreferrer">Track package <ExternalLink className="size-3.5" /></a>
                    </Button>
                  )}
                </div>
              )}
            </section>

            <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
              <section className="rounded-3xl border bg-card p-5 sm:p-6">
                <h3 className="font-heading text-lg font-semibold">Items</h3>
                <ul className="mt-3 divide-y">
                  {order.items.map((it) => (
                    <li key={it.id} className="flex items-center gap-3 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.image ?? "/images/placeholder.svg"} alt="" className="size-12 rounded-xl border bg-checker object-contain" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{it.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{it.variantLabel} · Qty {it.quantity}</p>
                      </div>
                      <p className="text-sm tabular-nums">{formatMoney(it.total)}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex justify-between border-t pt-3 text-sm">
                  <span className="text-muted-foreground">Order total</span>
                  <span className="font-semibold tabular-nums">{formatMoney(order.total)}</span>
                </div>
                {address && (
                  <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="size-3.5" /> Shipping to {address.city}, {address.state}</p>
                )}
              </section>
              <section className="rounded-3xl border bg-card p-5 sm:p-6">
                <h3 className="mb-5 font-heading text-lg font-semibold">Activity</h3>
                <OrderTimeline events={order.events} />
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
