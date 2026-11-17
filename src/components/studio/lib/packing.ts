/**
 * Skyline bottom-left rectangle packing for gang sheets.
 * All units are inches. Items may be rotated 90° when that packs tighter.
 */
export type PackInput = { id: string; w: number; h: number; allowRotate?: boolean };
export type Placement = { x: number; y: number; w: number; h: number; rotated: boolean };
export type PackResult = {
  placements: Map<string, Placement>;
  /** Sheet length needed (includes margins) */
  height: number;
  failed: string[];
};

type Seg = { x: number; y: number; w: number };
const EPS = 1e-6;

export function skylinePack(
  rects: PackInput[],
  sheetWidth: number,
  opts: { spacing?: number; margin?: number; maxHeight?: number } = {}
): PackResult {
  const spacing = opts.spacing ?? 0.25;
  const margin = opts.margin ?? 0.25;
  const maxHeight = opts.maxHeight ?? Infinity;
  // Each rect is padded by `spacing` on its right/bottom; usable width gets one extra spacing.
  const W = sheetWidth - 2 * margin + spacing;
  let sky: Seg[] = [{ x: 0, y: 0, w: W }];
  const placements = new Map<string, Placement>();
  const failed: string[] = [];
  let maxTop = 0;

  const sorted = [...rects].sort(
    (a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h) || b.w * b.h - a.w * a.h || a.id.localeCompare(b.id)
  );

  for (const r of sorted) {
    let best: { x: number; y: number; w: number; h: number; top: number; rotated: boolean } | null = null;
    const orients: [number, number, boolean][] = [[r.w, r.h, false]];
    if (r.allowRotate !== false && Math.abs(r.w - r.h) > EPS) orients.push([r.h, r.w, true]);

    for (const [w0, h0, rotated] of orients) {
      const w = w0 + spacing;
      const h = h0 + spacing;
      if (w > W + EPS) continue;
      for (let i = 0; i < sky.length; i++) {
        const x = sky[i]!.x;
        if (x + w > W + EPS) break;
        let y = 0;
        let remaining = w;
        let j = i;
        while (remaining > EPS && j < sky.length) {
          y = Math.max(y, sky[j]!.y);
          remaining -= sky[j]!.w;
          j++;
        }
        if (remaining > EPS) continue;
        const top = y + h;
        if (top - spacing + 2 * margin > maxHeight + EPS) continue;
        if (!best || top < best.top - EPS || (Math.abs(top - best.top) < EPS && x < best.x)) {
          best = { x, y, w, h, top, rotated };
        }
      }
    }

    if (!best) {
      failed.push(r.id);
      continue;
    }
    placements.set(r.id, {
      x: best.x + margin,
      y: best.y + margin,
      w: best.w - spacing,
      h: best.h - spacing,
      rotated: best.rotated,
    });
    maxTop = Math.max(maxTop, best.top);

    // Update skyline with the new segment.
    const seg: Seg = { x: best.x, y: best.top, w: best.w };
    const segEnd = seg.x + seg.w;
    const next: Seg[] = [];
    for (const s of sky) {
      const sEnd = s.x + s.w;
      if (sEnd <= seg.x + EPS || s.x >= segEnd - EPS) {
        next.push(s);
        continue;
      }
      if (s.x < seg.x - EPS) next.push({ x: s.x, y: s.y, w: seg.x - s.x });
      if (sEnd > segEnd + EPS) next.push({ x: segEnd, y: s.y, w: sEnd - segEnd });
    }
    next.push(seg);
    next.sort((a, b) => a.x - b.x);
    sky = [];
    for (const s of next) {
      const last = sky[sky.length - 1];
      if (last && Math.abs(last.y - s.y) < EPS && Math.abs(last.x + last.w - s.x) < EPS) last.w += s.w;
      else sky.push({ ...s });
    }
  }

  const height = placements.size ? maxTop - spacing + 2 * margin : 0;
  return { placements, height, failed };
}
