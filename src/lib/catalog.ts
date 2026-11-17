import "server-only";
import { db } from "@/lib/db";
import { toProductDTO, type ProductDTO } from "@/lib/products";
import type { Prisma } from "@prisma/client";

/** Products with approved-review rating aggregates attached. */
export async function getProducts(args: Prisma.ProductFindManyArgs = {}): Promise<ProductDTO[]> {
  const rows = await db.product.findMany({
    ...args,
    where: { active: true, ...(args.where ?? {}) },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });
  const ratings = await db.review.groupBy({
    by: ["productId"],
    where: { status: "APPROVED", productId: { in: rows.map((r) => r.id) } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const map = new Map(ratings.map((r) => [r.productId, r]));
  return rows.map((r) =>
    toProductDTO(r, {
      rating: map.get(r.id)?._avg.rating ?? undefined,
      reviewCount: map.get(r.id)?._count._all ?? 0,
    })
  );
}

export async function getProductBySlug(slug: string): Promise<ProductDTO | null> {
  const row = await db.product.findUnique({
    where: { slug },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });
  if (!row || !row.active) return null;
  const agg = await db.review.aggregate({
    where: { productId: row.id, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return toProductDTO(row, { rating: agg._avg.rating ?? undefined, reviewCount: agg._count._all });
}
