"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Star, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitReview, type ReviewState } from "@/app/(store)/_actions/reviews";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId, signedIn, slug }: { productId: string; signedIn: boolean; slug: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  // Controlled fields: React 19 resets uncontrolled inputs after a form action, which would wipe text on validation errors.
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [state, action, pending] = useActionState<ReviewState, FormData>(async (prev, fd) => {
    const res = await submitReview(prev, fd);
    if (res?.ok) {
      toast.success("Thanks! Your review is pending moderation.");
      setTitle("");
      setBody("");
      setRating(0);
    } else if (res?.error) toast.error(res.error);
    return res;
  }, undefined);

  if (!signedIn) {
    return (
      <div className="rounded-2xl border border-dashed p-6 text-center">
        <p className="font-semibold">Share your experience</p>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to write a review for this product.</p>
        <Button asChild variant="outline" className="mt-4 h-10 rounded-xl">
          <Link href={`/login?next=${encodeURIComponent(`/products/${slug}#reviews`)}`}>Sign in to review</Link>
        </Button>
      </div>
    );
  }

  const fe = state?.fieldErrors;
  return (
    <form action={action} className="space-y-4 rounded-2xl border bg-card p-5">
      <p className="font-heading text-lg font-semibold">Write a review</p>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating || ""} />
      <div>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" aria-label={`${i} star${i > 1 ? "s" : ""}`} onMouseEnter={() => setHover(i)} onClick={() => setRating(i)}>
              <Star className={cn("size-7 transition-colors", (hover || rating) >= i ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} strokeWidth={1.5} />
            </button>
          ))}
        </div>
        {fe?.rating && <p className="mt-1 text-xs text-destructive">{fe.rating[0]}</p>}
      </div>
      <Input name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Headline (optional)" maxLength={120} className="h-10 rounded-xl" />
      <div>
        <Textarea name="body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="How did your prints turn out? Colors, feel, durability…" rows={4} className="rounded-xl" aria-invalid={!!fe?.body} />
        {fe?.body && <p className="mt-1 text-xs text-destructive">{fe.body[0]}</p>}
      </div>
      <Button type="submit" disabled={pending} className="h-10 rounded-xl px-5">
        {pending && <LoaderCircle className="size-4 animate-spin" />} Submit review
      </Button>
    </form>
  );
}
