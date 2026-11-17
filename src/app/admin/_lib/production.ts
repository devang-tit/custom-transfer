import "server-only";
import { db } from "@/lib/db";
import { PRODUCTION_COLUMNS } from "@/lib/order-status";

export type BoardCard = {
  id: string;
  number: string;
  customerName: string;
  status: string;
  isRush: boolean;
  createdAt: string;
  total: number;
  shippingMethod: string;
  itemCount: number;
  units: number;
  thumbs: string[];
  artwork: { total: number; approved: number; changes: number };
  summary: string;
};

const SHIPPED_WINDOW_DAYS = 7;

/**
 * Orders for the production board. Returns the server's `now` so the client renders
 * ages ("2d") identically during SSR and hydration.
 */
export async function getProductionBoard(): Promise<{ cards: BoardCard[]; now: number }> {
  const now = Date.now();
  const shippedSince = new Date(now - SHIPPED_WINDOW_DAYS * 86400000);
  const orders = await db.order.findMany({
    where: {
      OR: [
        { status: { in: PRODUCTION_COLUMNS.filter((s) => s !== "SHIPPED") } },
        { status: "SHIPPED", updatedAt: { gte: shippedSince } },
      ],
    },
    orderBy: [{ isRush: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      number: true,
      customerName: true,
      status: true,
      isRush: true,
      createdAt: true,
      total: true,
      shippingMethod: true,
      items: { select: { image: true, artworkUrl: true, artworkStatus: true, quantity: true, name: true } },
    },
  });

  const cards = orders.map((o) => {
    const art = o.items.filter((i) => i.artworkUrl);
    return {
      id: o.id,
      number: o.number,
      customerName: o.customerName,
      status: o.status,
      isRush: o.isRush,
      createdAt: o.createdAt.toISOString(),
      total: o.total,
      shippingMethod: o.shippingMethod,
      itemCount: o.items.length,
      units: o.items.reduce((s, i) => s + i.quantity, 0),
      thumbs: o.items.slice(0, 4).map((i) => i.artworkUrl || i.image || "").filter(Boolean),
      artwork: {
        total: art.length,
        approved: art.filter((i) => i.artworkStatus === "APPROVED").length,
        changes: art.filter((i) => i.artworkStatus === "NEEDS_CHANGES").length,
      },
      summary: o.items.map((i) => i.name).join(", "),
    };
  });
  return { cards, now };
}
