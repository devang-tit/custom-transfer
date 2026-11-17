"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, SlidersHorizontal, X, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SORTS, shopHref, type ShopParams } from "./shop-params";

export function ShopToolbar({ params, filters, activeCount }: { params: ShopParams; filters: React.ReactNode; activeCount: number }) {
  const router = useRouter();
  const [q, setQ] = useState(params.q ?? "");
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form
        className="relative flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          start(() => router.push(shopHref(params, { q: q.trim() || undefined }), { scroll: false }));
        }}
      >
        {pending ? (
          <LoaderCircle className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
          className="h-11 w-full rounded-xl border bg-card pr-10 pl-10 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        />
        {q && (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setQ("");
              start(() => router.push(shopHref(params, { q: undefined }), { scroll: false }));
            }}
          >
            <X className="size-4" />
          </button>
        )}
      </form>
      <div className="flex gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-11 flex-1 rounded-xl px-4 lg:hidden">
              <SlidersHorizontal className="size-4" /> Filters
              {activeCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] text-primary-foreground">{activeCount}</span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[88%] overflow-y-auto sm:max-w-sm">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>Refine products by category, type and price.</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-8">{filters}</div>
          </SheetContent>
        </Sheet>
        <Select
          value={params.sort ?? "featured"}
          onValueChange={(v) => start(() => router.push(shopHref(params, { sort: v === "featured" ? undefined : v }), { scroll: false }))}
        >
          <SelectTrigger className="h-11! min-w-44 flex-1 rounded-xl bg-card px-3.5 sm:flex-none" aria-label="Sort products">
            <SelectValue>{SORTS.find((s) => s.id === (params.sort ?? "featured"))?.label ?? "Featured"}</SelectValue>
          </SelectTrigger>
          <SelectContent align="end">
            {SORTS.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
