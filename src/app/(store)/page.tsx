import { db } from "@/lib/db";
import { getProducts } from "@/lib/catalog";
import { parseJson } from "@/lib/json";
import type { ProductOptions } from "@/lib/types";
import {
  CollectionList,
  FaqSection,
  HeroSplit,
  HowItWorks,
  ImageWithText,
  ProductGridSection,
  Quotes,
} from "@/components/store/home/storefront-home";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featured, reviews, ratingAgg, gangProduct] = await Promise.all([
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
  ]);

  // Distinct review bodies, best first.
  const seen = new Set<string>();
  const quotes = reviews
    .filter((r) => (seen.has(r.body) ? false : (seen.add(r.body), true)))
    .slice(0, 3)
    .map((r) => ({ id: r.id, name: r.name, rating: r.rating, title: r.title, body: r.body, product: r.product.name }));

  const gangSizes = gangProduct ? (parseJson<ProductOptions>(gangProduct.options, {}).sizes ?? []) : [];
  const gangFrom = gangSizes.length ? Math.min(...gangSizes.map((s) => s.price)) : null;

  return (
    <>
      <HeroSplit fromPrice={gangFrom} />
      <ProductGridSection title="Best sellers" products={featured} href="/shop" />
      <CollectionList
        categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, image: c.image, count: c._count.products }))}
      />
      <ImageWithText
        image="/images/products/gang-sheet.svg"
        imageAlt="A 22-inch gang sheet packed with designs"
        eyebrow="Gang Sheet Builder"
        title="Fit more designs on every sheet"
        body="Upload your art and let the builder pack it onto a 22″ wide sheet. Pay by length, not by design."
        points={["Automatic packing to use the least film", "Live resolution checks on every design", "Save, reorder and edit sheets anytime"]}
        primary={{ label: "Open the builder", href: "/gang-sheet-builder" }}
        secondary={{ label: "See pricing", href: "/pricing" }}
      />
      <ImageWithText
        reverse
        image="/images/products/tee-white.svg"
        imageAlt="A white tee with a custom print"
        eyebrow="Design Studio"
        title="Put your design on a tee or hoodie"
        body="Pick a garment and color, add your artwork or text front and back, and choose sizes. We print, press and ship it."
        points={["Premium heavyweight tees, hoodies and crewnecks", "No minimums, bulk pricing from 12 pieces"]}
        primary={{ label: "Start designing", href: "/design-studio" }}
        secondary={{ label: "Shop apparel", href: "/shop?category=custom-apparel" }}
      />
      <HowItWorks />
      <Quotes reviews={quotes} rating={ratingAgg._avg.rating ?? 4.9} total={ratingAgg._count._all} />
      <FaqSection />
    </>
  );
}
