"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleWishlist } from "@/app/(store)/_actions/wishlist";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId, initial, slug, className }: { productId: string; initial: boolean; slug: string; className?: string }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Remove from wishlist" : "Save to wishlist"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          setOn((v) => !v);
          const res = await toggleWishlist(productId);
          if (!res.ok) {
            setOn(initial);
            if (res.needsLogin) {
              toast.info("Sign in to save products to your wishlist");
              router.push(`/login?next=${encodeURIComponent(`/products/${slug}`)}`);
            } else toast.error(res.error ?? "Something went wrong");
            return;
          }
          setOn(res.wishlisted);
          toast.success(res.wishlisted ? "Saved to your wishlist" : "Removed from wishlist");
        })
      }
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-xl border bg-card transition-colors hover:border-ink-magenta/40",
        on && "border-ink-magenta/40 bg-ink-magenta/10",
        className
      )}
    >
      <Heart className={cn("size-5 transition-transform", on ? "scale-110 fill-ink-magenta text-ink-magenta" : "text-muted-foreground")} />
    </button>
  );
}
