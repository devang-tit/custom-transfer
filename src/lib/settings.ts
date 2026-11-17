import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/pricing";
import type { StoreSettings } from "@/lib/types";

const SETTINGS_KEY = "store";

/** Store settings merged over defaults. Cached per request. */
export const getSettings = cache(async (): Promise<StoreSettings> => {
  const row = await db.setting.findUnique({ where: { key: SETTINGS_KEY } });
  if (!row) return DEFAULT_SETTINGS;
  try {
    const saved = JSON.parse(row.value) as Partial<StoreSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      notifications: { ...DEFAULT_SETTINGS.notifications, ...(saved.notifications ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
});

export async function saveSettings(patch: Partial<StoreSettings>) {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await db.setting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return next;
}
