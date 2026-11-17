import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Raw HTML of a logged email, for the admin preview iframe. Sandboxed: no scripts, no forms. */
export async function GET(_req: Request, ctx: RouteContext<"/api/admin/emails/[id]">) {
  await requireAdmin();
  const { id } = await ctx.params;
  const log = await db.emailLog.findUnique({ where: { id }, select: { html: true } });
  if (!log) return new Response("Not found", { status: 404 });
  return new Response(log.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "sandbox allow-popups allow-popups-to-escape-sandbox; default-src 'none'; img-src * data:; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
