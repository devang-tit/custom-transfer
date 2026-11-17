import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Droplets,
  Gauge,
  Layers,
  Leaf,
  Printer,
  Quote,
  Scissors,
  ShieldCheck,
  Sparkles,
  Timer,
  Truck,
  Upload,
  Flame,
  Wand2,
  ZoomIn,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProductCard } from "@/components/store/product-card";
import { RatingStars } from "@/components/shared/rating-stars";
import { formatMoney } from "@/lib/format";
import type { ProductDTO } from "@/lib/products";
import type { PriceTier, SizeOption } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Reveal } from "../reveal";
import { SectionHeading } from "./section-heading";

/* ---------------- Categories (bento) ---------------- */
export type HomeCategory = { id: string; name: string; slug: string; description: string | null; image: string | null; count: number };

const tints = [
  "from-violet-500/15 to-fuchsia-500/10",
  "from-emerald-500/15 to-cyan-500/10",
  "from-sky-500/15 to-indigo-500/10",
  "from-orange-500/15 to-rose-500/10",
  "from-pink-500/15 to-violet-500/10",
  "from-zinc-500/15 to-zinc-500/5",
];

export function CategoryBento({ categories }: { categories: HomeCategory[] }) {
  return (
    <section className="container-page py-20 sm:py-24">
      <Reveal>
        <SectionHeading
          eyebrow="Shop by category"
          title={<>Everything you need to <span className="text-ink-gradient">print & press</span></>}
          description="From single transfers to 240-inch gang sheets — pick a format and upload your art. We handle the rest."
          action={
            <Button asChild variant="outline" className="h-10 rounded-xl">
              <Link href="/shop">All products <ArrowRight className="size-4" /></Link>
            </Button>
          }
        />
      </Reveal>
      <div className="mt-10 grid auto-rows-[220px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c, i) => {
          const big = i === 0 || i === 1 || i >= 4;
          return (
            <Reveal
              key={c.id}
              delay={i * 0.05}
              className={cn(i === 0 && "sm:row-span-2 lg:col-span-2", i === 1 && "lg:col-span-2", i >= 4 && "lg:col-span-2")}
            >
              <Link
                href={`/shop?category=${c.slug}`}
                className={cn(
                  "group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border bg-gradient-to-br p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-premium",
                  tints[i % tints.length]
                )}
              >
                <div className="relative z-10 max-w-[60%]">
                  <p className="text-xs font-medium text-muted-foreground">{c.count} products</p>
                  <h3 className={cn("mt-1 font-heading font-bold", big && i === 0 ? "text-3xl" : "text-xl")}>{c.name}</h3>
                  {big && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{c.description}</p>}
                </div>
                <span className="relative z-10 inline-flex w-fit items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 text-xs font-semibold backdrop-blur transition-colors group-hover:bg-foreground group-hover:text-background">
                  Shop now <ArrowUpRight className="size-3.5" />
                </span>
                {c.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.image}
                    alt=""
                    className={cn(
                      "absolute right-[-8%] bottom-[-10%] rounded-3xl object-cover shadow-premium transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2",
                      i === 0 ? "w-[62%]" : big ? "w-[34%]" : "w-[48%]"
                    )}
                  />
                )}
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- How it works ---------------- */
const steps = [
  { icon: Upload, title: "Upload or build", body: "Drop in your PNG, PDF or SVG — or arrange designs in our gang sheet builder with auto-pack and DPI checks." },
  { icon: Printer, title: "We print & cure", body: "Your transfers are printed on calibrated DTF lines, powdered, cured and hand-inspected by our prepress team." },
  { icon: Flame, title: "You press & sell", body: "Press at 300–315°F for 10–15 seconds. Peel hot or cold. Vibrant, soft and wash-tested for 50+ cycles." },
];

export function HowItWorks() {
  return (
    <section className="relative border-y bg-muted/30 py-20 sm:py-24">
      <div className="container-page">
        <Reveal>
          <SectionHeading align="center" eyebrow="How it works" title="From file to finished shirt in 3 steps" description="No screens, no weeding, no minimums. Just upload and press." />
        </Reveal>
        <ol className="relative mt-14 grid gap-6 md:grid-cols-3">
          <div className="pointer-events-none absolute top-12 right-[16%] left-[16%] hidden h-px border-t border-dashed md:block" />
          {steps.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 0.1} className="relative rounded-3xl border bg-card p-7 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="relative grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
                  <s.icon className="size-6" />
                </span>
                <span className="font-heading text-6xl font-extrabold text-muted-foreground/15">0{i + 1}</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------- Featured products ---------------- */
export function FeaturedProducts({ products }: { products: ProductDTO[] }) {
  return (
    <section className="container-page py-20 sm:py-24">
      <Reveal>
        <SectionHeading
          eyebrow="Customer favorites"
          title="Best-selling transfers & blanks"
          description="The formats pro print shops reorder every week."
          action={
            <Button asChild variant="ghost" className="h-10 rounded-xl">
              <Link href="/shop?sort=featured">Shop best sellers <ArrowRight className="size-4" /></Link>
            </Button>
          }
        />
      </Reveal>
      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {products.map((p, i) => (
          <Reveal key={p.id} delay={(i % 4) * 0.06}>
            <ProductCard product={p} className="h-full" />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Gang sheet spotlight ---------------- */
const builderFeatures = [
  { icon: Wand2, title: "Smart auto-pack", body: "Nests your designs tightly to waste less film." },
  { icon: ZoomIn, title: "Live DPI checks", body: "Flags blurry art before you pay for it." },
  { icon: Copy, title: "Duplicate & fill", body: "Repeat logos across the sheet in one click." },
  { icon: Scissors, title: "Cut-line spacing", body: "Automatic gaps for easy trimming." },
];

export function GangSheetSpotlight({ sizes }: { sizes: SizeOption[] }) {
  return (
    <section className="relative overflow-hidden bg-ink-key py-20 text-white sm:py-28">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="pointer-events-none absolute -top-40 right-0 size-[40rem] rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-20rem] left-[-10rem] size-[40rem] rounded-full bg-ink-magenta/20 blur-3xl" />
      <div className="container-page relative grid items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <SectionHeading
            invert
            eyebrow="Gang Sheet Builder"
            title={<>Fit more designs.<br /><span className="text-ink-gradient">Pay for less film.</span></>}
            description="Our browser-based builder lays out your designs on a 22″ wide sheet in seconds. Mix sizes, duplicate logos and watch the price update live."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {builderFeatures.map((f) => (
              <div key={f.title} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-ink-cyan"><f.icon className="size-5" /></span>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-white/60">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-12 rounded-2xl bg-white px-6 text-base text-ink-key hover:bg-white/90">
              <Link href="/gang-sheet-builder"><Layers className="size-4" /> Launch the builder</Link>
            </Button>
            <Button asChild variant="ghost" className="h-12 rounded-2xl px-6 text-base text-white hover:bg-white/10 hover:text-white">
              <Link href="/products/upload-gang-sheet">Upload a ready file <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.04] p-3 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-1.5 px-2 pb-3">
              <span className="size-2.5 rounded-full bg-rose-400" />
              <span className="size-2.5 rounded-full bg-amber-300" />
              <span className="size-2.5 rounded-full bg-emerald-400" />
              <span className="ml-3 truncate text-xs text-white/50">gang-sheet-builder · 22″ × 60″</span>
              <span className="ml-auto rounded-md bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">94% utilized</span>
            </div>
            <div className="grid grid-cols-[1fr_9rem] gap-3">
              <div className="relative overflow-hidden rounded-2xl bg-checker">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/products/gang-sheet.svg" alt="Gang sheet layout preview" className="aspect-[4/5] w-full object-cover" />
                <div className="absolute top-[20%] left-[30%] h-[18%] w-[36%] rounded-md border-2 border-primary shadow-[0_0_0_4px_rgba(108,76,245,0.25)]">
                  <span className="absolute -top-6 left-0 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap">4.2″ × 4.2″ · 320 DPI</span>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                {sizes.slice(2, 7).map((s, i) => (
                  <div key={s.id} className={cn("flex items-center justify-between rounded-lg border border-white/10 px-2.5 py-2", i === 2 && "border-primary bg-primary/20")}>
                    <span className="text-white/80">{s.label}</span>
                    <span className="font-semibold">{formatMoney(s.price)}</span>
                  </div>
                ))}
                <div className="rounded-lg bg-white p-2.5 text-ink-key">
                  <p className="text-[10px] font-medium text-zinc-500">Sheet total</p>
                  <p className="font-heading text-lg font-bold">{formatMoney(sizes[4]?.price ?? 2699)}</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Pricing teaser ---------------- */
export function PricingTeaser({ sizes, tiers }: { sizes: SizeOption[]; tiers: PriceTier[] }) {
  const highlights = sizes.filter((s) => [24, 60, 120, 240].includes(s.height));
  return (
    <section className="container-page py-20 sm:py-24">
      <Reveal>
        <SectionHeading
          align="center"
          eyebrow="Transparent pricing"
          title="Simple per-sheet pricing. Bigger savings in bulk."
          description="No setup fees, no screen charges, no surprises. Gang sheets are priced by length — fill them with as many designs as you like."
        />
      </Reveal>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map((s, i) => (
          <Reveal key={s.id} delay={i * 0.06}>
            <div className={cn("relative h-full rounded-3xl border bg-card p-6", i === 1 && "border-primary shadow-premium ring-1 ring-primary/30")}>
              {i === 1 && <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Most popular</span>}
              <p className="text-sm font-medium text-muted-foreground">Gang sheet</p>
              <p className="mt-1 font-heading text-2xl font-bold">{s.label}</p>
              <p className="mt-4 font-heading text-4xl font-extrabold tabular-nums">{formatMoney(s.price)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatMoney(Math.round(s.price / s.height))} per linear inch</p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-ink-gradient" style={{ width: `${Math.max(12, (s.height / 240) * 100)}%` }} />
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.1}>
        <div className="mt-6 flex flex-col gap-6 rounded-3xl border bg-muted/40 p-6 sm:p-8 lg:flex-row lg:items-center">
          <div className="lg:w-1/3">
            <p className="font-heading text-xl font-bold">Quantity discounts on transfers</p>
            <p className="mt-1 text-sm text-muted-foreground">Applied automatically in your cart — mix any designs of the same size.</p>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-5">
            {tiers.map((t) => (
              <div key={t.minQty} className="rounded-2xl border bg-card px-3 py-3 text-center">
                <p className="text-xs text-muted-foreground">{t.minQty}+ pcs</p>
                <p className={cn("font-heading text-xl font-bold", t.discountPct > 0 && "text-primary")}>{t.discountPct ? `−${t.discountPct}%` : "Base"}</p>
              </div>
            ))}
          </div>
          <Button asChild variant="outline" className="h-11 shrink-0 rounded-xl">
            <Link href="/pricing">Full price list</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- Why us ---------------- */
const reasons = [
  { icon: Timer, title: "Same-day production", body: "Orders approved before 2pm CT print and ship the same business day." },
  { icon: Droplets, title: "Wash-tested durability", body: "Stretchy, crack-resistant prints that survive 50+ washes." },
  { icon: ShieldCheck, title: "Human artwork review", body: "Every file is checked by prepress before it hits the printer." },
  { icon: Sparkles, title: "Specialty finishes", body: "Glitter, glow-in-the-dark, puff and UV DTF — all in one place." },
  { icon: Truck, title: "Free shipping over $75", body: "Fast, tracked delivery anywhere in the U.S." },
  { icon: Leaf, title: "Eco-conscious inks", body: "Water-based, OEKO-TEX® certified inks and recyclable packaging." },
];

export function WhyUs() {
  return (
    <section className="border-y bg-muted/30 py-20 sm:py-24">
      <div className="container-page grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <SectionHeading eyebrow="Why InkForge" title="Print partner to 2,400+ shops & brands" description="We obsess over color, consistency and speed so you can focus on selling." />
          <div className="mt-8 flex items-center gap-4 rounded-3xl border bg-card p-5">
            <Gauge className="size-10 shrink-0 text-primary" />
            <div>
              <p className="font-heading text-3xl font-extrabold">99.2%</p>
              <p className="text-sm text-muted-foreground">orders ship on or before the promised date</p>
            </div>
          </div>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
          {reasons.map((r, i) => (
            <Reveal key={r.title} delay={(i % 2) * 0.06}>
              <div className="group h-full rounded-3xl border bg-card p-6 transition-shadow hover:shadow-premium">
                <span className="grid size-11 place-items-center rounded-2xl bg-accent text-accent-foreground transition-transform group-hover:scale-110 group-hover:-rotate-6">
                  <r.icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{r.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Testimonials ---------------- */
export type HomeReview = { id: string; name: string; rating: number; title: string | null; body: string; product: string };

export function Testimonials({ reviews, rating, total }: { reviews: HomeReview[]; rating: number; total: number }) {
  return (
    <section className="container-page py-20 sm:py-24">
      <Reveal>
        <SectionHeading
          align="center"
          eyebrow="Reviews"
          title="Don’t take our word for it"
          description={
            <span className="inline-flex flex-wrap items-center justify-center gap-2">
              <RatingStars rating={rating} /> <strong className="text-foreground">{rating.toFixed(1)} / 5</strong> from {total} verified reviews
            </span>
          }
        />
      </Reveal>
      <div className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {reviews.map((r, i) => (
          <Reveal key={r.id} delay={(i % 3) * 0.06} className="break-inside-avoid">
            <figure className="rounded-3xl border bg-card p-6">
              <Quote className="size-6 text-primary/40" />
              <RatingStars rating={r.rating} className="mt-3" size="size-3.5" />
              {r.title && <p className="mt-3 font-semibold">{r.title}</p>}
              <blockquote className="mt-1.5 text-sm leading-relaxed text-muted-foreground">“{r.body}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t pt-4">
                <span className="grid size-9 place-items-center rounded-full bg-ink-gradient text-xs font-bold text-white">
                  {r.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">Verified buyer · {r.product}</p>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Stats band ---------------- */
export function StatsBand({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <section className="container-page pb-20 sm:pb-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-ink-gradient p-[1.5px]">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[calc(2rem-1.5px)] bg-border/40 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-card px-6 py-8 text-center sm:py-10">
                <p className="font-heading text-3xl font-extrabold tracking-tight sm:text-5xl">{s.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- FAQ teaser ---------------- */
const faqs = [
  { q: "What file types can I upload?", a: "PNG with a transparent background at 300 DPI is ideal. We also accept JPG, WEBP, SVG and PDF. Our uploader checks resolution for your chosen print size automatically." },
  { q: "How do I press DTF transfers?", a: "Pre-press the garment for 3–5 seconds, then press the transfer at 300–315°F for 10–15 seconds with medium pressure. Peel hot or cold, then re-press for 5 seconds with a cover sheet for extra durability." },
  { q: "How fast will my order ship?", a: "Most transfer and gang sheet orders approved before 2pm CT ship the same business day. Custom apparel ships in 3–4 business days. Rush production is available at checkout." },
  { q: "Do you have minimum order quantities?", a: "No minimums on DTF transfers, gang sheets, UV DTF or apparel. Screen print transfers start at 12 pieces. Quantity discounts apply automatically." },
];

export function FaqTeaser() {
  return (
    <section className="border-t bg-muted/30 py-20 sm:py-24">
      <div className="container-page grid gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <SectionHeading eyebrow="FAQ" title="Questions? We’ve got answers." description="Everything you need to know about files, pressing and shipping." />
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild variant="outline" className="h-10 rounded-xl"><Link href="/faq">Read all FAQs</Link></Button>
            <Button asChild variant="ghost" className="h-10 rounded-xl"><Link href="/press-instructions">Press instructions <ArrowRight className="size-4" /></Link></Button>
          </div>
        </Reveal>
        <Reveal delay={0.08} className="lg:col-span-7">
          <Accordion type="single" collapsible defaultValue="item-0" className="rounded-3xl border bg-card px-6">
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`}>
                <AccordionTrigger className="py-5 text-base font-semibold hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */
export function FinalCta() {
  return (
    <section className="container-page py-20 sm:py-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-ink-key px-6 py-14 text-center text-white sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute inset-0 bg-ink-gradient opacity-30" />
          <div className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-ink-cyan/40 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 -bottom-24 size-72 rounded-full bg-ink-magenta/40 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold sm:text-5xl">Ready to make something people want to wear?</h2>
            <p className="mt-4 text-base text-white/75 sm:text-lg">Upload your art in minutes. Get vivid, press-ready transfers at your door in days.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild className="h-12 rounded-2xl bg-white px-6 text-base text-ink-key hover:bg-white/90">
                <Link href="/gang-sheet-builder"><Layers className="size-4" /> Start a gang sheet</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-2xl border-white/25 bg-white/5 px-6 text-base text-white hover:bg-white/15 hover:text-white">
                <Link href="/design-studio">Design a custom tee</Link>
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/70">
              {["No minimums", "Same-day production", "Free shipping over $75"].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Check className="size-4 text-ink-cyan" /> {t}</li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
