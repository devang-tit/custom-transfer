"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ArrowLeft, HelpCircle, LayoutGrid, Shirt, ShoppingBag, UserRound } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCart, cartCount } from "@/stores/cart";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/studio/ui/kbd";

const TOOLS = [
  { href: "/gang-sheet-builder", label: "Gang Sheet Builder", short: "Gang Sheet", icon: LayoutGrid },
  { href: "/design-studio", label: "Design Studio", short: "Apparel", icon: Shirt },
];

const SHORTCUTS: [string[], string][] = [
  [["Del"], "Delete selection"],
  [["⌘/Ctrl", "D"], "Duplicate"],
  [["⌘/Ctrl", "Z"], "Undo"],
  [["⌘/Ctrl", "⇧", "Z"], "Redo"],
  [["↑", "↓", "←", "→"], "Nudge (hold ⇧ for more)"],
  [["+", "−"], "Zoom in / out"],
  [["0"], "Zoom to fit"],
  [["⇧", "Click"], "Add to selection"],
  [["Esc"], "Clear selection"],
];

const emptySubscribe = () => () => {};

export function StudioTopbar({ user }: { user: { name: string; role: string } | null }) {
  const pathname = usePathname();
  const items = useCart((s) => s.items);
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const count = hydrated ? cartCount(items) : 0;

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-2 backdrop-blur sm:gap-3 sm:px-4">
      <Logo className="shrink-0" textClassName="hidden text-lg md:inline" />
      <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
      <nav className="flex items-center gap-1 rounded-xl bg-muted p-1" aria-label="Studio tools">
        {TOOLS.map((t) => {
          const active = pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-all",
                active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="size-4" />
              <span className="hidden lg:inline">{t.label}</span>
              <span className="lg:hidden">{t.short}</span>
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-1">
        <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
          <Link href="/shop">
            <ArrowLeft />
            Back to shop
          </Link>
        </Button>
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Help & shortcuts">
                  <HelpCircle className="size-[1.1rem]" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Help & shortcuts</TooltipContent>
          </Tooltip>
          <PopoverContent align="end" className="w-80">
            <p className="font-heading text-sm font-semibold">Keyboard shortcuts</p>
            <ul className="mt-3 space-y-2">
              {SHORTCUTS.map(([keys, label]) => (
                <li key={label} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="flex gap-1">
                    {keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Print tip:</strong> upload transparent PNGs at 300 DPI at the size you
              want printed. We flag anything under 150 DPI in red.
            </div>
            <Link href="/faq" className="mt-3 inline-block text-xs font-medium text-primary hover:underline">
              Read the full FAQ →
            </Link>
          </PopoverContent>
        </Popover>
        <ThemeToggle className="hidden sm:inline-flex" />
        <Button asChild variant="ghost" size="icon" aria-label={user ? "Your account" : "Sign in"} className="hidden sm:inline-flex">
          <Link href={user ? "/account" : `/login?next=${encodeURIComponent(pathname)}`}>
            <UserRound className="size-[1.1rem]" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="relative gap-1.5">
          <Link href="/cart" aria-label={`Cart, ${count} items`}>
            <ShoppingBag />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </Button>
      </div>
    </header>
  );
}
