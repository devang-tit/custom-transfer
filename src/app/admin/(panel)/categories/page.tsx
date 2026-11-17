import Link from "next/link";
import { FolderTree } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMoney, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CategoryDialog, DeleteCategoryButton } from "./category-client";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireAdmin();
  const [cats, revenue] = await Promise.all([
    db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } }, products: { select: { id: true, active: true } } },
    }),
    db.orderItem.groupBy({ by: ["productId"], where: { order: { paymentStatus: "PAID" } }, _sum: { total: true } }),
  ]);
  const revMap = new Map(revenue.map((r) => [r.productId, r._sum.total ?? 0]));

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Categories" description="Group products into collections shown in the store navigation." actions={<CategoryDialog />} />
      {cats.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cats.map((c) => {
            const rev = c.products.reduce((s, p) => s + (revMap.get(p.id) ?? 0), 0);
            const live = c.products.filter((p) => p.active).length;
            return (
              <article key={c.id} className="group overflow-hidden rounded-xl border bg-card shadow-xs transition-shadow hover:shadow-md">
                <div className="relative aspect-[16/7] overflow-hidden bg-muted">
                  {c.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                  <span className="absolute top-3 left-3 rounded-md bg-background/90 px-2 py-0.5 font-mono text-xs text-muted-foreground backdrop-blur">#{c.sortOrder}</span>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-heading font-semibold">{c.name}</h3>
                      <p className="font-mono text-xs text-muted-foreground">/{c.slug}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <CategoryDialog category={{ id: c.id, name: c.name, slug: c.slug, description: c.description ?? "", image: c.image ?? "", sortOrder: c.sortOrder }} />
                      <DeleteCategoryButton id={c.id} name={c.name} disabled={c._count.products > 0} />
                    </div>
                  </div>
                  {c.description && <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
                  <div className="flex items-center gap-4 border-t pt-3 text-sm">
                    <Link href={`/admin/products?category=${c.id}`} className="hover:text-primary">
                      <span className="font-semibold tabular-nums">{formatNumber(c._count.products)}</span> <span className="text-muted-foreground">products</span>
                    </Link>
                    <span>
                      <span className="font-semibold tabular-nums">{live}</span> <span className="text-muted-foreground">live</span>
                    </span>
                    <span className="ml-auto font-semibold tabular-nums">{formatMoney(rev)}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={FolderTree} title="No categories yet" description="Create your first category to organize the catalog." action={<CategoryDialog />} />
      )}
    </div>
  );
}
