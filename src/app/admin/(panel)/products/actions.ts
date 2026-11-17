"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { PRODUCT_TYPES } from "@/lib/types";

type Result<T = object> = ({ ok: true; message?: string } & T) | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

const cents = z.number().int().min(0).max(100_000_000);
const optStr = z
  .string()
  .trim()
  .max(5000)
  .transform((v) => v || null)
  .nullable()
  .optional();

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required").max(140),
  slug: z
    .string()
    .trim()
    .max(140)
    .regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers and dashes"),
  sku: optStr,
  type: z.enum(PRODUCT_TYPES),
  categoryId: optStr,
  shortDescription: optStr,
  description: optStr,
  badge: optStr,
  turnaround: optStr,
  images: z.array(z.string().min(1).max(500)).max(20),
  basePrice: cents,
  compareAtPrice: cents.nullable(),
  options: z.object({
    requiresArtwork: z.boolean().optional(),
    sizes: z
      .array(
        z.object({
          id: z.string().trim().min(1, "Size id required").max(40),
          label: z.string().trim().min(1, "Size label required").max(80),
          width: z.number().min(0).max(1000),
          height: z.number().min(0).max(5000),
          price: cents,
        })
      )
      .max(60)
      .optional(),
    finishes: z.array(z.object({ id: z.string().trim().min(1).max(40), label: z.string().trim().min(1).max(60), price: cents, description: z.string().max(200).optional() })).max(20).optional(),
    colors: z.array(z.object({ name: z.string().trim().min(1).max(40), hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color") })).max(40).optional(),
    apparelSizes: z.array(z.object({ size: z.string().trim().min(1).max(10), upcharge: cents })).max(20).optional(),
    printLocations: z.array(z.object({ id: z.string().trim().min(1).max(40), label: z.string().trim().min(1).max(60), price: cents })).max(20).optional(),
  }),
  tiers: z.array(z.object({ minQty: z.number().int().min(1).max(100000), discountPct: z.number().min(0).max(90) })).max(20),
  features: z.array(z.string().trim().min(1).max(160)).max(20),
  stock: z.number().int().min(0).max(1_000_000).nullable(),
  featured: z.boolean(),
  active: z.boolean(),
});

export type ProductInput = z.input<typeof productSchema>;

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "product";
  let slug = root;
  for (let i = 2; ; i++) {
    const hit = await db.product.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === excludeId) return slug;
    slug = `${root}-${i}`;
  }
}

function revalidateCatalog(id?: string) {
  revalidatePath("/admin/products");
  if (id) revalidatePath(`/admin/products/${id}`);
  revalidatePath("/", "layout");
}

export async function saveProduct(input: ProductInput): Promise<Result<{ id: string }>> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    const first = parsed.error.issues[0];
    return { ok: false, error: first ? `${first.path.join(".") || "Form"}: ${first.message}` : "Check the form", fieldErrors: flat.fieldErrors };
  }
  const d = parsed.data;
  if (d.type !== "APPAREL" && !(d.options.sizes?.length)) {
    return { ok: false, error: "Add at least one size / variant with a price" };
  }
  if (d.type === "APPAREL" && !(d.options.colors?.length && d.options.apparelSizes?.length)) {
    return { ok: false, error: "Apparel needs at least one color and one garment size" };
  }
  const slug = await uniqueSlug(d.slug || d.name, d.id);
  if (d.sku) {
    const skuHit = await db.product.findUnique({ where: { sku: d.sku }, select: { id: true } });
    if (skuHit && skuHit.id !== d.id) return { ok: false, error: `SKU ${d.sku} is already used by another product`, fieldErrors: { sku: ["Already in use"] } };
  }
  if (d.categoryId) {
    const cat = await db.category.findUnique({ where: { id: d.categoryId }, select: { id: true } });
    if (!cat) return { ok: false, error: "Category not found" };
  }

  // Clean options so only relevant keys are stored.
  const options =
    d.type === "APPAREL"
      ? { colors: d.options.colors, apparelSizes: d.options.apparelSizes, printLocations: d.options.printLocations ?? [], requiresArtwork: !!d.options.requiresArtwork }
      : { sizes: d.options.sizes, finishes: d.options.finishes?.length ? d.options.finishes : undefined, requiresArtwork: !!d.options.requiresArtwork };

  const data = {
    name: d.name,
    slug,
    sku: d.sku ?? null,
    type: d.type,
    categoryId: d.categoryId ?? null,
    shortDescription: d.shortDescription ?? null,
    description: d.description ?? null,
    badge: d.badge ?? null,
    turnaround: d.turnaround ?? null,
    images: JSON.stringify(d.images),
    basePrice: d.type === "APPAREL" ? d.basePrice : Math.min(...(d.options.sizes ?? []).map((s) => s.price), d.basePrice || Infinity),
    compareAtPrice: d.compareAtPrice,
    options: JSON.stringify(options),
    tiers: JSON.stringify([...d.tiers].sort((a, b) => a.minQty - b.minQty)),
    features: JSON.stringify(d.features),
    stock: d.stock,
    featured: d.featured,
    active: d.active,
  };

  const row = d.id ? await db.product.update({ where: { id: d.id }, data }) : await db.product.create({ data });
  revalidateCatalog(row.id);
  return { ok: true, id: row.id, message: d.id ? "Product saved" : "Product created" };
}

export async function duplicateProduct(id: string): Promise<Result<{ id: string }>> {
  await requireAdmin();
  const p = await db.product.findUnique({ where: { id } });
  if (!p) return { ok: false, error: "Product not found" };
  const slug = await uniqueSlug(`${p.slug}-copy`);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, createdAt, updatedAt, ...rest } = p;
  const copy = await db.product.create({ data: { ...rest, name: `${p.name} (copy)`, slug, sku: null, active: false, featured: false } });
  revalidateCatalog();
  return { ok: true, id: copy.id, message: "Duplicated as a hidden draft" };
}

export async function deleteProduct(id: string): Promise<Result<{ archived: boolean }>> {
  await requireAdmin();
  const p = await db.product.findUnique({ where: { id }, select: { id: true, _count: { select: { orderItems: true } } } });
  if (!p) return { ok: false, error: "Product not found" };
  if (p._count.orderItems > 0) {
    await db.product.update({ where: { id }, data: { active: false, featured: false } });
    revalidateCatalog(id);
    return { ok: true, archived: true, message: `Archived instead — it appears on ${p._count.orderItems} order line${p._count.orderItems === 1 ? "" : "s"}` };
  }
  await db.product.delete({ where: { id } });
  revalidateCatalog();
  return { ok: true, archived: false, message: "Product deleted" };
}

export async function setProductFlag(id: string, flag: "active" | "featured", value: boolean): Promise<Result> {
  await requireAdmin();
  if (!["active", "featured"].includes(flag)) return { ok: false, error: "Invalid flag" };
  await db.product.update({ where: { id }, data: { [flag]: value } });
  revalidateCatalog(id);
  return { ok: true, message: flag === "active" ? (value ? "Product is live" : "Product hidden from store") : value ? "Featured on homepage" : "Removed from featured" };
}
