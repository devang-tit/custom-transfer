import "server-only";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/json";
import type { ProductOptions } from "@/lib/types";

export type SearchHit = {
  id: string;
  name: string;
  slug: string;
  type: string;
  image: string;
  fromPrice: number;
  category: string | null;
};

export async function searchProducts(q: string, take = 8): Promise<SearchHit[]> {
  const query = q.trim();
  const rows = await db.product.findMany({
    where: {
      active: true,
      ...(query
        ? {
            OR: [
              { name: { contains: query } },
              { shortDescription: { contains: query } },
              { sku: { contains: query } },
              { category: { name: { contains: query } } },
            ],
          }
        : { featured: true }),
    },
    include: { category: { select: { name: true } } },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    take,
  });
  return rows.map((r) => {
    const opts = parseJson<ProductOptions>(r.options, {});
    const sizes = opts.sizes ?? [];
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      type: r.type,
      image: parseJson<string[]>(r.images, [])[0] ?? "/images/placeholder.svg",
      fromPrice: sizes.length ? Math.min(...sizes.map((s) => s.price)) : r.basePrice,
      category: r.category?.name ?? null,
    };
  });
}
