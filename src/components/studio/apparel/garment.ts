import { HOODIE_HOOD, HOODIE_PATH, HOODIE_POCKET, PRINT_AREAS, TEE_COLLAR_BACK, TEE_COLLAR_FRONT, TEE_PATH } from "@/lib/mockups";

export type Side = "front" | "back";
export type Area = { x: number; y: number; width: number; height: number };

/** Mockup pixels per printed inch (front print area 230px ≈ 12"). */
export const PX_PER_IN = PRINT_AREAS.front.width / 12;

export function isHoodie(slug: string) {
  return slug.includes("hoodie");
}

/** Printable area per garment + side, in 800×800 mockup coordinates. */
export function printArea(slug: string, side: Side): Area {
  if (isHoodie(slug)) {
    return side === "front" ? { x: 290, y: 338, width: 220, height: 172 } : { x: 280, y: 230, width: 240, height: 300 };
  }
  return { ...PRINT_AREAS[side] };
}

export function garmentPaths(slug: string, side: Side) {
  const hoodie = isHoodie(slug);
  return {
    body: hoodie ? HOODIE_PATH : TEE_PATH,
    collar: hoodie ? null : side === "front" ? TEE_COLLAR_FRONT : TEE_COLLAR_BACK,
    /** Neck opening: front shows the inside back panel (shaded), back view is closed with garment fabric. */
    neckInner: hoodie ? null : side === "front" ? "M330 160 Q400 134 470 160 Q400 215 330 160 Z" : null,
    neckFill: hoodie ? null : side === "back" ? "M330 160 Q400 215 470 160 Q400 182 330 160 Z" : null,
    hood: hoodie && side === "front" ? HOODIE_HOOD : null,
    hoodSeam: hoodie && side === "back" ? "M300 186 Q400 150 500 186" : null,
    pocket: hoodie && side === "front" ? HOODIE_POCKET : null,
    strings: hoodie && side === "front" ? ["M382 246 L377 330", "M418 246 L423 330"] : [],
  };
}

/** Perceived luminance 0..1 of a hex color — used to tune seams and print-area guides. */
export function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export const SHADE_STOPS: (number | string)[] = [
  0, "rgba(0,0,0,0.12)",
  0.22, "rgba(255,255,255,0.08)",
  0.6, "rgba(0,0,0,0)",
  1, "rgba(0,0,0,0.16)",
];
