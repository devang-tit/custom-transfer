"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Layers, Lock, MessageSquareText, Paintbrush, ShoppingBag, Sparkles, Upload, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { FileDropzone, type UploadedArtwork } from "@/components/shared/file-dropzone";
import { useCart } from "@/stores/cart";
import { priceLine } from "@/lib/pricing";
import { formatMoney } from "@/lib/format";
import { toPricingProduct, productImage, type ProductDTO } from "@/lib/products";
import type { LineSelection } from "@/lib/types";
import { cn } from "@/lib/utils";
import { minQuantityFor } from "../cart-line";
import { FinishPicker, OptionLabel, QuantityStepper, SizePicker, TierNudge, TierTable } from "./parts";

export function ProductConfigurator({ product, defaultSizeId }: { product: ProductDTO; defaultSizeId?: string }) {
  if (product.type === "APPAREL") return <ApparelConfigurator product={product} />;
  if (product.slug.includes("gang-sheet")) return <GangSheetConfigurator product={product} defaultSizeId={defaultSizeId} />;
  return <StandardConfigurator product={product} defaultSizeId={defaultSizeId} />;
}

/* ---------- shared bits ---------- */

function useAdd(product: ProductDTO) {
  const addItem = useCart((s) => s.addItem);
  return (sel: LineSelection, artwork: UploadedArtwork | null, notes?: string) => {
    const p = priceLine(toPricingProduct(product), sel);
    if (!p.quantity) return toast.error("Choose a quantity first");
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      type: product.type,
      image: artwork && artwork.type.startsWith("image/") ? artwork.url : productImage(product),
      variantLabel: p.variantLabel,
      selection: { ...sel, quantity: p.quantity },
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      total: p.total,
      artworkUrl: artwork?.url,
      artworkName: artwork?.name,
      notes: notes?.trim() || undefined,
    });
    toast.success(`Added to cart`, { description: `${p.quantity} × ${product.name}` });
  };
}

function Summary({
  unit,
  baseUnit,
  quantity,
  total,
  discountPct,
  unitLabel = "each",
  disabledReason,
  onAdd,
  extra,
  gross,
}: {
  /** Pre-discount line total; defaults to baseUnit × quantity */
  gross?: number;
  unit: number;
  baseUnit: number;
  quantity: number;
  total: number;
  discountPct: number;
  unitLabel?: string;
  disabledReason?: string | null;
  onAdd: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className="border-t pt-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">
            {quantity} × {formatMoney(unit)} {unitLabel}
            {discountPct > 0 && <span className="ml-1.5 text-muted-foreground line-through">{formatMoney(baseUnit)}</span>}
          </p>
          <p className="font-heading text-3xl font-extrabold tabular-nums">{formatMoney(total)}</p>
        </div>
        {discountPct > 0 && (
          <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
            You save {formatMoney(Math.max(0, (gross ?? baseUnit * quantity) - total))}
          </span>
        )}
      </div>
      <Button onClick={onAdd} disabled={!!disabledReason} className="mt-4 h-12 w-full rounded-xl text-base shadow-glow">
        <ShoppingBag className="size-4.5" /> Add to cart
      </Button>
      {disabledReason ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">{disabledReason}</p>
      ) : (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3" /> Free artwork review on every order
        </p>
      )}
      {extra}
    </div>
  );
}

function NotesField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(!!value);
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <MessageSquareText className="size-4" /> Add production notes
      </button>
    );
  return (
    <div>
      <OptionLabel title="Production notes" hint="Color matching, mirroring, deadlines… (optional)" />
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} maxLength={500} rows={3} placeholder="e.g. Please match Pantone 185C" className="rounded-xl" />
    </div>
  );
}

/* ---------- transfers / UV / screen print / supplies ---------- */

function StandardConfigurator({ product, defaultSizeId }: { product: ProductDTO; defaultSizeId?: string }) {
  const sizes = product.options.sizes ?? [];
  const finishes = product.options.finishes ?? [];
  const requiresArt = !!product.options.requiresArtwork;
  const minQty = minQuantityFor(product);
  const [sizeId, setSizeId] = useState(sizes.find((s) => s.id === defaultSizeId)?.id ?? sizes[0]?.id ?? "");
  const [finishId, setFinishId] = useState(finishes[0]?.id ?? "");
  const [quantity, setQuantity] = useState(Math.max(minQty, requiresArt ? 10 : 1));
  const [artwork, setArtwork] = useState<UploadedArtwork | null>(null);
  const [notes, setNotes] = useState("");
  const add = useAdd(product);
  const size = sizes.find((s) => s.id === sizeId);
  const sel: LineSelection = { sizeId, finishId: finishId || undefined, quantity };
  const price = useMemo(() => priceLine(toPricingProduct(product), sel), [product, sizeId, finishId, quantity]); // eslint-disable-line react-hooks/exhaustive-deps
  const supplies = product.type === "SUPPLIES";
  let step = 1;

  return (
    <div className="space-y-7">
      {sizes.length > 1 && (
        <div>
          <OptionLabel step={step++} title="Choose a size" hint={supplies ? undefined : "Width × height of your design"} />
          <SizePicker sizes={sizes} value={sizeId} onChange={setSizeId} />
        </div>
      )}
      {finishes.length > 1 && (
        <div>
          <OptionLabel step={step++} title="Finish" />
          <FinishPicker finishes={finishes} value={finishId} onChange={setFinishId} />
        </div>
      )}
      <div>
        <OptionLabel
          step={step++}
          title="Quantity"
          hint={minQty > 1 ? `Minimum ${minQty} pieces` : product.tiers.length > 1 ? "Discounts apply automatically" : undefined}
        />
        <div className="flex flex-wrap items-center gap-2">
          <QuantityStepper value={quantity} onChange={setQuantity} min={minQty} />
          {!supplies &&
            [10, 25, 50, 100].filter((q) => q >= minQty).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuantity(q)}
                className={cn("h-11 rounded-[0.875rem] border px-3.5 text-sm font-medium transition-colors hover:border-primary/50", quantity === q && "border-primary bg-primary/5")}
              >
                {q}
              </button>
            ))}
        </div>
        {product.tiers.length > 1 && (
          <div className="mt-3 space-y-2">
            <TierTable tiers={product.tiers} baseUnit={price.baseUnitPrice} quantity={quantity} onPick={setQuantity} />
            <TierNudge tiers={product.tiers} quantity={quantity} onPick={setQuantity} />
          </div>
        )}
      </div>
      {requiresArt && (
        <div>
          <OptionLabel step={step++} title="Upload artwork" hint="We’ll check resolution for the size you picked" />
          <FileDropzone value={artwork} onChange={setArtwork} printWidthIn={size?.width} printHeightIn={size?.height} />
        </div>
      )}
      {requiresArt && <NotesField value={notes} onChange={setNotes} />}
      <Summary
        unit={price.unitPrice}
        baseUnit={price.baseUnitPrice}
        quantity={price.quantity}
        total={price.total}
        discountPct={price.discountPct}
        disabledReason={requiresArt && !artwork ? "Upload your artwork to add this to your cart" : null}
        onAdd={() => add(sel, artwork, notes)}
      />
    </div>
  );
}

/* ---------- gang sheets ---------- */

function GangSheetConfigurator({ product, defaultSizeId }: { product: ProductDTO; defaultSizeId?: string }) {
  const sizes = product.options.sizes ?? [];
  const [mode, setMode] = useState<"build" | "upload">(product.slug.startsWith("upload") ? "upload" : "build");
  const [sizeId, setSizeId] = useState(sizes.find((s) => s.id === defaultSizeId)?.id ?? sizes[Math.min(4, sizes.length - 1)]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [artwork, setArtwork] = useState<UploadedArtwork | null>(null);
  const [notes, setNotes] = useState("");
  const add = useAdd(product);
  const size = sizes.find((s) => s.id === sizeId);
  const sel: LineSelection = { sizeId, quantity };
  const price = priceLine(toPricingProduct(product), sel);
  const builderHref = `/gang-sheet-builder?product=${product.slug}&size=${sizeId}`;

  return (
    <div className="space-y-7">
      <div>
        <OptionLabel step={1} title="Sheet length" hint={`All sheets are ${size?.width ?? 22}″ wide`} right={size && <span className="text-xs text-muted-foreground">{formatMoney(Math.round(size.price / size.height))}/inch</span>} />
        <SizePicker sizes={sizes} value={sizeId} onChange={setSizeId} compact />
      </div>

      <div>
        <OptionLabel step={2} title="How do you want to create it?" />
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
          {([
            { id: "build", label: "Build online", icon: Wand2 },
            { id: "upload", label: "Upload ready file", icon: Upload },
          ] as const).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all",
                mode === m.id ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <m.icon className="size-4" /> {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "build" ? (
        <div className="relative overflow-hidden rounded-3xl bg-ink-key p-6 text-white">
          <div className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-primary/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full bg-ink-magenta/30 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold"><Sparkles className="size-3.5 text-ink-yellow" /> Recommended</span>
            <p className="mt-4 font-heading text-2xl font-bold">Gang Sheet Builder</p>
            <p className="mt-1 max-w-sm text-sm text-white/70">
              Upload your designs, auto-pack them onto a {size?.label ?? "22″"} sheet, check DPI and see the price live.
            </p>
            <ul className="mt-4 grid gap-1.5 text-sm text-white/80 sm:grid-cols-2">
              {["Smart auto-pack", "Live DPI warnings", "Duplicate & fill", "Save & reorder designs"].map((f) => (
                <li key={f} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-ink-cyan" />{f}</li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button asChild className="h-12 rounded-xl bg-white px-5 text-base text-ink-key hover:bg-white/90">
                <Link href={builderHref}><Layers className="size-4.5" /> Open Gang Sheet Builder <ArrowRight className="size-4" /></Link>
              </Button>
              <span className="text-sm text-white/70">from <strong className="text-white">{formatMoney(size?.price ?? product.basePrice)}</strong> per sheet</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div>
            <OptionLabel step={3} title="Upload your print-ready sheet" hint={`Transparent PNG, ${size?.width ?? 22}″ wide at 300 DPI`} />
            <FileDropzone value={artwork} onChange={setArtwork} printWidthIn={size?.width} printHeightIn={size?.height} accept="image/png,application/pdf" hint="PNG or PDF · transparent background" />
          </div>
          <div>
            <OptionLabel step={4} title="Copies" hint="Need the same sheet more than once?" />
            <QuantityStepper value={quantity} onChange={setQuantity} />
            {product.tiers.length > 1 && (
              <div className="mt-3 space-y-2">
                <TierTable tiers={product.tiers} baseUnit={price.baseUnitPrice} quantity={quantity} onPick={setQuantity} unitLabel="sheets" />
                <TierNudge tiers={product.tiers} quantity={quantity} onPick={setQuantity} />
              </div>
            )}
          </div>
          <NotesField value={notes} onChange={setNotes} />
          <Summary
            unit={price.unitPrice}
            baseUnit={price.baseUnitPrice}
            quantity={price.quantity}
            total={price.total}
            discountPct={price.discountPct}
            unitLabel="per sheet"
            disabledReason={!artwork ? "Upload your gang sheet file to continue" : null}
            onAdd={() => add(sel, artwork, notes)}
          />
        </>
      )}
    </div>
  );
}

/* ---------- apparel ---------- */

function ApparelConfigurator({ product }: { product: ProductDTO }) {
  const colors = product.options.colors ?? [];
  const sizes = product.options.apparelSizes ?? [];
  const locations = product.options.printLocations ?? [];
  const [color, setColor] = useState(colors[0]?.name ?? "");
  const [locs, setLocs] = useState<string[]>(locations[0] ? [locations[0].id] : []);
  const [qty, setQty] = useState<Record<string, number>>({ M: 1 });
  const [artwork, setArtwork] = useState<UploadedArtwork | null>(null);
  const [notes, setNotes] = useState("");
  const add = useAdd(product);
  const sel: LineSelection = { color, printLocations: locs, apparelSizes: qty, quantity: Object.values(qty).reduce((a, b) => a + b, 0) };
  const price = priceLine(toPricingProduct(product), sel);
  const studioHref = `/design-studio?product=${product.slug}&color=${encodeURIComponent(color)}`;
  const reason = !price.quantity ? "Enter quantities for at least one size" : locs.length && !artwork ? "Upload artwork or open the Design Studio" : !locs.length ? "Choose at least one print location" : null;

  return (
    <div className="space-y-7">
      <Link
        href={studioHref}
        className="group relative flex items-center gap-4 overflow-hidden rounded-3xl bg-ink-key p-5 text-white transition-transform hover:-translate-y-0.5"
      >
        <div className="pointer-events-none absolute inset-0 bg-ink-gradient opacity-25" />
        <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-ink-key"><Paintbrush className="size-5" /></span>
        <span className="relative min-w-0">
          <span className="block font-heading text-lg font-bold">Customize in Design Studio</span>
          <span className="block text-sm text-white/70">Add text & images, preview front and back in real time.</span>
        </span>
        <ArrowRight className="relative ml-auto size-5 shrink-0 transition-transform group-hover:translate-x-1" />
      </Link>

      <div className="flex items-center gap-3 text-xs font-medium tracking-widest text-muted-foreground uppercase">
        <span className="h-px flex-1 bg-border" /> or quick order with your file <span className="h-px flex-1 bg-border" />
      </div>

      <div>
        <OptionLabel step={1} title="Garment color" right={<span className="text-sm font-medium">{color}</span>} />
        <div className="flex flex-wrap gap-2.5">
          {colors.map((c) => (
            <button
              key={c.name}
              type="button"
              title={c.name}
              aria-label={c.name}
              aria-pressed={color === c.name}
              onClick={() => setColor(c.name)}
              className={cn("grid size-10 place-items-center rounded-full border-2 transition-all", color === c.name ? "border-primary" : "border-transparent hover:border-border")}
            >
              <span className="size-7 rounded-full border border-black/10 shadow-inner" style={{ background: c.hex }} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <OptionLabel step={2} title="Print locations" hint="Each location is priced per garment" />
        <div className="grid grid-cols-2 gap-2">
          {locations.map((l) => {
            const on = locs.includes(l.id);
            return (
              <label key={l.id} className={cn("flex cursor-pointer items-center gap-3 rounded-[0.875rem] border bg-card px-3 py-2.5 transition-all hover:border-primary/50", on && "border-primary bg-primary/5 ring-1 ring-primary")}>
                <Checkbox checked={on} onCheckedChange={(v) => setLocs((cur) => (v ? [...cur, l.id] : cur.filter((x) => x !== l.id)))} />
                <span className="flex-1 text-sm font-semibold">{l.label}</span>
                <span className="text-xs text-muted-foreground">+{formatMoney(l.price)}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <OptionLabel step={3} title="Sizes & quantities" hint="Mix sizes — discounts use the total" right={<span className="text-sm font-semibold tabular-nums">{price.quantity} pcs</span>} />
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {sizes.map((s) => (
            <label key={s.size} className="rounded-[0.875rem] border bg-card p-2 text-center focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
              <span className="block text-xs font-semibold">{s.size}</span>
              <input
                inputMode="numeric"
                aria-label={`Quantity ${s.size}`}
                value={qty[s.size] ?? ""}
                placeholder="0"
                onChange={(e) => {
                  const n = Math.min(999, Number(e.target.value.replace(/\D/g, "")) || 0);
                  setQty((q) => {
                    const next = { ...q };
                    if (n) next[s.size] = n;
                    else delete next[s.size];
                    return next;
                  });
                }}
                className="mt-1 w-full bg-transparent text-center text-lg font-semibold tabular-nums outline-none placeholder:text-muted-foreground/40"
              />
              <span className="block text-[10px] text-muted-foreground">{s.upcharge ? `+${formatMoney(s.upcharge)}` : " "}</span>
            </label>
          ))}
        </div>
        {product.tiers.length > 1 && (
          <div className="mt-3 space-y-2">
            <TierTable tiers={product.tiers} baseUnit={price.baseUnitPrice} quantity={price.quantity} />
            {price.quantity > 0 && (
              <TierNudge tiers={product.tiers} quantity={price.quantity} onPick={(q) => setQty((cur) => ({ ...cur, M: (cur.M ?? 0) + (q - price.quantity) }))} />
            )}
          </div>
        )}
      </div>

      {locs.length > 0 && (
        <div>
          <OptionLabel step={4} title="Upload artwork" hint="Same design for all selected locations — or use the Design Studio" />
          <FileDropzone value={artwork} onChange={setArtwork} printWidthIn={12} printHeightIn={14} compact />
        </div>
      )}
      <NotesField value={notes} onChange={setNotes} />
      <Summary
        unit={price.unitPrice}
        baseUnit={price.baseUnitPrice}
        quantity={price.quantity}
        total={price.total}
        discountPct={price.discountPct}
        unitLabel="avg / garment"
        gross={Object.entries(qty).reduce((g, [sz, q]) => g + (price.baseUnitPrice + (sizes.find((x) => x.size === sz)?.upcharge ?? 0)) * q, 0)}
        disabledReason={reason}
        onAdd={() => add(sel, artwork, notes)}
      />
    </div>
  );
}
