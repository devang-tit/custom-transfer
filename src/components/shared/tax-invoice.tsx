import type { Order, OrderItem } from "@prisma/client";
import { LogoMark } from "@/components/brand/logo";
import { siteConfig } from "@/config/site";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { findState } from "@/lib/india";
import { parseJson } from "@/lib/json";
import { amountInWords, gstRows, paymentMethodLabel } from "@/lib/order-display";
import type { AddressInput, LineSelection, StoreSettings } from "@/lib/types";

type InvoiceOrder = Order & { items: OrderItem[] };

/**
 * GST tax invoice (or packing slip) for an order. Prices are GST-inclusive, so each line shows its
 * taxable value and the GST contained in it (order discount shared proportionally); shipping, rush
 * and COD charges carry `chargesGstRate`. Totals split into CGST + SGST or IGST by place of supply.
 */
export function TaxInvoice({ order, settings, variant = "invoice" }: { order: InvoiceOrder; settings: StoreSettings; variant?: "invoice" | "packing" }) {
  const packing = variant === "packing";
  const address = parseJson<Partial<AddressInput & { phone?: string }>>(order.shippingAddress, {});
  const method = settings.shippingMethods.find((m) => m.id === order.shippingMethod);
  const seller = findState(settings.storeState);
  const buyer = findState(address.state);
  const lineSum = order.items.reduce((s, i) => s + i.total, 0) || 1;
  const rows = order.items.map((it) => {
    const rate = it.gstRate ?? settings.taxRate;
    const net = it.total - (order.discount * it.total) / lineSum;
    const taxable = settings.pricesIncludeTax ? net / (1 + rate / 100) : net;
    return { it, rate, taxable, gst: settings.pricesIncludeTax ? net - taxable : (net * rate) / 100 };
  });
  const charges = [
    { label: `Shipping · ${method?.label ?? order.shippingMethod}`, amount: order.shipping },
    { label: "Rush production", amount: order.rushFee },
    { label: "Cash on Delivery fee", amount: order.codFee },
  ].filter((c) => c.amount > 0);
  const chargeRate = settings.chargesGstRate;
  const chargeTaxable = (amount: number) => (settings.pricesIncludeTax ? amount / (1 + chargeRate / 100) : amount);
  const taxableTotal = rows.reduce((s, r) => s + r.taxable, 0) + charges.reduce((s, c) => s + chargeTaxable(c.amount), 0);
  const tax = gstRows(order.tax, settings.storeState, address.state);
  const isTaxInvoice = !!settings.gstin;

  return (
    <article className="mx-auto max-w-4xl bg-white p-10 text-[13px] text-zinc-900 print:max-w-none print:p-0">
      <header className="flex items-start justify-between gap-6 border-b border-zinc-200 pb-6">
        <div className="flex items-start gap-3">
          <LogoMark className="size-10" />
          <div>
            <p className="text-xl font-bold">{settings.legalName || settings.storeName}</p>
            <p className="max-w-xs text-zinc-600">{siteConfig.contact.address}</p>
            <p className="text-zinc-600">
              {settings.supportEmail} · {settings.supportPhone}
            </p>
            {settings.gstin && <p className="mt-1 font-mono text-zinc-800">GSTIN: {settings.gstin}</p>}
            {seller && (
              <p className="text-zinc-600">
                State: {seller.name} ({seller.gst})
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tracking-tight uppercase">{packing ? "Packing slip" : isTaxInvoice ? "Tax invoice" : "Invoice"}</p>
          <p className="mt-1 text-zinc-600">
            No. <span className="font-mono">{order.number}</span>
          </p>
          <p className="text-zinc-600">Date: {formatDate(order.createdAt)}</p>
          {!packing && buyer && (
            <p className="text-zinc-600">
              Place of supply: {buyer.name} ({buyer.gst})
            </p>
          )}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-6 py-6">
        <div>
          <p className="mb-1 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Bill to</p>
          <p className="font-medium">{order.customerName}</p>
          {order.customerGstin && <p className="font-mono">GSTIN: {order.customerGstin}</p>}
          <p>{order.email}</p>
          {order.phone && <p>{order.phone}</p>}
          {!packing && (
            <p className="mt-2 text-zinc-600">
              Payment: {paymentMethodLabel(order.paymentMethod)} · {order.paymentStatus === "PAID" ? "Paid" : order.paymentMethod === "cod" ? "To be collected on delivery" : "Unpaid"}
            </p>
          )}
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Ship to</p>
          <p className="font-medium">{address.name ?? order.customerName}</p>
          {address.company && <p>{address.company}</p>}
          <p>
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
          </p>
          <p>
            {address.city}, {address.state} – {address.zip}
          </p>
          <p>India{address.phone ? ` · ${address.phone}` : ""}</p>
          <p className="mt-2 text-zinc-600">
            {method?.label ?? order.shippingMethod}
            {order.isRush ? " · RUSH" : ""}
          </p>
        </div>
      </section>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-y border-zinc-200 text-left text-[11px] tracking-wider text-zinc-500 uppercase">
            {packing && <th className="w-10 py-2">✓</th>}
            <th className="py-2">Item</th>
            {!packing && <th className="py-2">HSN</th>}
            <th className="py-2 text-right">Qty</th>
            {!packing && <th className="py-2 text-right">Taxable value</th>}
            {!packing && <th className="py-2 text-right">GST</th>}
            {!packing && <th className="py-2 text-right">Amount</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ it, rate, taxable, gst }) => {
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
                {!packing && <td className="py-3 font-mono text-xs">{it.hsnCode ?? "—"}</td>}
                <td className="py-3 text-right tabular-nums">{formatNumber(it.quantity)}</td>
                {!packing && <td className="py-3 text-right tabular-nums">{formatMoney(Math.round(taxable))}</td>}
                {!packing && (
                  <td className="py-3 text-right tabular-nums">
                    {formatMoney(Math.round(gst))}
                    <span className="block text-[11px] text-zinc-500">{rate}%</span>
                  </td>
                )}
                {!packing && <td className="py-3 text-right font-medium tabular-nums">{formatMoney(it.total)}</td>}
              </tr>
            );
          })}
          {!packing &&
            charges.map((c) => (
              <tr key={c.label} className="border-b border-zinc-100 align-top text-zinc-700">
                <td className="py-2 pr-4">{c.label}</td>
                <td className="py-2 font-mono text-xs">—</td>
                <td className="py-2 text-right">—</td>
                <td className="py-2 text-right tabular-nums">{formatMoney(Math.round(chargeTaxable(c.amount)))}</td>
                <td className="py-2 text-right tabular-nums">
                  {formatMoney(Math.round(c.amount - chargeTaxable(c.amount)))}
                  <span className="block text-[11px] text-zinc-500">{chargeRate}%</span>
                </td>
                <td className="py-2 text-right tabular-nums">{formatMoney(c.amount)}</td>
              </tr>
            ))}
        </tbody>
      </table>

      {!packing ? (
        <div className="mt-6 flex flex-col-reverse gap-6 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-sm text-xs text-zinc-600">
            <span className="block font-semibold text-zinc-800">Amount in words</span>
            {amountInWords(order.total)}
          </p>
          <dl className="w-72 space-y-1.5 tabular-nums">
            {order.discount > 0 && <Line label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""} (included above)`} value={`−${formatMoney(order.discount)}`} />}
            <Line label="Total taxable value" value={formatMoney(Math.round(taxableTotal))} />
            {tax.map((t) => (
              <Line key={t.label} label={t.label} value={formatMoney(t.amount)} />
            ))}
            <div className="flex justify-between border-t border-zinc-300 pt-2 text-base font-semibold">
              <span>Grand total</span>
              <span>{formatMoney(order.total)}</span>
            </div>
            {settings.pricesIncludeTax && <p className="text-right text-[11px] text-zinc-500">All prices include GST</p>}
          </dl>
        </div>
      ) : (
        order.notes && (
          <div className="mt-6 rounded-lg border border-zinc-200 p-3">
            <p className="mb-1 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Customer note</p>
            <p>{order.notes}</p>
          </div>
        )
      )}

      <footer className="mt-10 border-t border-zinc-200 pt-4 text-center text-xs text-zinc-500">
        {!packing && <p>This is a computer-generated invoice and does not need a signature.</p>}
        <p>
          Thank you for printing with {settings.storeName}! Press DTF at 150–160°C for 10–15 seconds, medium pressure. Questions? {settings.supportEmail}
        </p>
      </footer>
    </article>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
