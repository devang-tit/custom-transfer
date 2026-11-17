"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Link2,
  Loader2,
  Plus,
  Save,
  Star,
  Trash2,
  UploadCloud,
  X,
  Wand2,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel } from "@/components/admin/page-header";
import { ProductCard } from "@/components/store/product-card";
import { uploadFile } from "@/lib/upload-client";
import { DEFAULT_TIERS, priceLine } from "@/lib/pricing";
import { formatMoney, slugify } from "@/lib/format";
import { GARMENT_COLORS } from "@/lib/mockups";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS, type ProductType } from "@/lib/types";
import type { ProductDTO } from "@/lib/products";
import { cn } from "@/lib/utils";
import { saveProduct, type ProductInput } from "./actions";

type Str<T> = { [K in keyof T]: string };
type SizeRow = Str<{ id: string; label: string; width: string; height: string; price: string }>;
type PricedRow = Str<{ id: string; label: string; price: string }>;
type FinishRow = Str<{ id: string; label: string; price: string; description: string }>;
type TierRow = Str<{ minQty: string; discountPct: string }>;
type ColorRow = Str<{ name: string; hex: string }>;
type ApparelSizeRow = Str<{ size: string; upcharge: string }>;

const d = (cents: number | null | undefined) => (cents === null || cents === undefined ? "" : (cents / 100).toFixed(2));
const c = (dollars: string) => Math.max(0, Math.round((parseFloat(dollars || "0") || 0) * 100));
const n = (v: string) => (v === "" ? 0 : Number(v) || 0);

const DEFAULT_APPAREL_SIZES: ApparelSizeRow[] = ["XS", "S", "M", "L", "XL", "2XL", "3XL"].map((s) => ({
  size: s,
  upcharge: s === "2XL" ? "2.00" : s === "3XL" ? "3.00" : "0.00",
}));
const DEFAULT_LOCATIONS: PricedRow[] = [
  { id: "front", label: "Full front", price: "5.50" },
  { id: "back", label: "Full back", price: "5.50" },
  { id: "left-chest", label: "Left chest", price: "3.50" },
  { id: "sleeve", label: "Sleeve", price: "3.00" },
];

type FormState = {
  name: string;
  slug: string;
  sku: string;
  type: ProductType;
  categoryId: string;
  shortDescription: string;
  description: string;
  badge: string;
  turnaround: string;
  images: string[];
  basePrice: string;
  compareAtPrice: string;
  requiresArtwork: boolean;
  sizes: SizeRow[];
  finishes: FinishRow[];
  tiers: TierRow[];
  colors: ColorRow[];
  apparelSizes: ApparelSizeRow[];
  printLocations: PricedRow[];
  features: string[];
  trackStock: boolean;
  stock: string;
  active: boolean;
  featured: boolean;
};

function fromDTO(p?: ProductDTO): FormState {
  const o = p?.options ?? {};
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    sku: p?.sku ?? "",
    type: (p?.type as ProductType) ?? "DTF_TRANSFER",
    categoryId: p?.categoryId ?? "",
    shortDescription: p?.shortDescription ?? "",
    description: p?.description ?? "",
    badge: p?.badge ?? "",
    turnaround: p?.turnaround ?? "",
    images: p?.images ?? [],
    basePrice: d(p?.basePrice ?? 0),
    compareAtPrice: d(p?.compareAtPrice ?? null),
    requiresArtwork: o.requiresArtwork ?? !p,
    sizes: (o.sizes ?? (p ? [] : [
      { id: "4x4", label: '4" × 4"', width: 4, height: 4, price: 199 },
      { id: "8x8", label: '8" × 8"', width: 8, height: 8, price: 499 },
    ])).map((s) => ({ id: s.id, label: s.label, width: String(s.width), height: String(s.height), price: d(s.price) })),
    finishes: (o.finishes ?? []).map((f) => ({ id: f.id, label: f.label, price: d(f.price), description: f.description ?? "" })),
    tiers: (p?.tiers?.length ? p.tiers : DEFAULT_TIERS).map((t) => ({ minQty: String(t.minQty), discountPct: String(t.discountPct) })),
    colors: (o.colors ?? []).map((x) => ({ name: x.name, hex: x.hex })),
    apparelSizes: (o.apparelSizes ?? []).map((x) => ({ size: x.size, upcharge: d(x.upcharge) })),
    printLocations: (o.printLocations ?? []).map((x) => ({ id: x.id, label: x.label, price: d(x.price) })),
    features: p?.features ?? [],
    trackStock: p ? p.stock !== null : false,
    stock: p?.stock !== null && p?.stock !== undefined ? String(p.stock) : "0",
    active: p?.active ?? true,
    featured: p?.featured ?? false,
  };
}

function toInput(s: FormState, id?: string): ProductInput {
  const apparel = s.type === "APPAREL";
  return {
    id,
    name: s.name,
    slug: s.slug,
    sku: s.sku,
    type: s.type,
    categoryId: s.categoryId,
    shortDescription: s.shortDescription,
    description: s.description,
    badge: s.badge,
    turnaround: s.turnaround,
    images: s.images,
    basePrice: c(s.basePrice),
    compareAtPrice: s.compareAtPrice ? c(s.compareAtPrice) : null,
    options: apparel
      ? {
          requiresArtwork: s.requiresArtwork,
          colors: s.colors.filter((x) => x.name.trim()),
          apparelSizes: s.apparelSizes.filter((x) => x.size.trim()).map((x) => ({ size: x.size.trim(), upcharge: c(x.upcharge) })),
          printLocations: s.printLocations.filter((x) => x.label.trim()).map((x) => ({ id: x.id || slugify(x.label), label: x.label, price: c(x.price) })),
        }
      : {
          requiresArtwork: s.requiresArtwork,
          sizes: s.sizes
            .filter((x) => x.label.trim())
            .map((x) => ({ id: x.id || slugify(x.label) || `${x.width}x${x.height}`, label: x.label, width: n(x.width), height: n(x.height), price: c(x.price) })),
          finishes: s.finishes
            .filter((x) => x.label.trim())
            .map((x) => ({ id: x.id || slugify(x.label), label: x.label, price: c(x.price), ...(x.description.trim() ? { description: x.description.trim() } : {}) })),
        },
    tiers: s.tiers.filter((t) => t.minQty !== "").map((t) => ({ minQty: Math.max(1, Math.round(n(t.minQty))), discountPct: n(t.discountPct) })),
    features: s.features.map((f) => f.trim()).filter(Boolean),
    stock: s.trackStock ? Math.max(0, Math.round(n(s.stock))) : null,
    featured: s.featured,
    active: s.active,
  };
}

export function ProductForm({ product, categories }: { product?: ProductDTO; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const initial = useMemo(() => fromDTO(product), [product]);
  const [s, setS] = useState<FormState>(initial);
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [saving, start] = useTransition();
  const dirty = JSON.stringify(s) !== JSON.stringify(initial);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setS((p) => ({ ...p, [k]: v }));
  const apparel = s.type === "APPAREL";

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const submit = () =>
    start(async () => {
      const res = await saveProduct(toInput(s, product?.id));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message);
      if (!product) router.push(`/admin/products/${res.id}`);
      else router.refresh();
    });

  // Live preview DTO
  const input = toInput(s, product?.id);
  const preview: ProductDTO = {
    id: product?.id ?? "preview",
    name: s.name || "Untitled product",
    slug: s.slug || "preview",
    sku: s.sku || null,
    type: s.type,
    categoryId: s.categoryId || null,
    shortDescription: s.shortDescription || null,
    description: s.description || null,
    images: s.images,
    basePrice: apparel ? input.basePrice : Math.min(...(input.options.sizes?.map((x) => x.price) ?? [input.basePrice]), input.basePrice || Infinity),
    compareAtPrice: input.compareAtPrice,
    options: input.options,
    tiers: input.tiers,
    features: input.features,
    badge: s.badge || null,
    turnaround: s.turnaround || null,
    stock: input.stock,
    featured: s.featured,
    active: s.active,
    rating: product?.rating,
    reviewCount: product?.reviewCount,
  };
  if (!isFinite(preview.basePrice)) preview.basePrice = 0;

  // Example price: the first variant at the 2nd tier threshold
  const sampleQty = input.tiers[1]?.minQty ?? 10;
  const sample = priceLine(
    { id: preview.id, type: preview.type, basePrice: preview.basePrice, options: preview.options, tiers: preview.tiers },
    apparel
      ? { quantity: sampleQty, color: input.options.colors?.[0]?.name, apparelSizes: { [input.options.apparelSizes?.[0]?.size ?? "M"]: sampleQty }, printLocations: input.options.printLocations?.slice(0, 1).map((l) => l.id) }
      : { quantity: sampleQty, sizeId: input.options.sizes?.[0]?.id }
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="pb-24"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          <Panel title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product name" className="sm:col-span-2">
                <Input
                  value={s.name}
                  required
                  onChange={(e) => {
                    const name = e.target.value;
                    setS((p) => ({ ...p, name, slug: slugTouched ? p.slug : slugify(name) }));
                  }}
                  placeholder="e.g. Custom DTF Transfers by Size"
                />
              </Field>
              <Field label="URL slug" hint={`/products/${s.slug || "…"}`}>
                <Input
                  value={s.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", slugify(e.target.value));
                  }}
                  className="font-mono text-sm"
                />
              </Field>
              <Field label="SKU">
                <Input value={s.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} placeholder="DTF-SIZE" className="font-mono text-sm" />
              </Field>
              <Field label="Short description" className="sm:col-span-2" hint="Shown on product cards and at the top of the product page.">
                <Textarea value={s.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} className="min-h-16" maxLength={300} />
              </Field>
              <Field label="Full description" className="sm:col-span-2">
                <Textarea value={s.description} onChange={(e) => set("description", e.target.value)} className="min-h-36" />
              </Field>
            </div>
          </Panel>

          <MediaPanel images={s.images} onChange={(v) => set("images", v)} />

          {!apparel ? (
            <Panel
              title="Sizes & pricing"
              description="Each size is a variant with its own per-piece price."
              action={
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Customer uploads artwork
                  <Switch checked={s.requiresArtwork} onCheckedChange={(v) => set("requiresArtwork", v)} />
                </label>
              }
            >
              <RowsEditor<SizeRow>
                rows={s.sizes}
                onChange={(v) => set("sizes", v)}
                newRow={() => ({ id: "", label: "", width: "", height: "", price: "" })}
                addLabel="Add size"
                columns={[
                  { key: "label", label: "Label", placeholder: '10" × 10"', className: "min-w-36 flex-[2]" },
                  { key: "width", label: "W (in)", type: "number", className: "w-20" },
                  { key: "height", label: "H (in)", type: "number", className: "w-20" },
                  { key: "price", label: "Price", type: "money", className: "w-28" },
                  { key: "id", label: "Variant id", placeholder: "auto", mono: true, className: "w-28" },
                ]}
                onRowBlur={(row) => (!row.label && row.width && row.height ? { ...row, label: `${row.width}" × ${row.height}"` } : row)}
              />
              <div className="mt-5 border-t pt-4">
                <p className="mb-2 text-sm font-medium">Finishes / add-ons</p>
                <p className="mb-3 text-xs text-muted-foreground">Optional per-piece upcharges like Glitter or Glow. Leave empty if not applicable.</p>
                <RowsEditor<FinishRow>
                  rows={s.finishes}
                  onChange={(v) => set("finishes", v)}
                  newRow={() => ({ id: "", label: "", price: "", description: "" })}
                  addLabel="Add finish"
                  columns={[
                    { key: "label", label: "Finish", placeholder: "Glitter", className: "min-w-28 flex-1" },
                    { key: "description", label: "Description", placeholder: "Sparkle flake top layer", className: "min-w-36 flex-[1.5]" },
                    { key: "price", label: "+ Price", type: "money", className: "w-28" },
                    { key: "id", label: "Id", placeholder: "auto", mono: true, className: "w-24" },
                  ]}
                />
              </div>
            </Panel>
          ) : (
            <Panel
              title="Apparel options"
              description="Blank price + print locations, with per-size upcharges."
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setS((p) => ({
                      ...p,
                      colors: p.colors.length ? p.colors : GARMENT_COLORS.slice(0, 8).map((x) => ({ name: x.name, hex: x.hex })),
                      apparelSizes: p.apparelSizes.length ? p.apparelSizes : DEFAULT_APPAREL_SIZES,
                      printLocations: p.printLocations.length ? p.printLocations : DEFAULT_LOCATIONS,
                    }))
                  }
                >
                  <Wand2 /> Fill defaults
                </Button>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Blank garment price" hint="Per piece, before print locations.">
                  <MoneyInput value={s.basePrice} onChange={(v) => set("basePrice", v)} />
                </Field>
              </div>
              <div className="mt-5 border-t pt-4">
                <p className="mb-3 text-sm font-medium">Colors</p>
                <div className="flex flex-wrap gap-2">
                  {s.colors.map((col, i) => (
                    <div key={i} className="flex items-center gap-1.5 rounded-lg border bg-background py-1 pr-1 pl-1.5">
                      <label className="relative size-6 cursor-pointer overflow-hidden rounded-md ring-1 ring-border" style={{ background: col.hex }}>
                        <input
                          type="color"
                          value={col.hex}
                          onChange={(e) => set("colors", s.colors.map((x, j) => (j === i ? { ...x, hex: e.target.value.toUpperCase() } : x)))}
                          className="absolute inset-0 cursor-pointer opacity-0"
                          aria-label={`Color for ${col.name}`}
                        />
                      </label>
                      <input
                        value={col.name}
                        onChange={(e) => set("colors", s.colors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                        className="w-24 bg-transparent text-sm outline-none"
                        aria-label="Color name"
                      />
                      <button type="button" onClick={() => set("colors", s.colors.filter((_, j) => j !== i))} className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Remove ${col.name}`}>
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => set("colors", [...s.colors, { name: "New color", hex: "#888888" }])}>
                    <Plus /> Color
                  </Button>
                </div>
              </div>
              <div className="mt-5 grid gap-6 border-t pt-4 lg:grid-cols-2">
                <div>
                  <p className="mb-3 text-sm font-medium">Garment sizes</p>
                  <RowsEditor<ApparelSizeRow>
                    rows={s.apparelSizes}
                    onChange={(v) => set("apparelSizes", v)}
                    newRow={() => ({ size: "", upcharge: "0.00" })}
                    addLabel="Add size"
                    columns={[
                      { key: "size", label: "Size", placeholder: "XL", className: "w-24" },
                      { key: "upcharge", label: "Upcharge", type: "money", className: "flex-1" },
                    ]}
                  />
                </div>
                <div>
                  <p className="mb-3 text-sm font-medium">Print locations</p>
                  <RowsEditor<PricedRow>
                    rows={s.printLocations}
                    onChange={(v) => set("printLocations", v)}
                    newRow={() => ({ id: "", label: "", price: "" })}
                    addLabel="Add location"
                    columns={[
                      { key: "label", label: "Location", placeholder: "Full front", className: "flex-[2]" },
                      { key: "price", label: "Price", type: "money", className: "w-28" },
                    ]}
                  />
                </div>
              </div>
            </Panel>
          )}

          <Panel title="Quantity discounts" description="Tier discounts apply to the whole line once the quantity threshold is reached.">
            <RowsEditor<TierRow>
              rows={s.tiers}
              onChange={(v) => set("tiers", v)}
              newRow={() => ({ minQty: "", discountPct: "" })}
              addLabel="Add tier"
              columns={[
                { key: "minQty", label: "Min. quantity", type: "number", className: "flex-1" },
                { key: "discountPct", label: "Discount %", type: "number", className: "flex-1" },
              ]}
            />
            {input.tiers.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {[...input.tiers]
                  .sort((a, b) => a.minQty - b.minQty)
                  .map((t) => (
                    <span key={t.minQty} className="rounded-lg border bg-muted/50 px-2.5 py-1 text-xs">
                      <span className="font-semibold tabular-nums">{t.minQty}+</span>
                      <span className="text-muted-foreground"> pcs → </span>
                      <span className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">{t.discountPct}% off</span>
                    </span>
                  ))}
              </div>
            )}
          </Panel>

          <Panel title="Highlights" description="Short bullet points shown on the product page.">
            <div className="space-y-2">
              {s.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <GripVertical className="size-4 shrink-0 text-muted-foreground/50" />
                  <Input value={f} onChange={(e) => set("features", s.features.map((x, j) => (j === i ? e.target.value : x)))} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => set("features", s.features.filter((_, j) => j !== i))} aria-label="Remove highlight">
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => set("features", [...s.features, ""])}>
                <Plus /> Add highlight
              </Button>
            </div>
          </Panel>
        </div>

        <aside className="space-y-4">
          <Panel title="Visibility">
            <div className="space-y-3">
              <ToggleRow label="Live in store" description="Customers can find and buy it." checked={s.active} onChange={(v) => set("active", v)} />
              <ToggleRow label="Featured" description="Show on the homepage." checked={s.featured} onChange={(v) => set("featured", v)} />
            </div>
          </Panel>

          <Panel title="Organization">
            <div className="space-y-4">
              <Field label="Product type">
                <Select value={s.type} onValueChange={(v) => set("type", v as ProductType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{PRODUCT_TYPE_LABELS[s.type]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {PRODUCT_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Category">
                <Select value={s.categoryId || "none"} onValueChange={(v) => set("categoryId", v === "none" ? "" : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{categories.find((x) => x.id === s.categoryId)?.name ?? "No category"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((x) => (
                      <SelectItem key={x.id} value={x.id}>
                        {x.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Badge" hint="e.g. Best seller, New, Trending">
                <Input value={s.badge} onChange={(e) => set("badge", e.target.value)} />
              </Field>
              <Field label="Turnaround">
                <Input value={s.turnaround} onChange={(e) => set("turnaround", e.target.value)} placeholder="Ships in 24 hours" />
              </Field>
              <Field label="Compare-at price" hint="Shows a strikethrough “was” price.">
                <MoneyInput value={s.compareAtPrice} onChange={(v) => set("compareAtPrice", v)} placeholder="—" />
              </Field>
            </div>
          </Panel>

          <Panel title="Inventory">
            <ToggleRow
              label="Track stock"
              description={s.trackStock ? "Low-stock alerts at 10 or fewer." : "Made to order — no stock limit."}
              checked={s.trackStock}
              onChange={(v) => set("trackStock", v)}
            />
            {s.trackStock && (
              <Field label="Units in stock" className="mt-3">
                <Input type="number" min={0} value={s.stock} onChange={(e) => set("stock", e.target.value)} />
              </Field>
            )}
          </Panel>

          <div className="xl:sticky xl:top-20">
            <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Live preview</p>
            <div className="pointer-events-none max-w-72">
              <ProductCard product={preview} />
            </div>
            {sample.quantity > 0 && (
              <p className="mt-3 rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground">
                {sample.quantity} pcs {apparel ? "" : `of ${input.options.sizes?.[0]?.label ?? "first size"} `}→{" "}
                <span className="font-semibold text-foreground">{formatMoney(sample.unitPrice)}</span>/pc ·{" "}
                <span className="font-semibold text-foreground">{formatMoney(sample.total)}</span> total
                {sample.discountPct > 0 && <span className="text-emerald-600 dark:text-emerald-400"> ({sample.discountPct}% off)</span>}
              </p>
            )}
          </div>
        </aside>
      </div>

      <div
        className={cn(
          "fixed right-0 bottom-0 left-0 z-40 border-t bg-background/85 backdrop-blur-xl transition-transform lg:left-64",
          dirty || !product ? "translate-y-0" : "invisible translate-y-full"
        )}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">{product ? "You have unsaved changes" : "New product — not saved yet"}</p>
          <div className="flex gap-2">
            {product && (
              <Button type="button" variant="outline" disabled={saving} onClick={() => setS(initial)}>
                Discard
              </Button>
            )}
            <Button type="submit" disabled={saving} className="min-w-28">
              {saving ? <Loader2 className="animate-spin" /> : <Save />} {product ? "Save changes" : "Create product"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function Field({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-[13px]">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-muted-foreground">{description}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5" />
    </label>
  );
}

function MoneyInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">$</span>
      <Input
        type="number"
        inputMode="decimal"
        step="0.01"
        min={0}
        value={value}
        placeholder={placeholder ?? "0.00"}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => e.target.value && onChange((parseFloat(e.target.value) || 0).toFixed(2))}
        className="pl-6 tabular-nums"
      />
    </div>
  );
}

type Column<T> = { key: keyof T; label: string; type?: "text" | "number" | "money"; placeholder?: string; className?: string; mono?: boolean };

function RowsEditor<T extends Record<string, string>>({
  rows,
  onChange,
  columns,
  newRow,
  addLabel,
  onRowBlur,
}: {
  rows: T[];
  onChange: (rows: T[]) => void;
  columns: Column<T>[];
  newRow: () => T;
  addLabel: string;
  onRowBlur?: (row: T) => T;
}) {
  const update = (i: number, key: keyof T, v: string) => onChange(rows.map((r, j) => (j === i ? { ...r, [key]: v } : r)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {rows.length > 0 && (
        <div className="hidden gap-2 px-1 text-xs font-medium text-muted-foreground sm:flex">
          {columns.map((col) => (
            <span key={String(col.key)} className={cn("min-w-0", col.className)}>
              {col.label}
            </span>
          ))}
          <span className="w-[76px]" />
        </div>
      )}
      {rows.map((row, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg sm:flex-nowrap" onBlur={() => onRowBlur && onChange(rows.map((r, j) => (j === i ? onRowBlur(r) : r)))}>
          {columns.map((col) =>
            col.type === "money" ? (
              <MoneyInput key={String(col.key)} className={cn("min-w-0", col.className)} value={row[col.key]} onChange={(v) => update(i, col.key, v)} />
            ) : (
              <Input
                key={String(col.key)}
                aria-label={col.label}
                type={col.type === "number" ? "number" : "text"}
                step="any"
                value={row[col.key]}
                placeholder={col.placeholder}
                onChange={(e) => update(i, col.key, e.target.value)}
                className={cn("min-w-0", col.mono && "font-mono text-xs", col.className)}
              />
            )
          )}
          <div className="flex shrink-0 items-center">
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
              <ArrowLeft className="rotate-90" />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label="Remove row">
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, newRow()])}>
        <Plus /> {addLabel}
      </Button>
    </div>
  );
}

function MediaPanel({ images, onChange }: { images: string[]; onChange: (v: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [url, setUrl] = useState("");
  const [dragging, setDragging] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = [...files].filter((f) => f.type.startsWith("image/"));
    setBusy(list.length);
    const added: string[] = [];
    for (const f of list) {
      try {
        const r = await uploadFile(f, f.name);
        added.push(r.url);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy((b) => b - 1);
      }
    }
    if (added.length) {
      onChange([...images, ...added]);
      toast.success(`${added.length} image${added.length === 1 ? "" : "s"} added`);
    }
    if (inputRef.current) inputRef.current.value = "";
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };

  return (
    <Panel title="Media" description="The first image is the cover. Square images (1:1) look best.">
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void upload(e.dataTransfer.files);
        }}
      >
        {images.map((src, i) => (
          <div key={`${src}-${i}`} className={cn("group relative aspect-square overflow-hidden rounded-xl border bg-muted", i === 0 && "ring-2 ring-primary/50")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="size-full object-cover" />
            {i === 0 && <span className="absolute top-2 left-2 rounded-md bg-foreground/85 px-1.5 py-0.5 text-[10px] font-semibold text-background">Cover</span>}
            <div className="absolute inset-x-2 bottom-2 flex justify-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
              <IconBtn label="Move left" onClick={() => move(i, -1)} disabled={i === 0}>
                <ArrowLeft />
              </IconBtn>
              {i !== 0 && (
                <IconBtn label="Make cover" onClick={() => onChange([src, ...images.filter((_, j) => j !== i)])}>
                  <Star />
                </IconBtn>
              )}
              <IconBtn label="Move right" onClick={() => move(i, 1)} disabled={i === images.length - 1}>
                <ArrowRight />
              </IconBtn>
              <IconBtn label="Remove image" onClick={() => onChange(images.filter((_, j) => j !== i))}>
                <Trash2 />
              </IconBtn>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/40 hover:text-foreground",
            dragging && "border-primary bg-primary/5"
          )}
        >
          {busy > 0 ? <Loader2 className="size-5 animate-spin" /> : images.length ? <ImagePlus className="size-5" /> : <UploadCloud className="size-5" />}
          <span className="px-2 text-center text-xs">{busy > 0 ? `Uploading ${busy}…` : "Upload or drop images"}</span>
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => void upload(e.target.files)} />
      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image URL (/images/products/…)" className="pl-8" />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!url.trim()}
          onClick={() => {
            onChange([...images, url.trim()]);
            setUrl("");
          }}
        >
          Add
        </Button>
      </div>
    </Panel>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-7 place-items-center rounded-md bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:bg-background disabled:opacity-40 [&_svg]:size-3.5"
    >
      {children}
    </button>
  );
}
