/**
 * App-traffic connection string (shared by the Next.js app and build scripts).
 *
 * On Vercel the Postgres integration provides two URLs:
 * - DATABASE_URL: a direct connection for migrations, with a small connection cap.
 * - DATABASE_URL_POOLED: a connection pooler meant for app traffic.
 *
 * Serverless functions scale out to many instances, each with its own Prisma pool, so
 * pointing them at the direct URL exhausts its cap ("too many connections for role …").
 * App traffic therefore goes through the pooler with a small pool per instance, and
 * prepared statements are off (pgbouncer=true) so transaction-mode pooling works.
 * Migrations keep using DATABASE_URL via schema.prisma. Without a pooled URL (local
 * development), DATABASE_URL is used as-is plus timeouts.
 */
export function appDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const pooled = env.DATABASE_URL_POOLED?.trim();
  const raw = pooled || env.DATABASE_URL?.trim();
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    const set = (k: string, v: string) => {
      if (!url.searchParams.has(k)) url.searchParams.set(k, v);
    };
    if (pooled) {
      set("pgbouncer", "true");
      // Fluid compute serves many requests per instance; the pooler multiplexes, so allow a few.
      set("connection_limit", "5");
    }
    set("pool_timeout", "20");
    set("connect_timeout", "15");
    return url.toString();
  } catch {
    return raw;
  }
}
