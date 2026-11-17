"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Layers, Loader2, Maximize, Redo2, Save, ShoppingBag, Sparkles, Undo2, UploadCloud, Wrench, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { nextTier, priceLine } from "@/lib/pricing";
import { toPricingProduct } from "@/lib/products";
import { uploadFile, readImageSize } from "@/lib/upload-client";
import { useCart } from "@/stores/cart";
import { saveDesignAction } from "@/app/(studio)/actions";
import { useHistory } from "@/components/studio/lib/history";
import { clamp, dpiLevel, itemDpi, round, uid, type StudioItem } from "@/components/studio/lib/geometry";
import { measureText } from "@/components/studio/lib/render";
import { readDraft, writeDraft } from "@/components/studio/lib/draft";
import { ToolButton } from "@/components/studio/ui/tool-button";
import { AddedToCartDialog, type AddedSummary } from "@/components/studio/ui/added-to-cart-dialog";
import { SaveDesignDialog } from "@/components/studio/ui/save-design-dialog";
import { SAMPLE_ART } from "@/components/studio/gang-sheet/types";
import { ApparelCanvas } from "./apparel-canvas";
import { renderApparelSide } from "./export";
import { luminance, printArea, PX_PER_IN, type Side } from "./garment";
import { OrderPanel, StudioLayers, StudioSelectionPanel, ToolsPanel, type NewStudioText } from "./panels";
import type { ApparelDesignData, ApparelEditorProps } from "./types";

const DRAFT_KEY = "inkforge:apparel-draft";
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];
type Sides = Record<Side, StudioItem[]>;
type Asset = { url: string; name: string; width: number; height: number };
type Draft = ApparelDesignData & { uploads?: Asset[] };

/** Measure text in mockup px, adding vertical room for curved text. */
function measureStudioText(it: Pick<StudioItem, "text" | "fontFamily" | "fontSize" | "fontStyle" | "letterSpacing" | "curve">) {
  const m = measureText(it, 1);
  const sag = it.curve ? Math.abs((it.curve / 100) * m.width * 0.45) : 0;
  return { width: m.width, height: m.height + sag };
}

export default function DesignStudioEditor({ products, initialProductSlug, initialColor, design, signedIn }: ApparelEditorProps) {
  const addItem = useCart((s) => s.addItem);
  const [draft] = useState<Draft | null>(() => (design ? null : readDraft<Draft>(DRAFT_KEY)));

  const [productSlug, setProductSlug] = useState(() => {
    const wanted = design?.data.productSlug ?? initialProductSlug;
    return products.some((p) => p.slug === wanted) ? wanted : products[0]!.slug;
  });
  const product = products.find((p) => p.slug === productSlug) ?? products[0]!;
  const colors = product.options.colors ?? [];
  const [color, setColor] = useState(() => {
    const wanted = design?.data.color ?? initialColor ?? draft?.color;
    return colors.some((c) => c.name === wanted) ? wanted! : (colors[0]?.name ?? "White");
  });
  const colorHex = colors.find((c) => c.name === color)?.hex ?? "#F7F7F5";

  const [side, setSide] = useState<Side>("front");
  const history = useHistory<Sides>(() => fitSidesInto(productSlug, design?.data.sides ?? draft?.sides ?? { front: [], back: [] }));
  const setSides = history.set;
  const replaceSides = history.replace;
  const { undo, redo } = history;
  const sides = history.value;
  const items = sides[side];
  const [rawSelectedId, setSelectedId] = useState<string | null>(null);
  const [sizes, setSizes] = useState<Record<string, number>>(() => design?.data.sizes ?? draft?.sizes ?? { M: 1 });
  const [uploads, setUploads] = useState<Asset[]>(draft?.uploads ?? []);
  const [uploading, setUploading] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showArea, setShowArea] = useState(true);
  const [busy, setBusy] = useState<null | "cart" | "save">(null);
  const [designId, setDesignId] = useState<string | null>(design?.owned ? design.id : null);
  const [designName, setDesignName] = useState(design?.name ?? `${product.name} design`);
  const [saveOpen, setSaveOpen] = useState(false);
  const [added, setAdded] = useState<AddedSummary | null>(null);
  const [dpiConfirm, setDpiConfirm] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<null | "tools" | "order">(null);

  const area = printArea(product.slug, side);
  // Selection is derived: an id that no longer exists on this side (after undo/delete) selects nothing.
  const selected = items.find((it) => it.id === rawSelectedId) ?? null;
  const selectedId = selected?.id ?? null;

  // ----- Pricing -----
  const usedSides = useMemo<Side[]>(() => (["front", "back"] as const).filter((s) => sides[s].length > 0), [sides]);
  const quantity = Object.values(sizes).reduce((a, b) => a + b, 0);
  const pricing = useMemo(() => toPricingProduct(product), [product]);
  const price = useMemo(
    () => priceLine(pricing, { color, apparelSizes: sizes, printLocations: usedSides, quantity }),
    [pricing, color, sizes, usedSides, quantity]
  );
  const next = useMemo(() => nextTier(product.tiers, quantity), [product.tiers, quantity]);

  // ----- Effects -----
  useEffect(() => {
    document.fonts?.ready.then(() =>
      replaceSides((s) => ({
        front: s.front.map(remeasure),
        back: s.back.map(remeasure),
      }))
    );
  }, [replaceSides]);

  useEffect(() => {
    const t = window.setTimeout(
      () => writeDraft(DRAFT_KEY, { productSlug, color, sides, sizes, uploads } satisfies Draft),
      600
    );
    return () => window.clearTimeout(t);
  }, [productSlug, color, sides, sizes, uploads]);

  // ----- Mutations on the active side -----
  const setSideItems = useCallback(
    (fn: (list: StudioItem[]) => StudioItem[], key?: string) => {
      setSides((s) => ({ ...s, [side]: fn(s[side]) }), key);
    },
    [setSides, side]
  );

  const addImage = useCallback(
    (a: Asset) => {
      const vector = a.url.toLowerCase().endsWith(".svg");
      const ratio = a.width && a.height ? a.height / a.width : 1;
      let w = area.width * 0.7;
      if (!vector && a.width) w = Math.min(w, (a.width / 150) * PX_PER_IN); // never start below 150 DPI if avoidable
      w = Math.max(w, area.width * 0.25);
      let h = w * ratio;
      if (h > area.height * 0.85) {
        h = area.height * 0.85;
        w = h / ratio;
      }
      const item: StudioItem = {
        id: uid(),
        kind: "image",
        src: a.url,
        name: a.name,
        x: area.x + (area.width - w) / 2,
        y: area.y + Math.min(area.height * 0.08, (area.height - h) / 2),
        width: w,
        height: h,
        rotation: 0,
        naturalWidth: a.width || undefined,
        naturalHeight: a.height || undefined,
      };
      setSideItems((list) => [...list, item]);
      setSelectedId(item.id);
      setMobilePanel(null);
    },
    [area.height, area.width, area.x, area.y, setSideItems]
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      const valid = files.filter((f) => ALLOWED.includes(f.type));
      if (valid.length < files.length) toast.error("Some files were skipped — use PNG, SVG, JPG, WEBP or GIF.");
      if (!valid.length) return;
      setUploading((n) => n + valid.length);
      for (const file of valid) {
        try {
          const res = await uploadFile(file, file.name);
          const dims = await readImageSize(res.url);
          const asset = { url: res.url, name: file.name, width: dims.width, height: dims.height };
          setUploads((u) => [asset, ...u.filter((x) => x.url !== asset.url)].slice(0, 24));
          addImage(asset);
        } catch (e) {
          toast.error(e instanceof Error ? `${file.name}: ${e.message}` : "Upload failed");
        } finally {
          setUploading((n) => n - 1);
        }
      }
    },
    [addImage]
  );

  const addText = (t: NewStudioText) => {
    const m = measureStudioText({ text: t.text, fontFamily: t.fontFamily, fontSize: t.fontSize, fontStyle: t.fontStyle });
    let fontSize = t.fontSize;
    let { width, height } = m;
    if (width > area.width * 0.95) {
      const f = (area.width * 0.95) / width;
      fontSize *= f;
      width *= f;
      height *= f;
    }
    const item: StudioItem = {
      id: uid(),
      kind: "text",
      text: t.text,
      fontFamily: t.fontFamily,
      fontSize,
      fontStyle: t.fontStyle,
      // Keep the default ink readable on dark garments.
      fill: t.fill.toLowerCase() === "#111111" && luminance(colorHex) < 0.45 ? "#ffffff" : t.fill,
      letterSpacing: 0,
      curve: 0,
      x: area.x + (area.width - width) / 2,
      y: area.y + area.height * 0.06,
      width,
      height,
      rotation: 0,
    };
    setSideItems((list) => [...list, item]);
    setSelectedId(item.id);
    setMobilePanel(null);
  };

  const updateSelected = (patch: Partial<StudioItem>, key?: string) => {
    if (!selectedId) return;
    setSideItems(
      (list) =>
        list.map((it) => {
          if (it.id !== selectedId) return it;
          const nextIt = { ...it, ...patch };
          if (it.kind === "text" && ("text" in patch || "fontFamily" in patch || "fontStyle" in patch || "letterSpacing" in patch || "curve" in patch)) {
            const m = measureStudioText(nextIt);
            const cx = it.x + it.width / 2;
            const cy = it.y + it.height / 2;
            return { ...nextIt, width: m.width, height: m.height, x: cx - m.width / 2, y: cy - m.height / 2 };
          }
          return nextIt;
        }),
      key
    );
  };

  const scaleSelected = (widthIn: number) => {
    if (!selected) return;
    const f = (widthIn * PX_PER_IN) / selected.width;
    const cx = selected.x + selected.width / 2;
    const cy = selected.y + selected.height / 2;
    const width = selected.width * f;
    const height = selected.height * f;
    updateSelected({
      width,
      height,
      x: cx - width / 2,
      y: cy - height / 2,
      fontSize: selected.kind === "text" ? (selected.fontSize ?? 32) * f : selected.fontSize,
      letterSpacing: selected.kind === "text" && selected.letterSpacing ? selected.letterSpacing * f : selected.letterSpacing,
    });
  };

  const duplicate = useCallback(() => {
    if (!selected) return;
    const copy = { ...selected, id: uid(), x: selected.x + 12, y: selected.y + 12 };
    setSideItems((list) => [...list, copy]);
    setSelectedId(copy.id);
  }, [selected, setSideItems]);

  const remove = useCallback(
    (id = selectedId) => {
      if (!id) return;
      setSideItems((list) => list.filter((it) => it.id !== id));
      if (id === selectedId) setSelectedId(null);
    },
    [selectedId, setSideItems]
  );

  const reorder = (dir: "up" | "down") => {
    if (!selectedId) return;
    setSideItems((list) => {
      const i = list.findIndex((it) => it.id === selectedId);
      const j = dir === "up" ? i + 1 : i - 1;
      if (i < 0 || j < 0 || j >= list.length) return list;
      const arr = [...list];
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
      return arr;
    });
  };

  const align = (where: "center" | "top") => {
    if (!selected) return;
    updateSelected(where === "center" ? { x: area.x + area.width / 2 - selected.width / 2 } : { y: area.y + 4 });
  };

  const changeProduct = (slug: string) => {
    const p = products.find((x) => x.slug === slug);
    if (!p || slug === productSlug) return;
    setProductSlug(slug);
    const cs = p.options.colors ?? [];
    if (!cs.some((c) => c.name === color)) setColor(cs[0]?.name ?? "White");
    // Keep designs inside the new garment's print areas.
    setSides((s) => fitSidesInto(slug, s));
    window.history.replaceState(null, "", `/design-studio?product=${slug}`);
  };

  // ----- Keyboard -----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]')) return;
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      if (mod && k === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && k === "y") {
        e.preventDefault();
        redo();
      } else if (mod && k === "d") {
        e.preventDefault();
        duplicate();
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        remove();
      } else if (e.key === "Escape") {
        setSelectedId(null);
      } else if (e.key.startsWith("Arrow") && selectedId) {
        e.preventDefault();
        const d = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -d : e.key === "ArrowRight" ? d : 0;
        const dy = e.key === "ArrowUp" ? -d : e.key === "ArrowDown" ? d : 0;
        setSideItems((list) => list.map((it) => (it.id === selectedId ? { ...it, x: it.x + dx, y: it.y + dy } : it)), "nudge");
      } else if (!mod && (e.key === "+" || e.key === "=")) {
        setZoom((z) => clamp(z * 1.2, 0.5, 4));
      } else if (!mod && (e.key === "-" || e.key === "_")) {
        setZoom((z) => clamp(z / 1.2, 0.5, 4));
      } else if (!mod && e.key === "0") {
        setZoom(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [duplicate, remove, selectedId, setSideItems, undo, redo]);

  // ----- Persist -----
  const designData = (): ApparelDesignData => ({ productSlug, color, sides, sizes });

  const renderPreviews = async () => {
    const out: Partial<Record<Side, string>> = {};
    for (const s of usedSides.length ? usedSides : (["front"] as Side[])) {
      const blob = await renderApparelSide(product.slug, colorHex, s, sides[s]);
      out[s] = (await uploadFile(blob, `${product.slug}-${s}.png`)).url;
    }
    return out;
  };

  const persist = async (name: string, previewUrl: string) => {
    const res = await saveDesignAction({ id: designId, name, kind: "APPAREL", data: JSON.stringify(designData()), previewUrl });
    if (!res.ok) throw new Error(res.error);
    if (res.owned) setDesignId(res.id);
    return res;
  };

  const saveDesign = async (name: string) => {
    setBusy("save");
    try {
      const previews = await renderPreviews();
      await persist(name, (previews.front ?? previews.back)!);
      setDesignName(name);
      toast.success(signedIn ? "Design saved to your account" : "Design saved");
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save design");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const lowDpiCount = [...sides.front, ...sides.back].filter((it) => dpiLevel(itemDpi(it, PX_PER_IN)) === "low").length;

  const addToCart = async (force = false) => {
    if (!usedSides.length) {
      toast.error("Add a design to the front or back first");
      return;
    }
    if (quantity < 1) {
      toast.error("Choose at least one size");
      setMobilePanel("order");
      return;
    }
    if (!force && lowDpiCount) {
      setDpiConfirm(true);
      return;
    }
    setBusy("cart");
    try {
      const previews = await renderPreviews();
      const image = (previews.front ?? previews.back)!;
      const saved = await persist(designName, image);
      const lp = priceLine(pricing, { color, apparelSizes: sizes, printLocations: usedSides, quantity });
      const sizeSummary = Object.entries(sizes)
        .filter(([, q]) => q > 0)
        .map(([s, q]) => `${s}×${q}`)
        .join(", ");
      const variantLabel = `${lp.variantLabel} · ${sizeSummary}`;
      addItem({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        type: product.type,
        image,
        variantLabel,
        selection: { color, apparelSizes: Object.fromEntries(Object.entries(sizes).filter(([, q]) => q > 0)), printLocations: usedSides, quantity },
        quantity: lp.quantity,
        unitPrice: lp.unitPrice,
        total: lp.total,
        artworkUrl: image,
        artworkName: `${designName}.png`,
        designId: saved.id,
        notes: previews.front && previews.back ? `Back print preview: ${previews.back}` : undefined,
      });
      useCart.getState().close();
      setAdded({ image, name: product.name, variantLabel, quantity: lp.quantity, total: lp.total });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add to cart");
    } finally {
      setBusy(null);
    }
  };

  // ----- Panels -----
  const toolsPanel = (
    <ToolsPanel
      products={products}
      product={product}
      color={color}
      onProduct={changeProduct}
      onColor={setColor}
      uploads={uploads}
      uploading={uploading}
      onUpload={(f) => void handleFiles(f)}
      onAddImage={addImage}
      onAddText={addText}
      className="h-full"
    />
  );
  const orderPanel = <OrderPanel product={product} sizes={sizes} onSizes={setSizes} locations={usedSides} price={price} next={next} />;
  const editPanel = (
    <>
      <StudioSelectionPanel
        item={selected}
        onUpdate={updateSelected}
        onScale={scaleSelected}
        onDuplicate={duplicate}
        onDelete={() => remove()}
        onOrder={reorder}
        onAlign={align}
      />
      <StudioLayers items={items} selectedId={selectedId} onSelect={setSelectedId} onDelete={(id) => remove(id)} />
    </>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Toolbar */}
      <div className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto border-b bg-background px-2 no-scrollbar sm:px-3">
        <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobilePanel("tools")}>
          <Wrench /> Tools
        </Button>
        <ToolButton label="Undo" shortcut="⌘Z" onClick={history.undo} disabled={!history.canUndo}>
          <Undo2 />
        </ToolButton>
        <ToolButton label="Redo" shortcut="⇧⌘Z" onClick={history.redo} disabled={!history.canRedo}>
          <Redo2 />
        </ToolButton>
        <span className="mx-1 h-5 w-px shrink-0 bg-border" />
        <ToolButton label="Zoom out" shortcut="−" onClick={() => setZoom((z) => clamp(z / 1.2, 0.5, 4))}>
          <ZoomOut />
        </ToolButton>
        <span className="min-w-11 text-center text-xs font-medium text-muted-foreground tabular-nums">{Math.round(zoom * 100)}%</span>
        <ToolButton label="Zoom in" shortcut="+" onClick={() => setZoom((z) => clamp(z * 1.2, 0.5, 4))}>
          <ZoomIn />
        </ToolButton>
        <ToolButton label="Reset zoom" shortcut="0" onClick={() => setZoom(1)}>
          <Maximize />
        </ToolButton>
        <ToolButton label={showArea ? "Hide print area" : "Show print area"} active={showArea} onClick={() => setShowArea((v) => !v)}>
          {showArea ? <Eye /> : <EyeOff />}
        </ToolButton>

        <div className="ml-auto flex items-center gap-1.5 pl-2">
          <Button variant="outline" size="sm" className="xl:hidden" onClick={() => setMobilePanel("order")}>
            <Layers /> <span className="hidden sm:inline">Edit & sizes</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSaveOpen(true)} disabled={busy !== null}>
            {busy === "save" ? <Loader2 className="animate-spin" /> : <Save />}
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button size="sm" onClick={() => void addToCart()} disabled={busy !== null} className="hidden shadow-glow sm:inline-flex">
            {busy === "cart" ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
            Add to cart · {formatMoney(price.total)}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 flex-col border-r bg-background lg:flex">{toolsPanel}</aside>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <ApparelCanvas
            productSlug={product.slug}
            colorHex={colorHex}
            side={side}
            area={area}
            items={items}
            selectedId={selectedId}
            zoom={zoom}
            showArea={showArea}
            onSelect={setSelectedId}
            onItemsChange={(list) => setSides((s) => ({ ...s, [side]: list }))}
            onDropFiles={(f) => void handleFiles(f)}
          >
            {/* Side switcher */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1 rounded-full border glass p-1 shadow-premium">
              {(["front", "back"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSide(s);
                    setSelectedId(null);
                  }}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-4 text-sm font-medium capitalize transition-all",
                    side === s ? "bg-foreground text-background shadow" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s}
                  {sides[s].length > 0 && (
                    <span className={cn("grid size-4.5 place-items-center rounded-full text-[10px] tabular-nums", side === s ? "bg-background/20" : "bg-primary/15 text-primary")}>
                      {sides[s].length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {usedSides.length === 0 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center px-4">
                <div className="pointer-events-auto flex flex-col items-center gap-3 rounded-2xl border glass p-4 text-center shadow-premium sm:flex-row sm:text-left">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink-gradient text-white">
                    {uploading ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Drop your designs here</p>
                    <p className="text-xs text-muted-foreground">Upload a logo, add text, or start from clip art.</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => addImage(SAMPLE_ART[0]!)}>
                    <Sparkles /> Try a sample
                  </Button>
                </div>
              </div>
            )}
          </ApparelCanvas>

          <div className="flex h-9 shrink-0 items-center gap-3 overflow-x-auto border-t bg-background px-3 text-xs text-muted-foreground no-scrollbar">
            <span className="font-medium whitespace-nowrap text-foreground">{product.name}</span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="size-3 rounded-full ring-1 ring-foreground/20" style={{ backgroundColor: colorHex }} />
              {color}
            </span>
            <span className="whitespace-nowrap">
              {usedSides.length ? usedSides.map((s) => (s === "front" ? "Front" : "Back")).join(" + ") + " print" : "No print yet"}
            </span>
            {lowDpiCount > 0 && <span className="whitespace-nowrap text-rose-600 dark:text-rose-400">{lowDpiCount} low-res image{lowDpiCount > 1 ? "s" : ""}</span>}
            <span className="ml-auto whitespace-nowrap">
              {quantity} pcs · <span className="font-semibold text-foreground tabular-nums">{formatMoney(price.total)}</span>
            </span>
          </div>
        </div>

        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l bg-background xl:block">
          {editPanel}
          {orderPanel}
        </aside>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t bg-background p-2 sm:hidden">
        <div className="min-w-0 flex-1 pl-1">
          <p className="truncate text-xs text-muted-foreground">
            {quantity} pcs · {color}
          </p>
          <p className="font-heading text-base font-bold tabular-nums">{formatMoney(price.total)}</p>
        </div>
        <Button size="lg" onClick={() => void addToCart()} disabled={busy !== null} className="shadow-glow">
          {busy === "cart" ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
          Add to cart
        </Button>
      </div>

      <Sheet open={mobilePanel === "tools"} onOpenChange={(o) => setMobilePanel(o ? "tools" : null)}>
        <SheetContent side="left" className="w-[88vw] gap-0 p-0 sm:max-w-sm">
          <SheetHeader className="border-b">
            <SheetTitle>Design tools</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1">{toolsPanel}</div>
        </SheetContent>
      </Sheet>
      <Sheet open={mobilePanel === "order"} onOpenChange={(o) => setMobilePanel(o ? "order" : null)}>
        <SheetContent side="right" className="w-[88vw] gap-0 overflow-y-auto p-0 sm:max-w-sm">
          <SheetHeader className="border-b">
            <SheetTitle>Edit & sizes</SheetTitle>
          </SheetHeader>
          {editPanel}
          {orderPanel}
        </SheetContent>
      </Sheet>

      <SaveDesignDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        defaultName={designName}
        signedIn={signedIn}
        onSave={saveDesign}
        nextPath={`/design-studio?product=${product.slug}`}
      />
      <AddedToCartDialog open={!!added} onOpenChange={(o) => !o && setAdded(null)} summary={added} />
      <AlertDialog open={dpiConfirm} onOpenChange={setDpiConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Low-resolution artwork</AlertDialogTitle>
            <AlertDialogDescription>
              {lowDpiCount} image{lowDpiCount > 1 ? "s are" : " is"} under 150 DPI at the chosen size and may print blurry. Shrink {lowDpiCount > 1 ? "them" : "it"} or upload
              a larger file — or continue and our prepress team will reach out.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fix artwork</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDpiConfirm(false);
                void addToCart(true);
              }}
            >
              Add anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Scale/move items so each fits inside the garment's print area for its side. */
function fitSidesInto(slug: string, s: Sides): Sides {
  const fit = (list: StudioItem[], sd: Side) => {
    const a = printArea(slug, sd);
    return list.map((it) => {
      const f = Math.min(1, (a.width * 0.98) / it.width, (a.height * 0.98) / it.height);
      const w = it.width * f;
      const h = it.height * f;
      const cx = clamp(it.x + it.width / 2, a.x + w / 2, a.x + a.width - w / 2);
      const cy = clamp(it.y + it.height / 2, a.y + h / 2, a.y + a.height - h / 2);
      if (f === 1 && cx === it.x + it.width / 2 && cy === it.y + it.height / 2) return it;
      return { ...it, width: w, height: h, fontSize: it.kind === "text" ? (it.fontSize ?? 32) * f : it.fontSize, x: cx - w / 2, y: cy - h / 2 };
    });
  };
  return { front: fit(s.front ?? [], "front"), back: fit(s.back ?? [], "back") };
}

function remeasure(it: StudioItem): StudioItem {
  if (it.kind !== "text") return it;
  const m = measureStudioText(it);
  const cx = it.x + it.width / 2;
  const cy = it.y + it.height / 2;
  return { ...it, width: m.width, height: m.height, x: round(cx - m.width / 2, 2), y: round(cy - m.height / 2, 2) };
}
