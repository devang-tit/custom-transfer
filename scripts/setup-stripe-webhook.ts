/**
 * Ensures a Stripe webhook endpoint exists for this store and stores its signing secret
 * in the database (Setting "stripe_webhook"). Runs during `npm run vercel-build`.
 *
 * - Only for production deployments with STRIPE_SECRET_KEY and a public NEXT_PUBLIC_SITE_URL.
 * - Skipped when STRIPE_WEBHOOK_SECRET is set (you manage the endpoint yourself).
 * - Idempotent: an existing healthy endpoint is reused; stale ones created by this app are replaced.
 * - Never fails the build and never prints the secret.
 */
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { appDatabaseUrl } from "../src/lib/database-url";

const SETTING_KEY = "stripe_webhook";
const APP_TAG = "inkforge";
const EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
];

type Stored = { endpointId: string; secret: string; url: string; livemode: boolean; createdAt: string };

const log = (msg: string) => console.log(`[stripe-webhook] ${msg}`);

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return log("skipped: STRIPE_SECRET_KEY is not set");
  if (process.env.STRIPE_WEBHOOK_SECRET) return log("skipped: STRIPE_WEBHOOK_SECRET is set (endpoint managed manually)");
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv && vercelEnv !== "production") return log(`skipped: ${vercelEnv} deployment`);
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  if (!/^https:\/\//.test(site)) return log("skipped: NEXT_PUBLIC_SITE_URL is not a public https URL");

  const url = `${site}/api/stripe/webhook`;
  const stripe = new Stripe(secretKey);
  const db = new PrismaClient({ datasourceUrl: appDatabaseUrl() });
  try {
    const row = await db.setting.findUnique({ where: { key: SETTING_KEY } });
    const stored: Stored | null = row ? (JSON.parse(row.value) as Stored) : null;

    // Reuse the stored endpoint if it still exists, points here and is enabled.
    if (stored?.secret && stored.url === url) {
      const existing = await stripe.webhookEndpoints.retrieve(stored.endpointId).catch(() => null);
      if (existing && existing.url === url && existing.status === "enabled") {
        const missing = EVENTS.filter((e) => !existing.enabled_events.includes(e) && !existing.enabled_events.includes("*"));
        if (missing.length) {
          await stripe.webhookEndpoints.update(existing.id, { enabled_events: EVENTS });
          return log(`updated events on ${existing.id} → ${url}`);
        }
        return log(`ok: ${existing.id} (${existing.livemode ? "live" : "test"} mode) → ${url}`);
      }
    }

    // Remove endpoints this app created earlier for this URL (their secrets are unrecoverable).
    for await (const ep of stripe.webhookEndpoints.list({ limit: 100 })) {
      if (ep.metadata?.app === APP_TAG && (ep.url === url || ep.id === stored?.endpointId)) {
        await stripe.webhookEndpoints.del(ep.id);
        log(`removed stale endpoint ${ep.id}`);
      }
    }

    const ep = await stripe.webhookEndpoints.create({
      url,
      enabled_events: EVENTS,
      description: "InkForge order payments (managed by deploy)",
      metadata: { app: APP_TAG },
    });
    if (!ep.secret) throw new Error("Stripe did not return a signing secret");
    const value: Stored = { endpointId: ep.id, secret: ep.secret, url, livemode: ep.livemode, createdAt: new Date().toISOString() };
    await db.setting.upsert({
      where: { key: SETTING_KEY },
      create: { key: SETTING_KEY, value: JSON.stringify(value) },
      update: { value: JSON.stringify(value) },
    });
    log(`created ${ep.id} (${ep.livemode ? "live" : "test"} mode) → ${url}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  // Never block a deploy on Stripe; checkout still confirms payment on the success page.
  const lines = (e instanceof Error ? e.message : String(e)).split("\n").map((l) => l.trim()).filter(Boolean);
  console.warn(`[stripe-webhook] setup failed, deploy continues: ${lines.at(-1) ?? "unknown error"}`);
});
