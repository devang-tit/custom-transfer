import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProducts } from "@/lib/catalog";
import { GANG_SHEET_WIDTH } from "@/lib/pricing";
import { GangSheetLoader } from "@/components/studio/gang-sheet/loader";
import type { GangDesignData } from "@/components/studio/gang-sheet/types";
import { loadDesign } from "../load-design";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gang Sheet Builder",
  description: "Build a custom 22\" DTF gang sheet online — upload art, auto-pack designs, check print quality and order in minutes.",
};

export default async function GangSheetBuilderPage(props: PageProps<"/gang-sheet-builder">) {
  const sp = await props.searchParams;
  const param = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const user = await getCurrentUser();
  const design = await loadDesign<GangDesignData>(param("design"), "GANG_SHEET", user);

  const all = await getProducts({ where: { type: { in: ["GANG_SHEET", "UV_DTF"] } }, orderBy: { sortOrder: "asc" } });
  const builderProducts = all.filter(
    (p) => !p.slug.includes("upload") && (p.options.sizes ?? []).some((s) => s.width === GANG_SHEET_WIDTH)
  );
  const slug = design?.data.productSlug ?? param("product") ?? "dtf-gang-sheet";
  const product = builderProducts.find((p) => p.slug === slug) ?? builderProducts[0];
  if (!product) notFound();

  const sizes = (product.options.sizes ?? []).filter((s) => s.width === GANG_SHEET_WIDTH);
  const wanted = param("size");
  const initialSizeId = sizes.find((s) => s.id === wanted)?.id ?? sizes.find((s) => s.height === 60)?.id ?? sizes[0]!.id;

  return (
    <GangSheetLoader
      key={`${product.slug}:${design?.id ?? "new"}`}
      product={product}
      products={builderProducts.map((p) => ({ slug: p.slug, name: p.name, type: p.type }))}
      initialSizeId={initialSizeId}
      design={design}
      signedIn={!!user}
    />
  );
}
