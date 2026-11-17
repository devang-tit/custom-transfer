import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseJson } from "@/lib/json";
import { statusMeta } from "@/lib/order-status";
import type { AddressInput } from "@/lib/types";
import { orderOrderBy, orderWhere, readOrderParams } from "@/app/admin/_lib/order-filters";

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  // Neutralize spreadsheet formula injection and quote everything.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  await requireAdmin();

  const url = new URL(request.url);
  const params = readOrderParams(Object.fromEntries(url.searchParams));
  const orders = await db.order.findMany({
    where: orderWhere(params),
    orderBy: orderOrderBy(params),
    take: 10000,
    include: { _count: { select: { items: true } } },
  });

  const header = [
    "Order", "Date", "Customer", "Email", "Phone", "Status", "Payment", "Items", "Subtotal", "Discount", "Coupon",
    "Shipping", "Rush fee", "Tax", "Total", "Shipping method", "Rush", "Carrier", "Tracking", "City", "State", "Zip",
  ];
  const money = (c: number) => (c / 100).toFixed(2);
  const rows = orders.map((o) => {
    const a = parseJson<Partial<AddressInput>>(o.shippingAddress, {});
    return [
      o.number, o.createdAt.toISOString(), o.customerName, o.email, o.phone, statusMeta(o.status).label, o.paymentStatus,
      o._count.items, money(o.subtotal), money(o.discount), o.couponCode, money(o.shipping), money(o.rushFee), money(o.tax),
      money(o.total), o.shippingMethod, o.isRush ? "yes" : "no", o.carrier, o.trackingNumber, a.city, a.state, a.zip,
    ].map(csvCell).join(",");
  });
  const csv = [header.map(csvCell).join(","), ...rows].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
