"use client";

import { useTransition } from "react";
import { HeartOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { removeFromWishlistAction } from "@/app/(store)/account/actions";

export function RemoveWishlistButton({ productId, name }: { productId: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await removeFromWishlistAction(productId);
          toast.success(`Removed ${name} from your wishlist`);
        })
      }
      className="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-background/90 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-destructive hover:text-white"
      aria-label={`Remove ${name} from wishlist`}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <HeartOff className="size-4" />}
    </button>
  );
}
