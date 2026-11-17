"use client";

import { useRef, useState } from "react";
import {
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyStart,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ImagePlus,
  Italic,
  Loader2,
  Minus,
  Plus,
  RotateCw,
  Shapes,
  Shirt,
  Trash2,
  Type,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import type { LinePrice } from "@/lib/pricing";
import type { ProductDTO } from "@/lib/products";
import type { PriceTier } from "@/lib/types";
import { fromPrice } from "@/components/store/product-card";
import { STUDIO_FONTS, DEFAULT_FONT, fontCss } from "@/components/studio/lib/fonts";
import { displayName, itemDpi, round, type StudioItem } from "@/components/studio/lib/geometry";
import { PanelSection, FieldRow } from "@/components/studio/ui/panel";
import { NumberField } from "@/components/studio/ui/number-field";
import { DpiBadge, DpiDot } from "@/components/studio/ui/dpi-badge";
import { ToolButton } from "@/components/studio/ui/tool-button";
import { SAMPLE_ART } from "@/components/studio/gang-sheet/types";
import { PX_PER_IN } from "./garment";

export type NewStudioText = { text: string; fontFamily: string; fill: string; fontSize: number; fontStyle: "normal" | "bold" };

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml,image/gif";

export function ToolsPanel({
  products,
  product,
  color,
  onProduct,
  onColor,
  uploads,
  uploading,
  onUpload,
  onAddImage,
  onAddText,
  className,
}: {
  products: ProductDTO[];
  product: ProductDTO;
  color: string;
  onProduct: (slug: string) => void;
  onColor: (name: string) => void;
  uploads: { url: string; name: string; width: number; height: number }[];
  uploading: number;
  onUpload: (files: File[]) => void;
  onAddImage: (a: { url: string; name: string; width: number; height: number }) => void;
  onAddText: (t: NewStudioText) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState<NewStudioText>({ text: "Your brand", fontFamily: DEFAULT_FONT, fill: "#111111", fontSize: 40, fontStyle: "bold" });
  const colors = product.options.colors ?? [];

  return (
    <Tabs defaultValue="product" className={cn("flex min-h-0 flex-col gap-0", className)}>
      <div className="border-b px-3 py-3">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="product" title="Product">
            <Shirt />
          </TabsTrigger>
          <TabsTrigger value="upload" title="Upload">
            <ImagePlus />
          </TabsTrigger>
          <TabsTrigger value="text" title="Text">
            <Type />
          </TabsTrigger>
          <TabsTrigger value="clipart" title="Clip art">
            <Shapes />
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="product" className="min-h-0 flex-1 overflow-y-auto">
        <PanelSection title="Garment">
          <ul className="grid gap-2">
            {products.map((p) => {
              const active = p.slug === product.slug;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onProduct(p.slug)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-all",
                      active ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "hover:border-primary/40 hover:bg-muted/50"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.images[0]} alt="" className="size-12 rounded-lg object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.name}</span>
                      <span className="block text-xs text-muted-foreground">Blank from {formatMoney(fromPrice(p))}</span>
                    </span>
                    {active && <Check className="size-4 text-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </PanelSection>
        <PanelSection title={`Color · ${color}`}>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <Tooltip key={c.name}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onColor(c.name)}
                    aria-label={c.name}
                    aria-pressed={c.name === color}
                    className={cn(
                      "size-8 rounded-full ring-1 ring-foreground/15 transition-transform hover:scale-110",
                      c.name === color && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                    style={{ backgroundColor: c.hex }}
                  />
                </TooltipTrigger>
                <TooltipContent>{c.name}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </PanelSection>
        {product.features.length > 0 && (
          <PanelSection title="Details">
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {product.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>
          </PanelSection>
        )}
      </TabsContent>

      <TabsContent value="upload" className="min-h-0 flex-1 overflow-y-auto">
        <PanelSection title="Upload artwork">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="group flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-accent/40"
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT}
              className="sr-only"
              onChange={(e) => {
                onUpload(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
            <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-105">
              {uploading ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
            </span>
            <span className="text-sm font-medium">{uploading ? "Uploading…" : "Choose files"}</span>
            <span className="text-xs text-muted-foreground">Or drag & drop onto the shirt</span>
          </button>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Best results: transparent PNG at 300 DPI, at least {Math.round(12 * 300)}px wide for a full-front print.
          </p>
        </PanelSection>
        {uploads.length > 0 && (
          <PanelSection title="Your uploads">
            <ul className="grid grid-cols-3 gap-2">
              {uploads.map((u) => (
                <li key={u.url}>
                  <button
                    type="button"
                    onClick={() => onAddImage(u)}
                    title={`Add ${u.name}`}
                    className="grid aspect-square w-full place-items-center rounded-lg border bg-checker p-1.5 hover:border-primary"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u.url} alt={u.name} className="max-h-full max-w-full object-contain" />
                  </button>
                </li>
              ))}
            </ul>
          </PanelSection>
        )}
      </TabsContent>

      <TabsContent value="text" className="min-h-0 flex-1 overflow-y-auto">
        <PanelSection title="Add text">
          <div className="grid gap-3">
            <Input value={text.text} onChange={(e) => {
                const value = e.target.value;
                setText((prev) => ({ ...prev, text: value }));
              }} onKeyDown={(e) => e.stopPropagation()} aria-label="Text" />
            <Select value={text.fontFamily} onValueChange={(v) => setText((prev) => ({ ...prev, fontFamily: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STUDIO_FONTS.map((f) => (
                  <SelectItem key={f.key} value={f.key}>
                    <span style={{ fontFamily: fontCss(f.key) }}>{f.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={text.fill}
                onChange={(e) => {
                const value = e.target.value;
                setText((prev) => ({ ...prev, fill: value }));
              }}
                className="h-8 w-10 cursor-pointer rounded-lg border bg-transparent p-1"
                aria-label="Text color"
              />
              <Button
                variant={text.fontStyle === "bold" ? "secondary" : "outline"}
                size="sm"
                className="font-bold"
                onClick={() => setText((prev) => ({ ...prev, fontStyle: prev.fontStyle === "bold" ? "normal" : "bold" }))}
              >
                B
              </Button>
              <div className="flex-1 px-1">
                <Slider value={[text.fontSize]} min={14} max={110} step={1} onValueChange={(v) => setText((prev) => ({ ...prev, fontSize: v[0] ?? 40 }))} aria-label="Font size" />
              </div>
            </div>
            <div
              className="grid min-h-16 place-items-center rounded-xl border bg-checker px-3 py-3 text-center text-2xl break-all"
              style={{ fontFamily: fontCss(text.fontFamily), color: text.fill, fontWeight: text.fontStyle === "bold" ? 700 : 400 }}
            >
              {text.text || " "}
            </div>
            <Button size="lg" onClick={() => text.text.trim() && onAddText(text)} disabled={!text.text.trim()}>
              <Plus /> Add text
            </Button>
          </div>
        </PanelSection>
      </TabsContent>

      <TabsContent value="clipart" className="min-h-0 flex-1 overflow-y-auto">
        <PanelSection title="Clip art">
          <ul className="grid grid-cols-3 gap-2">
            {SAMPLE_ART.map((a) => (
              <li key={a.url}>
                <button
                  type="button"
                  onClick={() => onAddImage(a)}
                  title={`Add ${a.name}`}
                  className="grid aspect-square w-full place-items-center rounded-lg border bg-checker p-2 transition hover:border-primary hover:shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.url} alt={a.name} className="max-h-full max-w-full object-contain" />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">Vector clip art prints sharp at any size.</p>
        </PanelSection>
      </TabsContent>
    </Tabs>
  );
}

export function StudioSelectionPanel({
  item,
  onUpdate,
  onScale,
  onDuplicate,
  onDelete,
  onOrder,
  onAlign,
}: {
  item: StudioItem | null;
  onUpdate: (patch: Partial<StudioItem>, key?: string) => void;
  onScale: (widthIn: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onOrder: (dir: "up" | "down") => void;
  onAlign: (where: "center" | "top") => void;
}) {
  if (!item) {
    return (
      <PanelSection title="Selection">
        <p className="text-xs leading-relaxed text-muted-foreground">Click a design on the garment to resize, rotate, recolor or align it.</p>
      </PanelSection>
    );
  }
  const dpi = itemDpi(item, PX_PER_IN);
  return (
    <PanelSection
      title="Selection"
      action={
        <div className="flex items-center gap-0.5">
          <ToolButton label="Duplicate" shortcut="⌘D" size="icon-sm" onClick={onDuplicate}>
            <Copy />
          </ToolButton>
          <ToolButton label="Delete" shortcut="Del" size="icon-sm" onClick={onDelete} className="hover:text-destructive">
            <Trash2 />
          </ToolButton>
        </div>
      }
    >
      <div className="grid gap-3">
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{displayName(item)}</span>
          <DpiBadge dpi={dpi} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FieldRow label="Print width">
            <NumberField value={item.width / PX_PER_IN} min={0.5} max={16} step={0.25} unit="in" onCommit={onScale} ariaLabel="Print width" />
          </FieldRow>
          <FieldRow label="Rotation">
            <NumberField value={item.rotation} step={15} precision={1} unit="°" onCommit={(v) => onUpdate({ rotation: ((v % 360) + 360) % 360 })} ariaLabel="Rotation" />
          </FieldRow>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button variant="outline" size="sm" onClick={() => onAlign("center")}>
            <AlignHorizontalJustifyCenter /> Center
          </Button>
          <Button variant="outline" size="sm" onClick={() => onAlign("top")}>
            <AlignVerticalJustifyStart /> Top
          </Button>
          <Button variant="outline" size="sm" onClick={() => onUpdate({ rotation: ((item.rotation || 0) + 90) % 360 })}>
            <RotateCw /> 90°
          </Button>
          <ToolButton label="Bring forward" size="icon-sm" variant="outline" onClick={() => onOrder("up")}>
            <ChevronUp />
          </ToolButton>
          <ToolButton label="Send backward" size="icon-sm" variant="outline" onClick={() => onOrder("down")}>
            <ChevronDown />
          </ToolButton>
        </div>

        {item.kind === "text" && (
          <div className="grid gap-2.5 rounded-xl border p-3">
            <Input value={item.text ?? ""} onChange={(e) => onUpdate({ text: e.target.value }, `text-${item.id}`)} onKeyDown={(e) => e.stopPropagation()} aria-label="Text" />
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Select value={item.fontFamily} onValueChange={(v) => onUpdate({ fontFamily: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STUDIO_FONTS.map((f) => (
                    <SelectItem key={f.key} value={f.key}>
                      <span style={{ fontFamily: fontCss(f.key) }}>{f.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="color"
                value={item.fill ?? "#111111"}
                onChange={(e) => onUpdate({ fill: e.target.value }, `fill-${item.id}`)}
                className="h-8 w-10 cursor-pointer rounded-lg border bg-transparent p-1"
                aria-label="Text color"
              />
            </div>
            <div className="flex gap-1.5">
              <Button
                variant={item.fontStyle?.includes("bold") ? "secondary" : "outline"}
                size="sm"
                className="flex-1 font-bold"
                aria-pressed={!!item.fontStyle?.includes("bold")}
                onClick={() => onUpdate({ fontStyle: toggleStyle(item.fontStyle, "bold") })}
              >
                B
              </Button>
              <Button
                variant={item.fontStyle?.includes("italic") ? "secondary" : "outline"}
                size="sm"
                className="flex-1"
                aria-pressed={!!item.fontStyle?.includes("italic")}
                onClick={() => onUpdate({ fontStyle: toggleStyle(item.fontStyle, "italic") })}
              >
                <Italic />
              </Button>
            </div>
            <FieldRow label={`Letter spacing · ${round(item.letterSpacing ?? 0, 1)}`}>
              <Slider value={[item.letterSpacing ?? 0]} min={-2} max={20} step={0.5} onValueChange={(v) => onUpdate({ letterSpacing: v[0] ?? 0 }, `ls-${item.id}`)} />
            </FieldRow>
            <FieldRow label={`Curve · ${Math.round(item.curve ?? 0)}`}>
              <Slider value={[item.curve ?? 0]} min={-100} max={100} step={1} onValueChange={(v) => onUpdate({ curve: v[0] ?? 0 }, `curve-${item.id}`)} />
            </FieldRow>
          </div>
        )}

        {dpi !== null && dpi < 150 && (
          <p className="rounded-lg bg-rose-500/10 p-2.5 text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">
            This image is only {dpi} DPI at this size and may print blurry. Make it smaller or upload a larger file.
          </p>
        )}
      </div>
    </PanelSection>
  );
}

export function StudioLayers({
  items,
  selectedId,
  onSelect,
  onDelete,
}: {
  items: StudioItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <PanelSection title={`Layers on this side (${items.length})`}>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nothing here yet — add art or text from the left panel.</p>
      ) : (
        <ul className="-mx-1 space-y-0.5">
          {[...items].reverse().map((it) => (
            <li key={it.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelect(it.id)}
                onKeyDown={(e) => e.key === "Enter" && onSelect(it.id)}
                className={cn(
                  "group flex items-center gap-2 rounded-lg px-1.5 py-1 text-xs",
                  it.id === selectedId ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted"
                )}
              >
                <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-md border bg-checker">
                  {it.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.src} alt="" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <Type className="size-3.5 text-muted-foreground" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{displayName(it)}</span>
                <DpiDot dpi={itemDpi(it, PX_PER_IN)} />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(it.id);
                  }}
                  className="grid size-6 place-items-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
                  aria-label="Delete layer"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelSection>
  );
}

export function OrderPanel({
  product,
  sizes,
  onSizes,
  locations,
  price,
  next,
}: {
  product: ProductDTO;
  sizes: Record<string, number>;
  onSizes: (s: Record<string, number>) => void;
  locations: string[];
  price: LinePrice;
  next: PriceTier | null;
}) {
  const options = product.options.apparelSizes ?? [];
  const qty = Object.values(sizes).reduce((a, b) => a + b, 0);
  const locs = (product.options.printLocations ?? []).filter((l) => locations.includes(l.id));
  const set = (size: string, v: number) => onSizes({ ...sizes, [size]: Math.max(0, Math.min(999, v)) });
  return (
    <PanelSection title="Sizes & quantity">
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((o) => (
          <div key={o.size} className={cn("flex items-center gap-1 rounded-lg border px-1.5 py-1", (sizes[o.size] ?? 0) > 0 && "border-primary/40 bg-primary/5")}>
            <span className="w-8 text-xs font-semibold">{o.size}</span>
            <button type="button" className="grid size-6 place-items-center rounded-md hover:bg-muted" onClick={() => set(o.size, (sizes[o.size] ?? 0) - 1)} aria-label={`Fewer ${o.size}`}>
              <Minus className="size-3" />
            </button>
            <input
              value={sizes[o.size] ?? 0}
              inputMode="numeric"
              onChange={(e) => set(o.size, Number(e.target.value.replace(/\D/g, "")) || 0)}
              onKeyDown={(e) => e.stopPropagation()}
              className="w-full min-w-0 bg-transparent text-center text-sm tabular-nums outline-none"
              aria-label={`${o.size} quantity`}
            />
            <button type="button" className="grid size-6 place-items-center rounded-md hover:bg-muted" onClick={() => set(o.size, (sizes[o.size] ?? 0) + 1)} aria-label={`More ${o.size}`}>
              <Plus className="size-3" />
            </button>
            {o.upcharge > 0 && <span className="text-[10px] text-muted-foreground">+{formatMoney(o.upcharge).replace(".00", "")}</span>}
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-1.5 rounded-xl bg-muted/60 p-3 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>Blank {product.name.split(" ").slice(-1)[0]?.toLowerCase()}</span>
          <span className="tabular-nums">{formatMoney(product.basePrice)}</span>
        </div>
        {locs.length === 0 ? (
          <div className="flex justify-between text-muted-foreground">
            <span>Print</span>
            <span>Add a design</span>
          </div>
        ) : (
          locs.map((l) => (
            <div key={l.id} className="flex justify-between text-muted-foreground">
              <span>{l.label} print</span>
              <span className="tabular-nums">+{formatMoney(l.price)}</span>
            </div>
          ))
        )}
        <div className="flex items-baseline justify-between border-t pt-1.5">
          <span className="text-muted-foreground">
            {qty} item{qty === 1 ? "" : "s"} · {formatMoney(price.unitPrice)} ea
          </span>
          <span className="font-heading text-xl font-bold text-foreground tabular-nums">{formatMoney(price.total)}</span>
        </div>
        {price.discountPct > 0 && <p className="font-medium text-emerald-600 dark:text-emerald-400">Bulk discount: {price.discountPct}% off applied</p>}
        {next && qty > 0 && (
          <p className="text-muted-foreground">
            Add {next.minQty - qty} more to save <span className="font-semibold text-foreground">{next.discountPct}%</span>
          </p>
        )}
      </div>
    </PanelSection>
  );
}

function toggleStyle(current: StudioItem["fontStyle"], flag: "bold" | "italic"): StudioItem["fontStyle"] {
  const bold = current?.includes("bold") ?? false;
  const italic = current?.includes("italic") ?? false;
  const b = flag === "bold" ? !bold : bold;
  const i = flag === "italic" ? !italic : italic;
  return b && i ? "bold italic" : b ? "bold" : i ? "italic" : "normal";
}
