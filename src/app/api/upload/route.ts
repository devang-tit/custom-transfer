import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES, UPLOAD_ROOT } from "@/lib/uploads";

/**
 * POST multipart/form-data with a `file` field.
 * Returns { url, name, size, type }. Files are served from /uploads/...
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
