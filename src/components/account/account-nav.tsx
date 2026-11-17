"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutDashboard, LogOut, MapPin, Package, Palette, UserRound } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const items = [
  { href: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/designs", label: "Saved designs", icon: Palette },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile & security", icon: UserRound },
];

export function AccountNav({ counts }: { counts?: Partial<Record<string, number>> }) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(href + "/"));

  return (
    <nav aria-label="Account" className="lg:sticky lg:top-24 lg:self-start">
      {/* Mobile: horizontal pills */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar lg:hidden">
        {items.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
              isActive(href, exact) ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
        <form action={logoutAction} className="shrink-0">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </form>
      </div>

      {/* Desktop: vertical list */}
      <div className="hidden rounded-2xl border bg-card p-2 lg:block">
        <ul className="grid gap-0.5">
          {items.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            const count = counts?.[href];
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4.5" />
                  <span className="flex-1">{label}</span>
                  {count ? (
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] tabular-nums", active ? "bg-primary/15" : "bg-muted")}>{count}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="my-2 h-px bg-border" />
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-4.5" />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
