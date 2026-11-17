import "server-only";
import { db } from "@/lib/db";

/** Next sequential order number like "IF-10482". */
export async function generateOrderNumber(prefix: string): Promise<string> {
  const last = await db.order.findFirst({
    where: { number: { startsWith: `${prefix}-` } },
    orderBy: { createdAt: "desc" },
    select: { number: true },
  });
  const all = await db.order.findMany({ select: { number: true }, where: { number: { startsWith: `${prefix}-` } } });
  const max = all.reduce((m, o) => Math.max(m, Number(o.number.split("-").pop()) || 0), Number(last?.number.split("-").pop()) || 10000);
  return `${prefix}-${max + 1}`;
}
