import "server-only";
import { PrismaClient } from "@prisma/client";

/**
 * Runtime connection string.
 *
 * On Vercel the Postgres integration provides two URLs:
 * - DATABASE_URL: a direct connection for migrations, with a small connection cap.
 * - DATABASE_URL_POOLED: a connection pooler meant for app traffic.
 *
 * Serverless functions scale out to many instances, and each one opens its own Prisma pool.
 * Using the direct URL at runtime exhausts its cap ("too many connections for role …").
 * So the app talks to the pooler with one connection per instance. Prepared statements are
 * off (pgbouncer=true) so transaction-mode pooling works. Migrations keep using DATABASE_URL
 * via schema.prisma. Locally, without a pooled URL, DATABASE_URL is used as-is plus timeouts.
 */
function runtimeDatabaseUrl(): string | undefined {
  const pooled = process.env.DATABASE_URL_POOLED?.trim();
  const raw = pooled || process.env.DATABASE_URL?.trim();
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    const set = (k: string, v: string) => {
      if (!url.searchParams.has(k)) url.searchParams.set(k, v);
    };
    if (pooled) {
      set("pgbouncer", "true");
      set("connection_limit", "1");
    }
    set("pool_timeout", "20");
    set("connect_timeout", "15");
    return url.toString();
  } catch {
    return raw;
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: runtimeDatabaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
