import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { PrintButton } from "@/components/account/print-button";
import { PaymentStatusBadge } from "@/components/shared/status-badge";
import { siteConfig } from "@/config/site";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { parseJson } from "@/lib/json";
import { getSettings } from "@/lib/settings";
import type { AddressInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/account/orders/[number]/invoice">): Promise<Metadata> {
  const { number } = await params;
  return { title: `Invoice ${number}` };
}

export default async function InvoicePage({ params }: PageProps<"/account/orders/[number]/invoice">) {
  const { number } = await params;
  const user = await requireUser(`/account/orders/${number}/invoice`);
  const [order, settings] = await Promise.all([
    db.order.findFirst({ where: { number, userId: user.id }, include: { items: true } }),
    getSettings(),
  ]);
  if (!order) notFound();
  const address = parseJson<Partial<AddressInput>>(order.shippingAddress, {});
  const method = settings.shippingMethods.find((m) => m.id === order.shippingMethod);

  return (
    <div className="grid gap-4">
      {/* Print only the invoice sheet, regardless of the surrounding store layout. */}
      <style>{`@media print {
        body * { visibility: hidden !important; }
        #invoice, #invoice * { visibility: visible !important; }
        #invoice { position: absolute; inset: 0 auto auto 0; width: 100%; border: 0 !important; box-shadow: none !important; }
        @page { margin: 14mm; }
      }`}</style>
      <div className="no-print flex items-center justify-between gap-3">
        <Link href={`/account/orders/${order.number}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to order
        </Link>
        <PrintButton />
      </div>

      <article id="invoice" className="rounded-2xl border bg-white p-6 text-zinc-900 shadow-premium sm:p-10">
        <header className="flex flex-col gap-6 border-b border-zinc-200 pb-8 sm:flex-row sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark />
              <span className="font-heading text-xl font-bold">{siteConfig.name}</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-zinc-500">
              {siteConfig.contact.address}
              <br />
              {settings.supportEmail} · {settings.supportPhone}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="font-heading text-3xl font-bold tracking-tight">Invoice</p>
            <p className="mt-1 font-mono text-sm">{order.number}</p>
            <p className="text-sm text-zinc-500">Issued {formatDate(order.createdAt)}</p>
            <div className="mt-2 sm:flex sm:justify-end">
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
          </div>
        </header>

        <section className="grid gap-6 py-8 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Billed to</p>
            <p className="mt-2 font-medium">{order.customerName}</p>
            <p className="text-zinc-500">{order.email}</p>
            {order.phone && <p className="text-zinc-500">{order.phone}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Ship to</p>
            <p className="mt-2 font-medium">{address.name ?? order.customerName}</p>
            <p className="text-zinc-500">
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
              <br />
              {[address.city, address.state, address.zip].filter(Boolean).join(", ")} {address.country}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Shipping</p>
            <p className="mt-2 font-medium">{method?.label ?? order.shippingMethod}</p>
            <p className="text-zinc-500">{method?.description}</p>
            {order.trackingNumber && <p className="font-mono text-xs text-zinc-500">{order.carrier} {order.trackingNumber}</p>}
          </div>
        </section>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-y border-zinc-200 text-left text-xs tracking-wider text-zinc-400 uppercase">
                <th className="py-3 pr-4 font-semibold">Item</th>
                <th className="py-3 pr-4 text-right font-semibold">Qty</th>
                <th className="py-3 pr-4 text-right font-semibold">Unit</th>
                <th className="py-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={i.id} className="border-b border-zinc-100">
                  <td className="py-3.5 pr-4">
                    <p className="font-medium">{i.name}</p>
                    {i.variantLabel && <p className="text-xs text-zinc-500">{i.variantLabel}</p>}
                  </td>
                  <td className="py-3.5 pr-4 text-right tabular-nums">{i.quantity}</td>
                  <td className="py-3.5 pr-4 text-right tabular-nums">{formatMoney(i.unitPrice)}</td>
                  <td className="py-3.5 text-right font-medium tabular-nums">{formatMoney(i.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <dl className="grid w-full max-w-xs gap-2 text-sm">
            <Line label="Subtotal" value={formatMoney(order.subtotal)} />
            {order.discount > 0 && <Line label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`−${formatMoney(order.discount)}`} />}
            <Line label="Shipping" value={order.shipping ? formatMoney(order.shipping) : "Free"} />
            {order.rushFee > 0 && <Line label="Rush production" value={formatMoney(order.rushFee)} />}
            <Line label="Tax" value={formatMoney(order.tax)} />
            <div className="mt-1 flex justify-between border-t border-zinc-200 pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatMoney(order.total)}</dd>
            </div>
          </dl>
        </div>

        <footer className="mt-10 border-t border-zinc-200 pt-6 text-center text-xs text-zinc-400">
          Thank you for printing with {siteConfig.name}! Questions? {settings.supportEmail}
        </footer>
      </article>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
