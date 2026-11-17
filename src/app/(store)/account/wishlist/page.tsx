import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductCard } from "@/components/store/product-card";
import { RemoveWishlistButton } from "@/components/account/remove-wishlist-button";
import { AccountPageHeader } from "@/components/account/section";
import { requireUser } from "@/lib/auth";
import { getProducts } from "@/lib/catalog";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Wishlist" };
export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await requireUser("/account/wishlist");
  const saved = await db.wishlistItem.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { productId: true } });
  const products = saved.length ? await getProducts({ where: { id: { in: saved.map((s) => s.productId) } } }) : [];
  const ordered = saved.map((s) => products.find((p) => p.id === s.productId)).filter((p) => !!p);

  return (
    <div>
      <AccountPageHeader title="Wishlist" description={ordered.length ? `${ordered.length} saved ${ordered.length === 1 ? "product" : "products"}` : "Save products you love for later."} />
      {ordered.length ? (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          {ordered.map((p) => (
            <div key={p.id} className="relative">
              <RemoveWishlistButton productId={p.id} name={p.name} />
              <ProductCard product={p} className="h-full" />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it here."
          action={
            <Button asChild className="rounded-xl">
              <Link href="/shop">Browse products</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
