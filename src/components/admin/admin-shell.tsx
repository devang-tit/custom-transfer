"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, LogOut, Menu, Search, ChevronRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { logoutAction } from "@/lib/actions/auth";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, titleForPath, type NavCountKey } from "./nav";

type ShellUser = { name: string; email: string; role: string };

export function AdminShell({
  user,
  counts,
  children,
}: {
  user: ShellUser;
  counts: Record<NavCountKey, number>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // The mobile drawer remembers which page it was opened on; navigating elsewhere closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const mobileOpen = openOn === pathname;
  const setMobileOpen = (open: boolean) => setOpenOn(open ? pathname : null);

  return (
    <div className="flex min-h-svh bg-muted/40 dark:bg-background">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:block">
        <SidebarContent user={user} counts={counts} />
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground" showCloseButton={false}>
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <SidebarContent user={user} counts={counts} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({ user, counts }: { user: ShellUser; counts: Record<NavCountKey, number> }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-5">
        <Logo href="/admin" textClassName="text-white text-lg" />
        <span className="ml-auto rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-white/70 uppercase">
          Admin
        </span>
      </div>
      <nav className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-3" aria-label="Admin">
        {ADMIN_NAV.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-sidebar-foreground/45 uppercase">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
                const count = item.countKey ? counts[item.countKey] : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-sidebar-primary" />}
                      <item.icon className={cn("size-4", active ? "text-sidebar-primary" : "text-sidebar-foreground/55 group-hover:text-sidebar-foreground")} />
                      <span className="flex-1">{item.title}</span>
                      {count > 0 && (
                        <span
                          className={cn(
                            "min-w-5 rounded-full px-1.5 py-px text-center text-[11px] font-semibold tabular-nums",
                            active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-white/10 text-white/80"
                          )}
                        >
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="space-y-2 border-t border-sidebar-border p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <ExternalLink className="size-4 text-sidebar-foreground/55" />
          View store
        </Link>
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
          <Avatar size="sm" className="ring-1 ring-white/10">
            <AvatarFallback className="bg-sidebar-primary text-xs font-semibold text-white">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/55">{user.role === "ADMIN" ? "Administrator" : "Staff"}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="grid size-8 place-items-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { section, title } = titleForPath(pathname);
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

  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open navigation">
        <Menu className="size-5" />
      </Button>
      <div className="hidden min-w-0 items-center gap-1.5 text-sm sm:flex">
        <span className="text-muted-foreground">{section}</span>
        <ChevronRight className="size-3.5 text-muted-foreground/60" />
        <span className="truncate font-medium">{title}</span>
      </div>
      <form
        className="ml-auto w-full max-w-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const q = inputRef.current?.value.trim();
          if (q) router.push(`/admin/search?q=${encodeURIComponent(q)}`);
        }}
        role="search"
      >
        <label className="relative flex items-center">
          <span className="sr-only">Search orders, customers, products</span>
          <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search orders, customers, products…"
            className="h-9 w-full rounded-lg border bg-muted/50 pr-14 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:ring-3 focus:ring-ring/20"
          />
          <kbd className="pointer-events-none absolute right-2.5 hidden rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
            Ctrl K
          </kbd>
        </label>
      </form>
      <ThemeToggle />
    </header>
  );
}
