/**
 * Garment silhouettes (SVG path data) in an 800×800 coordinate space.
 * Shared by the design studio canvas and generated product art.
 */
export const MOCKUP_SIZE = 800;

export const TEE_PATH =
  "M330 160 Q400 215 470 160 L590 190 L670 318 L592 356 L572 318 L575 655 Q400 675 225 655 L228 318 L208 356 L130 318 L210 190 Z";
export const TEE_COLLAR_FRONT = "M330 160 Q400 228 470 160";
export const TEE_COLLAR_BACK = "M330 160 Q400 182 470 160";

export const HOODIE_PATH =
  "M292 182 L215 205 L150 420 L138 602 L200 612 L226 432 L228 662 Q400 682 572 662 L574 432 L600 612 L662 602 L650 420 L585 205 L508 182 C505 104 295 104 292 182 Z";
export const HOODIE_HOOD = "M335 186 Q400 262 465 186 Q452 138 400 136 Q348 138 335 186 Z";
export const HOODIE_POCKET = "M298 520 L502 520 L532 612 L268 612 Z";

/** Printable areas in mockup coordinates for each placement. */
export const PRINT_AREAS = {
  front: { x: 285, y: 235, width: 230, height: 300 },
  back: { x: 280, y: 210, width: 240, height: 330 },
  "left-chest": { x: 430, y: 235, width: 70, height: 70 },
  sleeve: { x: 600, y: 230, width: 50, height: 70 },
} as const;
export type PrintAreaId = keyof typeof PRINT_AREAS;

export const GARMENT_COLORS = [
  { name: "White", hex: "#F7F7F5" },
  { name: "Black", hex: "#1C1C22" },
  { name: "Heather Grey", hex: "#A9ABB2" },
  { name: "Navy", hex: "#1F2A4A" },
  { name: "Royal", hex: "#2F55C9" },
  { name: "Forest", hex: "#24483A" },
  { name: "Maroon", hex: "#6A1F2E" },
  { name: "Sand", hex: "#D9C7A7" },
  { name: "Lavender", hex: "#C9B8EA" },
  { name: "Safety Orange", hex: "#F26A21" },
];
