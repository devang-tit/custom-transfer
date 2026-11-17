import { redirect } from "next/navigation";

export default async function CategoryAlias(props: PageProps<"/shop/[category]">) {
  const { category } = await props.params;
  redirect(`/shop?category=${encodeURIComponent(category)}`);
}
