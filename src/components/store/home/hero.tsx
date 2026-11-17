"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, CheckCircle2, Layers, ShieldCheck, Timer, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/shared/rating-stars";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const reduce = useReducedMotion();
  const fade = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease },
  });

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="pointer-events-none absolute -top-40 -left-40 size-[34rem] rounded-full bg-ink-cyan/25 blur-3xl" />
      <div className="pointer-events-none absolute top-10 right-[-10rem] size-[36rem] rounded-full bg-ink-magenta/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-12rem] left-1/3 size-[30rem] rounded-full bg-primary/20 blur-3xl" />

      <div className="container-page relative grid items-center gap-12 pt-12 pb-16 sm:pt-16 lg:grid-cols-12 lg:gap-8 lg:pt-20 lg:pb-24">
        <div className="lg:col-span-6">
          <motion.div {...fade(0)}>
            <Link
              href="/gang-sheet-builder"
              className="group inline-flex items-center gap-2 rounded-full border bg-background/70 py-1 pr-3 pl-1 text-xs font-medium shadow-sm backdrop-blur transition-colors hover:border-primary/40"
            >
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">New</span>
              Smart auto-pack gang sheet builder
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
          <motion.h1
            {...fade(0.08)}
            className="mt-6 text-[2.6rem] leading-[1.02] font-extrabold sm:text-6xl lg:text-[4.4rem]"
          >
            Custom transfers
            <br />
            that <span className="text-ink-gradient">pop</span> on
            <br className="hidden sm:block" /> every shirt.
          </motion.h1>
          <motion.p {...fade(0.16)} className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Vivid DTF transfers, gang sheets, UV DTF decals and custom apparel — printed on pro-grade machines, quality-checked by hand, and
            shipped as fast as same day.
          </motion.p>
          <motion.div {...fade(0.24)} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-12 rounded-2xl px-6 text-base shadow-glow">
              <Link href="/gang-sheet-builder">
                <Layers className="size-4.5" /> Build a gang sheet
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-2xl bg-background/70 px-6 text-base backdrop-blur">
              <Link href="/shop">
                Shop transfers <ArrowRight className="size-4" />
              </Link>
            </Button>
          </motion.div>
          <motion.div {...fade(0.32)} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["#3EC6E0", "#6C4CF5", "#FF4F8B", "#FFD23F"].map((c, i) => (
                  <span key={c} className="grid size-8 place-items-center rounded-full text-[11px] font-bold text-white ring-2 ring-background" style={{ background: c }}>
                    {["JR", "AM", "KP", "LS"][i]}
                  </span>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <RatingStars rating={rating} size="size-3.5" />
                  <span className="font-semibold">{rating.toFixed(1)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Loved by {Math.max(reviewCount, 1).toLocaleString()}+ print shops & brands</p>
              </div>
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-1"><CheckCircle2 className="size-3.5 text-success" /> No minimums</li>
              <li className="flex items-center gap-1"><CheckCircle2 className="size-3.5 text-success" /> No setup fees</li>
            </ul>
          </motion.div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  const reduce = useReducedMotion();
  const pop = (delay: number, rotate = 0) => ({
    initial: reduce ? false : { opacity: 0, scale: 0.85, rotate: rotate - 6 },
    animate: { opacity: 1, scale: 1, rotate },
    transition: { duration: 0.8, delay, ease },
  });
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px] lg:col-span-6 lg:max-w-none">
      {/* main tee card */}
      <motion.div
        {...pop(0.15)}
        className="absolute inset-[8%] overflow-hidden rounded-[2.5rem] border bg-card shadow-premium"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/products/tee-black.svg" alt="Custom printed black tee" className="size-full object-cover" />
        <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl glass border px-4 py-3">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Heavyweight tee</p>
            <p className="text-sm font-semibold">Full-front DTF · 11″ × 11″</p>
          </div>
          <span className="rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">Ready to press</span>
        </div>
      </motion.div>

      {/* floating transfer: glitter */}
      <motion.div {...pop(0.35, -8)} className="absolute top-[2%] left-[-2%] w-[34%]">
        <div className="animate-float overflow-hidden rounded-3xl border bg-card shadow-premium [animation-delay:-1s]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/products/dtf-glitter.svg" alt="" className="aspect-square w-full object-cover" />
        </div>
      </motion.div>

      {/* floating gang sheet strip */}
      <motion.div {...pop(0.5, 6)} className="absolute right-[-3%] bottom-[14%] w-[30%]">
        <div className="animate-float overflow-hidden rounded-3xl border bg-card shadow-premium [animation-delay:-3s]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/products/gang-sheet.svg" alt="" className="aspect-[3/4] w-full object-cover" />
        </div>
      </motion.div>

      {/* chips */}
      <motion.div {...pop(0.65)} className="absolute top-[12%] right-[0%] flex items-center gap-2 rounded-2xl border bg-card px-3 py-2 shadow-premium">
        <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="size-4" /></span>
        <div>
          <p className="text-[11px] text-muted-foreground">Artwork check</p>
          <p className="text-xs font-semibold">300 DPI ✓</p>
        </div>
      </motion.div>
      <motion.div {...pop(0.8)} className="absolute bottom-[3%] left-[4%] flex items-center gap-2 rounded-2xl border bg-card px-3 py-2 shadow-premium">
        <span className="grid size-8 place-items-center rounded-xl bg-ink-magenta/15 text-ink-magenta"><Timer className="size-4" /></span>
        <div>
          <p className="text-[11px] text-muted-foreground">Order by 2pm CT</p>
          <p className="text-xs font-semibold">Ships today</p>
        </div>
      </motion.div>
      <motion.div {...pop(0.95)} className="absolute top-[46%] left-[-4%] hidden items-center gap-2 rounded-2xl border bg-card px-3 py-2 shadow-premium sm:flex">
        <span className="grid size-8 place-items-center rounded-xl bg-ink-cyan/20 text-sky-600 dark:text-ink-cyan"><Droplets className="size-4" /></span>
        <div>
          <p className="text-[11px] text-muted-foreground">Wash tested</p>
          <p className="text-xs font-semibold">50+ cycles</p>
        </div>
      </motion.div>
    </div>
  );
}
