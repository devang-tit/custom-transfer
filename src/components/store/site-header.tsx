import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseJson } from "@/lib/json";
import type { ProductOptions } from "@/lib/types";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";
import { SearchCommand } from "./search-command";
import { AccountMenu } from "./account-menu";
import { CartButton } from "./cart-button";
import type { NavCategory, NavFeatured } from "./nav-types";

export async function SiteHeader() {
  const [user, cats, featuredRow] = await Promise.all([
    getCurrentUser(),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, slug: true, description: true, image: true } }),
    db.product.findFirst({ where: { active: true, featured: true, type: "GANG_SHEET" }, orderBy: { sortOrder: "asc" } }),
  ]);
  const categories: NavCategory[] = cats;
  let featured: NavFeatured = null;
  if (featuredRow) {
    const sizes = parseJson<ProductOptions>(featuredRow.options, {}).sizes ?? [];
    featured = {
      name: featuredRow.name,
      slug: featuredRow.slug,
      image: parseJson<string[]>(featuredRow.images, [])[0] ?? "/images/placeholder.svg",
      fromPrice: sizes.length ? Math.min(...sizes.map((s) => s.price)) : featuredRow.basePrice,
      badge: featuredRow.badge,
    };
  }
  const headerUser = user ? { name: user.name, email: user.email, role: user.role } : null;

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container-page flex h-16 items-center gap-2 lg:h-[72px] lg:gap-8">
        <MobileNav categories={categories} user={headerUser} />
        <Logo className="shrink-0" />
        <DesktopNav categories={categories} featured={featured} />
        <div className="ml-auto flex items-center gap-0.5">
          <SearchCommand />
          <ThemeToggle className="size-9 rounded-full" />
          <AccountMenu user={headerUser} />
          <CartButton />
        </div>
      </div>
    </header>
  );
}
