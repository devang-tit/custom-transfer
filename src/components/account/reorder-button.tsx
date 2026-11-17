"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/stores/cart";
import { reorderAction } from "@/app/(store)/account/actions";
import { cn } from "@/lib/utils";

export function ReorderButton({ number, className, variant = "default" }: { number: string; className?: string; variant?: "default" | "outline" }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const close = useCart((s) => s.close);

  return (
    <Button
      variant={variant}
      disabled={pending}
      className={cn("h-10 rounded-xl px-4", className)}
      onClick={() =>
        start(async () => {
          const res = await reorderAction(number);
          if (res.error) {
            toast.error(res.error);
            return;
          }
          if (!res.lines.length) {
            toast.error("None of these items are available to reorder right now.");
            return;
          }
          res.lines.forEach((line) => addItem(line));
          close();
          toast.success(`Added ${res.lines.length} ${res.lines.length === 1 ? "item" : "items"} to your cart`, {
            description: res.skipped.length ? `Unavailable: ${res.skipped.join(", ")}` : "Priced at today's rates.",
          });
          router.push("/cart");
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <RotateCcw data-icon="inline-start" />}
      Reorder
    </Button>
  );
}
