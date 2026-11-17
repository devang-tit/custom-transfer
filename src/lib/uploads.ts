import "server-only";
import path from "node:path";

/** Uploaded files live outside /public so they are served in production builds too. */
// turbopackIgnore: resolved at runtime; stops the bundler tracing the whole project.
export const UPLOAD_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "storage", "uploads");
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB

export const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

export const MIME_BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(ALLOWED_UPLOAD_TYPES).map(([mime, ext]) => [ext, mime])
);
