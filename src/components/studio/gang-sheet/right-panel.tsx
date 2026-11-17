"use client";

import {
  AlignHorizontalJustifyCenter,
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  ChevronUp,
  Copy,
  Layers,
  Link2,
  Link2Off,
  Minus,
  Plus,
  RotateCw,
  Trash2,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import type { LinePrice } from "@/lib/pricing";
import type { PriceTier, SizeOption } from "@/lib/types";
import { STUDIO_FONTS, fontCss } from "@/components/studio/lib/fonts";
import { displayName, itemDpi, round, type StudioItem } from "@/components/studio/lib/geometry";
import { PanelSection, FieldRow } from "@/components/studio/ui/panel";
import { NumberField } from "@/components/studio/ui/number-field";
import { DpiBadge, DpiDot } from "@/components/studio/ui/dpi-badge";
import { ToolButton } from "@/components/studio/ui/tool-button";
import type { GangProductOption } from "./types";

export function SheetPanel({
  products,
  productSlug,
  onProductChange,
  sizes,
  sizeId,
  onSizeChange,
  quantity,
  onQuantityChange,
  price,
  next,
  requiredHeight,
}: {
  products: GangProductOption[];
  productSlug: string;
  onProductChange: (slug: string) => void;
  sizes: SizeOption[];
  sizeId: string;
  onSizeChange: (id: string) => void;
  quantity: number;
  onQuantityChange: (q: number) => void;
  price: LinePrice;
  next: PriceTier | null;
  requiredHeight: number;
}) {
  return (
    <PanelSection title="Sheet">
      <div className="grid gap-3">
        {products.length > 1 && (
          <FieldRow label="Print type">
            <Select value={productSlug} onValueChange={onProductChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.slug} value={p.slug}>
                    {p.type === "UV_DTF" ? "UV DTF (hard goods)" : "DTF (apparel)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
        )}
        <FieldRow label="Sheet size">
          <Select value={sizeId} onValueChange={onSizeChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sizes.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex w-full items-center justify-between gap-6">
                    <span>{s.label}</span>
                    <span className="text-muted-foreground tabular-nums">{formatMoney(s.price)}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
        {requiredHeight > 0 && (
          <p className="-mt-1 text-[11px] text-muted-foreground">
            Your designs currently use <span className="font-medium text-foreground tabular-nums">{round(requiredHeight, 1)}&quot;</span> of
            sheet length.
          </p>
        )}
        <FieldRow label="Copies of this sheet">
          <div className="flex h-9 items-center rounded-lg border">
            <Button variant="ghost" size="icon" className="h-full rounded-r-none" onClick={() => onQuantityChange(Math.max(1, quantity - 1))} aria-label="Fewer copies">
              <Minus />
            </Button>
            <input
              value={quantity}
              inputMode="numeric"
              onChange={(e) => onQuantityChange(Math.max(1, Math.min(999, Number(e.target.value.replace(/\D/g, "")) || 1)))}
              onKeyDown={(e) => e.stopPropagation()}
              className="h-full w-full min-w-0 bg-transparent text-center text-sm font-medium tabular-nums outline-none"
              aria-label="Copies"
            />
            <Button variant="ghost" size="icon" className="h-full rounded-l-none" onClick={() => onQuantityChange(Math.min(999, quantity + 1))} aria-label="More copies">
              <Plus />
            </Button>
          </div>
        </FieldRow>

        <div className="rounded-xl bg-muted/60 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Per sheet</span>
            <span className="text-sm tabular-nums">
              {price.discountPct > 0 && <span className="mr-1.5 text-xs text-muted-foreground line-through">{formatMoney(price.baseUnitPrice)}</span>}
              {formatMoney(price.unitPrice)}
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="font-heading text-xl font-bold tabular-nums">{formatMoney(price.total)}</span>
          </div>
          {price.discountPct > 0 && (
            <p className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">You&apos;re saving {price.discountPct}% with bulk pricing</p>
          )}
          {next && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Order {next.minQty - quantity} more to save <span className="font-semibold text-foreground">{next.discountPct}%</span>
            </p>
          )}
        </div>
      </div>
    </PanelSection>
  );
}

export function SelectionPanel({
  selected,
  lockRatio,
  onLockRatio,
  onUpdate,
  onResize,
  onDuplicate,
  onDelete,
  onOrder,
  onCenter,
}: {
  selected: StudioItem[];
  lockRatio: boolean;
  onLockRatio: (v: boolean) => void;
  onUpdate: (id: string, patch: Partial<StudioItem>, key?: string) => void;
  onResize: (id: string, w: number | null, h: number | null) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onOrder: (dir: "up" | "down" | "top" | "bottom") => void;
  onCenter: () => void;
}) {
  if (selected.length === 0) {
    return (
      <PanelSection title="Selection">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Select a design to edit its exact size, rotation and print quality. Shift-click or drag a box to select several.
        </p>
      </PanelSection>
    );
  }

  const actions = (
    <div className="flex items-center gap-0.5">
      <ToolButton label="Duplicate" shortcut="⌘D" size="icon-sm" onClick={onDuplicate}>
        <Copy />
      </ToolButton>
      <ToolButton label="Center horizontally" size="icon-sm" onClick={onCenter}>
        <AlignHorizontalJustifyCenter />
      </ToolButton>
      <ToolButton label="Delete" shortcut="Del" size="icon-sm" onClick={onDelete} className="hover:text-destructive">
        <Trash2 />
      </ToolButton>
    </div>
  );

  if (selected.length > 1) {
    return (
      <PanelSection title={`${selected.length} selected`} action={actions}>
        <div className="flex flex-wrap gap-1.5">
          <Button variant="outline" size="sm" onClick={() => onOrder("top")}>
            <ArrowUpToLine /> To front
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOrder("bottom")}>
            <ArrowDownToLine /> To back
          </Button>
        </div>
      </PanelSection>
    );
  }

  const it = selected[0]!;
  const dpi = itemDpi(it);
  return (
    <PanelSection title="Selection" action={actions}>
      <div className="grid gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border bg-checker">
            {it.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.src} alt="" className="max-h-full max-w-full object-contain" />
            ) : (
              <Type className="size-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName(it)}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <DpiBadge dpi={dpi} />
              {it.naturalWidth ? (
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {it.naturalWidth}×{it.naturalHeight}px
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-1.5">
          <FieldRow label="Width">
            <NumberField value={it.width} min={0.25} max={22} unit="in" onCommit={(v) => onResize(it.id, v, null)} ariaLabel="Width in inches" />
          </FieldRow>
          <ToolButton label={lockRatio ? "Unlock aspect ratio" : "Lock aspect ratio"} size="icon-sm" onClick={() => onLockRatio(!lockRatio)} active={lockRatio} disabled={it.kind === "text"}>
            {lockRatio || it.kind === "text" ? <Link2 /> : <Link2Off />}
          </ToolButton>
          <FieldRow label="Height">
            <NumberField value={it.height} min={0.25} max={240} unit="in" onCommit={(v) => onResize(it.id, null, v)} ariaLabel="Height in inches" />
          </FieldRow>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <FieldRow label="X">
            <NumberField value={it.x} step={0.125} unit="in" onCommit={(v) => onUpdate(it.id, { x: v })} ariaLabel="X position" />
          </FieldRow>
          <FieldRow label="Y">
            <NumberField value={it.y} step={0.125} unit="in" onCommit={(v) => onUpdate(it.id, { y: v })} ariaLabel="Y position" />
          </FieldRow>
          <FieldRow label="Rotate">
            <NumberField value={it.rotation} step={15} precision={1} unit="°" onCommit={(v) => onUpdate(it.id, { rotation: ((v % 360) + 360) % 360 })} ariaLabel="Rotation" />
          </FieldRow>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button variant="outline" size="sm" onClick={() => onUpdate(it.id, { rotation: ((it.rotation || 0) + 90) % 360 })}>
            <RotateCw /> 90°
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOrder("up")}>
            <ChevronUp /> Forward
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOrder("down")}>
            <ChevronDown /> Back
          </Button>
        </div>

        {it.kind === "text" && (
          <div className="grid gap-2 rounded-xl border p-3">
            <FieldRow label="Text">
              <Input value={it.text ?? ""} onChange={(e) => onUpdate(it.id, { text: e.target.value }, `text-${it.id}`)} onKeyDown={(e) => e.stopPropagation()} />
            </FieldRow>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <FieldRow label="Font">
                <Select value={it.fontFamily} onValueChange={(v) => onUpdate(it.id, { fontFamily: v })}>
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
              </FieldRow>
              <FieldRow label="Color">
                <input
                  type="color"
                  value={it.fill ?? "#111111"}
                  onChange={(e) => onUpdate(it.id, { fill: e.target.value }, `fill-${it.id}`)}
                  className="h-8 w-10 cursor-pointer rounded-lg border bg-transparent p-1"
                  aria-label="Text color"
                />
              </FieldRow>
            </div>
            <Button
              variant={it.fontStyle?.includes("bold") ? "secondary" : "outline"}
              size="sm"
              className="font-bold"
              onClick={() => onUpdate(it.id, { fontStyle: it.fontStyle?.includes("bold") ? "normal" : "bold" })}
            >
              Bold
            </Button>
          </div>
        )}

        {dpi !== null && dpi < 300 && (
          <p className={cn("rounded-lg p-2.5 text-[11px] leading-relaxed", dpi < 150 ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : "bg-amber-500/10 text-amber-800 dark:text-amber-300")}>
            {dpi < 150
              ? "This file will likely print blurry at this size. Shrink it or upload a higher-resolution version."
              : "Good enough for most prints. For the crispest result, use 300 DPI artwork."}{" "}
            Max size at 300 DPI: {round((it.naturalWidth ?? 0) / 300, 1)}&quot; × {round((it.naturalHeight ?? 0) / 300, 1)}&quot;.
          </p>
        )}
      </div>
    </PanelSection>
  );
}

export function LayersPanel({
  items,
  selectedIds,
  onSelect,
  onDelete,
}: {
  items: StudioItem[];
  selectedIds: string[];
  onSelect: (id: string, additive: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <PanelSection
      title={
        <span className="inline-flex items-center gap-1.5">
          <Layers className="size-3" /> Layers ({items.length})
        </span>
      }
    >
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No designs on the sheet yet.</p>
      ) : (
        <ul className="-mx-1 max-h-72 space-y-0.5 overflow-y-auto pr-1">
          {[...items].reverse().map((it) => {
            const active = selectedIds.includes(it.id);
            return (
              <li key={it.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => onSelect(it.id, e.shiftKey || e.metaKey)}
                  onKeyDown={(e) => e.key === "Enter" && onSelect(it.id, false)}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-1.5 py-1 text-xs transition-colors",
                    active ? "bg-primary/10 text-foreground ring-1 ring-primary/30" : "hover:bg-muted"
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
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{displayName(it)}</span>
                    <span className="block text-[10px] text-muted-foreground tabular-nums">
                      {round(it.width)}&quot; × {round(it.height)}&quot;
                    </span>
                  </span>
                  <DpiDot dpi={itemDpi(it)} />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(it.id);
                    }}
                    className="grid size-6 place-items-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-background hover:text-destructive focus-visible:opacity-100"
                    aria-label="Delete layer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PanelSection>
  );
}
