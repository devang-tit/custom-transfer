"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { CONTACT_SUBJECTS } from "@/components/content/contact-subjects";

export type ContactState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string[] | undefined> } | undefined;


const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.email("Enter a valid email").transform((v) => v.toLowerCase().trim()),
  subject: z.enum(CONTACT_SUBJECTS, { error: "Pick a topic" }),
  orderNumber: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => (v ? v.toUpperCase() : undefined)),
  message: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(5000),
  // Honeypot: real users never see or fill this.
  website: z.string().optional(),
});

export async function submitContactAction(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { name, email, subject, orderNumber, message, website } = parsed.data;
  if (website) return { ok: true }; // silently drop bots

  await db.contactMessage.create({
    data: {
      name,
      email,
      subject: orderNumber ? `${subject} · ${orderNumber}` : subject,
      message,
    },
  });
  return { ok: true };
}
