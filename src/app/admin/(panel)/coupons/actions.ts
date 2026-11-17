"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const schema = z
  .object({
    id: z.string().optional(),
    code: z
      .string()
      .trim()
      .min(3, "Code must be at least 3 characters")
      .max(32)
      .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, dashes and underscores only")
      .transform((v) => v.toUpperCase()),
    description: z.string().trim().max(200).optional(),
    type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
    value: z.number().int().min(0),
    minSubtotal: z.number().int().min(0),
    maxUses: z.number().int().min(1).nullable(),
    startsAt: z.string().nullable(),
    expiresAt: z.string().nullable(),
    active: z.boolean(),
  })
  .refine((d) => d.type !== "PERCENT" || (d.value >= 1 && d.value <= 100), { message: "Percent must be between 1 and 100", path: ["value"] })
  .refine((d) => d.type !== "FIXED" || d.value >= 1, { message: "Enter a discount amount", path: ["value"] })
  .refine((d) => !d.startsAt || !d.expiresAt || new Date(d.startsAt) < new Date(d.expiresAt), { message: "End date must be after start date", path: ["expiresAt"] });

export async function saveCoupon(input: z.input<typeof schema>): Promise<Result> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid coupon" };
  const { id, startsAt, expiresAt, description, ...d } = parsed.data;
  const clash = await db.coupon.findUnique({ where: { code: d.code }, select: { id: true } });
  if (clash && clash.id !== id) return { ok: false, error: `Code ${d.code} already exists` };
  const data = {
    ...d,
    value: d.type === "FREE_SHIPPING" ? 0 : d.value,
    description: description || null,
    startsAt: startsAt ? new Date(startsAt) : null,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  };
  if (id) await db.coupon.update({ where: { id }, data });
  else await db.coupon.create({ data });
  revalidatePath("/admin/coupons");
  return { ok: true, message: id ? "Coupon saved" : `Coupon ${d.code} created` };
}

export async function toggleCoupon(id: string, active: boolean): Promise<Result> {
  await requireAdmin();
  await db.coupon.update({ where: { id }, data: { active } });
  revalidatePath("/admin/coupons");
  return { ok: true, message: active ? "Coupon activated" : "Coupon paused" };
}

export async function deleteCoupon(id: string): Promise<Result> {
  await requireAdmin();
  await db.coupon.delete({ where: { id } });
  revalidatePath("/admin/coupons");
  return { ok: true, message: "Coupon deleted" };
}
