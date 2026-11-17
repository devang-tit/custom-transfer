import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { toProductDTO } from "@/lib/products";
import { formatMoney, formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "../product-form";
import { ProductRowActions } from "../product-list-client";

export async function generateMetadata(props: PageProps<"/admin/products/[id]">) {
  const { id } = await props.params;
  const p = await db.product.findUnique({ where: { id }, select: { name: true } });
  return { title: p?.name ?? "Product" };
}

export default async function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const [row, categories, agg, sales] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { category: { select: { id: true, name: true, slug: true } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.review.aggregate({ where: { productId: id, status: "APPROVED" }, _avg: { rating: true }, _count: { _all: true } }),
    db.orderItem.aggregate({ where: { productId: id, order: { paymentStatus: "PAID" } }, _sum: { quantity: true, total: true }, _count: { _all: true } }),
  ]);
  if (!row) notFound();
  const product = toProductDTO(row, { rating: agg._avg.rating ?? undefined, reviewCount: agg._count._all });

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        back={{ href: "/admin/products", label: "Products" }}
        title={product.name}
        description={
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              <span className="font-medium text-foreground tabular-nums">{formatNumber(sales._sum.quantity ?? 0)}</span> units sold
            </span>
            <span>
              <span className="font-medium text-foreground tabular-nums">{formatMoney(sales._sum.total ?? 0)}</span> revenue
            </span>
            <span>
              <span className="font-medium text-foreground tabular-nums">{agg._count._all}</span> reviews
              {agg._avg.rating ? ` · ${agg._avg.rating.toFixed(1)}★` : ""}
            </span>
          </span>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <a href={`/products/${product.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink /> View
              </a>
            </Button>
            <ProductRowActions id={product.id} slug={product.slug} active={product.active} featured={product.featured} name={product.name} />
          </>
        }
      />
      <ProductForm key={row.updatedAt.toISOString()} product={product} categories={categories} />
    </div>
  );
}
