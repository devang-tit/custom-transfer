"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ExternalLink, LogOut, Menu, Search, Store, UserRound } from "lucide-react";
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
import { ADMIN_CHANNELS, ADMIN_NAV, ADMIN_SETTINGS, isActive, isOpen, type AdminNavItem, type NavCountKey } from "./nav";

type ShellUser = { name: string; email: string; role: string };
type Counts = Record<NavCountKey, number>;

/**
 * Admin frame: dark top bar with centered search, light gray sidebar, gray canvas.
 * Adds .admin-theme-root to <html> while mounted so portaled dialogs/menus share the admin theme.
 */
export function AdminShell({
  user,
  counts,
  storeName,
  fontClass,
  children,
}: {
  user: ShellUser;
  counts: Counts;
  storeName: string;
  fontClass: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // The mobile drawer remembers which page it was opened on; navigating elsewhere closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const mobileOpen = openOn === pathname;
  const setMobileOpen = (open: boolean) => setOpenOn(open ? pathname : null);

  useEffect(() => {
    const root = document.documentElement;
    const classes = ["admin-theme-root", ...fontClass.split(" ").filter(Boolean)];
    root.classList.add(...classes);
    return () => root.classList.remove(...classes);
  }, [fontClass]);

  return (
    <div className={cn("admin-theme min-h-svh bg-[var(--admin-canvas)] text-foreground", fontClass)}>
      <Topbar user={user} storeName={storeName} inbox={counts.inbox} onMenu={() => setMobileOpen(true)} />
      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-60 shrink-0 bg-[var(--admin-nav)] lg:block">
          <Sidebar counts={counts} />
        </aside>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 gap-0 border-0 bg-[var(--admin-nav)] p-0" showCloseButton={false}>
            <SheetTitle className="flex h-14 items-center gap-2 bg-[var(--admin-topbar)] px-4 text-sm font-semibold text-white">
              <LogoMark className="size-7" /> {storeName}
            </SheetTitle>
            <Sidebar counts={counts} />
          </SheetContent>
        </Sheet>
        <main className="min-w-0 flex-1 px-4 pt-5 pb-12 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

/* ------------------------------ Top bar ------------------------------ */

function Topbar({ user, storeName, inbox, onMenu }: { user: ShellUser; storeName: string; inbox: number; onMenu: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const iconBtn = "grid size-8 place-items-center rounded-lg text-[#e3e3e3] transition-colors hover:bg-white/10 hover:text-white";

  return (
    <header className="no-print sticky top-0 z-40 flex h-14 items-center gap-3 bg-[var(--admin-topbar)] px-3 sm:px-4">
      <div className="flex shrink-0 items-center gap-1 lg:w-56">
        <button type="button" className={cn(iconBtn, "lg:hidden")} onClick={onMenu} aria-label="Open navigation">
          <Menu className="size-5" />
        </button>
        <Link href="/admin" className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-white hover:bg-white/5">
          <LogoMark className="size-7" />
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">{storeName}</span>
        </Link>
      </div>

      <form
        role="search"
        className="mx-auto w-full max-w-[480px] min-w-0"
        onSubmit={(e) => {
          e.preventDefault();
          const q = inputRef.current?.value.trim();
          if (q) router.push(`/admin/search?q=${encodeURIComponent(q)}`);
        }}
      >
        <label className="relative flex items-center">
          <span className="sr-only">Search orders, customers and products</span>
          <Search className="pointer-events-none absolute left-2.5 size-4 text-[#b5b5b5]" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search"
            className="h-8 w-full rounded-lg border border-transparent bg-[var(--admin-search)] pr-16 pl-8 text-[13px] text-[#f1f1f1] transition-colors outline-none placeholder:text-[#b5b5b5] hover:bg-[var(--admin-search-hover)] focus:border-[#8a8a8a] focus:bg-[var(--admin-search-hover)]"
          />
          <span className="pointer-events-none absolute right-2 hidden items-center gap-0.5 sm:flex">
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-sans text-[11px] text-[#b5b5b5]">Ctrl</kbd>
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-sans text-[11px] text-[#b5b5b5]">K</kbd>
          </span>
        </label>
      </form>

      <div className="flex shrink-0 items-center gap-1 lg:w-56 lg:justify-end">
        <Link href="/admin/inbox" className={cn(iconBtn, "relative")} aria-label={inbox ? `Inbox, ${inbox} new` : "Inbox"}>
          <Bell className="size-[18px]" />
          {inbox > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#ff6b6b] ring-2 ring-[var(--admin-topbar)]" />}
        </Link>
        <ThemeToggle className="size-8 rounded-lg text-[#e3e3e3] hover:bg-white/10 hover:text-white" />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg py-1 pr-2 pl-1 text-[13px] font-medium text-[#e3e3e3] outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#4b9bff]">
            <span className="grid size-7 place-items-center rounded-md bg-[#9be7c4] text-[11px] font-bold text-[#0c5132]">{initials(user.name)}</span>
            <span className="hidden max-w-32 truncate md:inline">{user.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email} · {user.role === "ADMIN" ? "Administrator" : "Staff"}
              </p>
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
      </div>
    </header>
  );
}

/* ------------------------------ Sidebar ------------------------------ */

function Sidebar({ counts }: { counts: Counts }) {
  return (
    <nav aria-label="Admin" className="no-scrollbar flex h-full flex-col overflow-y-auto px-3 py-3">
      <ul className="space-y-px">
        {ADMIN_NAV.map((item) => (
          <NavItem key={item.href} item={item} counts={counts} />
        ))}
      </ul>
      <p className="mt-5 mb-1 px-2 text-xs font-semibold text-[var(--admin-nav-icon)]">Sales channels</p>
      <ul className="space-y-px">
        {ADMIN_CHANNELS.map((item) => (
          <NavItem key={item.href} item={item} counts={counts} />
        ))}
      </ul>
      <ul className="mt-auto space-y-px pt-4">
        <NavItem item={ADMIN_SETTINGS} counts={counts} />
      </ul>
    </nav>
  );
}

function CountPill({ value, strong }: { value: number; strong?: boolean }) {
  if (!value) return null;
  return (
    <span
      className={cn(
        "ml-auto min-w-5 rounded-md px-1.5 text-center text-[11px] leading-[18px] font-semibold tabular-nums",
        strong ? "bg-[var(--admin-nav-text)] text-[var(--admin-nav)]" : "bg-black/[0.07] text-[var(--admin-nav-text)] dark:bg-white/10"
      )}
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}

function NavItem({ item, counts }: { item: AdminNavItem; counts: Counts }) {
  const pathname = usePathname();
  const selfActive = !item.external && isActive(pathname, item.href, item.exact);
  const open = !item.external && isOpen(pathname, item);
  const base =
    "flex h-7 items-center gap-2 rounded-lg px-2 text-[13px] text-[var(--admin-nav-text)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";
  return (
    <li>
      <Link
        href={item.href}
        target={item.external ? "_blank" : undefined}
        aria-current={selfActive ? "page" : undefined}
        className={cn(
          base,
          selfActive ? "bg-[var(--admin-nav-active)] font-semibold shadow-[0_1px_0_rgba(0,0,0,0.05)]" : "font-[550] hover:bg-[var(--admin-nav-hover)]",
          open && !selfActive && "font-semibold"
        )}
      >
        <item.icon className={cn("size-4 shrink-0", selfActive || open ? "text-[var(--admin-nav-text)]" : "text-[var(--admin-nav-icon)]")} />
        <span className="truncate">{item.title}</span>
        {item.external ? (
          <ExternalLink className="ml-auto size-3.5 text-[var(--admin-nav-icon)] opacity-70" />
        ) : (
          item.countKey && <CountPill value={counts[item.countKey]} strong={selfActive} />
        )}
      </Link>
      {open && item.children && (
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
                    "pl-8",
                    active ? "bg-[var(--admin-nav-active)] font-semibold shadow-[0_1px_0_rgba(0,0,0,0.05)]" : "font-normal hover:bg-[var(--admin-nav-hover)]"
                  )}
                >
                  <span className="truncate">{child.title}</span>
                  {child.countKey && <CountPill value={counts[child.countKey]} strong={active} />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
