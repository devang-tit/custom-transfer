"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CircleAlert,
  Eraser,
  ImagePlus,
  Layers,
  LayoutGrid,
  Loader2,
  Magnet,
  Maximize,
  RulerDimensionLine,
  Save,
  Settings2,
  ShoppingBag,
  Grid3x3,
  Redo2,
  Undo2,
  UploadCloud,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
import { GANG_SHEET_WIDTH, nextTier, priceLine } from "@/lib/pricing";
import { toPricingProduct } from "@/lib/products";
import { uploadFile, readImageSize } from "@/lib/upload-client";
import { useCart } from "@/stores/cart";
import { saveDesignAction } from "@/app/(studio)/actions";
import { useHistory } from "@/components/studio/lib/history";
import { analyzeSheet, clamp, round, uid, unionBox, type StudioItem } from "@/components/studio/lib/geometry";
import { skylinePack, type PackResult } from "@/components/studio/lib/packing";
import { measureText, renderGangSheetPng } from "@/components/studio/lib/render";
import { readDraft, writeDraft, clearDraft } from "@/components/studio/lib/draft";
import { ToolButton } from "@/components/studio/ui/tool-button";
import { NumberField } from "@/components/studio/ui/number-field";
import { AddedToCartDialog, type AddedSummary } from "@/components/studio/ui/added-to-cart-dialog";
import { SaveDesignDialog } from "@/components/studio/ui/save-design-dialog";
import { GangCanvas, SHEET_MARGIN, TEXT_SCALE, type GangCanvasHandle, type SheetBackground } from "./gang-canvas";
import { GangLeftPanel, type NewText } from "./left-panel";
import { LayersPanel, SelectionPanel, SheetPanel } from "./right-panel";
import { SAMPLE_ART, type GangDesignData, type GangEditorProps, type LibraryAsset } from "./types";

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];
type Draft = { sizeId: string; quantity: number; items: StudioItem[]; library: LibraryAsset[]; savedAt: number };

export default function GangSheetEditor({ product, products, initialSizeId, design, signedIn }: GangEditorProps) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const canvasRef = useRef<GangCanvasHandle>(null);
  const draftKey = `inkforge:gang-draft:${product.slug}`;

  const sizes = useMemo(
    () => (product.options.sizes ?? []).filter((s) => s.width === GANG_SHEET_WIDTH).sort((a, b) => a.height - b.height),
    [product]
  );

  // Draft restore happens once, before first render (component is client-only).
  const [draft] = useState<Draft | null>(() => (design ? null : readDraft<Draft>(draftKey)));
  const initial = design?.data ?? draft;

  const [sizeId, setSizeId] = useState<string>(() => {
    const wanted = initial?.sizeId ?? initialSizeId;
    return sizes.some((s) => s.id === wanted) ? wanted : (sizes[0]?.id ?? "");
  });
  const size = sizes.find((s) => s.id === sizeId) ?? sizes[0]!;
  const sheetW = GANG_SHEET_WIDTH;
  const sheetH = size.height;

  const [quantity, setQuantity] = useState(initial?.quantity ?? 1);
  const history = useHistory<StudioItem[]>(() => initial?.items ?? []);
  const items = history.value;
  const { set: setItems, reset: resetItems, replace: replaceItems, undo, redo } = history;
  const [library, setLibrary] = useState<LibraryAsset[]>(initial?.library ?? []);
  const [rawSelectedIds, setSelectedIds] = useState<string[]>([]);
  // Derived selection: ids removed by undo/delete simply drop out.
  const selectedIds = useMemo(() => rawSelectedIds.filter((id) => items.some((it) => it.id === id)), [rawSelectedIds, items]);
  const [zoom, setZoom] = useState(1);
  const [background, setBackground] = useState<SheetBackground>("checker");
  const [snap, setSnap] = useState(true);
  const [spacing, setSpacing] = useState(0.25);
  const [lockRatio, setLockRatio] = useState(true);
  const [uploading, setUploading] = useState(0);
  const [busy, setBusy] = useState<null | "cart" | "save" | "pack">(null);
  const [designId, setDesignId] = useState<string | null>(design?.owned ? design.id : null);
  const [customName, setDesignName] = useState<string | null>(design?.name ?? null);
  const designName = customName ?? `Gang sheet ${size.label}`;
  const [saveOpen, setSaveOpen] = useState(false);
  const [added, setAdded] = useState<AddedSummary | null>(null);
  const [issuesConfirm, setIssuesConfirm] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<null | "art" | "sheet">(null);

  // ----- Derived -----
  const issues = useMemo(() => analyzeSheet(items, sheetW, sheetH), [items, sheetW, sheetH]);
  const pricing = useMemo(() => toPricingProduct(product), [product]);
  const price = useMemo(() => priceLine(pricing, { sizeId, quantity }), [pricing, sizeId, quantity]);
  const next = useMemo(() => nextTier(product.tiers, quantity), [product.tiers, quantity]);
  const content = useMemo(() => unionBox(items), [items]);
  const requiredHeight = content ? content.y + content.h + SHEET_MARGIN : 0;
  const coverage = useMemo(() => {
    const area = items.reduce((s, it) => s + it.width * it.height, 0);
    return Math.min(100, Math.round((area / (sheetW * sheetH)) * 100));
  }, [items, sheetW, sheetH]);
  const selected = useMemo(() => items.filter((it) => selectedIds.includes(it.id)), [items, selectedIds]);
  const issueCount = issues.outside.size + issues.lowDpi.size + issues.overlapping.size;

  // ----- Effects -----
  useEffect(() => {
    if (draft && draft.items.length) {
      toast("Restored your last gang sheet draft", {
        action: {
          label: "Start fresh",
          onClick: () => {
            resetItems([]);
            setLibrary([]);
            clearDraft(draftKey);
          },
        },
      });
    }
    // Re-measure text once web fonts are ready (metrics change after load).
    document.fonts?.ready.then(() => {
      replaceItems((list) =>
        list.map((it) => {
          if (it.kind !== "text") return it;
          const m = measureText(it, TEXT_SCALE);
          const cx = it.x + it.width / 2;
          const cy = it.y + it.height / 2;
          return { ...it, width: m.width, height: m.height, x: cx - m.width / 2, y: cy - m.height / 2 };
        })
      );
    });
  }, [draft, draftKey, resetItems, replaceItems]);

  useEffect(() => {
    const t = window.setTimeout(() => writeDraft(draftKey, { sizeId, quantity, items, library, savedAt: Date.now() } satisfies Draft), 600);
    return () => window.clearTimeout(t);
  }, [draftKey, sizeId, quantity, items, library]);

  // ----- Item helpers -----
  const itemFromAsset = useCallback(
    (a: LibraryAsset): StudioItem => {
      const vector = a.type === "image/svg+xml" || a.url.toLowerCase().endsWith(".svg");
      const ratio = a.width && a.height ? a.height / a.width : 1;
      let w = vector || !a.width ? 4 : clamp(a.width / 300, 1, 10);
      let h = w * ratio;
      if (h > 20) {
        h = 20;
        w = h / ratio;
      }
      const maxW = sheetW - SHEET_MARGIN * 2;
      if (w > maxW) {
        w = maxW;
        h = w * ratio;
      }
      return {
        id: uid(),
        kind: "image",
        src: a.url,
        name: a.name,
        x: 0,
        y: 0,
        width: round(w, 3),
        height: round(h, 3),
        rotation: 0,
        naturalWidth: a.width || undefined,
        naturalHeight: a.height || undefined,
      };
    },
    [sheetW]
  );

  /** Place new items: at a drop point, or packed below the existing content. */
  const placeNew = useCallback(
    (current: StudioItem[], fresh: StudioItem[], at?: { x: number; y: number } | null): StudioItem[] => {
      if (at && fresh.length === 1) {
        const it = fresh[0]!;
        return [...current, { ...it, x: clamp(at.x - it.width / 2, 0, sheetW - it.width), y: Math.max(0, at.y - it.height / 2) }];
      }
      const box = unionBox(current);
      const top = box ? box.y + box.h + spacing - SHEET_MARGIN : 0;
      const res = skylinePack(
        fresh.map((it) => ({ id: it.id, w: it.width, h: it.height })),
        sheetW,
        { spacing, margin: SHEET_MARGIN }
      );
      return [...current, ...applyPack(fresh, res, top)];
    },
    [sheetW, spacing]
  );

  const addAsset = useCallback(
    (asset: LibraryAsset, copies = 1, at?: { x: number; y: number } | null) => {
      setLibrary((lib) => (lib.some((a) => a.url === asset.url) ? lib : [...lib, asset]));
      const base = itemFromAsset(asset);
      const fresh = Array.from({ length: Math.max(1, copies) }, () => ({ ...base, id: uid() }));
      setItems((cur) => placeNew(cur, fresh, at));
      setSelectedIds(fresh.map((f) => f.id));
      requestAnimationFrame(() => canvasRef.current?.scrollToItem(fresh[0]!.id));
    },
    [itemFromAsset, placeNew, setItems]
  );

  const handleFiles = useCallback(
    async (files: File[], at?: { x: number; y: number } | null) => {
      const valid = files.filter((f) => ALLOWED.includes(f.type));
      if (valid.length < files.length) toast.error("Some files were skipped — use PNG, SVG, JPG, WEBP or GIF.");
      if (!valid.length) return;
      setUploading((n) => n + valid.length);
      await Promise.all(
        valid.map(async (file, i) => {
          try {
            const res = await uploadFile(file, file.name);
            const dims = await readImageSize(res.url);
            const asset: LibraryAsset = { url: res.url, name: file.name, width: dims.width, height: dims.height, type: file.type };
            addAsset(asset, 1, i === 0 && valid.length === 1 ? at : null);
          } catch (e) {
            toast.error(e instanceof Error ? `${file.name}: ${e.message}` : "Upload failed");
          } finally {
            setUploading((n) => n - 1);
          }
        })
      );
    },
    [addAsset]
  );

  const addText = (t: NewText) => {
    const fontSize = t.heightIn / 0.72; // cap-height ≈ 72% of font size
    const m = measureText({ text: t.text, fontFamily: t.fontFamily, fontSize, fontStyle: t.fontStyle }, TEXT_SCALE);
    const item: StudioItem = {
      id: uid(),
      kind: "text",
      text: t.text,
      fontFamily: t.fontFamily,
      fontSize,
      fontStyle: t.fontStyle,
      fill: t.fill,
      x: 0,
      y: 0,
      width: m.width,
      height: m.height,
      rotation: 0,
    };
    setItems((cur) => placeNew(cur, [item]));
    setSelectedIds([item.id]);
    setMobilePanel(null);
  };

  const updateItem = useCallback(
    (id: string, patch: Partial<StudioItem>, key?: string) => {
      setItems(
        (cur) =>
          cur.map((it) => {
            if (it.id !== id) return it;
            const nextIt = { ...it, ...patch };
            if (it.kind === "text" && ("text" in patch || "fontFamily" in patch || "fontStyle" in patch)) {
              const m = measureText(nextIt, TEXT_SCALE);
              const cx = it.x + it.width / 2;
              const cy = it.y + it.height / 2;
              return { ...nextIt, width: m.width, height: m.height, x: cx - m.width / 2, y: cy - m.height / 2 };
            }
            return nextIt;
          }),
        key
      );
    },
    [setItems]
  );

  const resizeItem = (id: string, w: number | null, h: number | null) => {
    setItems((cur) =>
      cur.map((it) => {
        if (it.id !== id) return it;
        const ratio = it.height / it.width;
        const keep = lockRatio || it.kind === "text";
        let width = w ?? it.width;
        let height = h ?? it.height;
        if (keep) {
          if (w !== null) height = w * ratio;
          else if (h !== null) width = h / ratio;
        }
        const f = width / it.width;
        const cx = it.x + it.width / 2;
        const cy = it.y + it.height / 2;
        return {
          ...it,
          width,
          height,
          fontSize: it.kind === "text" ? (it.fontSize ?? 1) * f : it.fontSize,
          x: cx - width / 2,
          y: cy - height / 2,
        };
      })
    );
  };

  const duplicate = useCallback(() => {
    if (!selectedIds.length) return;
    const copies = items.filter((it) => selectedIds.includes(it.id)).map((it) => ({ ...it, id: uid(), x: it.x + 0.25, y: it.y + 0.25 }));
    setItems((cur) => [...cur, ...copies]);
    setSelectedIds(copies.map((c) => c.id));
  }, [items, selectedIds, setItems]);

  const deleteSelected = useCallback(() => {
    if (!selectedIds.length) return;
    setItems((cur) => cur.filter((it) => !selectedIds.includes(it.id)));
    setSelectedIds([]);
  }, [selectedIds, setItems]);

  const reorder = (dir: "up" | "down" | "top" | "bottom") => {
    setItems((cur) => {
      const sel = cur.filter((it) => selectedIds.includes(it.id));
      const rest = cur.filter((it) => !selectedIds.includes(it.id));
      if (dir === "top") return [...rest, ...sel];
      if (dir === "bottom") return [...sel, ...rest];
      const arr = [...cur];
      const idxs = arr.map((it, i) => (selectedIds.includes(it.id) ? i : -1)).filter((i) => i >= 0);
      if (dir === "up") {
        for (const i of idxs.reverse()) if (i < arr.length - 1 && !selectedIds.includes(arr[i + 1]!.id)) [arr[i], arr[i + 1]] = [arr[i + 1]!, arr[i]!];
      } else {
        for (const i of idxs) if (i > 0 && !selectedIds.includes(arr[i - 1]!.id)) [arr[i], arr[i - 1]] = [arr[i - 1]!, arr[i]!];
      }
      return arr;
    });
  };

  const centerSelected = () => {
    const box = unionBox(selected);
    if (!box) return;
    const dx = sheetW / 2 - (box.x + box.w / 2);
    setItems((cur) => cur.map((it) => (selectedIds.includes(it.id) ? { ...it, x: it.x + dx } : it)));
  };

  // ----- Packing -----
  const packInputs = (list: StudioItem[]) => list.map((it) => ({ id: it.id, w: it.width, h: it.height }));

  const fitSheet = useCallback(() => {
    if (!items.length) return toast.info("Add some designs first");
    const res = skylinePack(packInputs(items), sheetW, { spacing, margin: SHEET_MARGIN });
    const target = sizes.find((s) => s.height >= res.height - 0.001);
    setItems(applyPack(items, res));
    if (!target) {
      const largest = sizes[sizes.length - 1]!;
      setSizeId(largest.id);
      toast.error(`Your designs need ${round(res.height, 1)}" — more than our largest ${largest.label} sheet. Split them across two sheets.`);
      return;
    }
    setSizeId(target.id);
    toast.success(`Sheet set to ${target.label} — the smallest size that fits`);
  }, [items, sheetW, spacing, sizes, setItems]);
  // Toast actions fire later; keep a ref to the latest fitSheet (updated after commit).
  const fitSheetRef = useRef(fitSheet);
  useEffect(() => {
    fitSheetRef.current = fitSheet;
  }, [fitSheet]);

  const autoPack = useCallback(() => {
    if (!items.length) return toast.info("Add some designs first");
    const res = skylinePack(packInputs(items), sheetW, { spacing, margin: SHEET_MARGIN });
    setItems(applyPack(items, res));
    if (res.height > sheetH + 0.001) {
      toast.warning(`Packed — your designs need ${round(res.height, 1)}" but the sheet is ${sheetH}" long.`, {
        action: { label: "Fit sheet", onClick: () => fitSheetRef.current() },
      });
    } else {
      toast.success(`Packed ${items.length} design${items.length === 1 ? "" : "s"} into ${round(res.height, 1)}" of sheet`);
    }
  }, [items, sheetW, sheetH, spacing, setItems]);

  const fillSpace = useCallback(() => {
    const src = items.find((it) => it.id === selectedIds[0]);
    if (!src) return toast.info("Select a design first, then fill the sheet with copies of it");
    setBusy("pack");
    // Let the spinner paint before the (synchronous) search runs.
    window.setTimeout(() => {
      try {
        const base = packInputs(items);
        const fits = (k: number): PackResult | null => {
          const extra = Array.from({ length: k }, (_, i) => ({ id: `__fill_${i}`, w: src.width, h: src.height }));
          const r = skylinePack([...base, ...extra], sheetW, { spacing, margin: SHEET_MARGIN, maxHeight: sheetH });
          return r.failed.length ? null : r;
        };
        if (!fits(0)) {
          toast.error("The current designs already overflow this sheet — try Fit sheet first");
          return;
        }
        const used = items.reduce((s, it) => s + (it.width + spacing) * (it.height + spacing), 0);
        const free = (sheetW - 2 * SHEET_MARGIN + spacing) * (sheetH - 2 * SHEET_MARGIN + spacing) - used;
        let hi = Math.min(2000, Math.max(1, Math.floor(free / ((src.width + spacing) * (src.height + spacing))) + 2));
        while (hi > 0 && fits(hi)) hi = Math.min(4000, hi * 2);
        let lo = 0;
        while (lo < hi - 1) {
          const mid = (lo + hi) >> 1;
          if (fits(mid)) lo = mid;
          else hi = mid;
        }
        if (lo === 0) {
          toast.info("No room left for another copy at this size");
          return;
        }
        const res = fits(lo)!;
        const copies: StudioItem[] = Array.from({ length: lo }, (_, i) => ({ ...src, id: `__fill_${i}` }));
        const placed = applyPack([...items, ...copies], res).map((it) => (it.id.startsWith("__fill_") ? { ...it, id: uid() } : it));
        setItems(placed);
        toast.success(`Added ${lo} cop${lo === 1 ? "y" : "ies"} and re-packed the sheet`);
      } finally {
        setBusy(null);
      }
    }, 30);
  }, [items, selectedIds, sheetW, sheetH, spacing, setItems]);

  const clearAll = () => {
    if (!items.length) return;
    setItems([]);
    setSelectedIds([]);
    toast("Sheet cleared", { action: { label: "Undo", onClick: () => undo() } });
  };

  // ----- Zoom -----
  const zoomBy = useCallback((f: number) => setZoom((z) => clamp(round(z * f, 3), 0.1, 8)), []);

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
      } else if (mod && k === "a") {
        e.preventDefault();
        setSelectedIds(items.map((it) => it.id));
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length) {
          e.preventDefault();
          deleteSelected();
        }
      } else if (e.key === "Escape") {
        setSelectedIds([]);
      } else if (e.key.startsWith("Arrow") && selectedIds.length) {
        e.preventDefault();
        const d = e.shiftKey ? 1 : 0.125;
        const dx = e.key === "ArrowLeft" ? -d : e.key === "ArrowRight" ? d : 0;
        const dy = e.key === "ArrowUp" ? -d : e.key === "ArrowDown" ? d : 0;
        setItems((cur) => cur.map((it) => (selectedIds.includes(it.id) ? { ...it, x: it.x + dx, y: it.y + dy } : it)), "nudge");
      } else if (!mod && (e.key === "+" || e.key === "=")) {
        zoomBy(1.25);
      } else if (!mod && (e.key === "-" || e.key === "_")) {
        zoomBy(0.8);
      } else if (!mod && e.key === "0") {
        setZoom(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, selectedIds, duplicate, deleteSelected, setItems, zoomBy, undo, redo]);

  // ----- Persist -----
  const designData = (): GangDesignData => ({ productSlug: product.slug, sizeId, quantity, items, library });

  const renderAndUpload = async () => {
    const blob = await renderGangSheetPng(items, sheetW, sheetH, { textScale: TEXT_SCALE });
    return uploadFile(blob, `gang-sheet-${size.id}.png`);
  };

  const persist = async (name: string, previewUrl: string) => {
    const res = await saveDesignAction({
      id: designId,
      name,
      kind: "GANG_SHEET",
      data: JSON.stringify(designData()),
      previewUrl,
      widthIn: sheetW,
      heightIn: sheetH,
    });
    if (!res.ok) throw new Error(res.error);
    if (res.owned) setDesignId(res.id);
    return res;
  };

  const saveDesign = async (name: string): Promise<boolean> => {
    if (!items.length) {
      toast.error("Add at least one design before saving");
      return false;
    }
    setBusy("save");
    try {
      const up = await renderAndUpload();
      await persist(name, up.url);
      setDesignName(name);
      toast.success(signedIn ? "Design saved to your account" : "Design saved", {
        description: signedIn ? "Find it under Account → Saved designs." : undefined,
      });
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save design");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const addToCart = async (force = false) => {
    if (!items.length) {
      toast.error("Add at least one design to your sheet");
      return;
    }
    if (!force && (issues.outside.size || issues.lowDpi.size)) {
      setIssuesConfirm(true);
      return;
    }
    setBusy("cart");
    try {
      const up = await renderAndUpload();
      const saved = await persist(designName, up.url);
      const lp = priceLine(pricing, { sizeId, quantity });
      const variantLabel = `${size.label} gang sheet · ${items.length} design${items.length === 1 ? "" : "s"}`;
      addItem({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        type: product.type,
        image: up.url,
        variantLabel,
        selection: { sizeId, quantity },
        quantity: lp.quantity,
        unitPrice: lp.unitPrice,
        total: lp.total,
        artworkUrl: up.url,
        artworkName: `${designName}.png`,
        designId: saved.id,
      });
      // The cart drawer lives in the store layout; don't leave it flagged open.
      useCart.getState().close();
      setAdded({ image: up.url, name: product.name, variantLabel, quantity: lp.quantity, total: lp.total });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add to cart");
    } finally {
      setBusy(null);
    }
  };

  const switchProduct = (slug: string) => {
    if (slug === product.slug) return;
    writeDraft(`inkforge:gang-draft:${slug}`, { sizeId: "", quantity, items, library, savedAt: Date.now() } satisfies Draft);
    router.push(`/gang-sheet-builder?product=${slug}`);
  };

  // ----- Panels -----
  const leftPanel = (
    <GangLeftPanel
      library={library}
      uploading={uploading}
      onUpload={(files) => {
        void handleFiles(files);
        setMobilePanel(null);
      }}
      onAddAsset={(a, n) => {
        addAsset(a, n);
        setMobilePanel(null);
      }}
      onRemoveAsset={(url) => setLibrary((lib) => lib.filter((a) => a.url !== url))}
      onAddText={addText}
      className="h-full"
    />
  );
  const rightPanel = (
    <>
      <SheetPanel
        products={products}
        productSlug={product.slug}
        onProductChange={switchProduct}
        sizes={sizes}
        sizeId={sizeId}
        onSizeChange={setSizeId}
        quantity={quantity}
        onQuantityChange={setQuantity}
        price={price}
        next={next}
        requiredHeight={requiredHeight}
      />
      <SelectionPanel
        selected={selected}
        lockRatio={lockRatio}
        onLockRatio={setLockRatio}
        onUpdate={updateItem}
        onResize={resizeItem}
        onDuplicate={duplicate}
        onDelete={deleteSelected}
        onOrder={reorder}
        onCenter={centerSelected}
      />
      <LayersPanel
        items={items}
        selectedIds={selectedIds}
        onSelect={(id, additive) => {
          setSelectedIds((ids) => (additive ? (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]) : [id]));
          canvasRef.current?.scrollToItem(id);
        }}
        onDelete={(id) => setItems((cur) => cur.filter((it) => it.id !== id))}
      />
    </>
  );

  const selectIssue = (set: Set<string>) => {
    if (!set.size) return;
    const ids = Array.from(set);
    setSelectedIds(ids);
    canvasRef.current?.scrollToItem(ids[0]!);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Toolbar */}
      <div className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto border-b bg-background px-2 no-scrollbar sm:px-3">
        <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobilePanel("art")}>
          <ImagePlus /> Add art
        </Button>
        <ToolButton label="Undo" shortcut="⌘Z" onClick={history.undo} disabled={!history.canUndo}>
          <Undo2 />
        </ToolButton>
        <ToolButton label="Redo" shortcut="⇧⌘Z" onClick={history.redo} disabled={!history.canRedo}>
          <Redo2 />
        </ToolButton>
        <Divider />
        <ToolButton label="Zoom out" shortcut="−" onClick={() => zoomBy(0.8)}>
          <ZoomOut />
        </ToolButton>
        <button
          type="button"
          onClick={() => setZoom(1)}
          className="h-7 min-w-12 rounded-md px-1.5 text-xs font-medium tabular-nums text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Zoom to fit (0)"
        >
          {Math.round(zoom * 100)}%
        </button>
        <ToolButton label="Zoom in" shortcut="+" onClick={() => zoomBy(1.25)}>
          <ZoomIn />
        </ToolButton>
        <ToolButton label="Fit width" shortcut="0" onClick={() => setZoom(1)}>
          <Maximize />
        </ToolButton>
        <Divider />
        <ToggleGroup
          type="single"
          value={background}
          onValueChange={(v) => v && setBackground(v as SheetBackground)}
          variant="outline"
          size="sm"
          aria-label="Sheet background"
          className="hidden sm:flex"
        >
          <ToggleGroupItem value="checker" aria-label="Transparent background" title="Transparent">
            <span className="size-3.5 rounded-sm bg-checker ring-1 ring-foreground/20" />
          </ToggleGroupItem>
          <ToggleGroupItem value="white" aria-label="White garment preview" title="White garment">
            <span className="size-3.5 rounded-sm bg-white ring-1 ring-foreground/20" />
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" aria-label="Dark garment preview" title="Dark garment">
            <span className="size-3.5 rounded-sm bg-[#17171f] ring-1 ring-foreground/20" />
          </ToggleGroupItem>
        </ToggleGroup>
        <ToolButton label={snap ? "Snapping on" : "Snapping off"} active={snap} onClick={() => setSnap((s) => !s)}>
          <Magnet />
        </ToolButton>
        <Divider />
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={autoPack} className="rounded-r-none" title="Arrange all designs to use the least film">
            <LayoutGrid /> <span className="hidden md:inline">Auto-pack</span>
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="rounded-l-none" aria-label="Packing settings">
                <Settings2 />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <p className="text-sm font-medium">Packing settings</p>
              <p className="mt-1 text-xs text-muted-foreground">Gap between designs. We recommend at least 0.25&quot; so they&apos;re easy to cut apart.</p>
              <div className="mt-3 flex items-center gap-2">
                <NumberField value={spacing} min={0} max={2} step={0.125} precision={3} unit="in" onCommit={setSpacing} className="w-28" ariaLabel="Spacing" />
                <div className="flex gap-1">
                  {[0.125, 0.25, 0.5].map((v) => (
                    <Button key={v} size="xs" variant={spacing === v ? "secondary" : "outline"} onClick={() => setSpacing(v)}>
                      {v}&quot;
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Button variant="ghost" size="sm" onClick={fitSheet} title="Pick the smallest sheet that fits all designs">
          <RulerDimensionLine /> <span className="hidden md:inline">Fit sheet</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={fillSpace} disabled={busy === "pack"} title="Fill empty space with copies of the selected design">
          {busy === "pack" ? <Loader2 className="animate-spin" /> : <Grid3x3 />} <span className="hidden md:inline">Fill space</span>
        </Button>
        <ToolButton label="Clear sheet" onClick={clearAll} disabled={!items.length}>
          <Eraser />
        </ToolButton>

        <div className="ml-auto flex items-center gap-1.5 pl-2">
          <Button variant="outline" size="sm" className="xl:hidden" onClick={() => setMobilePanel("sheet")}>
            <Layers /> <span className="hidden sm:inline">Sheet & layers</span>
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
        <aside className="hidden w-72 shrink-0 flex-col border-r bg-background lg:flex">{leftPanel}</aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <GangCanvas
            ref={canvasRef}
            items={items}
            selectedIds={selectedIds}
            sheetW={sheetW}
            sheetH={sheetH}
            zoom={zoom}
            onZoomChange={setZoom}
            background={background}
            snap={snap}
            issues={issues}
            onSelect={setSelectedIds}
            onItemsChange={(nextItems) => setItems(nextItems)}
            onDropFiles={(files, at) => void handleFiles(files, at)}
          >
            {items.length === 0 && (
              <Onboarding
                uploading={uploading > 0}
                onPick={(files) => void handleFiles(files)}
                onSamples={() => {
                  const picks = SAMPLE_ART.slice(0, 6);
                  setLibrary((lib) => [...lib, ...picks.filter((p) => !lib.some((a) => a.url === p.url))]);
                  const fresh = picks.flatMap((a) => Array.from({ length: 2 }, () => ({ ...itemFromAsset(a), id: uid() })));
                  setItems((cur) => placeNew(cur, fresh));
                }}
              />
            )}
          </GangCanvas>

          {/* Status bar */}
          <div className="flex h-9 shrink-0 items-center gap-3 overflow-x-auto border-t bg-background px-3 text-xs text-muted-foreground no-scrollbar">
            <span className="font-medium whitespace-nowrap text-foreground">{size.label}</span>
            <span className="whitespace-nowrap">
              {items.length} design{items.length === 1 ? "" : "s"}
            </span>
            <span className="hidden items-center gap-1.5 whitespace-nowrap sm:inline-flex">
              <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-ink-gradient" style={{ width: `${coverage}%` }} />
              </span>
              {coverage}% covered
            </span>
            {issueCount === 0 ? (
              items.length > 0 && <span className="whitespace-nowrap text-emerald-600 dark:text-emerald-400">✓ Print-ready</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <CircleAlert className="size-3.5 text-amber-500" />
                <IssuePill n={issues.outside.size} label="outside sheet" tone="rose" onClick={() => selectIssue(issues.outside)} />
                <IssuePill n={issues.lowDpi.size} label="low DPI" tone="rose" onClick={() => selectIssue(issues.lowDpi)} />
                <IssuePill n={issues.overlapping.size} label="overlapping" tone="amber" onClick={() => selectIssue(issues.overlapping)} />
              </span>
            )}
            <span className="ml-auto whitespace-nowrap">
              {quantity > 1 && `${quantity} × `}
              <span className="font-semibold text-foreground tabular-nums">{formatMoney(price.total)}</span>
            </span>
          </div>
        </div>

        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l bg-background xl:block">{rightPanel}</aside>
      </div>

      {/* Mobile action bar */}
      <div className="flex shrink-0 items-center gap-2 border-t bg-background p-2 sm:hidden">
        <div className="min-w-0 flex-1 pl-1">
          <p className="truncate text-xs text-muted-foreground">{size.label} · {items.length} designs</p>
          <p className="font-heading text-base font-bold tabular-nums">{formatMoney(price.total)}</p>
        </div>
        <Button size="lg" onClick={() => void addToCart()} disabled={busy !== null} className="shadow-glow">
          {busy === "cart" ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
          Add to cart
        </Button>
      </div>

      <Sheet open={mobilePanel === "art"} onOpenChange={(o) => setMobilePanel(o ? "art" : null)}>
        <SheetContent side="left" className="w-[88vw] gap-0 p-0 sm:max-w-sm">
          <SheetHeader className="border-b">
            <SheetTitle>Add artwork</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1">{leftPanel}</div>
        </SheetContent>
      </Sheet>
      <Sheet open={mobilePanel === "sheet"} onOpenChange={(o) => setMobilePanel(o ? "sheet" : null)}>
        <SheetContent side="right" className="w-[88vw] gap-0 overflow-y-auto p-0 sm:max-w-sm">
          <SheetHeader className="border-b">
            <SheetTitle>Sheet & layers</SheetTitle>
          </SheetHeader>
          {rightPanel}
        </SheetContent>
      </Sheet>

      <SaveDesignDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        defaultName={designName}
        signedIn={signedIn}
        onSave={saveDesign}
        nextPath={`/gang-sheet-builder?product=${product.slug}`}
      />
      <AddedToCartDialog open={!!added} onOpenChange={(o) => !o && setAdded(null)} summary={added} />
      <AlertDialog open={issuesConfirm} onOpenChange={setIssuesConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Some designs need attention</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                {issues.outside.size > 0 && (
                  <p>
                    • <strong className="text-foreground">{issues.outside.size}</strong> design(s) extend past the sheet edge and will be cut off. Try{" "}
                    <em>Fit sheet</em>.
                  </p>
                )}
                {issues.lowDpi.size > 0 && (
                  <p>
                    • <strong className="text-foreground">{issues.lowDpi.size}</strong> design(s) are under 150 DPI and may print blurry.
                  </p>
                )}
                <p>You can fix these now, or add to cart anyway and our prepress team will contact you.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fix designs</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIssuesConfirm(false);
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

/** Apply packing placements; `yOffset` shifts placed items down (inches). */
function applyPack(list: StudioItem[], res: PackResult, yOffset = 0): StudioItem[] {
  return list.map((it) => {
    const p = res.placements.get(it.id);
    if (!p) return it;
    const cx = p.x + p.w / 2;
    const cy = p.y + yOffset + p.h / 2;
    return { ...it, rotation: p.rotated ? 90 : 0, x: round(cx - it.width / 2, 4), y: round(cy - it.height / 2, 4) };
  });
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-border" />;
}

function IssuePill({ n, label, tone, onClick }: { n: number; label: string; tone: "rose" | "amber"; onClick: () => void }) {
  if (!n) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-2 py-0.5 font-medium whitespace-nowrap ring-1 ring-inset transition-colors",
        tone === "rose"
          ? "bg-rose-500/10 text-rose-700 ring-rose-500/25 hover:bg-rose-500/20 dark:text-rose-300"
          : "bg-amber-500/10 text-amber-700 ring-amber-500/25 hover:bg-amber-500/20 dark:text-amber-300"
      )}
    >
      {n} {label}
    </button>
  );
}

function Onboarding({ onPick, onSamples, uploading }: { onPick: (files: File[]) => void; onSamples: () => void; uploading: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="pointer-events-none absolute inset-0 z-20 col-start-2 row-start-2 grid place-items-center p-6">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border glass p-6 text-center shadow-premium">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-ink-gradient text-white shadow-glow">
          {uploading ? <Loader2 className="size-6 animate-spin" /> : <UploadCloud className="size-6" />}
        </div>
        <h2 className="mt-4 text-xl font-bold">Drop your designs here</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Upload transparent PNGs or SVGs, then let <strong className="text-foreground">Auto-pack</strong> fit them onto your 22&quot; sheet with
          the least wasted film.
        </p>
        <ol className="mt-4 grid grid-cols-3 gap-2 text-left text-[11px] text-muted-foreground">
          {["Upload art", "Arrange or auto-pack", "Add to cart"].map((s, i) => (
            <li key={s} className="rounded-lg bg-muted/70 p-2">
              <span className="font-heading text-sm font-bold text-foreground">{i + 1}</span>
              <span className="block">{s}</span>
            </li>
          ))}
        </ol>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED.join(",")}
          className="sr-only"
          onChange={(e) => {
            onPick(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button size="lg" className="flex-1 shadow-glow" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <UploadCloud /> Upload files
          </Button>
          <Button size="lg" variant="outline" className="flex-1" onClick={onSamples}>
            <Sparkles /> Try sample art
          </Button>
        </div>
      </div>
    </div>
  );
}
