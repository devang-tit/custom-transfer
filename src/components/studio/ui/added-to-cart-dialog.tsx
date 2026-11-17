"use client";

import Link from "next/link";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMoney } from "@/lib/format";

export type AddedSummary = {
  image: string;
  name: string;
  variantLabel: string;
  quantity: number;
  total: number;
};

export function AddedToCartDialog({
  open,
  onOpenChange,
  summary,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: AddedSummary | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 grid size-11 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-6" />
          </div>
          <DialogTitle className="font-heading text-xl">Added to your cart</DialogTitle>
          <DialogDescription>Your design is saved with the order. Our prepress team checks every file before printing.</DialogDescription>
        </DialogHeader>
        {summary && (
          <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-checker">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={summary.image} alt="" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{summary.name}</p>
              <p className="truncate text-xs text-muted-foreground">{summary.variantLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Qty {summary.quantity} · <span className="font-semibold text-foreground">{formatMoney(summary.total)}</span>
              </p>
            </div>
          </div>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>
            Keep designing
          </Button>
          <Button asChild size="lg" className="shadow-glow">
            <Link href="/cart">
              <ShoppingBag />
              Go to cart
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
