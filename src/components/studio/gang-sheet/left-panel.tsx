"use client";

import { useRef, useState } from "react";
import { CopyPlus, ImagePlus, Loader2, Plus, Sparkles, Trash2, Type, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { STUDIO_FONTS, DEFAULT_FONT, fontCss } from "@/components/studio/lib/fonts";
import { PanelSection, FieldRow } from "@/components/studio/ui/panel";
import { NumberField } from "@/components/studio/ui/number-field";
import { SAMPLE_ART, type LibraryAsset } from "./types";

export type NewText = { text: string; fontFamily: string; fill: string; heightIn: number; fontStyle: "normal" | "bold" };

export function GangLeftPanel({
  library,
  uploading,
  onUpload,
  onAddAsset,
  onRemoveAsset,
  onAddText,
  className,
}: {
  library: LibraryAsset[];
  uploading: number;
  onUpload: (files: File[]) => void;
  onAddAsset: (asset: LibraryAsset, copies: number) => void;
  onRemoveAsset: (url: string) => void;
  onAddText: (t: NewText) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [text, setText] = useState<NewText>({ text: "Your text", fontFamily: DEFAULT_FONT, fill: "#111111", heightIn: 1.5, fontStyle: "bold" });

  return (
    <Tabs defaultValue="art" className={cn("flex min-h-0 flex-col gap-0", className)}>
      <div className="border-b px-4 pt-3 pb-3">
        <TabsList className="w-full">
          <TabsTrigger value="art" className="flex-1">
            <ImagePlus /> Artwork
          </TabsTrigger>
          <TabsTrigger value="text" className="flex-1">
            <Type /> Text
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="art" className="min-h-0 flex-1 overflow-y-auto">
        <PanelSection title="Upload">
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              onUpload(Array.from(e.dataTransfer.files));
            }}
            className={cn(
              "group flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/40"
            )}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
              className="sr-only"
              onChange={(e) => {
                onUpload(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
            <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-105">
              {uploading ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
            </span>
            <span className="text-sm font-medium">{uploading ? `Uploading ${uploading} file${uploading > 1 ? "s" : ""}…` : "Upload designs"}</span>
            <span className="text-xs text-muted-foreground">PNG, SVG, JPG or WEBP · multiple files OK</span>
          </div>
        </PanelSection>

        <PanelSection title={`Your library (${library.length})`}>
          {library.length === 0 ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Uploaded files appear here. Add them to the sheet as many times as you like.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-2">
              {library.map((a) => (
                <AssetTile key={a.url} asset={a} onAdd={onAddAsset} onRemove={() => onRemoveAsset(a.url)} />
              ))}
            </ul>
          )}
        </PanelSection>

        <PanelSection
          title={
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-3" /> Sample art
            </span>
          }
        >
          <ul className="grid grid-cols-4 gap-2">
            {SAMPLE_ART.map((a) => (
              <li key={a.url}>
                <button
                  type="button"
                  onClick={() => onAddAsset(a, 1)}
                  title={`Add ${a.name}`}
                  className="grid aspect-square w-full place-items-center rounded-lg border bg-checker p-1.5 transition hover:border-primary hover:shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.url} alt={a.name} className="max-h-full max-w-full object-contain" />
                </button>
              </li>
            ))}
          </ul>
        </PanelSection>
      </TabsContent>

      <TabsContent value="text" className="min-h-0 flex-1 overflow-y-auto">
        <PanelSection title="Add text">
          <div className="grid gap-3">
            <FieldRow label="Text">
              <Input value={text.text} onChange={(e) => {
                const value = e.target.value;
                setText((prev) => ({ ...prev, text: value }));
              }} onKeyDown={(e) => e.stopPropagation()} />
            </FieldRow>
            <FieldRow label="Font">
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
            </FieldRow>
            <div className="grid grid-cols-2 gap-2">
              <FieldRow label="Letter height">
                <NumberField value={text.heightIn} min={0.25} max={20} step={0.25} unit="in" onCommit={(v) => setText((prev) => ({ ...prev, heightIn: v }))} />
              </FieldRow>
              <FieldRow label="Color">
                <div className="flex h-8 items-center gap-2 rounded-lg border px-1.5">
                  <input
                    type="color"
                    value={text.fill}
                    onChange={(e) => {
                const value = e.target.value;
                setText((prev) => ({ ...prev, fill: value }));
              }}
                    className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
                    aria-label="Text color"
                  />
                  <span className="font-mono text-xs uppercase">{text.fill}</span>
                </div>
              </FieldRow>
            </div>
            <div className="flex gap-2">
              {(["normal", "bold"] as const).map((w) => (
                <Button
                  key={w}
                  type="button"
                  variant={text.fontStyle === w ? "secondary" : "outline"}
                  size="sm"
                  className={cn("flex-1", w === "bold" && "font-bold")}
                  onClick={() => setText((prev) => ({ ...prev, fontStyle: w }))}
                >
                  {w === "bold" ? "Bold" : "Regular"}
                </Button>
              ))}
            </div>
            <div
              className="grid min-h-20 place-items-center rounded-xl border bg-checker px-3 py-4 text-center text-2xl break-all"
              style={{ fontFamily: fontCss(text.fontFamily), color: text.fill, fontWeight: text.fontStyle === "bold" ? 700 : 400 }}
            >
              {text.text || " "}
            </div>
            <Button size="lg" onClick={() => text.text.trim() && onAddText(text)} disabled={!text.text.trim()}>
              <Plus /> Add text to sheet
            </Button>
          </div>
        </PanelSection>
      </TabsContent>
    </Tabs>
  );
}

function AssetTile({
  asset,
  onAdd,
  onRemove,
}: {
  asset: LibraryAsset;
  onAdd: (a: LibraryAsset, copies: number) => void;
  onRemove: () => void;
}) {
  const [copies, setCopies] = useState(10);
  return (
    <li className="group relative overflow-hidden rounded-xl border bg-card">
      <button type="button" onClick={() => onAdd(asset, 1)} className="block w-full" title="Add to sheet">
        <div className="grid aspect-square place-items-center bg-checker p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset.url} alt={asset.name} className="max-h-full max-w-full object-contain" />
        </div>
      </button>
      <div className="flex items-center gap-1 border-t px-1.5 py-1">
        <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground" title={asset.name}>
          {asset.name}
        </span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label="Add copies">
              <CopyPlus />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="end">
            <p className="text-sm font-medium">Add multiple copies</p>
            <p className="mt-1 text-xs text-muted-foreground">Copies are packed below your existing designs.</p>
            <div className="mt-3 flex gap-2">
              <NumberField value={copies} min={1} max={500} step={1} precision={0} onCommit={setCopies} className="w-20" ariaLabel="Copies" />
              <Button size="sm" className="flex-1" onClick={() => onAdd(asset, copies)}>
                Add {copies}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="icon-xs" aria-label="Remove from library" onClick={onRemove} className="text-muted-foreground hover:text-destructive">
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}
