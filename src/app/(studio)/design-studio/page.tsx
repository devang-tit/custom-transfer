import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProducts } from "@/lib/catalog";
import { DesignStudioLoader } from "@/components/studio/apparel/loader";
import type { ApparelDesignData } from "@/components/studio/apparel/types";
import { loadDesign } from "../load-design";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Design Studio",
  description: "Design custom tees, hoodies and crewnecks online. Add your logo or text, preview front and back, and order with no minimums.",
};

export default async function DesignStudioPage(props: PageProps<"/design-studio">) {
  const sp = await props.searchParams;
  const param = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const user = await getCurrentUser();
  const design = await loadDesign<ApparelDesignData>(param("design"), "APPAREL", user);
  const products = await getProducts({ where: { type: "APPAREL" }, orderBy: { sortOrder: "asc" } });
  if (!products.length) notFound();

  const slug = design?.data.productSlug ?? param("product") ?? products[0]!.slug;
  const product = products.find((p) => p.slug === slug) ?? products[0]!;

  return (
    <DesignStudioLoader
      key={design?.id ?? "new"}
      products={products}
      initialProductSlug={product.slug}
      initialColor={design?.data.color ?? param("color") ?? null}
      design={design ? { ...design, data: { ...design.data, sides: { front: design.data.sides?.front ?? [], back: design.data.sides?.back ?? [] } } } : null}
      signedIn={!!user}
    />
  );
}
