import type { DesignItem } from "@/lib/types";
import { IDEAL_DPI, MIN_DPI } from "@/lib/pricing";

/** Editor item. Extends the shared DesignItem with optional text styling. */
export type StudioItem = DesignItem & {
  name?: string;
  fontStyle?: "normal" | "bold" | "italic" | "bold italic";
  letterSpacing?: number;
  /** -100..100 arc for curved text (apparel studio) */
  curve?: number;
};

export type Box = { x: number; y: number; w: number; h: number };

export function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

/** Axis-aligned bounding box of an item, accounting for rotation around its center. */
export function itemBox(it: Pick<DesignItem, "x" | "y" | "width" | "height" | "rotation">): Box {
  const rad = ((it.rotation || 0) * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  const w = it.width * c + it.height * s;
  const h = it.width * s + it.height * c;
  const cx = it.x + it.width / 2;
  const cy = it.y + it.height / 2;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

export function boxesOverlap(a: Box, b: Box, eps = 0.01): boolean {
  return a.x < b.x + b.w - eps && b.x < a.x + a.w - eps && a.y < b.y + b.h - eps && b.y < a.y + a.h - eps;
}

export function isOutside(b: Box, W: number, H: number, eps = 0.01): boolean {
  return b.x < -eps || b.y < -eps || b.x + b.w > W + eps || b.y + b.h > H + eps;
}

export function isVector(it: StudioItem): boolean {
  return it.kind === "text" || !!it.src?.toLowerCase().split("?")[0]!.endsWith(".svg");
}

/**
 * Effective print DPI of an image item. `unitsPerInch` converts item units to inches
 * (1 for gang sheets measured in inches, ~19 for apparel mockup pixels).
 * Returns null for vector content (text/SVG) or unknown sizes.
 */
export function itemDpi(it: StudioItem, unitsPerInch = 1): number | null {
  if (isVector(it)) return null;
  if (!it.naturalWidth || !it.naturalHeight || !it.width || !it.height) return null;
  const wIn = it.width / unitsPerInch;
  const hIn = it.height / unitsPerInch;
  return Math.round(Math.min(it.naturalWidth / wIn, it.naturalHeight / hIn));
}

export type DpiLevel = "vector" | "great" | "ok" | "low";
export function dpiLevel(dpi: number | null): DpiLevel {
  if (dpi === null) return "vector";
  if (dpi >= IDEAL_DPI) return "great";
  if (dpi >= MIN_DPI) return "ok";
  return "low";
}

export type SheetIssues = {
  outside: Set<string>;
  overlapping: Set<string>;
  lowDpi: Set<string>;
};

export function analyzeSheet(items: StudioItem[], W: number, H: number, unitsPerInch = 1): SheetIssues {
  const outside = new Set<string>();
  const overlapping = new Set<string>();
  const lowDpi = new Set<string>();
  const boxes = items.map((it) => ({ id: it.id, b: itemBox(it) }));
  for (let i = 0; i < boxes.length; i++) {
    const a = boxes[i]!;
    if (isOutside(a.b, W, H)) outside.add(a.id);
    for (let j = i + 1; j < boxes.length; j++) {
      const b = boxes[j]!;
      if (boxesOverlap(a.b, b.b)) {
        overlapping.add(a.id);
        overlapping.add(b.id);
      }
    }
  }
  for (const it of items) if (dpiLevel(itemDpi(it, unitsPerInch)) === "low") lowDpi.add(it.id);
  return { outside, overlapping, lowDpi };
}

/** Bounding box of a set of items (null when empty). */
export function unionBox(items: StudioItem[]): Box | null {
  if (!items.length) return null;
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const it of items) {
    const b = itemBox(it);
    x1 = Math.min(x1, b.x);
    y1 = Math.min(y1, b.y);
    x2 = Math.max(x2, b.x + b.w);
    y2 = Math.max(y2, b.y + b.h);
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

export const round = (n: number, p = 2) => Math.round(n * 10 ** p) / 10 ** p;
export const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

/** Short display name for an upload URL / file name. */
export function displayName(it: Pick<StudioItem, "name" | "src" | "text" | "kind">): string {
  if (it.kind === "text") return `“${(it.text ?? "Text").slice(0, 24)}”`;
  if (it.name) return it.name;
  return it.src?.split("/").pop() ?? "Image";
}
