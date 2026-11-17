"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createSession, requireUser } from "@/lib/auth";
import { notifyPasswordChanged } from "@/lib/email/notify";
import { parseJson } from "@/lib/json";
import { priceLine } from "@/lib/pricing";
import { toPricingProduct, toProductDTO, productImage } from "@/lib/products";
import type { LineSelection } from "@/lib/types";
import type { CartItem } from "@/stores/cart";

export type FormState = { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string[] | undefined> } | undefined;

const optional = z
  .string()
  .trim()
  .transform((v) => (v ? v : undefined))
  .optional();

/* ---------------- Profile ---------------- */

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  phone: optional,
  company: optional,
  marketingOptIn: z.string().optional(),
});

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/profile");
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { name, phone, company, marketingOptIn } = parsed.data;
  await db.user.update({
    where: { id: user.id },
    data: { name, phone: phone ?? null, company: company ?? null, marketingOptIn: marketingOptIn === "on" },
  });
  revalidatePath("/account", "layout");
  return { ok: true, message: "Profile updated" };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/profile");
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const row = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!row || !(await bcrypt.compare(parsed.data.currentPassword, row.passwordHash))) {
    return { fieldErrors: { currentPassword: ["Current password is incorrect"] } };
  }
  const updated = await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10), passwordChangedAt: new Date() },
    select: { id: true, email: true, name: true, role: true, passwordChangedAt: true },
  });
  // Signs out other devices (their sessions predate passwordChangedAt) but keeps this one.
  await createSession(updated);
  notifyPasswordChanged(user.id, "account");
  return { ok: true, message: "Password changed. Other devices have been signed out" };
}

/* ---------------- Addresses ---------------- */

const addressSchema = z.object({
  id: optional,
  label: z.string().trim().min(1, "Give this address a label").max(40),
  name: z.string().trim().min(2, "Enter the recipient name"),
  company: optional,
  line1: z.string().trim().min(3, "Enter a street address"),
  line2: optional,
  city: z.string().trim().min(2, "Enter a city"),
  state: z.string().trim().min(2, "Enter a state"),
  zip: z.string().trim().regex(/^[A-Za-z0-9 -]{3,10}$/, "Enter a valid ZIP / postal code"),
  country: z.string().trim().min(2).default("US"),
  phone: optional,
  isDefault: z.string().optional(),
});

export async function saveAddressAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/addresses");
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { id, isDefault, ...data } = parsed.data;
  const count = await db.address.count({ where: { userId: user.id } });
  const makeDefault = isDefault === "on" || count === 0;

  await db.$transaction(async (tx) => {
    if (makeDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    const payload = {
      ...data,
      company: data.company ?? null,
      line2: data.line2 ?? null,
      phone: data.phone ?? null,
      ...(makeDefault ? { isDefault: true } : {}),
    };
    if (id) {
      const res = await tx.address.updateMany({ where: { id, userId: user.id }, data: payload });
      if (res.count === 0) throw new Error("Address not found");
    } else {
      await tx.address.create({ data: { ...payload, userId: user.id } });
    }
  });
  revalidatePath("/account/addresses");
  return { ok: true, message: id ? "Address updated" : "Address added" };
}

export async function deleteAddressAction(id: string) {
  const user = await requireUser("/account/addresses");
  const addr = await db.address.findFirst({ where: { id, userId: user.id } });
  if (!addr) return { error: "Address not found" };
  await db.address.delete({ where: { id: addr.id } });
  if (addr.isDefault) {
    const next = await db.address.findFirst({ where: { userId: user.id }, orderBy: { id: "asc" } });
    if (next) await db.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function setDefaultAddressAction(id: string) {
  const user = await requireUser("/account/addresses");
  const addr = await db.address.findFirst({ where: { id, userId: user.id } });
  if (!addr) return { error: "Address not found" };
  await db.$transaction([
    db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    db.address.update({ where: { id: addr.id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/account/addresses");
  return { ok: true };
}

/* ---------------- Designs ---------------- */

export async function renameDesignAction(id: string, name: string) {
  const user = await requireUser("/account/designs");
  const clean = name.trim().slice(0, 80);
  if (clean.length < 1) return { error: "Name can't be empty" };
  const res = await db.savedDesign.updateMany({ where: { id, userId: user.id }, data: { name: clean } });
  if (res.count === 0) return { error: "Design not found" };
  revalidatePath("/account/designs");
  return { ok: true };
}

export async function deleteDesignAction(id: string) {
  const user = await requireUser("/account/designs");
  const res = await db.savedDesign.deleteMany({ where: { id, userId: user.id } });
  if (res.count === 0) return { error: "Design not found" };
  revalidatePath("/account/designs");
  revalidatePath("/account");
  return { ok: true };
}

/* ---------------- Wishlist ---------------- */

export async function removeFromWishlistAction(productId: string) {
  const user = await requireUser("/account/wishlist");
  await db.wishlistItem.deleteMany({ where: { userId: user.id, productId } });
  revalidatePath("/account/wishlist");
  return { ok: true };
}

/* ---------------- Reorder ---------------- */

export type ReorderResult = { lines: Omit<CartItem, "id">[]; skipped: string[]; error?: string };

/** Re-prices every line of a past order at today's prices. The client adds them to the cart. */
export async function reorderAction(orderNumber: string): Promise<ReorderResult> {
  const user = await requireUser("/account/orders");
  const order = await db.order.findFirst({
    where: { number: orderNumber, userId: user.id },
    include: { items: true },
  });
  if (!order) return { lines: [], skipped: [], error: "Order not found" };

  const productIds = order.items.map((i) => i.productId).filter((v): v is string => !!v);
  const products = await db.product.findMany({
    where: { id: { in: productIds }, active: true },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });
  const byId = new Map(products.map((p) => [p.id, toProductDTO(p)]));

  const lines: Omit<CartItem, "id">[] = [];
  const skipped: string[] = [];
  for (const item of order.items) {
    const product = item.productId ? byId.get(item.productId) : undefined;
    if (!product) {
      skipped.push(item.name);
      continue;
    }
    const selection = parseJson<LineSelection>(item.selection, { quantity: item.quantity });
    if (!selection.quantity) selection.quantity = item.quantity;
    // Drop options that no longer exist on the product.
    if (selection.sizeId && !product.options.sizes?.some((s) => s.id === selection.sizeId)) {
      skipped.push(item.name);
      continue;
    }
    const price = priceLine(toPricingProduct(product), selection);
    if (price.quantity <= 0) {
      skipped.push(item.name);
      continue;
    }
    lines.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      type: product.type,
      image: item.artworkUrl && /\.(png|jpe?g|webp|svg|gif)$/i.test(item.artworkUrl) ? item.artworkUrl : (item.image ?? productImage(product)),
      variantLabel: price.variantLabel || item.variantLabel || "",
      selection,
      quantity: price.quantity,
      unitPrice: price.unitPrice,
      total: price.total,
      artworkUrl: item.artworkUrl ?? undefined,
      artworkName: item.artworkUrl ? `Artwork from ${order.number}` : undefined,
      designId: item.designId ?? undefined,
    });
  }
  return { lines, skipped };
}
