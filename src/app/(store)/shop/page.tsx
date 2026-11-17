import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch, X } from "lucide-react";
import { db } from "@/lib/db";
import { getProducts } from "@/lib/catalog";
import { PRODUCT_TYPE_LABELS, PRODUCT_TYPES, type ProductType } from "@/lib/types";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductCard, fromPrice } from "@/components/store/product-card";
import { ShopFilters } from "@/components/store/shop/shop-filters";
import { ShopToolbar } from "@/components/store/shop/shop-toolbar";
import { PRICE_PRESETS, SORTS, shopHref, toggleInList, type ShopParams } from "@/components/store/shop/shop-params";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/shop">): Promise<Metadata> {
  const sp = await props.searchParams;
  const slug = typeof sp.category === "string" ? sp.category : undefined;
  if (slug) {
    const cat = await db.category.findUnique({ where: { slug } });
    if (cat) return { title: cat.name, description: cat.description ?? undefined };
  }
  return { title: "Shop all transfers & apparel" };
}

const str = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : undefined);

export default async function ShopPage(props: PageProps<"/shop">) {
  const sp = await props.searchParams;
  const params: ShopParams = { category: str(sp.category), type: str(sp.type), sort: str(sp.sort), q: str(sp.q), price: str(sp.price) };

  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { active: true } } } } },
  });
  const activeCategory = categories.find((c) => c.slug === params.category);

  const types = (params.type ?? "").split(",").filter((t): t is ProductType => (PRODUCT_TYPES as readonly string[]).includes(t));
  const q = params.q?.trim();

  // Base set (category + search) used for type counts; type & price filters applied after.
  const base = await getProducts({
    where: {
      ...(activeCategory ? { categoryId: activeCategory.id } : {}),
      ...(q
        ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { shortDescription: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] }
        : {}),
    },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
  });
  const typeCounts: Record<string, number> = {};
  for (const p of base) typeCounts[p.type] = (typeCounts[p.type] ?? 0) + 1;

  const preset = PRICE_PRESETS.find((p) => p.id === params.price);
  let products = base.filter((p) => (types.length ? types.includes(p.type) : true));
  if (preset) products = products.filter((p) => fromPrice(p) >= preset.min && fromPrice(p) <= preset.max);

  switch (params.sort) {
    case "price-asc":
      products.sort((a, b) => fromPrice(a) - fromPrice(b));
      break;
    case "price-desc":
      products.sort((a, b) => fromPrice(b) - fromPrice(a));
      break;
    case "rating":
      products.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
      break;
    case "newest":
      products.reverse();
      break;
  }

  const chips: { label: string; href: string }[] = [];
  if (q) chips.push({ label: `“${q}”`, href: shopHref(params, { q: undefined }) });
  for (const t of types) chips.push({ label: PRODUCT_TYPE_LABELS[t], href: shopHref(params, { type: toggleInList(params.type, t) }) });
  if (preset) chips.push({ label: preset.label, href: shopHref(params, { price: undefined }) });

  const filters = (
    <ShopFilters
      params={params}
      categories={categories.map((c) => ({ slug: c.slug, name: c.name, count: c._count.products }))}
      typeCounts={typeCounts}
    />
  );

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden border-b bg-muted/30">
        <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="pointer-events-none absolute -top-24 right-0 size-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="container-page relative py-10 sm:py-14">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink asChild><Link href="/">Home</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              {activeCategory ? (
                <>
                  <BreadcrumbItem><BreadcrumbLink asChild><Link href="/shop">Shop</Link></BreadcrumbLink></BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem><BreadcrumbPage>{activeCategory.name}</BreadcrumbPage></BreadcrumbItem>
                </>
              ) : (
                <BreadcrumbItem><BreadcrumbPage>Shop</BreadcrumbPage></BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">{activeCategory?.name ?? "Shop everything"}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {activeCategory?.description ??
              "DTF transfers, gang sheets, UV DTF, screen print transfers, custom apparel and pressing supplies — all printed in-house and shipped fast."}
          </p>
          <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <CategoryChip href={shopHref(params, { category: undefined })} active={!activeCategory}>All</CategoryChip>
            {categories.map((c) => (
              <CategoryChip key={c.id} href={shopHref(params, { category: c.slug })} active={activeCategory?.id === c.id} image={c.image}>
                {c.name}
              </CategoryChip>
            ))}
          </div>
        </div>
      </section>

      <div className="container-page grid gap-10 pt-8 lg:grid-cols-[15.5rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">{filters}</div>
        </aside>
        <div className="min-w-0">
          <ShopToolbar params={params} filters={filters} activeCount={chips.length + (activeCategory ? 1 : 0)} />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <p className="mr-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{products.length}</span> {products.length === 1 ? "product" : "products"}
              {params.sort && params.sort !== "featured" && <> · {SORTS.find((s) => s.id === params.sort)?.label}</>}
            </p>
            {chips.map((c) => (
              <Link key={c.label} href={c.href} scroll={false} className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs font-medium hover:border-destructive/40 hover:text-destructive">
                {c.label} <X className="size-3" />
              </Link>
            ))}
            {chips.length > 1 && (
              <Link href={shopHref({ category: params.category }, {})} scroll={false} className="text-xs font-medium text-primary hover:underline">
                Clear all
              </Link>
            )}
          </div>

          {products.length ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 3} />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-8"
              icon={PackageSearch}
              title="No products match your filters"
              description="Try removing a filter or searching for something else — or build a fully custom gang sheet."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild variant="outline" className="h-10 rounded-xl"><Link href="/shop">Reset filters</Link></Button>
                  <Button asChild className="h-10 rounded-xl"><Link href="/gang-sheet-builder">Open builder</Link></Button>
                </div>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryChip({ href, active, image, children }: { href: string; active: boolean; image?: string | null; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full border py-1 pr-3.5 pl-1 text-sm font-medium whitespace-nowrap transition-colors",
        !image && "pl-3.5",
        active ? "border-foreground bg-foreground text-background" : "bg-card hover:border-foreground/30"
      )}
    >
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="size-7 rounded-full object-cover" />
      )}
      {children}
    </Link>
  );
}
