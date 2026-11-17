import {
  LayoutDashboard,
  ChartLine,
  ShoppingBag,
  Kanban,
  Package,
  FolderTree,
  Star,
  Users,
  Inbox,
  TicketPercent,
  Settings,
  Mail,
  type LucideIcon,
} from "lucide-react";

export type NavCountKey = "orders" | "reviews" | "inbox";
export type AdminNavItem = { title: string; href: string; icon: LucideIcon; countKey?: NavCountKey; exact?: boolean };
export type AdminNavGroup = { label: string; items: AdminNavItem[] };

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
      { title: "Analytics", href: "/admin/analytics", icon: ChartLine },
    ],
  },
  {
    label: "Sales",
    items: [
      { title: "Orders", href: "/admin/orders", icon: ShoppingBag, countKey: "orders" },
      { title: "Production board", href: "/admin/production", icon: Kanban },
    ],
  },
  {
    label: "Catalog",
    items: [
      { title: "Products", href: "/admin/products", icon: Package },
      { title: "Categories", href: "/admin/categories", icon: FolderTree },
      { title: "Reviews", href: "/admin/reviews", icon: Star, countKey: "reviews" },
    ],
  },
  {
    label: "Customers",
    items: [
      { title: "Customers", href: "/admin/customers", icon: Users },
      { title: "Inbox", href: "/admin/inbox", icon: Inbox, countKey: "inbox" },
    ],
  },
  {
    label: "Marketing",
    items: [{ title: "Coupons", href: "/admin/coupons", icon: TicketPercent }],
  },
  {
    label: "System",
    items: [
      { title: "Settings", href: "/admin/settings", icon: Settings },
      { title: "Email log", href: "/admin/emails", icon: Mail },
    ],
  },
];

/** Map a pathname to a title for the top bar. */
export function titleForPath(pathname: string): { section: string; title: string } {
  for (const g of ADMIN_NAV) {
    for (const item of g.items) {
      if (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/")) {
        return { section: g.label, title: item.title };
      }
    }
  }
  if (pathname.startsWith("/admin/search")) return { section: "Overview", title: "Search" };
  return { section: "Admin", title: "Dashboard" };
}
