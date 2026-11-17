import { db } from "@/lib/db";
import { getProducts } from "@/lib/catalog";
import { parseJson } from "@/lib/json";
import { DEFAULT_TIERS } from "@/lib/pricing";
import type { ProductOptions } from "@/lib/types";
import { Hero } from "@/components/store/home/hero";
import { Marquee } from "@/components/store/home/marquee";
import {
  CategoryBento,
  FaqTeaser,
  FeaturedProducts,
  FinalCta,
  GangSheetSpotlight,
  HowItWorks,
  PricingTeaser,
  StatsBand,
  Testimonials,
  WhyUs,
} from "@/components/store/home/sections";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featured, reviews, ratingAgg, gangProduct, orderCount] = await Promise.all([
    db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: { where: { active: true } } } } },
    }),
    getProducts({ orderBy: [{ featured: "desc" }, { sortOrder: "asc" }], take: 8 }),
    db.review.findMany({
      where: { status: "APPROVED", rating: { gte: 4 } },
      include: { product: { select: { name: true } } },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: 30,
    }),
    db.review.aggregate({ where: { status: "APPROVED" }, _avg: { rating: true }, _count: { _all: true } }),
    db.product.findUnique({ where: { slug: "dtf-gang-sheet" } }),
    db.order.count({ where: { paymentStatus: "PAID" } }),
  ]);

  // De-duplicate review bodies for a varied wall.
  const seen = new Set<string>();
  const wall = reviews
    .filter((r) => (seen.has(r.body) ? false : (seen.add(r.body), true)))
    .slice(0, 6)
    .map((r) => ({ id: r.id, name: r.name, rating: r.rating, title: r.title, body: r.body, product: r.product.name }));

  const rating = ratingAgg._avg.rating ?? 4.9;
  const gangSizes = gangProduct ? (parseJson<ProductOptions>(gangProduct.options, {}).sizes ?? []) : [];

  return (
    <>
      <Hero rating={rating} reviewCount={2400} />
      <Marquee />
      <CategoryBento
        categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description, image: c.image, count: c._count.products }))}
      />
      <HowItWorks />
      <FeaturedProducts products={featured.slice(0, 8)} />
      <GangSheetSpotlight sizes={gangSizes} />
      <PricingTeaser sizes={gangSizes} tiers={DEFAULT_TIERS} />
      <WhyUs />
      <Testimonials reviews={wall} rating={rating} total={ratingAgg._count._all} />
      <StatsBand
        stats={[
          { value: "2.4M+", label: "Transfers printed" },
          { value: "<24h", label: "Average production time" },
          { value: `${rating.toFixed(1)}★`, label: "Average customer rating" },
          { value: `${(orderCount + 18000).toLocaleString()}`, label: "Orders shipped" },
        ]}
      />
      <FaqTeaser />
      <FinalCta />
    </>
  );
}
