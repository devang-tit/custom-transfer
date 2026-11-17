"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronsUpDown, ExternalLink, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, Store, UserRound } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/lib/actions/auth";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ADMIN_CHANNELS, ADMIN_NAV, ADMIN_NAV_COOKIE, ADMIN_SETTINGS, isActive, isOpen, type AdminNavItem, type NavCountKey } from "./nav";

type ShellUser = { name: string; email: string; role: string };
type Counts = Record<NavCountKey, number>;

/**
 * Admin frame: near-black frame holding the navigation (store menu, search, notifications,
 * links), with page content in a white rounded panel. The sidebar collapses to icons.
 * Adds .admin-theme-root to <html> while mounted so portaled dialogs/menus share the theme.
 */
export function AdminShell({
  user,
  counts,
  storeName,
  fontClass,
  initialCollapsed,
  children,
}: {
  user: ShellUser;
  counts: Counts;
  storeName: string;
  fontClass: string;
  initialCollapsed: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  // The mobile drawer remembers which page it was opened on; navigating elsewhere closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const mobileOpen = openOn === pathname;
  const setMobileOpen = (open: boolean) => setOpenOn(open ? pathname : null);
  const searchRef = useRef<HTMLInputElement>(null);

  const setCollapsedPersist = (next: boolean) => {
    setCollapsed(next);
    document.cookie = `${ADMIN_NAV_COOKIE}=${next ? "collapsed" : "open"}; path=/admin; max-age=31536000; samesite=lax`;
  };

  useEffect(() => {
    const root = document.documentElement;
    const classes = ["admin-theme-root", ...fontClass.split(" ").filter(Boolean)];
    root.classList.add(...classes);
    return () => root.classList.remove(...classes);
  }, [fontClass]);

  // Ctrl/Cmd+K focuses search (expanding the sidebar first if needed).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (collapsed) {
          setCollapsed(false);
          document.cookie = `${ADMIN_NAV_COOKIE}=open; path=/admin; max-age=31536000; samesite=lax`;
        }
        requestAnimationFrame(() => searchRef.current?.focus());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [collapsed]);

  const sidebarProps = { user, storeName, counts, searchRef };

  return (
    <div className={cn("admin-theme flex min-h-svh bg-[var(--admin-frame)] text-foreground", fontClass)}>
      <aside className={cn("sticky top-0 hidden h-svh shrink-0 transition-[width] duration-200 ease-out lg:block", collapsed ? "w-[68px]" : "w-60")}>
        <Sidebar {...sidebarProps} collapsed={collapsed} onToggle={() => setCollapsedPersist(!collapsed)} />
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 gap-0 border-0 bg-[var(--admin-frame)] p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <Sidebar {...sidebarProps} collapsed={false} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col lg:py-2 lg:pr-2">
        <header className="no-print sticky top-0 z-40 flex h-12 items-center gap-2 bg-[var(--admin-frame)] px-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="grid size-9 place-items-center rounded-full text-[var(--admin-nav-text)] hover:bg-[var(--admin-nav-hover)]"
          >
            <Menu className="size-5" />
          </button>
          <Link href="/admin" className="flex items-center gap-2 text-sm font-semibold text-[var(--admin-nav-text-active)]">
            <LogoMark className="size-6" />
            {storeName}
          </Link>
          <Link
            href="/admin/search"
            aria-label="Search"
            className="ml-auto grid size-9 place-items-center rounded-full text-[var(--admin-nav-text)] hover:bg-[var(--admin-nav-hover)]"
          >
            <Search className="size-[18px]" />
          </Link>
        </header>
        <main className="min-h-[calc(100svh-3rem)] flex-1 rounded-t-[1.25rem] bg-[var(--admin-canvas)] px-4 pt-5 pb-12 sm:px-6 lg:min-h-[calc(100svh-1rem)] lg:rounded-[1.25rem] lg:px-8 lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ------------------------------ Sidebar ------------------------------ */

function Sidebar({
  user,
  storeName,
  counts,
  searchRef,
  collapsed,
  onToggle,
}: {
  user: ShellUser;
  storeName: string;
  counts: Counts;
  searchRef: React.RefObject<HTMLInputElement | null>;
  collapsed: boolean;
  onToggle?: () => void;
}) {
  const router = useRouter();
  const navBtn =
    "grid size-8 shrink-0 place-items-center rounded-full text-[var(--admin-nav-text)] transition-colors hover:bg-[var(--admin-nav-hover)] hover:text-[var(--admin-nav-text-active)]";

  return (
    <div className="flex h-full flex-col px-3 py-3">
      {/* Store / account menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex items-center gap-2.5 rounded-xl p-1.5 text-left text-[var(--admin-nav-text-active)] outline-none hover:bg-[var(--admin-nav-hover)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
            collapsed && "justify-center"
          )}
          title={collapsed ? storeName : undefined}
        >
          <LogoMark className="size-7 shrink-0" />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{storeName}</span>
                <span className="block truncate text-[11px] text-[var(--admin-nav-text-muted)]">{user.name}</span>
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-[var(--admin-nav-icon)]" />
            </>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side={collapsed ? "right" : "bottom"} className="w-60">
          <DropdownMenuLabel className="flex items-center gap-2.5 font-normal">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#c1f5a9] text-[11px] font-semibold text-[#214b03]">{initials(user.name)}</span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-foreground">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {user.email} · {user.role === "ADMIN" ? "Admin" : "Staff"}
              </span>
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/" target="_blank">
              <Store /> View your store <ExternalLink className="ml-auto size-3.5 opacity-60" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/profile">
              <UserRound /> Your profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <form action={logoutAction}>
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full">
                <LogOut /> Log out
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Search + notifications */}
      <div className={cn("mt-3 flex items-center gap-1.5", collapsed && "flex-col")}>
        {collapsed ? (
          <button type="button" className={navBtn} onClick={onToggle} title="Search (Ctrl K)" aria-label="Search">
            <Search className="size-4" />
          </button>
        ) : (
          <form
            role="search"
            className="min-w-0 flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              const q = searchRef.current?.value.trim();
              if (q) router.push(`/admin/search?q=${encodeURIComponent(q)}`);
            }}
          >
            <label className="relative flex items-center">
              <span className="sr-only">Search orders, customers and products</span>
              <Search className="pointer-events-none absolute left-2.5 size-4 text-[var(--admin-nav-icon)]" />
              <input
                ref={searchRef}
                type="search"
                placeholder="Search"
                className="h-8 w-full rounded-full border border-transparent bg-[var(--admin-nav-field)] pr-12 pl-8 text-[13px] text-[var(--admin-nav-text-active)] transition-colors outline-none placeholder:text-[var(--admin-nav-text-muted)] hover:bg-[var(--admin-nav-field-hover)] focus:border-white/25 focus:bg-[var(--admin-nav-field-hover)]"
              />
              <kbd className="pointer-events-none absolute right-2.5 font-sans text-[11px] text-[var(--admin-nav-text-muted)]">⌃K</kbd>
            </label>
          </form>
        )}
        <Link href="/admin/inbox" className={cn(navBtn, "relative")} aria-label={counts.inbox ? `Notifications, ${counts.inbox} new` : "Notifications"} title="Notifications">
          <Bell className="size-4" />
          {counts.inbox > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#ff6b6b] ring-2 ring-[var(--admin-frame)]" />}
        </Link>
      </div>

      {/* Navigation */}
      <nav aria-label="Admin" className="no-scrollbar mt-3 flex-1 overflow-y-auto">
        <ul className="space-y-px">
          {ADMIN_NAV.map((item) => (
            <NavItem key={item.href} item={item} counts={counts} collapsed={collapsed} />
          ))}
        </ul>
        {!collapsed && <p className="mt-5 mb-1 px-2.5 text-xs font-medium text-[var(--admin-nav-text-muted)]">Sales channels</p>}
        <ul className={cn("space-y-px", collapsed && "mt-4 border-t border-white/10 pt-4")}>
          {ADMIN_CHANNELS.map((item) => (
            <NavItem key={item.href} item={item} counts={counts} collapsed={collapsed} />
          ))}
        </ul>
      </nav>

      {/* Bottom: settings, theme, collapse */}
      <div className="space-y-px pt-2">
        <ul>
          <NavItem item={ADMIN_SETTINGS} counts={counts} collapsed={collapsed} />
        </ul>
        <div className={cn("flex items-center gap-1 pt-1", collapsed ? "flex-col" : "justify-between px-1")}>
          <ThemeToggle className={cn(navBtn, "size-8 rounded-full")} />
          {onToggle && (
            <button type="button" onClick={onToggle} className={navBtn} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand" : "Collapse"}>
              {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CountPill({ value, active }: { value: number; active?: boolean }) {
  if (!value) return null;
  return (
    <span
      className={cn(
        "ml-auto min-w-5 rounded-full px-1.5 text-center text-[11px] leading-[18px] font-medium tabular-nums",
        active ? "bg-white/20 text-[var(--admin-nav-text-active)]" : "bg-white/10 text-[var(--admin-nav-text)]"
      )}
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}

function NavItem({ item, counts, collapsed }: { item: AdminNavItem; counts: Counts; collapsed: boolean }) {
  const pathname = usePathname();
  const selfActive = !item.external && isActive(pathname, item.href, item.exact);
  const open = !item.external && isOpen(pathname, item);
  const count = item.countKey ? counts[item.countKey] : 0;
  const base =
    "flex h-8 items-center gap-2.5 rounded-[0.625rem] px-2.5 text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";
  return (
    <li>
      <Link
        href={item.href}
        target={item.external ? "_blank" : undefined}
        aria-current={selfActive ? "page" : undefined}
        title={collapsed ? item.title : undefined}
        className={cn(
          base,
          collapsed && "relative justify-center px-0",
          selfActive || (open && collapsed)
            ? "bg-[var(--admin-nav-active)] text-[var(--admin-nav-text-active)]"
            : "text-[var(--admin-nav-text)] hover:bg-[var(--admin-nav-hover)] hover:text-[var(--admin-nav-text-active)]",
          open && !selfActive && "text-[var(--admin-nav-text-active)]"
        )}
      >
        <item.icon className={cn("size-4 shrink-0", selfActive || open ? "text-[var(--admin-nav-text-active)]" : "text-[var(--admin-nav-icon)]")} />
        {collapsed ? (
          count > 0 && <span className="absolute top-1 right-1.5 size-1.5 rounded-full bg-[var(--admin-nav-text-active)]" />
        ) : (
          <>
            <span className="truncate">{item.title}</span>
            {item.external ? (
              <ExternalLink className="ml-auto size-3.5 text-[var(--admin-nav-icon)]" />
            ) : (
              <CountPill value={count} active={selfActive} />
            )}
          </>
        )}
      </Link>
      {open && !collapsed && item.children && (
        <ul className="mt-px space-y-px">
          {item.children.map((child) => {
            const active = isActive(pathname, child.href);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    base,
                    "h-7 pl-[2.375rem] font-normal",
                    active
                      ? "bg-[var(--admin-nav-active)] text-[var(--admin-nav-text-active)]"
                      : "text-[var(--admin-nav-text-muted)] hover:bg-[var(--admin-nav-hover)] hover:text-[var(--admin-nav-text-active)]"
                  )}
                >
                  <span className="truncate">{child.title}</span>
                  {child.countKey && <CountPill value={counts[child.countKey]} active={active} />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
