import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES, UPLOAD_ROOT } from "@/lib/uploads";

/**
 * POST multipart/form-data with a `file` field. Returns { url, name, size, type }.
 * Storage: Vercel Blob when BLOB_READ_WRITE_TOKEN is set (required on Vercel, whose
 * filesystem is read-only), otherwise local disk under storage/uploads served at /uploads/...
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  const ext = ALLOWED_UPLOAD_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Unsupported file type. Use PNG, JPG, WEBP, SVG, GIF or PDF." }, { status: 415 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File is larger than 50MB" }, { status: 413 });
  }

  const now = new Date();
  const folder = path.join(String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"));
  const filename = `${nanoid(12)}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`uploads/${folder.split(path.sep).join("/")}/${filename}`, file, {
        access: "public",
        contentType: file.type,
        addRandomSuffix: false,
      });
      return NextResponse.json({ url: blob.url, name: file.name, size: file.size, type: file.type });
    } catch (e) {
      console.error("[upload] Blob upload failed", e);
      return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 502 });
    }
  }

  const dir = path.join(/*turbopackIgnore: true*/ UPLOAD_ROOT, folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ dir, filename), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({
    url: `/uploads/${folder.split(path.sep).join("/")}/${filename}`,
    name: file.name,
    size: file.size,
    type: file.type,
  });
}
