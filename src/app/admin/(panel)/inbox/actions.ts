"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

type Result = { ok: true; message?: string } | { ok: false; error: string };
const schema = z.object({ id: z.string().min(1), status: z.enum(["NEW", "READ", "REPLIED"]) });

export async function setMessageStatus(input: z.input<typeof schema>): Promise<Result> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid message" };
  await db.contactMessage.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
  revalidatePath("/admin/inbox");
  return { ok: true, message: parsed.data.status === "REPLIED" ? "Marked as replied" : parsed.data.status === "NEW" ? "Marked as unread" : undefined };
}

export async function deleteMessage(id: string): Promise<Result> {
  await requireAdmin();
  await db.contactMessage.delete({ where: { id } });
  revalidatePath("/admin/inbox");
  return { ok: true, message: "Message deleted" };
}
