import Link from "next/link";
import { Check } from "lucide-react";
import { PRODUCT_TYPE_LABELS, PRODUCT_TYPES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PRICE_PRESETS, shopHref, toggleInList, type ShopParams } from "./shop-params";

export type FilterCategory = { slug: string; name: string; count: number };

export function ShopFilters({
  params,
  categories,
  typeCounts,
}: {
  params: ShopParams;
  categories: FilterCategory[];
  typeCounts: Record<string, number>;
}) {
  const types = new Set((params.type ?? "").split(",").filter(Boolean));
  const total = categories.reduce((n, c) => n + c.count, 0);
  return (
    <div className="space-y-8">
      <FilterGroup title="Category">
        <ul className="space-y-0.5">
          <li>
            <FilterLink href={shopHref(params, { category: undefined })} active={!params.category} count={total}>
              All products
            </FilterLink>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <FilterLink href={shopHref(params, { category: c.slug })} active={params.category === c.slug} count={c.count}>
                {c.name}
              </FilterLink>
            </li>
          ))}
        </ul>
      </FilterGroup>

      <FilterGroup title="Product type">
        <ul className="space-y-1">
          {PRODUCT_TYPES.filter((t) => typeCounts[t]).map((t) => {
            const on = types.has(t);
            return (
              <li key={t}>
                <Link
                  href={shopHref(params, { type: toggleInList(params.type, t) })}
                  scroll={false}
                  className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <span
                    className={cn(
                      "grid size-4.5 place-items-center rounded-[5px] border transition-colors",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background group-hover:border-primary/50"
                    )}
                  >
                    {on && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className="flex-1">{PRODUCT_TYPE_LABELS[t]}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{typeCounts[t]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </FilterGroup>

      <FilterGroup title="Starting price">
        <div className="flex flex-wrap gap-2">
          {PRICE_PRESETS.map((p) => {
            const on = params.price === p.id;
            return (
              <Link
                key={p.id}
                href={shopHref(params, { price: on ? undefined : p.id })}
                scroll={false}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  on ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary/40"
                )}
              >
                {p.label}
              </Link>
            );
          })}
        </div>
      </FilterGroup>

      <div className="rounded-2xl bg-ink-key p-5 text-white">
        <p className="font-heading text-lg font-semibold">Need a custom quote?</p>
        <p className="mt-1 text-sm text-white/70">Bulk runs over 500 pcs, special inks or rush deadlines — we’ve got you.</p>
        <Link href="/contact" className="mt-4 inline-flex text-sm font-semibold text-ink-cyan hover:underline">
          Talk to our team →
        </Link>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">{title}</p>
      {children}
    </div>
  );
}

function FilterLink({ href, active, count, children }: { href: string; active: boolean; count: number; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors",
        active ? "bg-accent font-semibold text-accent-foreground" : "hover:bg-muted"
      )}
    >
      {children}
      <span className={cn("text-xs tabular-nums", active ? "text-accent-foreground/70" : "text-muted-foreground")}>{count}</span>
    </Link>
  );
}
