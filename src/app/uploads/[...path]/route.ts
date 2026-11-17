import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { MIME_BY_EXT, UPLOAD_ROOT } from "@/lib/uploads";

export async function GET(_req: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const { path: parts } = await ctx.params;
  const target = path.normalize(path.join(/*turbopackIgnore: true*/ UPLOAD_ROOT, ...parts));
  if (!target.startsWith(UPLOAD_ROOT + path.sep)) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const info = await stat(target);
    if (!info.isFile()) throw new Error("not a file");
    const data = await readFile(target);
    const ext = path.extname(target).slice(1).toLowerCase();
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        // Uploaded SVGs are user content — never let them run script in our origin.
        "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
