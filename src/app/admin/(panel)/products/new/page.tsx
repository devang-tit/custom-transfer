import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "../product-form";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader back={{ href: "/admin/products", label: "Products" }} title="New product" description="Set up pricing, variants and media. You can hide it until it's ready." />
      <ProductForm categories={categories} />
    </div>
  );
}
