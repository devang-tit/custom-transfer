import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/shared/rating-stars";
import { Price } from "@/components/shared/price";
import { productImage, type ProductDTO } from "@/lib/products";
import { PRODUCT_TYPE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Lowest per-piece price for "From $x" labels. */
export function fromPrice(p: Pick<ProductDTO, "basePrice" | "options">): number {
  const sizes = p.options.sizes ?? [];
  return sizes.length ? Math.min(...sizes.map((s) => s.price)) : p.basePrice;
}

export function ProductCard({ product, className, priority }: { product: ProductDTO; className?: string; priority?: boolean }) {
  const href = `/products/${product.slug}`;
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-premium focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
        className
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={productImage(product)}
          alt={product.name}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.badge && <Badge className="bg-foreground text-background shadow-sm">{product.badge}</Badge>}
          {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
            <Badge className="bg-ink-magenta text-white">Sale</Badge>
          )}
        </div>
        <span className="absolute right-3 bottom-3 grid size-9 translate-y-2 place-items-center rounded-full bg-background/90 opacity-0 shadow-sm backdrop-blur transition-all group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{PRODUCT_TYPE_LABELS[product.type]}</p>
        <h3 className="line-clamp-2 font-heading text-base leading-snug font-semibold">{product.name}</h3>
        {typeof product.rating === "number" && product.reviewCount ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RatingStars rating={product.rating} size="size-3.5" />
            <span>({product.reviewCount})</span>
          </div>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <Price amount={fromPrice(product)} compareAt={product.compareAtPrice} prefix="From" className="text-base" />
          {product.turnaround && (
            <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex">
              <Clock className="size-3" />
              {product.turnaround}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
