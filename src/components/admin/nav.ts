import { ChartColumn, House, Package, Percent, Settings, ShoppingCart, Store, UserRound, type LucideIcon } from "lucide-react";

export type NavCountKey = "orders" | "reviews" | "inbox";

export type AdminNavChild = { title: string; href: string; countKey?: NavCountKey };
export type AdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  countKey?: NavCountKey;
  exact?: boolean;
  /** Shown indented under the item while it (or a child) is active */
  children?: AdminNavChild[];
  external?: boolean;
};

/** Primary navigation, top to bottom. */
export const ADMIN_NAV: AdminNavItem[] = [
  { title: "Home", href: "/admin", icon: House, exact: true },
  {
    title: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
    countKey: "orders",
    children: [{ title: "Production board", href: "/admin/production" }],
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: Package,
    children: [
      { title: "Categories", href: "/admin/categories" },
      { title: "Reviews", href: "/admin/reviews", countKey: "reviews" },
    ],
  },
  {
    title: "Customers",
    href: "/admin/customers",
    icon: UserRound,
    children: [{ title: "Inbox", href: "/admin/inbox", countKey: "inbox" }],
  },
  { title: "Analytics", href: "/admin/analytics", icon: ChartColumn },
  { title: "Discounts", href: "/admin/coupons", icon: Percent },
];

/** "Sales channels" section */
export const ADMIN_CHANNELS: AdminNavItem[] = [{ title: "Online store", href: "/", icon: Store, external: true }];

/** Pinned to the bottom of the sidebar */
export const ADMIN_SETTINGS: AdminNavItem = {
  title: "Settings",
  href: "/admin/settings",
  icon: Settings,
  children: [{ title: "Email log", href: "/admin/emails" }],
};


export function isActive(pathname: string, href: string, exact?: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

/** An item is "open" (children visible) when it or one of its children is active. */
export function isOpen(pathname: string, item: AdminNavItem): boolean {
  return isActive(pathname, item.href, item.exact) || !!item.children?.some((c) => isActive(pathname, c.href));
}
