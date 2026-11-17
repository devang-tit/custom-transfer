import { Star } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { SegmentedLinks, withParams } from "@/components/admin/segmented-links";
import { EmptyState } from "@/components/shared/empty-state";
import { RatingStars } from "@/components/shared/rating-stars";
import { sp } from "../../_lib/ranges";
import { ReviewsList } from "./reviews-list";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage(props: PageProps<"/admin/reviews">) {
  await requireAdmin();
  const raw = await props.searchParams;
  const status = sp(raw.status) ?? "PENDING";
  const rating = Number(sp(raw.rating)) || 0;
  const where: Prisma.ReviewWhereInput = { ...(status !== "all" ? { status } : {}), ...(rating ? { rating } : {}) };
  const [reviews, counts, avg, dist] = await Promise.all([
    db.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { product: { select: { id: true, name: true, slug: true, images: true } }, user: { select: { id: true } } },
    }),
    db.review.groupBy({ by: ["status"], _count: { _all: true } }),
    db.review.aggregate({ where: { status: "APPROVED" }, _avg: { rating: true }, _count: { _all: true } }),
    db.review.groupBy({ by: ["rating"], where: { status: "APPROVED" }, _count: { _all: true } }),
  ]);
  const c = Object.fromEntries(counts.map((x) => [x.status, x._count._all]));
  const current = { status: sp(raw.status), rating: sp(raw.rating) };
  const distMap = Object.fromEntries(dist.map((d) => [d.rating, d._count._all]));
  const maxDist = Math.max(1, ...dist.map((d) => d._count._all));

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Reviews" description="Approve customer reviews before they appear on product pages." />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <SegmentedLinks
              active={status}
              items={[
                { key: "PENDING", label: "Pending", count: c.PENDING ?? 0, href: withParams("/admin/reviews", current, { status: undefined }) },
                { key: "APPROVED", label: "Published", count: c.APPROVED ?? 0, href: withParams("/admin/reviews", current, { status: "APPROVED" }) },
                { key: "REJECTED", label: "Rejected", count: c.REJECTED ?? 0, href: withParams("/admin/reviews", current, { status: "REJECTED" }) },
                { key: "all", label: "All", href: withParams("/admin/reviews", current, { status: "all" }) },
              ]}
            />
            <SegmentedLinks
              active={rating ? String(rating) : "any"}
              items={[
                { key: "any", label: "Any ★", href: withParams("/admin/reviews", current, { rating: undefined }) },
                ...[5, 4, 3, 2, 1].map((r) => ({ key: String(r), label: `${r}★`, href: withParams("/admin/reviews", current, { rating: String(r) }) })),
              ]}
            />
          </div>
          {reviews.length ? (
            <ReviewsList
              reviews={reviews.map((r) => ({
                id: r.id,
                name: r.name,
                rating: r.rating,
                title: r.title,
                body: r.body,
                status: r.status,
                createdAt: r.createdAt.toISOString(),
                verified: !!r.user,
                product: { id: r.product.id, name: r.product.name, slug: r.product.slug, image: (JSON.parse(r.product.images) as string[])[0] ?? null },
              }))}
            />
          ) : (
            <EmptyState icon={Star} title={status === "PENDING" ? "You're all caught up" : "No reviews here"} description={status === "PENDING" ? "No reviews are waiting for moderation." : "Try a different filter."} />
          )}
        </div>
        <aside className="space-y-4">
          <div className="rounded-xl border bg-card p-5 shadow-xs">
            <p className="text-sm text-muted-foreground">Average rating</p>
            <div className="mt-1 flex items-end gap-2">
              <span className="font-heading text-4xl font-semibold tabular-nums">{(avg._avg.rating ?? 0).toFixed(1)}</span>
              <span className="mb-1.5 text-sm text-muted-foreground">/ 5 · {avg._count._all} published</span>
            </div>
            <RatingStars rating={avg._avg.rating ?? 0} className="mt-1" />
            <ul className="mt-4 space-y-1.5">
              {[5, 4, 3, 2, 1].map((r) => (
                <li key={r} className="flex items-center gap-2 text-xs">
                  <span className="w-6 text-muted-foreground tabular-nums">{r}★</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-amber-400" style={{ width: `${((distMap[r] ?? 0) / maxDist) * 100}%` }} />
                  </span>
                  <span className="w-6 text-right tabular-nums">{distMap[r] ?? 0}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
