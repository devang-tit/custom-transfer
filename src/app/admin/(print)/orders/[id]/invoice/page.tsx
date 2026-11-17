import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { parseJson } from "@/lib/json";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type { AddressInput, LineSelection } from "@/lib/types";
import { siteConfig } from "@/config/site";
import { LogoMark } from "@/components/brand/logo";
import { PrintButton } from "./print-button";

export async function generateMetadata(props: PageProps<"/admin/orders/[id]/invoice">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const o = await db.order.findUnique({ where: { id }, select: { number: true } });
  return { title: `${sp.type === "packing" ? "Packing slip" : "Invoice"} ${o?.number ?? ""}` };
}

export default async function InvoicePage(props: PageProps<"/admin/orders/[id]/invoice">) {
  await requireAdmin();
  const { id } = await props.params;
  const sp = await props.searchParams;
  const packing = sp.type === "packing";
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();
  const settings = await getSettings();
  const address = parseJson<Partial<AddressInput>>(order.shippingAddress, {});
  const method = settings.shippingMethods.find((m) => m.id === order.shippingMethod);

  return (
    <div className="min-h-svh bg-muted/50 py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between px-4">
        <p className="text-sm text-muted-foreground">{packing ? "Packing slip" : "Invoice"} preview</p>
        <PrintButton />
      </div>
      <article className="mx-auto max-w-3xl bg-white p-10 text-[13px] text-zinc-900 shadow-premium print:max-w-none print:p-0 print:shadow-none sm:rounded-xl">
        <header className="flex items-start justify-between gap-6 border-b border-zinc-200 pb-6">
          <div className="flex items-center gap-3">
            <LogoMark className="size-10" />
            <div>
              <p className="font-heading text-xl font-bold">{settings.storeName}</p>
              <p className="text-zinc-500">{siteConfig.contact.address}</p>
              <p className="text-zinc-500">
                {settings.supportEmail} · {settings.supportPhone}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-heading text-2xl font-semibold tracking-tight uppercase">{packing ? "Packing slip" : "Invoice"}</p>
            <p className="mt-1 font-mono text-zinc-600">{order.number}</p>
            <p className="text-zinc-500">{formatDate(order.createdAt)}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-6 py-6">
          <div>
            <p className="mb-1 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Ship to</p>
            <p className="font-medium">{address.name ?? order.customerName}</p>
            {address.company && <p>{address.company}</p>}
            <p>
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
            </p>
            <p>
              {address.city}, {address.state} {address.zip}
            </p>
            <p>{address.country}</p>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">{packing ? "Order details" : "Bill to"}</p>
            <p className="font-medium">{order.customerName}</p>
            <p>{order.email}</p>
            {order.phone && <p>{order.phone}</p>}
            <p className="mt-2 text-zinc-600">
              Shipping: {method?.label ?? order.shippingMethod}
              {order.isRush ? " · RUSH" : ""}
            </p>
            {!packing && <p className="text-zinc-600">Payment: {order.paymentStatus === "PAID" ? `Paid${order.paymentMethod ? ` (${order.paymentMethod})` : ""}` : order.paymentStatus}</p>}
          </div>
        </section>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y border-zinc-200 text-left text-[11px] tracking-wider text-zinc-500 uppercase">
              {packing && <th className="w-10 py-2">✓</th>}
              <th className="py-2">Item</th>
              <th className="py-2 text-right">Qty</th>
              {!packing && <th className="py-2 text-right">Unit</th>}
              {!packing && <th className="py-2 text-right">Total</th>}
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => {
              const sel = parseJson<LineSelection>(it.selection, { quantity: it.quantity });
              const sizes = sel.apparelSizes
                ? Object.entries(sel.apparelSizes)
                    .filter(([, q]) => q > 0)
                    .map(([s, q]) => `${s}×${q}`)
                    .join("  ")
                : null;
              return (
                <tr key={it.id} className="border-b border-zinc-100 align-top">
                  {packing && (
                    <td className="py-3">
                      <span className="inline-block size-4 rounded border border-zinc-400" />
                    </td>
                  )}
                  <td className="py-3 pr-4">
                    <p className="font-medium">{it.name}</p>
                    {it.variantLabel && <p className="text-zinc-500">{it.variantLabel}</p>}
                    {sizes && <p className="font-mono text-xs text-zinc-500">{sizes}</p>}
                  </td>
                  <td className="py-3 text-right tabular-nums">{formatNumber(it.quantity)}</td>
                  {!packing && <td className="py-3 text-right tabular-nums">{formatMoney(it.unitPrice)}</td>}
                  {!packing && <td className="py-3 text-right font-medium tabular-nums">{formatMoney(it.total)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>

        {!packing ? (
          <dl className="mt-6 ml-auto w-64 space-y-1.5 tabular-nums">
            <Line label="Subtotal" value={formatMoney(order.subtotal)} />
            {order.discount > 0 && <Line label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`−${formatMoney(order.discount)}`} />}
            <Line label="Shipping" value={order.shipping ? formatMoney(order.shipping) : "Free"} />
            {order.rushFee > 0 && <Line label="Rush production" value={formatMoney(order.rushFee)} />}
            <Line label={`Tax (${settings.taxRate}%)`} value={formatMoney(order.tax)} />
            <div className="flex justify-between border-t border-zinc-300 pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </dl>
        ) : (
          order.notes && (
            <div className="mt-6 rounded-lg border border-zinc-200 p-3">
              <p className="mb-1 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Customer note</p>
              <p>{order.notes}</p>
            </div>
          )
        )}

        <footer className="mt-10 border-t border-zinc-200 pt-4 text-center text-xs text-zinc-500">
          Thank you for printing with {settings.storeName}! Press at 300–315°F for 10–15 seconds, medium pressure. Questions? {settings.supportEmail}
        </footer>
      </article>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-zinc-500">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
