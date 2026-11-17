import "server-only";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/json";

/** Written by scripts/setup-stripe-webhook.ts during production deploys. */
const SETTING_KEY = "stripe_webhook";

type Stored = { endpointId: string; secret: string; url: string; livemode: boolean; createdAt: string };

async function readStored(): Promise<Stored | null> {
  const row = await db.setting.findUnique({ where: { key: SETTING_KEY } });
  return parseJson<Stored | null>(row?.value, null);
}

/** Signing secret: STRIPE_WEBHOOK_SECRET if set, otherwise the one saved by the deploy script. */
export async function getStripeWebhookSecret(): Promise<string | null> {
  const env = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (env) return env;
  return (await readStored())?.secret ?? null;
}

export type StripeStatus = {
  enabled: boolean;
  mode: "live" | "test" | "unknown";
  webhook: { source: "env" | "auto"; url?: string; endpointId?: string; createdAt?: string } | null;
};

/** Safe-to-display Stripe status for the admin (never includes secrets). */
export async function getStripeStatus(): Promise<StripeStatus> {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const mode = /^(sk|rk)_live_/.test(key) ? "live" : /^(sk|rk)_test_/.test(key) ? "test" : "unknown";
  if (process.env.STRIPE_WEBHOOK_SECRET?.trim()) return { enabled: !!key, mode, webhook: { source: "env" } };
  const stored = await readStored();
  return {
    enabled: !!key,
    mode,
    webhook: stored ? { source: "auto", url: stored.url, endpointId: stored.endpointId, createdAt: stored.createdAt } : null,
  };
}
