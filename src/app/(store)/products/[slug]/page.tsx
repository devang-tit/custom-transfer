import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, Droplets, ShieldCheck, Thermometer, Timer, Truck, PackageCheck, Recycle } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getProductBySlug, getProducts } from "@/lib/catalog";
import { siteConfig } from "@/config/site";
import { PRODUCT_TYPE_LABELS } from "@/lib/types";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RatingStars } from "@/components/shared/rating-stars";
import { Price } from "@/components/shared/price";
import { ProductCard, fromPrice } from "@/components/store/product-card";
import { ProductGallery } from "@/components/store/product/gallery";
import { ProductConfigurator } from "@/components/store/product/configurator";
import { WishlistButton } from "@/components/store/product/wishlist-button";
import { ReviewsSection } from "@/components/store/product/reviews-section";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found" };
  return {
    title: p.name,
    description: p.shortDescription ?? undefined,
    openGraph: { title: p.name, description: p.shortDescription ?? undefined, images: p.images.slice(0, 1) },
  };
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const sp = await props.searchParams;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [user, reviews, relatedSame] = await Promise.all([
    getCurrentUser(),
    db.review.findMany({ where: { productId: product.id, status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 50 }),
    getProducts({ where: { categoryId: product.categoryId ?? undefined, id: { not: product.id } }, orderBy: { sortOrder: "asc" }, take: 4 }),
  ]);
  const wishlisted = user ? !!(await db.wishlistItem.findUnique({ where: { userId_productId: { userId: user.id, productId: product.id } } })) : false;
  let related = relatedSame;
  if (related.length < 4) {
    const extra = await getProducts({ where: { featured: true, id: { notIn: [product.id, ...related.map((r) => r.id)] } }, take: 4 - related.length });
    related = [...related, ...extra];
  }
  const defaultSizeId = typeof sp.size === "string" ? sp.size : undefined;
  const isApparel = product.type === "APPAREL";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    image: product.images.map((i) => `${siteConfig.url}${i}`),
    sku: product.sku,
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: { "@type": "AggregateOffer", priceCurrency: siteConfig.currency, lowPrice: (fromPrice(product) / 100).toFixed(2), availability: "https://schema.org/InStock" },
    ...(product.reviewCount ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating?.toFixed(1), reviewCount: product.reviewCount } } : {}),
  };

  return (
    <div className="container-page pt-6 pb-10 sm:pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link href="/">Home</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink asChild><Link href="/shop">Shop</Link></BreadcrumbLink></BreadcrumbItem>
          {product.category && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink asChild><Link href={`/shop?category=${product.category.slug}`}>{product.category.name}</Link></BreadcrumbLink></BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator className="hidden sm:block" />
          <BreadcrumbItem className="hidden sm:inline-flex"><BreadcrumbPage className="max-w-56 truncate">{product.name}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <ProductGallery images={product.images} name={product.name} badge={product.badge} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">{PRODUCT_TYPE_LABELS[product.type]}</p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <h1 className="text-3xl leading-tight font-bold sm:text-4xl">{product.name}</h1>
            <WishlistButton productId={product.id} initial={wishlisted} slug={product.slug} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {product.reviewCount ? (
              <a href="#reviews" className="flex items-center gap-1.5 hover:underline">
                <RatingStars rating={product.rating ?? 0} size="size-4" />
                <span className="font-medium">{product.rating?.toFixed(1)}</span>
                <span className="text-muted-foreground">({product.reviewCount} reviews)</span>
              </a>
            ) : (
              <span className="text-muted-foreground">No reviews yet</span>
            )}
            {product.turnaround && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                <Clock className="size-3.5" /> {product.turnaround}
              </span>
            )}
            {product.stock != null && (
              <span className={product.stock <= 5 ? "text-xs font-semibold text-destructive" : "text-xs text-muted-foreground"}>
                {product.stock <= 0 ? "Out of stock" : product.stock <= 5 ? `Only ${product.stock} left` : `${product.stock} in stock`}
              </span>
            )}
          </div>
          <div className="mt-5">
            <Price amount={fromPrice(product)} compareAt={product.compareAtPrice} prefix={isApparel ? "Blank from" : "From"} className="text-2xl" />
          </div>
          {product.shortDescription && <p className="mt-4 leading-relaxed text-muted-foreground">{product.shortDescription}</p>}
          {product.features.length > 0 && (
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {product.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Check className="size-3" strokeWidth={3} /></span>
                  {f}
                </li>
              ))}
            </ul>
          )}
          <div className="my-8 h-px bg-border" />
          <ProductConfigurator product={product} defaultSizeId={defaultSizeId} />
          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
            <div className="rounded-xl border bg-muted/30 p-3"><ShieldCheck className="mx-auto mb-1 size-5 text-primary" />Secure checkout</div>
            <div className="rounded-xl border bg-muted/30 p-3"><Truck className="mx-auto mb-1 size-5 text-primary" />Free ship $75+</div>
            <div className="rounded-xl border bg-muted/30 p-3"><Droplets className="mx-auto mb-1 size-5 text-primary" />50+ wash tested</div>
          </div>
        </div>
      </div>

      <section className="mt-16">
        <Tabs defaultValue="description" className="gap-6">
          <TabsList className="h-11! w-full justify-start overflow-x-auto rounded-xl p-1 sm:w-fit">
            <TabsTrigger value="description" className="rounded-lg px-4">Description</TabsTrigger>
            <TabsTrigger value="press" className="rounded-lg px-4">{isApparel || product.type === "SUPPLIES" ? "Care" : "How to press"}</TabsTrigger>
            <TabsTrigger value="shipping" className="rounded-lg px-4">Shipping</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="max-w-3xl space-y-4 leading-relaxed text-muted-foreground">
            {(product.description ?? "").split("\n").filter(Boolean).map((para, i) => <p key={i}>{para}</p>)}
          </TabsContent>
          <TabsContent value="press">
            {isApparel || product.type === "SUPPLIES" ? (
              <div className="max-w-3xl space-y-3 text-muted-foreground">
                <p>Machine wash cold inside-out with like colors. Tumble dry low or hang dry. Do not iron directly on the print, and avoid bleach and fabric softener for the longest-lasting color.</p>
              </div>
            ) : product.type === "UV_DTF" ? (
              <PressSteps
                steps={[
                  { icon: Recycle, title: "Clean the surface", body: "Wipe with isopropyl alcohol and let it dry completely." },
                  { icon: PackageCheck, title: "Peel & place", body: "Peel the backing film and position the decal adhesive side down." },
                  { icon: Thermometer, title: "Burnish firmly", body: "Rub with a squeegee or your thumb for 30 seconds." },
                  { icon: Timer, title: "Reveal slowly", body: "Peel the top film at a low angle. Let cure 24h before washing." },
                ]}
              />
            ) : (
              <PressSteps
                steps={[
                  { icon: Thermometer, title: "300–315°F", body: "Pre-press garment 3–5 seconds to remove moisture & wrinkles." },
                  { icon: Timer, title: "10–15 seconds", body: "Press with medium-firm pressure, film side up." },
                  { icon: PackageCheck, title: "Peel hot or cold", body: "Peel smoothly in one motion once the film releases." },
                  { icon: Recycle, title: "Re-press 5 seconds", body: "Cover with parchment/teflon for a soft, matte finish." },
                ]}
                footer={<Link href="/press-instructions" className="text-sm font-semibold text-primary hover:underline">Full press guide by fabric →</Link>}
              />
            )}
          </TabsContent>
          <TabsContent value="shipping" className="grid max-w-4xl gap-3 sm:grid-cols-3">
            {[
              { t: "Production", b: product.turnaround ?? "1–3 business days", i: Timer },
              { t: "Standard shipping", b: "3–5 business days · free over $75", i: Truck },
              { t: "Need it faster?", b: "Rush production, express & overnight available at checkout", i: Clock },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl border bg-card p-5">
                <x.i className="size-5 text-primary" />
                <p className="mt-3 font-semibold">{x.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{x.b}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </section>

      <div className="mt-16">
        <ReviewsSection
          reviews={reviews}
          productId={product.id}
          slug={product.slug}
          signedIn={!!user}
        />
      </div>

      {related.length > 0 && (
        <section className="border-t py-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl font-bold">You may also like</h2>
            <Link href="/shop" className="text-sm font-semibold text-primary hover:underline">View all</Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function PressSteps({ steps, footer }: { steps: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }[]; footer?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <s.icon className="size-5 text-primary" />
              <span className="font-heading text-2xl font-bold text-muted-foreground/25">0{i + 1}</span>
            </div>
            <p className="mt-3 font-semibold">{s.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
      {footer}
    </div>
  );
}
