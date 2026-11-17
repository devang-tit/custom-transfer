"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Group, Image as KImage, Layer, Line, Path, Rect, Stage, Text as KText, TextPath, Transformer } from "react-konva";
import { resolveFont } from "@/components/studio/lib/fonts";
import { useLoadedImage } from "@/components/studio/lib/images";
import { arcPath } from "@/components/studio/lib/render";
import { clamp, round, type StudioItem } from "@/components/studio/lib/geometry";
import { garmentPaths, luminance, PX_PER_IN, SHADE_STOPS, type Area, type Side } from "./garment";

const BRAND = "#5B3FF0";
const MOCK = 800;

type Props = {
  productSlug: string;
  colorHex: string;
  side: Side;
  area: Area;
  items: StudioItem[];
  selectedId: string | null;
  zoom: number;
  showArea: boolean;
  onSelect: (id: string | null) => void;
  onItemsChange: (items: StudioItem[]) => void;
  onDropFiles: (files: File[]) => void;
  children?: React.ReactNode;
};

export function ApparelCanvas({
  productSlug,
  colorHex,
  side,
  area,
  items,
  selectedId,
  zoom,
  showArea,
  onSelect,
  onItemsChange,
  onDropFiles,
  children,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const nodes = useRef(new Map<string, Konva.Node>());
  const [view, setView] = useState({ w: 0, h: 0 });
  const [dragOver, setDragOver] = useState(false);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setView({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setView({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Garment occupies roughly x 120–690, y 100–690 of the mockup; fit that box.
  const fit = Math.min(view.w / 620, view.h / 620) || 1;
  const scale = fit * zoom;
  const ox = view.w / 2 - 405 * scale;
  const oy = view.h / 2 - 400 * scale;

  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const n = selectedId ? nodes.current.get(selectedId) : null;
    tr.nodes(n ? [n] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedId, items, side]);

  const register = useCallback((id: string, n: Konva.Node | null) => {
    if (n) nodes.current.set(id, n);
    else nodes.current.delete(id);
  }, []);

  const paths = garmentPaths(productSlug, side);
  const dark = luminance(colorHex) < 0.45;
  const guideColor = dark ? "rgba(255,255,255,0.55)" : "rgba(60,60,90,0.45)";

  const constrain = (node: Konva.Node) => {
    node.x(clamp(node.x(), area.x, area.x + area.width));
    node.y(clamp(node.y(), area.y, area.y + area.height));
  };

  const commitNode = (id: string, node: Konva.Node) => {
    onItemsChange(
      items.map((it) => {
        if (it.id !== id) return it;
        const f = Math.abs(node.scaleX());
        node.scale({ x: 1, y: 1 });
        const width = it.width * f;
        const height = it.height * f;
        return {
          ...it,
          width,
          height,
          fontSize: it.kind === "text" ? (it.fontSize ?? 32) * f : it.fontSize,
          letterSpacing: it.kind === "text" && it.letterSpacing ? it.letterSpacing * f : it.letterSpacing,
          rotation: round(node.rotation(), 1),
          x: node.x() - width / 2,
          y: node.y() - height / 2,
        };
      })
    );
  };

  return (
    <div
      ref={hostRef}
      className="relative min-h-0 flex-1 overflow-hidden bg-muted/40 bg-dots"
      onDragOver={(e) => {
        if (Array.from(e.dataTransfer.types).includes("Files")) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={(e) => e.currentTarget === e.target && setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files ?? []);
        if (files.length) onDropFiles(files);
      }}
    >
      {view.w > 0 && (
        <Stage
          width={view.w}
          height={view.h}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage() || e.target.name() === "garment") onSelect(null);
          }}
          onTouchStart={(e) => {
            if (e.target === e.target.getStage() || e.target.name() === "garment") onSelect(null);
          }}
        >
          <Layer>
            <Group x={ox} y={oy} scaleX={scale} scaleY={scale}>
              <Path
                name="garment"
                data={paths.body}
                fill={colorHex}
                shadowColor="#1b1530"
                shadowBlur={36}
                shadowOffsetY={22}
                shadowOpacity={0.22}
              />
              <Path
                data={paths.body}
                listening={false}
                fillLinearGradientStartPoint={{ x: 130, y: 0 }}
                fillLinearGradientEndPoint={{ x: 670, y: 0 }}
                fillLinearGradientColorStops={SHADE_STOPS}
              />
              {paths.neckInner && (
                <>
                  <Path data={paths.neckInner} fill={colorHex} listening={false} />
                  <Path data={paths.neckInner} fill="rgba(0,0,0,0.28)" listening={false} />
                </>
              )}
              {paths.neckFill && <Path data={paths.neckFill} fill={colorHex} listening={false} />}
              {paths.collar && (
                <Path data={paths.collar} stroke={dark ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.14)"} strokeWidth={12} lineCap="butt" listening={false} />
              )}
              {paths.hood && <Path data={paths.hood} fill="rgba(0,0,0,0.28)" listening={false} />}
              {paths.hoodSeam && <Path data={paths.hoodSeam} stroke="rgba(0,0,0,0.18)" strokeWidth={5} listening={false} />}
              {paths.pocket && <Path data={paths.pocket} stroke="rgba(0,0,0,0.2)" strokeWidth={5} listening={false} />}
              {paths.strings.map((d) => (
                <Path key={d} data={d} stroke="#f2f2f2" strokeWidth={6} lineCap="round" listening={false} />
              ))}

              {showArea && (
                <>
                  <Rect
                    x={area.x}
                    y={area.y}
                    width={area.width}
                    height={area.height}
                    stroke={guideColor}
                    strokeWidth={1.25}
                    dash={[6, 5]}
                    strokeScaleEnabled={false}
                    cornerRadius={4}
                    listening={false}
                  />
                  <Line
                    points={[area.x + area.width / 2, area.y - 6, area.x + area.width / 2, area.y + 6]}
                    stroke={guideColor}
                    strokeWidth={1}
                    strokeScaleEnabled={false}
                    listening={false}
                  />
                  <KText
                    x={area.x}
                    y={area.y + area.height + 8}
                    width={area.width}
                    align="center"
                    text={`Print area · ${round(area.width / PX_PER_IN, 1)}" × ${round(area.height / PX_PER_IN, 1)}"`}
                    fontSize={11}
                    fontFamily="ui-sans-serif, system-ui, sans-serif"
                    fill={guideColor}
                    listening={false}
                  />
                </>
              )}

              <Group clipX={area.x} clipY={area.y} clipWidth={area.width} clipHeight={area.height}>
                {items.map((it) => (
                  <ItemNode
                    key={it.id}
                    item={it}
                    register={register}
                    onSelect={() => onSelect(it.id)}
                    onDragMove={constrain}
                    onDragEnd={(n) => commitNode(it.id, n)}
                  />
                ))}
              </Group>
            </Group>
            <Transformer
              ref={trRef}
              rotateEnabled
              keepRatio
              flipEnabled={false}
              enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
              rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
              rotationSnapTolerance={6}
              anchorSize={10}
              anchorCornerRadius={3}
              anchorStroke={BRAND}
              anchorFill="#ffffff"
              borderStroke={BRAND}
              borderStrokeWidth={1.5}
              rotateAnchorOffset={24}
              boundBoxFunc={(o, n) => (Math.abs(n.width) < 10 || Math.abs(n.height) < 10 ? o : n)}
              onTransformEnd={() => {
                const n = selectedId ? nodes.current.get(selectedId) : null;
                if (n && selectedId) commitNode(selectedId, n);
              }}
            />
          </Layer>
        </Stage>
      )}
      {dragOver && (
        <div className="pointer-events-none absolute inset-3 z-20 grid place-items-center rounded-2xl border-2 border-dashed border-primary bg-primary/5">
          <p className="rounded-full bg-background px-4 py-2 text-sm font-medium shadow-premium">Drop to place on the {side}</p>
        </div>
      )}
      {children}
    </div>
  );
}

function ItemNode({
  item,
  register,
  onSelect,
  onDragMove,
  onDragEnd,
}: {
  item: StudioItem;
  register: (id: string, n: Konva.Node | null) => void;
  onSelect: () => void;
  onDragMove: (n: Konva.Node) => void;
  onDragEnd: (n: Konva.Node) => void;
}) {
  const img = useLoadedImage(item.kind === "image" ? item.src : undefined);
  const refCb = useCallback((n: Konva.Node | null) => register(item.id, n), [register, item.id]);
  const common = {
    id: item.id,
    x: item.x + item.width / 2,
    y: item.y + item.height / 2,
    rotation: item.rotation || 0,
    draggable: true,
    onMouseDown: onSelect,
    onTouchStart: onSelect,
    onDragMove: (e: KonvaEventObject<DragEvent>) => onDragMove(e.target),
    onDragEnd: (e: KonvaEventObject<DragEvent>) => onDragEnd(e.target),
  };
  if (item.kind === "text") {
    const textProps = {
      text: item.text ?? "",
      fontFamily: resolveFont(item.fontFamily),
      fontSize: item.fontSize ?? 32,
      fontStyle: item.fontStyle ?? "normal",
      letterSpacing: item.letterSpacing ?? 0,
      fill: item.fill ?? "#111111",
      align: "center" as const,
    };
    if (item.curve && Math.abs(item.curve) > 1) {
      return (
        <TextPath
          ref={refCb}
          {...common}
          {...textProps}
          data={arcPath(item.width, item.height, item.curve)}
          offsetX={item.width / 2}
          offsetY={item.height / 2}
        />
      );
    }
    return (
      <KText
        ref={refCb}
        {...common}
        {...textProps}
        lineHeight={1.1}
        wrap="none"
        width={item.width}
        offsetX={item.width / 2}
        offsetY={item.height / 2}
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

export { MOCK };
