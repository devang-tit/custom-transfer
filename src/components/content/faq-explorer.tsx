"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FaqCategory } from "@/components/content/faq-data";

export function FaqExplorer({ categories }: { categories: FaqCategory[] }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .filter((c) => active === "all" || c.id === active)
      .map((c) => ({
        ...c,
        items: q ? c.items.filter((i) => i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q)) : c.items,
      }))
      .filter((c) => c.items.length);
  }, [categories, query, active]);

  const total = filtered.reduce((n, c) => n + c.items.length, 0);

  return (
    <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions"
            aria-label="Search questions"
            className="h-11 rounded-xl pr-10 pl-10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar lg:mx-0 lg:grid lg:gap-0.5 lg:px-0">
          {[{ id: "all", title: "All topics" }, ...categories].map((c) => {
            const count = c.id === "all" ? categories.reduce((n, x) => n + x.items.length, 0) : categories.find((x) => x.id === c.id)!.items.length;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(c.id)}
                className={cn(
                  "flex shrink-0 items-center justify-between gap-3 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors lg:rounded-xl lg:border-0 lg:py-2.5",
                  active === c.id ? "border-foreground bg-foreground text-background lg:bg-primary/10 lg:text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {c.title}
                <span className="hidden text-xs tabular-nums opacity-70 lg:inline">{count}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0">
        {query && (
          <p className="mb-6 text-sm text-muted-foreground">
            {total} {total === 1 ? "result" : "results"} for “{query}”
          </p>
        )}
        {filtered.length ? (
          <div className="grid gap-10">
            {filtered.map((c) => (
              <section key={c.id} id={c.id} className="scroll-mt-28">
                <h2 className="mb-3 text-2xl font-bold">{c.title}</h2>
                <Accordion type="multiple" className="rounded-2xl border bg-card px-5">
                  {c.items.map((item, i) => (
                    <AccordionItem key={item.q} value={`${c.id}-${i}`}>
                      <AccordionTrigger className="py-4 text-[15px] font-semibold hover:no-underline">{item.q}</AccordionTrigger>
                      <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed px-6 py-14 text-center">
            <p className="font-semibold">No questions match “{query}”</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different keyword, or ask us directly — we reply within one business day.</p>
          </div>
        )}
      </div>
    </div>
  );
}
