"use client";

import Konva from "konva";
import { buildNode, renderScenePng } from "@/components/studio/lib/render";
import type { StudioItem } from "@/components/studio/lib/geometry";
import { garmentPaths, luminance, printArea, SHADE_STOPS, type Side } from "./garment";

/** Render one side of the garment mockup with its print to an 800×800 PNG. */
export function renderApparelSide(slug: string, colorHex: string, side: Side, items: StudioItem[]): Promise<Blob> {
  const paths = garmentPaths(slug, side);
  const area = printArea(slug, side);
  const dark = luminance(colorHex) < 0.45;
  return renderScenePng(800, 800, async (layer) => {
    layer.add(new Konva.Path({ data: paths.body, fill: colorHex, shadowColor: "#1b1530", shadowBlur: 30, shadowOffsetY: 18, shadowOpacity: 0.18 }));
    layer.add(
      new Konva.Path({
        data: paths.body,
        fillLinearGradientStartPoint: { x: 130, y: 0 },
        fillLinearGradientEndPoint: { x: 670, y: 0 },
        fillLinearGradientColorStops: SHADE_STOPS,
      })
    );
    if (paths.neckInner) {
      layer.add(new Konva.Path({ data: paths.neckInner, fill: colorHex }));
      layer.add(new Konva.Path({ data: paths.neckInner, fill: "rgba(0,0,0,0.28)" }));
    }
    if (paths.neckFill) layer.add(new Konva.Path({ data: paths.neckFill, fill: colorHex }));
    if (paths.collar) layer.add(new Konva.Path({ data: paths.collar, stroke: dark ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.14)", strokeWidth: 12, lineCap: "butt" }));
    if (paths.hood) layer.add(new Konva.Path({ data: paths.hood, fill: "rgba(0,0,0,0.28)" }));
    if (paths.hoodSeam) layer.add(new Konva.Path({ data: paths.hoodSeam, stroke: "rgba(0,0,0,0.18)", strokeWidth: 5 }));
    if (paths.pocket) layer.add(new Konva.Path({ data: paths.pocket, stroke: "rgba(0,0,0,0.2)", strokeWidth: 5 }));
    for (const d of paths.strings) layer.add(new Konva.Path({ data: d, stroke: "#f2f2f2", strokeWidth: 6, lineCap: "round" }));
    const clip = new Konva.Group({ clipX: area.x, clipY: area.y, clipWidth: area.width, clipHeight: area.height });
    layer.add(clip);
    for (const it of items) clip.add((await buildNode(it, 1)) as Konva.Shape);
  });
}
