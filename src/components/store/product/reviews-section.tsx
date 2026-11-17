import { MessageSquareQuote, BadgeCheck } from "lucide-react";
import { RatingStars } from "@/components/shared/rating-stars";
import { formatDate } from "@/lib/format";
import { ReviewForm } from "./review-form";

type R = { id: string; name: string; rating: number; title: string | null; body: string; createdAt: Date; userId: string | null };

export function ReviewsSection({
  reviews,
  productId,
  slug,
  signedIn,
}: {
  reviews: R[];
  productId: string;
  slug: string;
  signedIn: boolean;
}) {
  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, n: reviews.filter((r) => r.rating === star).length }));

  return (
    <section id="reviews" className="scroll-mt-24 border-t py-16">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <div>
            <h2 className="text-3xl font-bold">Customer reviews</h2>
            <div className="mt-4 flex items-center gap-4">
              <p className="font-heading text-5xl font-extrabold">{count ? avg.toFixed(1) : "—"}</p>
              <div>
                <RatingStars rating={avg} />
                <p className="mt-1 text-sm text-muted-foreground">Based on {count} review{count === 1 ? "" : "s"}</p>
              </div>
            </div>
          </div>
          <ul className="space-y-2">
            {dist.map((d) => (
              <li key={d.star} className="flex items-center gap-3 text-sm">
                <span className="w-8 text-muted-foreground tabular-nums">{d.star}★</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-amber-400" style={{ width: count ? `${(d.n / count) * 100}%` : 0 }} />
                </span>
                <span className="w-6 text-right text-muted-foreground tabular-nums">{d.n}</span>
              </li>
            ))}
          </ul>
          <ReviewForm productId={productId} signedIn={signedIn} slug={slug} />
        </div>
        <div className="lg:col-span-8">
          {count === 0 ? (
            <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-3xl border border-dashed p-8 text-center">
              <MessageSquareQuote className="size-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">No reviews yet</p>
              <p className="text-sm text-muted-foreground">Be the first to share how your prints turned out.</p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {reviews.slice(0, 12).map((r) => (
                <li key={r.id} className="rounded-3xl border bg-card p-5">
                  <div className="flex items-center justify-between gap-2">
                    <RatingStars rating={r.rating} size="size-3.5" />
                    <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                  </div>
                  {r.title && <p className="mt-3 font-semibold">{r.title}</p>}
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                  <p className="mt-4 flex items-center gap-1.5 text-xs font-medium">
                    {r.name}
                    {r.userId && (
                      <span className="inline-flex items-center gap-0.5 text-success">
                        <BadgeCheck className="size-3.5" /> Verified buyer
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
