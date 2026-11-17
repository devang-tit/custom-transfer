"use client";

import { useCallback, useRef, useState } from "react";
import { FileImage, Loader2, UploadCloud, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadFile, readImageSize, formatBytes, type UploadResult } from "@/lib/upload-client";
import { MIN_DPI, IDEAL_DPI } from "@/lib/pricing";

export type UploadedArtwork = UploadResult & { width: number; height: number };

/**
 * Drag & drop artwork uploader with preview and print-size DPI check.
 * Pass printWidthIn/printHeightIn to show resolution feedback for the chosen size.
 */
export function FileDropzone({
  value,
  onChange,
  printWidthIn,
  printHeightIn,
  accept = "image/png,image/jpeg,image/webp,image/svg+xml,application/pdf",
  className,
  compact = false,
  label = "Upload your artwork",
  hint = "PNG with transparent background works best · up to 50MB",
}: {
  value: UploadedArtwork | null;
  onChange: (file: UploadedArtwork | null) => void;
  printWidthIn?: number;
  printHeightIn?: number;
  accept?: string;
  className?: string;
  compact?: boolean;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      setBusy(true);
      try {
        const res = await uploadFile(file, file.name);
        const dims = file.type.startsWith("image/") ? await readImageSize(res.url) : { width: 0, height: 0 };
        onChange({ ...res, ...dims });
        toast.success("Artwork uploaded");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [onChange]
  );

  if (value) {
    const isImage = value.type.startsWith("image/");
    let dpi = 0;
    if (isImage && value.width && printWidthIn && printHeightIn && value.type !== "image/svg+xml") {
      const imgRatio = value.width / value.height;
      const boxRatio = printWidthIn / printHeightIn;
      // Artwork is fit inside the print box; DPI is limited by the constraining side.
      dpi = imgRatio >= boxRatio ? value.width / printWidthIn : value.height / printHeightIn;
      dpi = Math.round(dpi);
    }
    const quality = value.type === "image/svg+xml" || value.type === "application/pdf" ? "vector" : !dpi ? null : dpi >= IDEAL_DPI ? "great" : dpi >= MIN_DPI ? "ok" : "low";
    return (
      <div className={cn("flex items-center gap-4 rounded-xl border bg-card p-3", className)}>
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-checker">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.url} alt={value.name} className="size-full object-contain" />
          ) : (
            <FileImage className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{value.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(value.size)}
            {value.width ? ` · ${value.width}×${value.height}px` : ""}
          </p>
          {quality && (
            <p
              className={cn(
                "mt-1 inline-flex items-center gap-1 text-xs font-medium",
                quality === "low" ? "text-destructive" : quality === "ok" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {quality === "low" ? <AlertTriangle className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
              {quality === "vector" && "Vector file — prints sharp at any size"}
              {quality === "great" && `${dpi} DPI — excellent print quality`}
              {quality === "ok" && `${dpi} DPI — good, 300 DPI recommended`}
              {quality === "low" && `${dpi} DPI — may print blurry at this size`}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Remove file"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        compact ? "gap-1 px-4 py-5" : "gap-2 px-6 py-10",
        dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/40",
        className
      )}
    >
      <input ref={inputRef} type="file" accept={accept} className="sr-only" onChange={(e) => void handleFiles(e.target.files)} />
      <div className={cn("grid place-items-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-105", compact ? "size-9" : "size-12")}>
        {busy ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
      </div>
      <p className="text-sm font-medium">{busy ? "Uploading…" : label}</p>
      {!compact && <p className="text-xs text-muted-foreground">Drag & drop or click to browse · {hint}</p>}
    </div>
  );
}
