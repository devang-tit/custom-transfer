"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Layers, Shirt, ArrowRight, LoaderCircle } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Command } from "@/components/ui/command";
import { formatMoney } from "@/lib/format";
import { PRODUCT_TYPE_LABELS, type ProductType } from "@/lib/types";
import type { SearchHit } from "@/app/(store)/_actions/search";
import { cn } from "@/lib/utils";

export function SearchCommand({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d: { results: SearchHit[] }) => setHits(d.results))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 160);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, open]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group inline-flex h-9 items-center gap-2 rounded-xl border bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          className
        )}
        aria-label="Search products"
      >
        <Search className="size-4" />
        <span className="hidden xl:inline">Search transfers…</span>
        <kbd className="ml-3 hidden rounded-md border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium xl:inline">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search products" description="Search the InkForge catalog" className="sm:max-w-xl">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search DTF transfers, gang sheets, hoodies…" value={q} onValueChange={setQ} />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>{loading ? "Searching…" : "No products found."}</CommandEmpty>
            {hits.length > 0 && (
              <CommandGroup heading={q ? "Products" : "Popular right now"}>
                {hits.map((h) => (
                  <CommandItem key={h.id} value={h.slug} onSelect={() => go(`/products/${h.slug}`)} className="gap-3 py-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={h.image} alt="" className="size-10 rounded-lg border object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{h.name}</p>
                      <p className="text-xs text-muted-foreground">{PRODUCT_TYPE_LABELS[h.type as ProductType] ?? h.type}</p>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">from {formatMoney(h.fromPrice)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandSeparator />
            <CommandGroup heading="Tools">
              <CommandItem value="gang-sheet-builder" onSelect={() => go("/gang-sheet-builder")}>
                <Layers /> Open Gang Sheet Builder
              </CommandItem>
              <CommandItem value="design-studio" onSelect={() => go("/design-studio")}>
                <Shirt /> Open Design Studio
              </CommandItem>
              {q && (
                <CommandItem value={`search-all-${q}`} onSelect={() => go(`/shop?q=${encodeURIComponent(q)}`)}>
                  {loading ? <LoaderCircle className="animate-spin" /> : <ArrowRight />} See all results for “{q}”
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
