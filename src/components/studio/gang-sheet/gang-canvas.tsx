"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Group, Image as KImage, Layer, Line, Rect, Stage, Text as KText, Transformer } from "react-konva";
import { cn } from "@/lib/utils";
import { resolveFont } from "@/components/studio/lib/fonts";
import { useLoadedImage } from "@/components/studio/lib/images";
import { itemBox, type Box, type SheetIssues, type StudioItem } from "@/components/studio/lib/geometry";

export const SHEET_MARGIN = 0.25;
/** Text is rendered at 100× and scaled down so tiny inch font sizes measure correctly. */
export const TEXT_SCALE = 100;
const PAD = 40;
const BRAND = "#5B3FF0";

export type SheetBackground = "checker" | "white" | "dark";

export type GangCanvasHandle = {
  /** Convert a client (screen) point to sheet inches. */
  clientToInches: (clientX: number, clientY: number) => { x: number; y: number } | null;
  /** Center of the visible area in sheet inches. */
  viewCenter: () => { x: number; y: number };
  scrollToItem: (id: string) => void;
};

type Props = {
  items: StudioItem[];
  selectedIds: string[];
  sheetW: number;
  sheetH: number;
  zoom: number;
  onZoomChange: (z: number) => void;
  background: SheetBackground;
  snap: boolean;
  issues: SheetIssues;
  onSelect: (ids: string[]) => void;
  onItemsChange: (next: StudioItem[]) => void;
  onDropFiles: (files: File[], at: { x: number; y: number } | null) => void;
  children?: React.ReactNode;
};

type Guide = { orientation: "v" | "h"; at: number };

export const GangCanvas = forwardRef<GangCanvasHandle, Props>(function GangCanvas(
  { items, selectedIds, sheetW, sheetH, zoom, onZoomChange, background, snap, issues, onSelect, onItemsChange, onDropFiles, children },
  ref
) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const rulerTopRef = useRef<HTMLDivElement>(null);
  const rulerLeftRef = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, Konva.Node>());
  const dragStart = useRef(new Map<string, { x: number; y: number }>());
  const [view, setView] = useState({ w: 0, h: 0 });
  const [guides, setGuides] = useState<Guide[]>([]);
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // ----- Layout math -----
  const fit = view.w ? Math.max(3, (view.w - PAD * 2) / sheetW) : 20;
  const scale = fit * zoom;
  const sheetPxW = sheetW * scale;
  const sheetPxH = sheetH * scale;
  const contentW = Math.max(view.w, sheetPxW + PAD * 2);
  const contentH = Math.max(view.h, sheetPxH + PAD * 2);
  const offX = (contentW - sheetPxW) / 2;
  const offY = sheetPxH + PAD * 2 < view.h ? (contentH - sheetPxH) / 2 : PAD;

  // Latest values for imperative handlers (scroll, wheel, imperative handle). Synced after
  // commit; declared before the other layout effects so they always read fresh values.
  const layout = useRef({ scale, offX, offY, view });
  const zoomRef = useRef(zoom);
  const itemsRef = useRef(items);
  useLayoutEffect(() => {
    layout.current = { scale, offX, offY, view };
    zoomRef.current = zoom;
    itemsRef.current = items;
  });

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setView({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setView({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const reposition = useCallback(() => {
    const el = scrollRef.current;
    const stage = stageRef.current;
    if (!el || !stage) return;
    const sl = el.scrollLeft;
    const st = el.scrollTop;
    if (wrapRef.current) wrapRef.current.style.transform = `translate(${sl}px, ${st}px)`;
    stage.position({ x: -sl, y: -st });
    stage.batchDraw();
    const { offX: ox, offY: oy } = layout.current;
    if (rulerTopRef.current) rulerTopRef.current.style.transform = `translateX(${ox - sl}px)`;
    if (rulerLeftRef.current) rulerLeftRef.current.style.transform = `translateY(${oy - st}px)`;
  }, []);

  // Keep the visual center stable when zoom changes.
  const prev = useRef<{ scale: number; offX: number; offY: number; viewW: number } | null>(null);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const p = prev.current;
    // Only re-center on real zoom changes, not on the first measured layout.
    if (el && p && p.viewW > 0 && p.scale !== scale && view.w) {
      const cx = (el.scrollLeft + view.w / 2 - p.offX) / p.scale;
      const cy = (el.scrollTop + view.h / 2 - p.offY) / p.scale;
      el.scrollLeft = cx * scale + offX - view.w / 2;
      el.scrollTop = cy * scale + offY - view.h / 2;
    }
    prev.current = { scale, offX, offY, viewW: view.w };
    reposition();
  }, [scale, offX, offY, view, reposition]);

  // Ctrl/⌘ + wheel zoom (non-passive so we can prevent browser zoom).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0025);
      onZoomChange(Math.min(8, Math.max(0.1, zoomRef.current * factor)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onZoomChange]);

  useImperativeHandle(
    ref,
    () => ({
      clientToInches(clientX, clientY) {
        const el = scrollRef.current;
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const { scale: s, offX: ox, offY: oy } = layout.current;
        return { x: (clientX - r.left + el.scrollLeft - ox) / s, y: (clientY - r.top + el.scrollTop - oy) / s };
      },
      viewCenter() {
        const el = scrollRef.current;
        const { scale: s, offX: ox, offY: oy, view: v } = layout.current;
        if (!el) return { x: sheetW / 2, y: 2 };
        return { x: (el.scrollLeft + v.w / 2 - ox) / s, y: (el.scrollTop + v.h / 2 - oy) / s };
      },
      scrollToItem(id) {
        const el = scrollRef.current;
        const it = itemsRef.current.find((i) => i.id === id);
        if (!el || !it) return;
        const b = itemBox(it);
        const { scale: s, offY: oy, view: v } = layout.current;
        const top = b.y * s + oy;
        if (top < el.scrollTop || top + b.h * s > el.scrollTop + v.h) {
          el.scrollTo({ top: top - v.h / 3, behavior: "smooth" });
        }
      },
    }),
    [sheetW]
  );

  // ----- Transformer attachment -----
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const attached = selectedIds.map((id) => nodes.current.get(id)).filter((n): n is Konva.Node => !!n);
    tr.nodes(attached);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, items]);

  const registerNode = useCallback((id: string, node: Konva.Node | null) => {
    if (node) nodes.current.set(id, node);
    else nodes.current.delete(id);
  }, []);

  // ----- Selection -----
  const selectFromNode = useCallback(
    (id: string, additive: boolean) => {
      if (additive) {
        onSelect(selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]);
      } else if (!selectedIds.includes(id)) {
        onSelect([id]);
      }
    },
    [onSelect, selectedIds]
  );

  const toInches = (p: { x: number; y: number }) => ({ x: (p.x - offX) / scale, y: (p.y - offY) / scale });

  const onStageMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const target = e.target;
    const isBackground = target === e.target.getStage() || target.name() === "sheet-area";
    if (!isBackground) return;
    const layer = target.getStage()?.getLayers()[0];
    const pos = layer?.getRelativePointerPosition();
    if (!pos) return;
    const additive = e.evt.shiftKey;
    if (!additive) onSelect([]);
    setMarquee({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
  };

  const onStageMouseMove = () => {
    if (!marquee) return;
    const pos = stageRef.current?.getLayers()[0]?.getRelativePointerPosition();
    if (pos) setMarquee((m) => (m ? { ...m, x2: pos.x, y2: pos.y } : m));
  };

  const onStageMouseUp = (e: KonvaEventObject<MouseEvent>) => {
    if (!marquee) return;
    const a = toInches({ x: Math.min(marquee.x1, marquee.x2), y: Math.min(marquee.y1, marquee.y2) });
    const b = toInches({ x: Math.max(marquee.x1, marquee.x2), y: Math.max(marquee.y1, marquee.y2) });
    setMarquee(null);
    if (Math.abs(b.x - a.x) * scale < 4 && Math.abs(b.y - a.y) * scale < 4) return;
    const hit = items
      .filter((it) => {
        const bx = itemBox(it);
        return bx.x < b.x && bx.x + bx.w > a.x && bx.y < b.y && bx.y + bx.h > a.y;
      })
      .map((it) => it.id);
    const additive = e.evt.shiftKey;
    onSelect(additive ? Array.from(new Set([...selectedIds, ...hit])) : hit);
  };

  // ----- Drag with group move + snapping -----
  const onDragStart = (id: string) => {
    const ids = selectedIds.includes(id) ? selectedIds : [id];
    dragStart.current.clear();
    for (const sid of ids) {
      const n = nodes.current.get(sid);
      if (n) dragStart.current.set(sid, { x: n.x(), y: n.y() });
    }
  };

  const onDragMove = (id: string, node: Konva.Node) => {
    const start = dragStart.current.get(id);
    const item = items.find((i) => i.id === id);
    if (!start || !item) return;
    let dx = node.x() - start.x;
    let dy = node.y() - start.y;
    const newGuides: Guide[] = [];

    if (snap) {
      // Snap the dragged item's bounding box to sheet edges/center, margins and other items.
      const moving = new Set(dragStart.current.keys());
      const box = itemBox({ ...item, x: item.x + dx, y: item.y + dy });
      const vLines = [0, SHEET_MARGIN, sheetW / 2, sheetW - SHEET_MARGIN, sheetW];
      const hLines = [0, SHEET_MARGIN, sheetH - SHEET_MARGIN, sheetH];
      for (const other of items) {
        if (moving.has(other.id)) continue;
        const ob = itemBox(other);
        vLines.push(ob.x, ob.x + ob.w / 2, ob.x + ob.w);
        hLines.push(ob.y, ob.y + ob.h / 2, ob.y + ob.h);
      }
      const thr = 6 / scale;
      const snapAxis = (edges: number[], lines: number[]) => {
        let best: { diff: number; line: number } | null = null;
        for (const e of edges)
          for (const l of lines) {
            const d = l - e;
            if (Math.abs(d) < thr && (!best || Math.abs(d) < Math.abs(best.diff))) best = { diff: d, line: l };
          }
        return best;
      };
      const sx = snapAxis([box.x, box.x + box.w / 2, box.x + box.w], vLines);
      const sy = snapAxis([box.y, box.y + box.h / 2, box.y + box.h], hLines);
      if (sx) {
        dx += sx.diff;
        newGuides.push({ orientation: "v", at: sx.line });
      } else {
        dx += Math.round(box.x / 0.125) * 0.125 - box.x;
      }
      if (sy) {
        dy += sy.diff;
        newGuides.push({ orientation: "h", at: sy.line });
      } else {
        dy += Math.round(box.y / 0.125) * 0.125 - box.y;
      }
    }

    for (const [sid, s] of dragStart.current) {
      const n = nodes.current.get(sid);
      n?.position({ x: s.x + dx, y: s.y + dy });
    }
    setGuides((g) => (g.length === 0 && newGuides.length === 0 ? g : newGuides));
  };

  const onDragEnd = () => {
    const moved = new Map<string, { x: number; y: number }>();
    for (const sid of dragStart.current.keys()) {
      const n = nodes.current.get(sid);
      if (n) moved.set(sid, { x: n.x(), y: n.y() });
    }
    dragStart.current.clear();
    setGuides([]);
    if (!moved.size) return;
    onItemsChange(
      items.map((it) => {
        const c = moved.get(it.id);
        return c ? { ...it, x: c.x - it.width / 2, y: c.y - it.height / 2 } : it;
      })
    );
  };

  const onTransformEnd = () => {
    const changed = new Map<string, Konva.Node>();
    for (const id of selectedIds) {
      const n = nodes.current.get(id);
      if (n) changed.set(id, n);
    }
    onItemsChange(
      items.map((it) => {
        const n = changed.get(it.id);
        if (!n) return it;
        const base = it.kind === "text" ? 1 / TEXT_SCALE : 1;
        const f = Math.abs(n.scaleX() / base);
        n.scale({ x: base, y: base });
        const width = it.width * f;
        const height = it.height * f;
        return {
          ...it,
          width,
          height,
          fontSize: it.kind === "text" ? (it.fontSize ?? 1) * f : it.fontSize,
          letterSpacing: it.kind === "text" && it.letterSpacing ? it.letterSpacing * f : it.letterSpacing,
          rotation: Math.round(n.rotation() * 10) / 10,
          x: n.x() - width / 2,
          y: n.y() - height / 2,
        };
      })
    );
  };

  // ----- File drop -----
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    if (!files.length) return;
    const el = scrollRef.current;
    let at: { x: number; y: number } | null = null;
    if (el) {
      const r = el.getBoundingClientRect();
      at = { x: (e.clientX - r.left + el.scrollLeft - offX) / scale, y: (e.clientY - r.top + el.scrollTop - offY) / scale };
    }
    onDropFiles(files, at);
  };

  // ----- Rulers -----
  const rulerStep = useMemo(() => [1, 2, 3, 6, 12, 24, 48].find((n) => n * scale >= 44) ?? 48, [scale]);
  const issueBoxes = useMemo(() => {
    const out: { id: string; box: Box; kind: "outside" | "overlap" | "dpi" }[] = [];
    for (const it of items) {
      const kind = issues.outside.has(it.id) ? "outside" : issues.lowDpi.has(it.id) ? "dpi" : issues.overlapping.has(it.id) ? "overlap" : null;
      if (kind) out.push({ id: it.id, box: itemBox(it), kind });
    }
    return out;
  }, [items, issues]);

  const bgClass =
    background === "checker" ? "bg-checker" : background === "white" ? "bg-white" : "bg-[#17171f]";

  return (
    <div className="relative grid min-h-0 flex-1 grid-cols-[24px_minmax(0,1fr)] grid-rows-[24px_minmax(0,1fr)] bg-muted/50">
      {/* Corner */}
      <div className="z-10 grid place-items-center border-r border-b bg-background text-[9px] font-semibold text-muted-foreground">in</div>
      {/* Top ruler */}
      <div className="relative overflow-hidden border-b bg-background">
        <div ref={rulerTopRef} className="absolute top-0 left-0 h-full" style={{ width: sheetPxW }}>
          <div
            className="absolute inset-x-0 bottom-0 h-1.5 text-muted-foreground/50"
            style={{
              backgroundImage: `repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px ${scale}px)`,
              display: scale >= 6 ? "block" : "none",
            }}
          />
          {Array.from({ length: Math.floor(sheetW / rulerStep) + 1 }, (_, i) => i * rulerStep).map((v) => (
            <div key={v} className="absolute top-0 h-full border-l border-muted-foreground/60" style={{ left: v * scale }}>
              <span className="absolute top-0.5 left-1 font-mono text-[9px] leading-none text-muted-foreground tabular-nums">{v}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Left ruler */}
      <div className="relative overflow-hidden border-r bg-background">
        <div ref={rulerLeftRef} className="absolute top-0 left-0 w-full" style={{ height: sheetPxH }}>
          <div
            className="absolute inset-y-0 right-0 w-1.5 text-muted-foreground/50"
            style={{
              backgroundImage: `repeating-linear-gradient(to bottom, currentColor 0 1px, transparent 1px ${scale}px)`,
              display: scale >= 6 ? "block" : "none",
            }}
          />
          {Array.from({ length: Math.floor(sheetH / rulerStep) + 1 }, (_, i) => i * rulerStep).map((v) => (
            <div key={v} className="absolute left-0 w-full border-t border-muted-foreground/60" style={{ top: v * scale }}>
              <span className="absolute top-1 left-0.5 font-mono text-[9px] leading-none text-muted-foreground tabular-nums [writing-mode:vertical-rl] rotate-180">
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll viewport */}
      <div
        ref={scrollRef}
        onScroll={reposition}
        onDragOver={(e) => {
          if (Array.from(e.dataTransfer.types).includes("Files")) {
            e.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDragOver(false);
        }}
        onDrop={handleDrop}
        className="relative overflow-auto bg-dots overscroll-contain"
      >
        <div className="relative" style={{ width: contentW, height: contentH }}>
          <div
            className={cn("absolute rounded-[2px] shadow-premium ring-1 ring-foreground/10", bgClass)}
            style={{ left: offX, top: offY, width: sheetPxW, height: sheetPxH }}
          >
            {snap && scale >= 8 && (
              <div
                className={cn("absolute inset-0", background === "dark" ? "text-white/[0.07]" : "text-black/[0.06]")}
                style={{
                  backgroundImage:
                    "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                  backgroundSize: `${scale}px ${scale}px`,
                }}
              />
            )}
          </div>
          <div ref={wrapRef} className="absolute top-0 left-0 z-10" style={{ width: view.w, height: view.h }}>
            {view.w > 0 && (
              <Stage
                ref={stageRef}
                width={view.w}
                height={view.h}
                onMouseDown={onStageMouseDown}
                onMouseMove={onStageMouseMove}
                onMouseUp={onStageMouseUp}
                onMouseLeave={() => setMarquee(null)}
                onTouchStart={(e) => {
                  if (e.target === e.target.getStage() || e.target.name() === "sheet-area") onSelect([]);
                }}
              >
                <Layer>
                  <Group x={offX} y={offY} scaleX={scale} scaleY={scale}>
                    <Rect name="sheet-area" x={0} y={0} width={sheetW} height={sheetH} fill="rgba(0,0,0,0)" />
                    <Rect
                      x={SHEET_MARGIN}
                      y={SHEET_MARGIN}
                      width={sheetW - SHEET_MARGIN * 2}
                      height={sheetH - SHEET_MARGIN * 2}
                      stroke={background === "dark" ? "#7c7ca0" : "#9a9ab5"}
                      strokeWidth={1}
                      dash={[6, 5]}
                      strokeScaleEnabled={false}
                      listening={false}
                    />
                    {items.map((it) => (
                      <ItemNode
                        key={it.id}
                        item={it}
                        register={registerNode}
                        onPointerDown={(additive) => selectFromNode(it.id, additive)}
                        onDragStart={() => onDragStart(it.id)}
                        onDragMove={(n) => onDragMove(it.id, n)}
                        onDragEnd={onDragEnd}
                      />
                    ))}
                    {issueBoxes.map(({ id, box, kind }) => (
                      <Rect
                        key={`issue-${id}`}
                        x={box.x}
                        y={box.y}
                        width={box.w}
                        height={box.h}
                        stroke={kind === "overlap" ? "#f59e0b" : "#f43f5e"}
                        strokeWidth={1.5}
                        dash={kind === "dpi" ? [4, 3] : undefined}
                        strokeScaleEnabled={false}
                        listening={false}
                      />
                    ))}
                    {guides.map((g, i) =>
                      g.orientation === "v" ? (
                        <Line key={i} points={[g.at, -2, g.at, sheetH + 2]} stroke="#ec4899" strokeWidth={1} strokeScaleEnabled={false} listening={false} />
                      ) : (
                        <Line key={i} points={[-2, g.at, sheetW + 2, g.at]} stroke="#ec4899" strokeWidth={1} strokeScaleEnabled={false} listening={false} />
                      )
                    )}
                  </Group>
                  <Transformer
                    ref={trRef}
                    rotateEnabled
                    keepRatio
                    flipEnabled={false}
                    ignoreStroke
                    enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
                    rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                    rotationSnapTolerance={6}
                    anchorSize={9}
                    anchorCornerRadius={3}
                    anchorStroke={BRAND}
                    anchorFill="#ffffff"
                    borderStroke={BRAND}
                    borderStrokeWidth={1.5}
                    rotateAnchorOffset={24}
                    boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 6 || Math.abs(newBox.height) < 6 ? oldBox : newBox)}
                    onTransformEnd={onTransformEnd}
                  />
                  {marquee && (
                    <Rect
                      x={Math.min(marquee.x1, marquee.x2)}
                      y={Math.min(marquee.y1, marquee.y2)}
                      width={Math.abs(marquee.x2 - marquee.x1)}
                      height={Math.abs(marquee.y2 - marquee.y1)}
                      fill="rgba(91,63,240,0.08)"
                      stroke={BRAND}
                      strokeWidth={1}
                      dash={[4, 3]}
                      listening={false}
                    />
                  )}
                </Layer>
              </Stage>
            )}
          </div>
        </div>
      </div>

      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-20 col-start-2 row-start-2 m-3 grid place-items-center rounded-2xl border-2 border-dashed border-primary bg-primary/5 backdrop-blur-[1px]">
          <p className="rounded-full bg-background px-4 py-2 text-sm font-medium shadow-premium">Drop to upload & place on the sheet</p>
        </div>
      )}
      {children}
    </div>
  );
});

function ItemNode({
  item,
  register,
  onPointerDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  item: StudioItem;
  register: (id: string, node: Konva.Node | null) => void;
  onPointerDown: (additive: boolean) => void;
  onDragStart: () => void;
  onDragMove: (node: Konva.Node) => void;
  onDragEnd: () => void;
}) {
  const img = useLoadedImage(item.kind === "image" ? item.src : undefined);
  const refCb = useCallback((n: Konva.Node | null) => register(item.id, n), [register, item.id]);
  const common = {
    id: item.id,
    name: "item",
    x: item.x + item.width / 2,
    y: item.y + item.height / 2,
    rotation: item.rotation || 0,
    draggable: true,
    onMouseDown: (e: KonvaEventObject<MouseEvent>) => onPointerDown(e.evt.shiftKey || e.evt.metaKey),
    onTouchStart: () => onPointerDown(false),
    onDragStart,
    onDragMove: (e: KonvaEventObject<DragEvent>) => onDragMove(e.target),
    onDragEnd,
  };
  if (item.kind === "text") {
    const K = TEXT_SCALE;
    return (
      <KText
        ref={refCb}
        {...common}
        text={item.text ?? ""}
        fontFamily={resolveFont(item.fontFamily)}
        fontSize={(item.fontSize ?? 1) * K}
        fontStyle={item.fontStyle ?? "normal"}
        letterSpacing={(item.letterSpacing ?? 0) * K}
        lineHeight={1.1}
        align="center"
        wrap="none"
        fill={item.fill ?? "#111111"}
        width={item.width * K}
        offsetX={(item.width * K) / 2}
        offsetY={(item.height * K) / 2}
        scaleX={1 / K}
        scaleY={1 / K}
      />
    );
  }
  return (
    <KImage
      ref={refCb}
      {...common}
      image={img ?? undefined}
      fill={img ? undefined : "rgba(140,140,170,0.25)"}
      width={item.width}
      height={item.height}
      offsetX={item.width / 2}
      offsetY={item.height / 2}
    />
  );
}
