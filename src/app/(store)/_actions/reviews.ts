"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type ReviewState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string[] | undefined> } | undefined;

const schema = z.object({
  productId: z.string().min(1).max(64),
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(10, "Tell us a bit more (10+ characters)").max(2000),
});

export async function submitReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to write a review." };
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const product = await db.product.findUnique({ where: { id: parsed.data.productId }, select: { slug: true } });
  if (!product) return { error: "Product not found." };
  await db.review.create({
    data: {
      productId: parsed.data.productId,
      userId: user.id,
      name: user.name,
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      body: parsed.data.body,
      status: "PENDING",
    },
  });
  revalidatePath(`/products/${product.slug}`);
  return { ok: true };
}
