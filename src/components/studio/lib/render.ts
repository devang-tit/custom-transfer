"use client";

import Konva from "konva";
import { resolveFont } from "./fonts";
import { loadImage } from "./images";
import type { StudioItem } from "./geometry";

/**
 * Text is measured/rendered at `textScale`× and scaled down, so tiny inch-based font
 * sizes still get accurate canvas metrics.
 */
export function measureText(
  it: Pick<StudioItem, "text" | "fontFamily" | "fontSize" | "fontStyle" | "letterSpacing">,
  textScale = 1
): { width: number; height: number } {
  const t = new Konva.Text({
    text: it.text || " ",
    fontFamily: resolveFont(it.fontFamily),
    fontSize: (it.fontSize ?? 1) * textScale,
    fontStyle: it.fontStyle ?? "normal",
    letterSpacing: (it.letterSpacing ?? 0) * textScale,
    lineHeight: 1.1,
    align: "center",
  });
  const out = { width: Math.max(t.width(), 1) / textScale, height: Math.max(t.height(), 1) / textScale };
  t.destroy();
  return out;
}

/** Arc path for curved text, centered in a box of the given size. */
export function arcPath(width: number, height: number, curve: number): string {
  // curve: -100..100 → sagitta proportional to width
  const sag = (curve / 100) * width * 0.45;
  const y = height / 2 + sag / 2;
  return `M 0 ${y} Q ${width / 2} ${y - sag * 2} ${width} ${y}`;
}

/** Build an imperative Konva node for an item (used for export). Units are the caller's. */
export async function buildNode(it: StudioItem, textScale = 1): Promise<Konva.Node> {
  const common = {
    x: it.x + it.width / 2,
    y: it.y + it.height / 2,
    rotation: it.rotation || 0,
  };
  if (it.kind === "image" && it.src) {
    const image = await loadImage(it.src);
    return new Konva.Image({
      ...common,
      image,
      width: it.width,
      height: it.height,
      offsetX: it.width / 2,
      offsetY: it.height / 2,
    });
  }
  const K = textScale;
  if (it.curve && Math.abs(it.curve) > 1) {
    return new Konva.TextPath({
      ...common,
      text: it.text ?? "",
      data: arcPath(it.width * K, it.height * K, it.curve),
      fontFamily: resolveFont(it.fontFamily),
      fontSize: (it.fontSize ?? 1) * K,
      fontStyle: it.fontStyle ?? "normal",
      letterSpacing: (it.letterSpacing ?? 0) * K,
      fill: it.fill ?? "#111",
      align: "center",
      offsetX: (it.width * K) / 2,
      offsetY: (it.height * K) / 2,
      scaleX: 1 / K,
      scaleY: 1 / K,
    });
  }
  return new Konva.Text({
    ...common,
    text: it.text ?? "",
    fontFamily: resolveFont(it.fontFamily),
    fontSize: (it.fontSize ?? 1) * K,
    fontStyle: it.fontStyle ?? "normal",
    letterSpacing: (it.letterSpacing ?? 0) * K,
    lineHeight: 1.1,
    align: "center",
    fill: it.fill ?? "#111",
    offsetX: (it.width * K) / 2,
    offsetY: (it.height * K) / 2,
    scaleX: 1 / K,
    scaleY: 1 / K,
  });
}

/** Render a gang sheet (inches) to a transparent PNG blob for previews. */
export async function renderGangSheetPng(
  items: StudioItem[],
  widthIn: number,
  heightIn: number,
  opts: { ppi?: number; maxPx?: number; textScale?: number } = {}
): Promise<Blob> {
  const ppi = Math.min(opts.ppi ?? 50, (opts.maxPx ?? 4000) / Math.max(widthIn, heightIn));
  const container = document.createElement("div");
  const stage = new Konva.Stage({ container, width: Math.round(widthIn * ppi), height: Math.round(heightIn * ppi) });
  try {
    const layer = new Konva.Layer();
    stage.add(layer);
    const group = new Konva.Group({ scaleX: ppi, scaleY: ppi });
    layer.add(group);
    for (const it of items) group.add((await buildNode(it, opts.textScale ?? 100)) as Konva.Shape);
    layer.draw();
    return (await stage.toBlob({ pixelRatio: 1, mimeType: "image/png" })) as Blob;
  } finally {
    stage.destroy();
  }
}

/** Render an arbitrary scene builder into a PNG blob. */
export async function renderScenePng(
  width: number,
  height: number,
  build: (layer: Konva.Layer) => Promise<void> | void,
  pixelRatio = 1
): Promise<Blob> {
  const container = document.createElement("div");
  const stage = new Konva.Stage({ container, width, height });
  try {
    const layer = new Konva.Layer();
    stage.add(layer);
    await build(layer);
    layer.draw();
    return (await stage.toBlob({ pixelRatio, mimeType: "image/png" })) as Blob;
  } finally {
    stage.destroy();
  }
}
