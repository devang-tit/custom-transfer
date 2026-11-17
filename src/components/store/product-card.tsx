import Link from "next/link";
import Image from "next/image";
import { RatingStars } from "@/components/shared/rating-stars";
import { Price } from "@/components/shared/price";
import { productImage, type ProductDTO } from "@/lib/products";
import { cn } from "@/lib/utils";

/** Lowest per-piece price for "From $x" labels. */
export function fromPrice(p: Pick<ProductDTO, "basePrice" | "options">): number {
  const sizes = p.options.sizes ?? [];
  return sizes.length ? Math.min(...sizes.map((s) => s.price)) : p.basePrice;
}

/**
 * Image-first product card: square, edge-to-edge media with no frame, pill badges top-right,
 * title and price underneath. Hovering swaps to the second product image when there is one.
 */
export function ProductCard({ product, className, priority }: { product: ProductDTO; className?: string; priority?: boolean }) {
  const href = `/products/${product.slug}`;
  const hoverImage = product.images[1];
  const onSale = !!product.compareAtPrice && product.compareAtPrice > product.basePrice;
  return (
    <Link href={href} className={cn("group flex flex-col gap-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={productImage(product)}
          alt={product.name}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className={cn("object-cover transition-opacity duration-500", hoverImage && "group-hover:opacity-0")}
          unoptimized
        />
        {hoverImage && (
          <Image
            src={hoverImage}
            alt=""
            aria-hidden
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            unoptimized
          />
        )}
        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5">
          {onSale && <span className="rounded-full bg-foreground px-2.5 py-1 text-[11px] leading-none font-medium text-background">Sale</span>}
          {product.badge && <span className="rounded-full bg-background px-2.5 py-1 text-[11px] leading-none font-medium text-foreground">{product.badge}</span>}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="line-clamp-2 text-sm leading-snug font-medium underline-offset-4 group-hover:underline">{product.name}</h3>
        <Price amount={fromPrice(product)} compareAt={product.compareAtPrice} prefix="From" className="text-sm [&_span.font-semibold]:font-normal" />
        {typeof product.rating === "number" && product.reviewCount ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RatingStars rating={product.rating} size="size-3" />
            <span>({product.reviewCount})</span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
