import type { Product, Category } from "@prisma/client";
import { parseJson } from "@/lib/json";
import type { PriceTier, ProductOptions, PricingProduct, ProductType } from "@/lib/types";

/** Product with JSON columns parsed — safe to pass to client components. */
export type ProductDTO = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  type: ProductType;
  categoryId: string | null;
  category?: { id: string; name: string; slug: string } | null;
  shortDescription: string | null;
  description: string | null;
  images: string[];
  basePrice: number;
  compareAtPrice: number | null;
  options: ProductOptions;
  tiers: PriceTier[];
  features: string[];
  badge: string | null;
  turnaround: string | null;
  stock: number | null;
  featured: boolean;
  active: boolean;
  rating?: number;
  reviewCount?: number;
};

export function toProductDTO(
  p: Product & { category?: Pick<Category, "id" | "name" | "slug"> | null },
  extra?: { rating?: number; reviewCount?: number }
): ProductDTO {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    type: p.type as ProductType,
    categoryId: p.categoryId,
    category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : null,
    shortDescription: p.shortDescription,
    description: p.description,
    images: parseJson<string[]>(p.images, []),
    basePrice: p.basePrice,
    compareAtPrice: p.compareAtPrice,
    options: parseJson<ProductOptions>(p.options, {}),
    tiers: parseJson<PriceTier[]>(p.tiers, []),
    features: parseJson<string[]>(p.features, []),
    badge: p.badge,
    turnaround: p.turnaround,
    stock: p.stock,
    featured: p.featured,
    active: p.active,
    ...extra,
  };
}

export function toPricingProduct(p: ProductDTO): PricingProduct {
  return { id: p.id, type: p.type, basePrice: p.basePrice, options: p.options, tiers: p.tiers };
}

export const PLACEHOLDER_IMAGE = "/images/placeholder.svg";

export function productImage(p: { images: string[] }): string {
  return p.images[0] ?? PLACEHOLDER_IMAGE;
}
