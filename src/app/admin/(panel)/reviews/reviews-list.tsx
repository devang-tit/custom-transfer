"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, X, Trash2, BadgeCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RatingStars } from "@/components/shared/rating-stars";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { moderateReviews } from "./actions";

type ReviewRow = {
  id: string;
  name: string;
  rating: number;
  title: string | null;
  body: string;
  status: string;
  createdAt: string;
  verified: boolean;
  product: { id: string; name: string; slug: string; image: string | null };
};

const STATUS_PILL: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  APPROVED: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  REJECTED: "bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:text-rose-300",
};

export function ReviewsList({ reviews }: { reviews: ReviewRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const act = (ids: string[], action: "APPROVED" | "REJECTED" | "PENDING" | "DELETE") =>
    start(async () => {
      const r = await moderateReviews({ ids, action });
      if (r.ok) {
        toast.success(r.message);
        setSelected(new Set());
        router.refresh();
      } else toast.error(r.error);
    });
  const all = reviews.length > 0 && reviews.every((r) => selected.has(r.id));

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-4 py-2.5 text-sm">
        <Checkbox
          aria-label="Select all reviews"
          checked={all ? true : selected.size ? "indeterminate" : false}
          onCheckedChange={(v) => setSelected(v ? new Set(reviews.map((r) => r.id)) : new Set())}
        />
        <span className="text-muted-foreground">{selected.size ? `${selected.size} selected` : `${reviews.length} reviews`}</span>
        {selected.size > 0 && (
          <div className="ml-auto flex flex-wrap gap-1.5">
            <Button size="sm" disabled={pending} onClick={() => act([...selected], "APPROVED")}>
              <Check /> Approve
            </Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => act([...selected], "REJECTED")}>
              <X /> Reject
            </Button>
            <Button size="sm" variant="destructive" disabled={pending} onClick={() => act([...selected], "DELETE")}>
              <Trash2 /> Delete
            </Button>
          </div>
        )}
      </div>
      <ul className="divide-y">
        {reviews.map((r) => (
          <li key={r.id} className={cn("flex gap-4 p-4 transition-colors", selected.has(r.id) && "bg-accent/40")}>
            <Checkbox
              className="mt-1"
              aria-label={`Select review by ${r.name}`}
              checked={selected.has(r.id)}
              onCheckedChange={() =>
                setSelected((s) => {
                  const n = new Set(s);
                  if (n.has(r.id)) n.delete(r.id);
                  else n.add(r.id);
                  return n;
                })
              }
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <RatingStars rating={r.rating} size="size-3.5" />
                {r.title && <p className="font-semibold">{r.title}</p>}
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", STATUS_PILL[r.status])}>
                  {r.status === "APPROVED" ? "Published" : r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">{r.body}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  {r.name}
                  {r.verified && <BadgeCheck className="size-3.5 text-primary" aria-label="Registered customer" />}
                </span>
                <span>{formatDate(r.createdAt)}</span>
                <Link href={`/admin/products/${r.product.id}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                  {r.product.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.product.image} alt="" className="size-4 rounded object-cover" />
                  )}
                  {r.product.name}
                </Link>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row sm:items-start">
              {r.status !== "APPROVED" && (
                <Button size="sm" disabled={pending} onClick={() => act([r.id], "APPROVED")}>
                  <Check /> Approve
                </Button>
              )}
              {r.status === "PENDING" && (
                <Button size="sm" variant="outline" disabled={pending} onClick={() => act([r.id], "REJECTED")}>
                  <X /> Reject
                </Button>
              )}
              {r.status !== "PENDING" && (
                <Button size="sm" variant="ghost" disabled={pending} onClick={() => act([r.id], "PENDING")} aria-label="Move back to pending">
                  <RotateCcw />
                </Button>
              )}
              <Button size="icon-sm" variant="ghost" disabled={pending} onClick={() => act([r.id], "DELETE")} aria-label="Delete review">
                <Trash2 />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
