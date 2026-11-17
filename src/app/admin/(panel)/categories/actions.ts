"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required").max(80),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(500).optional(),
  image: z.string().trim().max(500).optional(),
  sortOrder: z.number().int().min(0).max(9999),
});

export async function saveCategory(input: z.input<typeof schema>): Promise<Result> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid category" };
  const { id, name, description, image, sortOrder } = parsed.data;
  const slug = slugify(parsed.data.slug || name);
  if (!slug) return { ok: false, error: "Slug is required" };
  const clash = await db.category.findUnique({ where: { slug }, select: { id: true } });
  if (clash && clash.id !== id) return { ok: false, error: `Slug “${slug}” is already used` };
  const data = { name, slug, description: description || null, image: image || null, sortOrder };
  if (id) await db.category.update({ where: { id }, data });
  else await db.category.create({ data });
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  return { ok: true, message: id ? "Category saved" : "Category created" };
}

export async function deleteCategory(id: string): Promise<Result> {
  await requireAdmin();
  const cat = await db.category.findUnique({ where: { id }, select: { _count: { select: { products: true } } } });
  if (!cat) return { ok: false, error: "Category not found" };
  if (cat._count.products > 0) return { ok: false, error: `Move its ${cat._count.products} product(s) to another category first` };
  await db.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  return { ok: true, message: "Category deleted" };
}
