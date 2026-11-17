import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { getProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/store/product-card";
import { CartView } from "@/components/store/cart/cart-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your cart" };

export default async function CartPage() {
  const [settings, crossSell] = await Promise.all([
    getSettings(),
    getProducts({ where: { OR: [{ type: "SUPPLIES" }, { featured: true }] }, orderBy: [{ type: "desc" }, { sortOrder: "asc" }], take: 4 }),
  ]);
  return (
    <>
      <CartView settings={settings} />
      {crossSell.length > 0 && (
        <section className="container-page border-t py-14">
          <h2 className="text-2xl font-bold sm:text-3xl">Complete your setup</h2>
          <p className="mt-1 text-muted-foreground">Pressing essentials and fan favorites.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {crossSell.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </>
  );
}
