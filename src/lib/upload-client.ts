"use client";

export type UploadResult = { url: string; name: string; size: number; type: string };

/** Upload a File/Blob to /api/upload. Throws with a friendly message on failure. */
export async function uploadFile(file: File | Blob, filename = "upload.png"): Promise<UploadResult> {
  const body = new FormData();
  body.append("file", file instanceof File ? file : new File([file], filename, { type: file.type || "image/png" }));
  const res = await fetch("/api/upload", { method: "POST", body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Upload failed");
  return json as UploadResult;
}

/** Read natural pixel size of an image URL (0×0 for non-images like PDF). */
export function readImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = src;
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
