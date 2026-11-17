import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, FileSearch, Mail, Printer, Truck, UserPlus } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { parseJson } from "@/lib/json";
import { formatMoney } from "@/lib/format";
import type { AddressInput } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { TotalsTable } from "@/components/store/checkout/totals";
import { CelebrationBadge, ClearCartOnMount, CopyOrderNumber } from "@/components/store/checkout/success-client";
import { getStripe, markOrderPaid, stripeEnabled } from "@/app/(store)/_actions/payment-lib";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

export default async function SuccessPage(props: PageProps<"/checkout/success">) {
  const sp = await props.searchParams;
  const number = typeof sp.order === "string" ? sp.order.slice(0, 30) : "";
  const sessionId = typeof sp.session_id === "string" ? sp.session_id : null;
  const [jar, session, settings] = await Promise.all([cookies(), getSession(), getSettings()]);

  let order = number
    ? await db.order.findUnique({ where: { number }, include: { items: true } })
    : null;
  const allowed = !!order && (jar.get("if_last_order")?.value === order.number || (!!session && session.sub === order.userId));

  // Fallback confirmation when Stripe webhooks aren't reachable (e.g. local dev).
  if (order && allowed && sessionId && stripeEnabled() && order.paymentStatus !== "PAID" && order.paymentRef === sessionId) {
    try {
      const s = await getStripe().checkout.sessions.retrieve(sessionId);
      if (s.payment_status === "paid" && s.metadata?.orderId === order.id) {
        await markOrderPaid(order.id, typeof s.payment_intent === "string" ? s.payment_intent : s.id);
        order = await db.order.findUnique({ where: { id: order.id }, include: { items: true } });
      }
    } catch {
      /* ignore — webhook will reconcile */
    }
  }

  if (!order || !allowed) {
    return (
      <div className="container-page flex flex-col items-center py-24 text-center">
        {order && <ClearCartOnMount />}
        <CelebrationBadge />
        <h1 className="mt-8 text-4xl font-bold">Thank you for your order!</h1>
        <p className="mt-3 max-w-md text-muted-foreground">We’ve emailed your confirmation. You can check progress any time with your order number and email.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button asChild className="h-11 rounded-xl px-5"><Link href={`/track${number ? `?order=${number}` : ""}`}>Track your order</Link></Button>
          <Button asChild variant="outline" className="h-11 rounded-xl px-5"><Link href="/shop">Continue shopping</Link></Button>
        </div>
      </div>
    );
  }

  const address = parseJson<AddressInput | null>(order.shippingAddress, null);
  const method = settings.shippingMethods.find((m) => m.id === order.shippingMethod);
  const paid = order.paymentStatus === "PAID";
  const steps = [
    { icon: FileSearch, title: "Artwork review", body: "Prepress checks every file — usually within 2 business hours.", active: order.status === "ARTWORK_REVIEW" },
    { icon: Printer, title: "Printing & curing", body: order.isRush ? "Rush: printed within 4 business hours of approval." : "Same-day production for approvals before 2pm CT.", active: order.status === "IN_PRODUCTION" },
    { icon: Truck, title: method?.id === "pickup" ? "Ready for pickup" : "Shipped to you", body: method ? `${method.label} · ${method.description}` : "Tracking emailed when it ships.", active: false },
  ];

  return (
    <div className="relative overflow-hidden">
      <ClearCartOnMount />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-grid [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="container-page relative py-14 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <CelebrationBadge />
          <p className="mt-8 text-sm font-semibold tracking-[0.16em] text-primary uppercase">{paid ? "Payment received" : "Order received"}</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Thanks, {order.customerName.split(" ")[0]}! Your order is in.</h1>
          <p className="mt-4 text-muted-foreground">
            A confirmation is on its way to <strong className="text-foreground">{order.email}</strong>.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <CopyOrderNumber number={order.number} />
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        <ol className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className={cn("rounded-3xl border bg-card p-5", s.active && "border-primary ring-1 ring-primary/30")}>
              <div className="flex items-center justify-between">
                <span className={cn("grid size-10 place-items-center rounded-xl", s.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  <s.icon className="size-5" />
                </span>
                <span className="text-xs font-semibold text-muted-foreground">Step {i + 1}</span>
              </div>
              <p className="mt-4 font-semibold">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              {s.active && <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"><span className="size-1.5 animate-pulse rounded-full bg-primary" /> In progress</p>}
            </li>
          ))}
        </ol>

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 lg:grid-cols-[1fr_20rem]">
          <section className="rounded-3xl border bg-card p-5 sm:p-6">
            <h2 className="font-heading text-lg font-semibold">Order summary</h2>
            <ul className="mt-4 divide-y">
              {order.items.map((it) => (
                <li key={it.id} className="flex gap-3 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.artworkUrl && /\.(png|jpe?g|webp|gif|svg)$/i.test(it.artworkUrl) ? it.artworkUrl : (it.image ?? "/images/placeholder.svg")} alt="" className="size-14 rounded-xl border bg-checker object-contain" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{it.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{it.variantLabel} · Qty {it.quantity}</p>
                  </div>
                  <p className="text-sm font-medium tabular-nums">{formatMoney(it.total)}</p>
                </li>
              ))}
            </ul>
            <TotalsTable
              className="mt-4 border-t pt-4"
              totals={{ subtotal: order.subtotal, discount: order.discount, shipping: order.shipping, rushFee: order.rushFee, tax: order.tax, total: order.total, freeShippingApplied: order.shipping === 0, freeShippingRemaining: 0 }}
              shippingLabel={method?.label ?? "Shipping"}
            />
          </section>
          <aside className="space-y-4">
            {address && (
              <div className="rounded-3xl border bg-card p-5 text-sm">
                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">{method?.id === "pickup" ? "Pickup contact" : "Shipping to"}</p>
                <p className="mt-2 font-medium">{address.name}</p>
                <p className="text-muted-foreground">{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
                <p className="text-muted-foreground">{address.city}, {address.state} {address.zip}</p>
              </div>
            )}
            <Button asChild className="h-11 w-full rounded-xl">
              <Link href={`/track?order=${order.number}&email=${encodeURIComponent(order.email)}`}>Track this order <ArrowRight className="size-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="h-11 w-full rounded-xl">
              <Link href="/shop">Continue shopping</Link>
            </Button>
            {!session ? (
              <div className="rounded-3xl bg-ink-key p-5 text-white">
                <UserPlus className="size-5 text-ink-cyan" />
                <p className="mt-3 font-heading text-lg font-semibold">Save this order to an account</p>
                <p className="mt-1 text-sm text-white/70">Create a free account with <strong className="text-white">{order.email}</strong> to track orders, save designs and reorder in one click.</p>
                <Button asChild className="mt-4 h-10 w-full rounded-xl bg-white text-ink-key hover:bg-white/90">
                  <Link href="/register">Create account</Link>
                </Button>
              </div>
            ) : (
              <Link href="/account/orders" className="flex items-center gap-2 rounded-3xl border p-4 text-sm font-medium hover:bg-muted/50">
                <Mail className="size-4 text-primary" /> View all your orders <ArrowRight className="ml-auto size-4" />
              </Link>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
