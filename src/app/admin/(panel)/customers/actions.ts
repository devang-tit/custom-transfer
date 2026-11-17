"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const schema = z.object({ userId: z.string().min(1), role: z.enum(["CUSTOMER", "STAFF", "ADMIN"]) });

export async function setUserRole(input: z.input<typeof schema>): Promise<Result> {
  const me = await requireAdmin();
  if (me.role !== "ADMIN") return { ok: false, error: "Only administrators can change roles" };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid role" };
  const { userId, role } = parsed.data;
  if (userId === me.id && role !== "ADMIN") return { ok: false, error: "You can't remove your own admin access" };
  if (role !== "ADMIN") {
    const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (target?.role === "ADMIN") {
      const admins = await db.user.count({ where: { role: "ADMIN" } });
      if (admins <= 1) return { ok: false, error: "There must be at least one administrator" };
    }
  }
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${userId}`);
  return { ok: true, message: `Role changed to ${role.toLowerCase()}` };
}
