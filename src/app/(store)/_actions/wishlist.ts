"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export type WishlistResult = { ok: true; wishlisted: boolean } | { ok: false; needsLogin?: boolean; error?: string };

export async function toggleWishlist(productId: string): Promise<WishlistResult> {
  const id = z.string().min(1).max(64).safeParse(productId);
  if (!id.success) return { ok: false, error: "Invalid product" };
  const session = await getSession();
  if (!session) return { ok: false, needsLogin: true };
  const key = { userId_productId: { userId: session.sub, productId: id.data } };
  const existing = await db.wishlistItem.findUnique({ where: key });
  if (existing) {
    await db.wishlistItem.delete({ where: key });
  } else {
    const product = await db.product.findUnique({ where: { id: id.data }, select: { id: true } });
    if (!product) return { ok: false, error: "Product not found" };
    await db.wishlistItem.create({ data: { userId: session.sub, productId: id.data } });
  }
  revalidatePath("/account/wishlist");
  return { ok: true, wishlisted: !existing };
}
