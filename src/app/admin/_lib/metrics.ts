import "server-only";
import { db } from "@/lib/db";
import { PRODUCT_TYPE_LABELS, type ProductType } from "@/lib/types";
import { addDays, pctDelta, rangeDays, startOfDay, type RangeKey } from "./ranges";

export type SeriesPoint = { key: string; label: string; revenue: number; orders: number };

const isPaid = (o: { paymentStatus: string }) => o.paymentStatus === "PAID";

function buildBuckets(range: RangeKey, start: Date, now: Date) {
  const buckets: SeriesPoint[] = [];
  if (range === "12m") {
    const d = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    for (let i = 0; i < 12; i++) {
      const m = new Date(d.getFullYear(), d.getMonth() + i, 1);
      buckets.push({
        key: `${m.getFullYear()}-${m.getMonth()}`,
        label: m.toLocaleDateString("en-US", { month: "short" }),
        revenue: 0,
        orders: 0,
      });
    }
  } else {
    for (let d = new Date(start); d <= now; d = addDays(d, 1)) {
      buckets.push({
        key: d.toDateString(),
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: 0,
        orders: 0,
      });
    }
  }
  const keyOf = (d: Date) => (range === "12m" ? `${d.getFullYear()}-${d.getMonth()}` : startOfDay(d).toDateString());
  return { buckets, keyOf };
}

export async function getDashboardData(range: RangeKey) {
  const now = new Date();
  const days = rangeDays(range);
  const start = range === "12m" ? new Date(now.getFullYear(), now.getMonth() - 11, 1) : startOfDay(addDays(now, -(days - 1)));
  const prevStart = new Date(start.getTime() - (now.getTime() - start.getTime()));

  const [orders, newCustomers, prevCustomers, topRaw, typeRaw, recentOrders, attention] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: prevStart } },
      select: { id: true, total: true, paymentStatus: true, status: true, createdAt: true },
    }),
    db.user.count({ where: { role: "CUSTOMER", createdAt: { gte: start } } }),
    db.user.count({ where: { role: "CUSTOMER", createdAt: { gte: prevStart, lt: start } } }),
    db.orderItem.groupBy({
      by: ["productId", "name"],
      where: { order: { createdAt: { gte: start }, paymentStatus: "PAID" } },
      _sum: { total: true, quantity: true },
      orderBy: { _sum: { total: "desc" } },
      take: 6,
    }),
    db.orderItem.groupBy({
      by: ["type"],
      where: { order: { createdAt: { gte: start }, paymentStatus: "PAID" } },
      _sum: { total: true },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        number: true,
        customerName: true,
        email: true,
        status: true,
        paymentStatus: true,
        total: true,
        createdAt: true,
        isRush: true,
        _count: { select: { items: true } },
      },
    }),
    getAttention(),
  ]);

  const cur = orders.filter((o) => o.createdAt >= start);
  const prev = orders.filter((o) => o.createdAt < start);
  const sumPaid = (list: typeof orders) => list.filter(isPaid).reduce((s, o) => s + o.total, 0);
  const revenue = sumPaid(cur);
  const prevRevenue = sumPaid(prev);
  const paidCount = cur.filter(isPaid).length;
  const prevPaidCount = prev.filter(isPaid).length;
  const aov = paidCount ? Math.round(revenue / paidCount) : 0;
  const prevAov = prevPaidCount ? Math.round(prevRevenue / prevPaidCount) : 0;

  const { buckets, keyOf } = buildBuckets(range, start, now);
  const idx = new Map(buckets.map((b, i) => [b.key, i]));
  for (const o of cur) {
    const i = idx.get(keyOf(o.createdAt));
    if (i === undefined) continue;
    buckets[i]!.orders += 1;
    if (isPaid(o)) buckets[i]!.revenue += o.total;
  }

  const statusCounts: Record<string, number> = {};
  for (const o of cur) statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;

  const productIds = topRaw.map((t) => t.productId).filter(Boolean) as string[];
  const productImages = await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, images: true, type: true } });
  const imgMap = new Map(productImages.map((p) => [p.id, { image: (JSON.parse(p.images) as string[])[0] ?? null, type: p.type }]));

  return {
    range,
    kpis: {
      revenue: { value: revenue, delta: pctDelta(revenue, prevRevenue), series: buckets.map((b) => b.revenue) },
      orders: { value: cur.length, delta: pctDelta(cur.length, prev.length), series: buckets.map((b) => b.orders) },
      aov: { value: aov, delta: pctDelta(aov, prevAov), series: buckets.map((b) => (b.orders ? b.revenue / b.orders : 0)) },
      customers: { value: newCustomers, delta: pctDelta(newCustomers, prevCustomers), series: [] as number[] },
    },
    series: buckets,
    statusCounts,
    topProducts: topRaw.map((t) => ({
      id: t.productId,
      name: t.name,
      revenue: t._sum.total ?? 0,
      units: t._sum.quantity ?? 0,
      image: t.productId ? (imgMap.get(t.productId)?.image ?? null) : null,
    })),
    typeMix: typeRaw
      .map((t) => ({ type: t.type, label: PRODUCT_TYPE_LABELS[t.type as ProductType] ?? t.type, revenue: t._sum.total ?? 0 }))
      .sort((a, b) => b.revenue - a.revenue),
    recentOrders,
    attention,
  };
}

export async function getAttention() {
  const [artwork, rush, lowStock, unread, pendingReviews, awaitingPayment] = await Promise.all([
    db.order.count({ where: { status: "ARTWORK_REVIEW" } }),
    db.order.count({ where: { isRush: true, status: { in: ["ARTWORK_REVIEW", "IN_PRODUCTION", "QUALITY_CHECK", "READY"] } } }),
    db.product.findMany({
      where: { stock: { not: null, lte: 10 }, active: true },
      select: { id: true, name: true, stock: true },
      orderBy: { stock: "asc" },
    }),
    db.contactMessage.count({ where: { status: "NEW" } }),
    db.review.count({ where: { status: "PENDING" } }),
    db.order.count({ where: { status: "PENDING" } }),
  ]);
  return { artwork, rush, lowStock, unread, pendingReviews, awaitingPayment };
}

/** Badge counts for the sidebar. */
export async function getNavCounts() {
  const [orders, reviews, inbox] = await Promise.all([
    db.order.count({ where: { status: { in: ["PENDING", "ARTWORK_REVIEW"] } } }),
    db.review.count({ where: { status: "PENDING" } }),
    db.contactMessage.count({ where: { status: "NEW" } }),
  ]);
  return { orders, reviews, inbox };
}

export async function getAnalyticsData() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const [orders, customers, couponRows, typeRaw] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: yearStart } },
      select: {
        id: true,
        total: true,
        subtotal: true,
        discount: true,
        paymentStatus: true,
        status: true,
        createdAt: true,
        couponCode: true,
        userId: true,
        email: true,
        customerName: true,
        isRush: true,
        shippingMethod: true,
      },
    }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.coupon.findMany({ select: { code: true, usedCount: true, type: true, value: true, active: true } }),
    db.orderItem.groupBy({
      by: ["type"],
      where: { order: { createdAt: { gte: yearStart }, paymentStatus: "PAID" } },
      _sum: { total: true, quantity: true },
    }),
  ]);

  const months: { key: string; label: string; revenue: number; orders: number; aov: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const m = new Date(yearStart.getFullYear(), yearStart.getMonth() + i, 1);
    months.push({ key: `${m.getFullYear()}-${m.getMonth()}`, label: m.toLocaleDateString("en-US", { month: "short" }), revenue: 0, orders: 0, aov: 0 });
  }
  const mIdx = new Map(months.map((m, i) => [m.key, i]));
  const heat: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  const custMap = new Map<string, { name: string; email: string; userId: string | null; revenue: number; orders: number }>();
  const couponUse = new Map<string, { orders: number; discount: number }>();
  const shipMix = new Map<string, number>();
  let paidCount = 0;
  let revenue = 0;
  let rushCount = 0;

  for (const o of orders) {
    heat[o.createdAt.getDay()]![o.createdAt.getHours()]! += 1;
    shipMix.set(o.shippingMethod, (shipMix.get(o.shippingMethod) ?? 0) + 1);
    if (o.isRush) rushCount++;
    if (o.paymentStatus !== "PAID") continue;
    paidCount++;
    revenue += o.total;
    const i = mIdx.get(`${o.createdAt.getFullYear()}-${o.createdAt.getMonth()}`);
    if (i !== undefined) {
      months[i]!.revenue += o.total;
      months[i]!.orders += 1;
    }
    const ck = o.userId ?? o.email;
    const c = custMap.get(ck) ?? { name: o.customerName, email: o.email, userId: o.userId, revenue: 0, orders: 0 };
    c.revenue += o.total;
    c.orders += 1;
    custMap.set(ck, c);
    if (o.couponCode) {
      const cu = couponUse.get(o.couponCode) ?? { orders: 0, discount: 0 };
      cu.orders += 1;
      cu.discount += o.discount;
      couponUse.set(o.couponCode, cu);
    }
  }
  for (const m of months) m.aov = m.orders ? Math.round(m.revenue / m.orders) : 0;

  // Funnel: how many orders reached each stage of the happy path.
  const flow = ["PENDING", "ARTWORK_REVIEW", "IN_PRODUCTION", "QUALITY_CHECK", "READY", "SHIPPED", "DELIVERED"];
  const funnel = flow.map((stage, i) => ({
    stage,
    count: orders.filter((o) => {
      const at = flow.indexOf(o.status);
      return at >= i;
    }).length,
  }));
  const cancelled = orders.filter((o) => o.status === "CANCELLED" || o.status === "REFUNDED").length;

  const repeatCustomers = [...custMap.values()].filter((c) => c.orders > 1).length;

  return {
    months,
    heat,
    totals: {
      revenue,
      orders: orders.length,
      paidCount,
      aov: paidCount ? Math.round(revenue / paidCount) : 0,
      customers,
      repeatRate: custMap.size ? (repeatCustomers / custMap.size) * 100 : 0,
      rushShare: orders.length ? (rushCount / orders.length) * 100 : 0,
      cancelled,
    },
    topCustomers: [...custMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8),
    coupons: couponRows
      .map((c) => ({ ...c, ordersInPeriod: couponUse.get(c.code)?.orders ?? 0, discountGiven: couponUse.get(c.code)?.discount ?? 0 }))
      .sort((a, b) => b.ordersInPeriod - a.ordersInPeriod),
    typeMix: typeRaw
      .map((t) => ({ type: t.type, label: PRODUCT_TYPE_LABELS[t.type as ProductType] ?? t.type, revenue: t._sum.total ?? 0, units: t._sum.quantity ?? 0 }))
      .sort((a, b) => b.revenue - a.revenue),
    shipMix: [...shipMix.entries()].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count),
    funnel,
  };
}
