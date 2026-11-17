"use server";

import { z } from "zod";
import { isAllowedAssetUrl } from "@/lib/asset-url";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const saveSchema = z.object({
  id: z.string().max(64).nullish(),
  name: z.string().trim().min(1, "Give your design a name").max(80),
  kind: z.enum(["GANG_SHEET", "APPAREL"]),
  data: z.string().max(1_000_000, "Design is too large to save"),
  previewUrl: z.string().max(300).refine(isAllowedAssetUrl, "Invalid preview URL").nullish(),
  widthIn: z.number().positive().max(1000).nullish(),
  heightIn: z.number().positive().max(1000).nullish(),
});

export type SaveDesignInput = z.input<typeof saveSchema>;
export type SaveDesignResult = { ok: true; id: string; owned: boolean } | { ok: false; error: string };

/**
 * Create or update a saved design. Updates in place only when the design belongs to the
 * signed-in user; otherwise a new design is created (guest designs have userId = null).
 */
export async function saveDesignAction(input: SaveDesignInput): Promise<SaveDesignResult> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid design" };
  const { id, name, kind, data, previewUrl, widthIn, heightIn } = parsed.data;
  try {
    JSON.parse(data);
  } catch {
    return { ok: false, error: "Invalid design data" };
  }

  const user = await getCurrentUser();
  const fields = {
    name,
    kind,
    data,
    previewUrl: previewUrl ?? null,
    widthIn: widthIn ?? null,
    heightIn: heightIn ?? null,
  };

  if (id && user) {
    const existing = await db.savedDesign.findUnique({ where: { id }, select: { userId: true } });
    if (existing && existing.userId === user.id) {
      await db.savedDesign.update({ where: { id }, data: fields });
      return { ok: true, id, owned: true };
    }
  }
  const created = await db.savedDesign.create({ data: { ...fields, userId: user?.id ?? null } });
  return { ok: true, id: created.id, owned: !!user };
}
