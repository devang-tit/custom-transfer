import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RatingStars } from "@/components/shared/rating-stars";
import { ProductCard } from "@/components/store/product-card";
import type { ProductDTO } from "@/lib/products";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/* Clean, image-first storefront sections (sentence-case type, generous whitespace, 48px rhythm). */

function SectionTitle({ title, href, linkLabel = "View all" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="text-2xl leading-tight font-bold">{title}</h2>
      {href && (
        <Link href={href} className="shrink-0 text-sm underline underline-offset-4 hover:no-underline">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

/** Two large images side by side with the headline and actions along the bottom. */
export function HeroSplit({ fromPrice }: { fromPrice: number | null }) {
  return (
    <section className="container-page pt-4 sm:pt-6">
      <div className="relative overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="relative aspect-[4/5] sm:aspect-auto sm:h-[min(78svh,44rem)]">
            <Image src="/images/products/tee-black.svg" alt="Custom printed black tee" fill priority sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" unoptimized />
          </div>
          <div className="relative hidden sm:block sm:h-[min(78svh,44rem)]">
            <Image src="/images/products/gang-sheet.svg" alt="DTF gang sheet packed with designs" fill priority sizes="50vw" className="object-cover" unoptimized />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 p-5 text-white sm:p-8 lg:flex-row lg:items-end lg:justify-between lg:p-10">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-medium text-white/85">Custom DTF transfers & apparel printing</p>
            <h1 className="text-4xl leading-none font-bold sm:text-5xl lg:text-[56px]">Your designs, printed to press.</h1>
            <p className="mt-4 max-w-lg text-[15px] text-white/85">
              Vivid, wash-tested transfers and gang sheets{fromPrice ? ` from ${formatMoney(fromPrice)}` : ""}, made to order and shipped fast.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="h-11 bg-white px-6 text-black hover:bg-white/90">
              <Link href="/shop">Shop all</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 border-white px-6 text-white hover:bg-white/10">
              <Link href="/gang-sheet-builder">Build a gang sheet</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProductGridSection({ title, products, href }: { title: string; products: ProductDTO[]; href: string }) {
  if (!products.length) return null;
  return (
    <section className="container-page py-12">
      <SectionTitle title={title} href={href} />
      <div className="grid grid-cols-2 gap-x-2 gap-y-8 lg:grid-cols-4">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 4} />
        ))}
      </div>
    </section>
  );
}

type CollectionItem = { id: string; name: string; slug: string; image: string | null; count: number };

export function CollectionList({ categories }: { categories: CollectionItem[] }) {
  if (!categories.length) return null;
  return (
    <section className="container-page py-12">
      <SectionTitle title="Shop by category" href="/shop" linkLabel="All products" />
      <div className="grid grid-cols-2 gap-x-2 gap-y-6 md:grid-cols-3">
        {categories.map((c) => (
          <Link key={c.id} href={`/shop?category=${c.slug}`} className="group flex flex-col gap-3">
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              {c.image && (
                <Image src={c.image} alt="" fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" unoptimized />
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium underline-offset-4 group-hover:underline">{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.count} products</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ImageWithText({
  image,
  imageAlt,
  eyebrow,
  title,
  body,
  points,
  primary,
  secondary,
  reverse = false,
}: {
  image: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  body: string;
  points?: string[];
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  reverse?: boolean;
}) {
  return (
    <section className="container-page py-12">
      <div className={cn("grid items-center gap-8 lg:grid-cols-2 lg:gap-16", reverse && "lg:[&>*:first-child]:order-2")}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image src={image} alt={imageAlt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" unoptimized />
        </div>
        <div className="max-w-xl">
          <p className="mb-3 text-sm font-medium text-muted-foreground">{eyebrow}</p>
          <h2 className="text-3xl leading-tight font-bold sm:text-[32px]">{title}</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{body}</p>
          {points && (
            <ul className="mt-6 space-y-2.5 border-t pt-6 text-sm">
              {points.map((pt) => (
                <li key={pt} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" />
                  {pt}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-8 flex flex-wrap gap-2">
            <Button asChild className="h-11 px-6">
              <Link href={primary.href}>{primary.label}</Link>
            </Button>
            {secondary && (
              <Button asChild variant="outline" className="h-11 px-6">
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { title: "Upload or build", body: "Send a PNG, PDF or SVG, or arrange designs in the gang sheet builder with automatic packing and resolution checks." },
  { title: "We print and cure", body: "Every transfer is printed on calibrated DTF lines, powdered, cured and checked by hand before it ships." },
  { title: "You press", body: "Press at 300–315°F for 10–15 seconds and peel hot or cold. Soft, stretchy and wash-tested for 50+ cycles." },
];

export function HowItWorks() {
  return (
    <section className="bg-secondary">
      <div className="container-page py-16">
        <h2 className="max-w-xl text-3xl leading-tight font-bold sm:text-[32px]">From file to finished shirt in three steps</h2>
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title}>
              <p className="text-sm text-muted-foreground">0{i + 1}</p>
              <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
        <Link href="/press-instructions" className="mt-10 inline-flex items-center gap-1.5 text-sm underline underline-offset-4 hover:no-underline">
          Read the full press guide <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}

type Quote = { id: string; name: string; rating: number; title: string | null; body: string; product: string };

export function Quotes({ reviews, rating, total }: { reviews: Quote[]; rating: number; total: number }) {
  if (!reviews.length) return null;
  return (
    <section className="container-page py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-2xl leading-tight font-bold">What customers say</h2>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <RatingStars rating={rating} size="size-3.5" />
          {rating.toFixed(1)} from {total.toLocaleString()} reviews
        </p>
      </div>
      <div className="grid gap-x-8 gap-y-10 md:grid-cols-3">
        {reviews.slice(0, 3).map((r) => (
          <figure key={r.id} className="border-t pt-6">
            <RatingStars rating={r.rating} size="size-3.5" />
            <blockquote className="mt-4 text-lg leading-snug font-medium">“{r.title ?? r.body.split(". ")[0]}”</blockquote>
            <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
            <figcaption className="mt-4 text-xs text-muted-foreground">
              {r.name} · {r.product}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

const FAQ = [
  { q: "What file should I upload?", a: "A transparent PNG at 300 DPI, sized to the print size, works best. PDF and SVG are welcome too. Our builder flags low-resolution art before you order." },
  { q: "How fast do orders ship?", a: "Most transfers and gang sheets are produced the same or next business day. Rush production moves your order to the front of the queue." },
  { q: "Will DTF work on dark and polyester garments?", a: "Yes. DTF prints on cotton, polyester, blends, canvas and denim, on light or dark fabric, with no weeding or pretreatment." },
  { q: "Do you have minimums?", a: "No minimums on DTF transfers, gang sheets or custom apparel. Quantity discounts start at 10 pieces." },
];

export function FaqSection() {
  return (
    <section className="container-page py-16">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 className="text-2xl leading-tight font-bold">Questions, answered</h2>
          <p className="mt-3 text-sm text-muted-foreground">Can’t find what you need?</p>
          <Link href="/faq" className="mt-1 inline-block text-sm underline underline-offset-4 hover:no-underline">
            Visit the FAQ
          </Link>
        </div>
        <Accordion type="single" collapsible className="border-t lg:col-span-8">
          {FAQ.map((f) => (
            <AccordionItem key={f.q} value={f.q} className="border-b">
              <AccordionTrigger className="py-5 text-[15px] font-medium hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
