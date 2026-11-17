"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Layers, Shirt, ArrowRight, Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NavCategory, NavFeatured } from "./nav-types";

export function DesktopNav({ categories, featured }: { categories: NavCategory[]; featured: NavFeatured }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const enter = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  };
  const leave = () => {
    timer.current = setTimeout(() => setOpen(false), 120);
  };

  const isActive = (href: string) => (href === "/shop" ? pathname.startsWith("/shop") || pathname.startsWith("/products") : pathname.startsWith(href));

  return (
    <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
      {siteConfig.mainNav.map((item) =>
        item.href === "/shop" ? (
          <div key={item.href} onMouseEnter={enter} onMouseLeave={leave}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className={cn(
                "inline-flex h-9 items-center gap-1 rounded-xl px-3 text-sm font-medium transition-colors hover:bg-muted",
                (open || isActive(item.href)) && "bg-muted"
              )}
            >
              {item.title}
              <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
            </button>
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="absolute inset-x-0 top-full border-b bg-popover shadow-premium"
                  onMouseEnter={enter}
                  onMouseLeave={leave}
                >
                  <div className="container-page grid grid-cols-12 gap-8 py-8">
                    <div className="col-span-8">
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Shop by category</p>
                        <Link href="/shop" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                          View all products <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {categories.map((c) => (
                          <Link
                            key={c.id}
                            href={`/shop?category=${c.slug}`}
                            className="group flex items-center gap-3 rounded-2xl border border-transparent p-2.5 transition-colors hover:border-border hover:bg-muted/60"
                          >
                            <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                              {c.image && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={c.image} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-110" />
                              )}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold">{c.name}</span>
                              <span className="line-clamp-2 text-xs text-muted-foreground">{c.description}</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <Link href="/gang-sheet-builder" className="group flex items-center gap-3 rounded-2xl bg-accent/60 p-4 transition-colors hover:bg-accent">
                          <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Layers className="size-5" /></span>
                          <span>
                            <span className="block text-sm font-semibold">Gang Sheet Builder</span>
                            <span className="text-xs text-muted-foreground">Auto-pack designs on a 22″ sheet</span>
                          </span>
                          <ArrowRight className="ml-auto size-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link href="/design-studio" className="group flex items-center gap-3 rounded-2xl bg-muted/70 p-4 transition-colors hover:bg-muted">
                          <span className="grid size-10 place-items-center rounded-xl bg-foreground text-background"><Shirt className="size-5" /></span>
                          <span>
                            <span className="block text-sm font-semibold">Design Studio</span>
                            <span className="text-xs text-muted-foreground">Customize tees, hoodies & more</span>
                          </span>
                          <ArrowRight className="ml-auto size-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                    {featured && (
                      <Link href={`/products/${featured.slug}`} className="group col-span-4 overflow-hidden rounded-3xl border bg-card">
                        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={featured.image} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold backdrop-blur">
                            <Sparkles className="size-3 text-ink-magenta" /> {featured.badge ?? "Featured"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 p-4">
                          <div>
                            <p className="font-heading font-semibold">{featured.name}</p>
                            <p className="text-sm text-muted-foreground">From {formatMoney(featured.fromPrice)}</p>
                          </div>
                          <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:-rotate-45">
                            <ArrowRight className="size-4" />
                          </span>
                        </div>
                      </Link>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex h-9 items-center rounded-xl px-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground",
              isActive(item.href) && "bg-muted text-foreground"
            )}
          >
            {item.title}
          </Link>
        )
      )}
    </nav>
  );
}
