"use server";

import { z } from "zod";
import { db } from "@/lib/db";

export type NewsletterState = { ok?: boolean; error?: string } | undefined;

export async function subscribeNewsletter(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const parsed = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { error: "Please enter a valid email address." };
  await db.newsletterSubscriber.upsert({
    where: { email: parsed.data },
    create: { email: parsed.data },
    update: {},
  });
  return { ok: true };
}
