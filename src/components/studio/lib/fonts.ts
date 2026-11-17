"use client";

/** Fonts offered in the editors. `cssVar` fonts come from next/font (hashed family names). */
export const STUDIO_FONTS: { key: string; label: string; cssVar?: string; stack?: string }[] = [
  { key: "Bricolage Grotesque", label: "Bricolage Grotesque", cssVar: "--font-bricolage" },
  { key: "Geist", label: "Geist", cssVar: "--font-geist" },
  { key: "Geist Mono", label: "Geist Mono", cssVar: "--font-geist-mono" },
  { key: "Impact", label: "Impact", stack: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif" },
  { key: "Arial Black", label: "Arial Black", stack: "'Arial Black', 'Arial Bold', Gadget, sans-serif" },
  { key: "Georgia", label: "Georgia", stack: "Georgia, 'Times New Roman', serif" },
  { key: "Courier", label: "Courier", stack: "'Courier New', Courier, monospace" },
  { key: "Trebuchet", label: "Trebuchet", stack: "'Trebuchet MS', Helvetica, sans-serif" },
  { key: "Brush Script", label: "Brush Script", stack: "'Brush Script MT', 'Segoe Script', cursive" },
];

export const DEFAULT_FONT = "Bricolage Grotesque";

const resolved = new Map<string, string>();

/** Font key → canvas-usable font-family list. */
export function resolveFont(key: string | undefined): string {
  const k = key ?? DEFAULT_FONT;
  const hit = resolved.get(k);
  if (hit) return hit;
  const def = STUDIO_FONTS.find((f) => f.key === k);
  let family = def?.stack ?? k;
  if (def?.cssVar && typeof window !== "undefined") {
    const v = getComputedStyle(document.documentElement).getPropertyValue(def.cssVar).trim();
    if (v) family = v;
  }
  if (typeof window !== "undefined") resolved.set(k, family);
  return family;
}

/** CSS font-family for previews in DOM (font picker). */
export function fontCss(key: string): string {
  const def = STUDIO_FONTS.find((f) => f.key === key);
  if (def?.cssVar) return `var(${def.cssVar})`;
  return def?.stack ?? key;
}
