import Link from "next/link";
import Image from "next/image";
import { Package, Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { toProductDTO } from "@/lib/products";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS, type ProductType } from "@/lib/types";
import { formatMoney, formatNumber } from "@/lib/format";
import { fromPrice } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/admin/page-header";
import { SegmentedLinks, withParams } from "@/components/admin/segmented-links";
import { EmptyState } from "@/components/shared/empty-state";
import { sp } from "../../_lib/ranges";
import { ProductRowActions, ProductsToolbar } from "./product-list-client";
import { cn } from "@/lib/utils";

export const metadata = { title: "Products" };

export default async function ProductsPage(props: PageProps<"/admin/products">) {
  await requireAdmin();
  const raw = await props.searchParams;
  const params = { q: sp(raw.q), type: sp(raw.type), category: sp(raw.category), status: sp(raw.status) };
  const where: Prisma.ProductWhereInput = { AND: [] };
  const and = where.AND as Prisma.ProductWhereInput[];
  if (params.q) and.push({ OR: [{ name: { contains: params.q, mode: "insensitive" } }, { sku: { contains: params.q, mode: "insensitive" } }, { slug: { contains: params.q, mode: "insensitive" } }] });
  if (params.type && (PRODUCT_TYPES as readonly string[]).includes(params.type)) and.push({ type: params.type });
  if (params.category) and.push({ categoryId: params.category });
  if (params.status === "active") and.push({ active: true });
  if (params.status === "hidden") and.push({ active: false });
  if (params.status === "featured") and.push({ featured: true });
  if (params.status === "low") and.push({ stock: { not: null, lte: 10 } });

  const [rows, categories, sold, counts] = await Promise.all([
    db.product.findMany({ where, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], include: { category: { select: { id: true, name: true, slug: true } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.orderItem.groupBy({ by: ["productId"], where: { order: { paymentStatus: "PAID" } }, _sum: { quantity: true, total: true } }),
    Promise.all([db.product.count(), db.product.count({ where: { active: true } }), db.product.count({ where: { active: false } }), db.product.count({ where: { featured: true } }), db.product.count({ where: { stock: { not: null, lte: 10 } } })]),
  ]);
  const soldMap = new Map(sold.map((s) => [s.productId, s._sum]));
  const products = rows.map((r) => toProductDTO(r));
  const current = params as Record<string, string | undefined>;
  const status = params.status ?? "all";

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Products"
        description={`${counts[0]} products in your catalog`}
        actions={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus /> Add product
            </Link>
          </Button>
        }
      />
      <SegmentedLinks
        className="mb-4"
        active={status}
        items={[
          { key: "all", label: "All", count: counts[0], href: withParams("/admin/products", current, { status: undefined }) },
          { key: "active", label: "Live", count: counts[1], href: withParams("/admin/products", current, { status: "active" }) },
          { key: "hidden", label: "Hidden", count: counts[2], href: withParams("/admin/products", current, { status: "hidden" }) },
          { key: "featured", label: "Featured", count: counts[3], href: withParams("/admin/products", current, { status: "featured" }) },
          { key: "low", label: "Low stock", count: counts[4], href: withParams("/admin/products", current, { status: "low" }) },
        ]}
      />
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <ProductsToolbar
          params={current}
          types={PRODUCT_TYPES.map((t) => ({ value: t, label: PRODUCT_TYPE_LABELS[t] }))}
          categories={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        {products.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-4">Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">From</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12 pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const s = soldMap.get(p.id);
                  return (
                    <TableRow key={p.id} className={cn(!p.active && "opacity-60")}>
                      <TableCell className="pl-4">
                        <Link href={`/admin/products/${p.id}`} className="group flex items-center gap-3">
                          <span className="relative size-11 shrink-0 overflow-hidden rounded-lg border bg-muted">
                            {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="44px" className="object-cover" unoptimized />}
                          </span>
                          <span className="min-w-0">
                            <span className="block max-w-72 truncate font-medium group-hover:text-primary">{p.name}</span>
                            <span className="block font-mono text-xs text-muted-foreground">{p.sku ?? p.slug}</span>
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{PRODUCT_TYPE_LABELS[p.type as ProductType]}</TableCell>
                      <TableCell className="text-muted-foreground">{p.category?.name ?? "—"}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatMoney(fromPrice(p))}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className="font-medium">{formatNumber(s?.quantity ?? 0)}</span>
                        <span className="block text-xs text-muted-foreground">{formatMoney(s?.total ?? 0)}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.stock === null ? (
                          <span className="text-xs text-muted-foreground">Made to order</span>
                        ) : (
                          <span className={cn("font-medium", p.stock <= 5 ? "text-rose-600 dark:text-rose-400" : p.stock <= 10 ? "text-amber-600 dark:text-amber-400" : "")}>
                            {formatNumber(p.stock)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                              p.active ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-400" : "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-400"
                            )}
                          >
                            <span className={cn("size-1.5 rounded-full", p.active ? "bg-emerald-500" : "bg-zinc-400")} />
                            {p.active ? "Live" : "Hidden"}
                          </span>
                          {p.featured && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-primary/20 ring-inset">Featured</span>}
                        </div>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <ProductRowActions id={p.id} slug={p.slug} active={p.active} featured={p.featured} name={p.name} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={Package}
              title="No products found"
              description="Adjust the filters or add your first product."
              action={
                <Button asChild>
                  <Link href="/admin/products/new">
                    <Plus /> Add product
                  </Link>
                </Button>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
