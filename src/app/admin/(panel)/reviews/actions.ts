"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

type Result = { ok: true; message?: string } | { ok: false; error: string };
const schema = z.object({ ids: z.array(z.string().min(1)).min(1).max(200), action: z.enum(["APPROVED", "REJECTED", "PENDING", "DELETE"]) });

export async function moderateReviews(input: z.input<typeof schema>): Promise<Result> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Nothing selected" };
  const { ids, action } = parsed.data;
  const products = await db.review.findMany({ where: { id: { in: ids } }, select: { product: { select: { slug: true } } } });
  if (action === "DELETE") await db.review.deleteMany({ where: { id: { in: ids } } });
  else await db.review.updateMany({ where: { id: { in: ids } }, data: { status: action } });
  revalidatePath("/admin/reviews");
  for (const p of new Set(products.map((r) => r.product.slug))) revalidatePath(`/products/${p}`);
  const n = ids.length;
  const noun = `${n} review${n === 1 ? "" : "s"}`;
  return { ok: true, message: action === "DELETE" ? `${noun} deleted` : action === "APPROVED" ? `${noun} published` : action === "REJECTED" ? `${noun} rejected` : `${noun} moved to pending` };
}
