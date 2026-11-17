import "server-only";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { isStaffRole } from "@/lib/session-token";
import type { CurrentUser } from "@/lib/auth";

export type LoadedDesign<T> = { id: string; name: string; owned: boolean; data: T };

/** Load a saved design the viewer may open: their own, a guest design, or any design for staff. */
export async function loadDesign<T>(
  id: string | undefined,
  kind: "GANG_SHEET" | "APPAREL",
  user: CurrentUser | null
): Promise<LoadedDesign<T> | null> {
  if (!id) return null;
  const d = await db.savedDesign.findUnique({ where: { id } });
  if (!d || d.kind !== kind) return null;
  const owned = !!user && d.userId === user.id;
  if (d.userId && !owned && !isStaffRole(user?.role)) return null;
  return { id: d.id, name: d.name, owned, data: parseJson<T>(d.data, {} as T) };
}
