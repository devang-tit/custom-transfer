"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Search, Ellipsis, Pencil, Copy, Eye, EyeOff, Star, StarOff, Trash2, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { deleteProduct, duplicateProduct, setProductFlag } from "./actions";

type Opt = { value: string; label: string };

export function ProductsToolbar({ params, types, categories }: { params: Record<string, string | undefined>; types: Opt[]; categories: Opt[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, start] = useTransition();
  const push = (o: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, ...o })) if (v) next.set(k, v);
    start(() => router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  };
  return (
    <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center">
      <form
        className="relative flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
          push({ q: q || undefined });
        }}
      >
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          key={params.q ?? ""}
          name="q"
          type="search"
          defaultValue={params.q ?? ""}
          aria-label="Search products"
          placeholder="Search by name, SKU or slug…"
          className="h-9 w-full rounded-lg border bg-background pr-3 pl-9 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
        />
      </form>
      <div className="flex flex-wrap gap-2">
        <Select value={params.type ?? "all"} onValueChange={(v) => push({ type: v === "all" ? undefined : v })}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue>{types.find((t) => t.value === params.type)?.label ?? "All types"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {types.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={params.category ?? "all"} onValueChange={(v) => push({ category: v === "all" ? undefined : v })}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue>{categories.find((c) => c.value === params.category)?.label ?? "All categories"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(params.q || params.type || params.category) && (
          <Button variant="ghost" className="h-9" onClick={() => push({ q: undefined, type: undefined, category: undefined })}>
            <X /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}

export function ProductRowActions({ id, slug, active, featured, name }: { id: string; slug: string; active: boolean; featured: boolean; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const run = (
    fn: () => Promise<{ ok: boolean; message?: string; error?: string; id?: string; archived?: boolean }>,
    after?: (r: { id?: string; archived?: boolean }) => void
  ) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (r.message) toast.success(r.message);
        after?.(r);
        router.refresh();
      } else toast.error(r.error ?? "Something went wrong");
    });
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`} disabled={pending}>
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/admin/products/${id}`}>
              <Pencil /> Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`/products/${slug}`} target="_blank" rel="noreferrer">
              <ExternalLink /> View in store
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => run(() => duplicateProduct(id), (r) => r.id && router.push(`/admin/products/${r.id}`))}>
            <Copy /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => run(() => setProductFlag(id, "active", !active))}>
            {active ? <EyeOff /> : <Eye />} {active ? "Hide from store" : "Publish"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => run(() => setProductFlag(id, "featured", !featured))}>
            {featured ? <StarOff /> : <Star />} {featured ? "Unfeature" : "Feature"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirm(true)}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Products that appear on past orders are archived (hidden) instead of deleted so order history stays intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() =>
                run(
                  () => deleteProduct(id),
                  (r) => {
                    setConfirm(false);
                    if (!r.archived) router.push("/admin/products");
                  }
                )
              }>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
