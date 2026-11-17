import "server-only";
import type { Prisma } from "@prisma/client";
import { addDays, startOfDay, sp } from "./ranges";

export type OrderFilterParams = {
  status?: string;
  q?: string;
  payment?: string;
  rush?: string;
  range?: string;
  sort?: string;
  dir?: string;
  page?: string;
};

export function readOrderParams(raw: Record<string, string | string[] | undefined>): OrderFilterParams {
  return {
    status: sp(raw.status),
    q: sp(raw.q)?.trim() || undefined,
    payment: sp(raw.payment),
    rush: sp(raw.rush),
    range: sp(raw.range),
    sort: sp(raw.sort),
    dir: sp(raw.dir),
    page: sp(raw.page),
  };
}

export const ORDER_DATE_RANGES = [
  { key: "today", label: "Today", days: 1 },
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
] as const;

/** Filters except status (so status tab counts can reuse it). */
export function orderWhereBase(p: OrderFilterParams): Prisma.OrderWhereInput {
  const and: Prisma.OrderWhereInput[] = [];
  if (p.q) {
    and.push({
      OR: [
        { number: { contains: p.q, mode: "insensitive" } },
        { email: { contains: p.q, mode: "insensitive" } },
        { customerName: { contains: p.q, mode: "insensitive" } },
        { trackingNumber: { contains: p.q, mode: "insensitive" } },
      ],
    });
  }
  if (p.payment && p.payment !== "all") and.push({ paymentStatus: p.payment });
  if (p.rush === "1") and.push({ isRush: true });
  const range = ORDER_DATE_RANGES.find((r) => r.key === p.range);
  if (range) and.push({ createdAt: { gte: startOfDay(addDays(new Date(), -(range.days - 1))) } });
  return and.length ? { AND: and } : {};
}

export function orderWhere(p: OrderFilterParams): Prisma.OrderWhereInput {
  const base = orderWhereBase(p);
  if (!p.status || p.status === "all") return base;
  if (p.status === "open") return { AND: [base, { status: { notIn: ["DELIVERED", "CANCELLED", "REFUNDED"] } }] };
  return { AND: [base, { status: p.status }] };
}

const SORTABLE = ["createdAt", "total", "number", "customerName", "status"] as const;

export function orderOrderBy(p: OrderFilterParams): Prisma.OrderOrderByWithRelationInput {
  const key = (SORTABLE as readonly string[]).includes(p.sort ?? "") ? (p.sort as (typeof SORTABLE)[number]) : "createdAt";
  const dir = p.dir === "asc" ? "asc" : "desc";
  return { [key]: dir };
}
