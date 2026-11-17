"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Layers, Shirt, Package, User, LogIn, ChevronRight, MapPin } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/config/site";
import type { NavCategory } from "./nav-types";
import type { HeaderUser } from "./account-menu";

export function MobileNav({ categories, user }: { categories: NavCategory[]; user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9 rounded-xl lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[88%] gap-0 overflow-y-auto p-0 sm:max-w-sm">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle asChild>
            <div><Logo /></div>
          </SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-5 py-5">
          <div className="grid grid-cols-2 gap-2">
            <Link href="/gang-sheet-builder" className="rounded-2xl bg-primary p-4 text-primary-foreground">
              <Layers className="mb-3 size-5" />
              <span className="block text-sm font-semibold">Gang Sheet Builder</span>
            </Link>
            <Link href="/design-studio" className="rounded-2xl bg-foreground p-4 text-background">
              <Shirt className="mb-3 size-5" />
              <span className="block text-sm font-semibold">Design Studio</span>
            </Link>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Shop</p>
            <ul className="space-y-1">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/shop?category=${c.slug}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted">
                    {c.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image} alt="" className="size-10 rounded-lg object-cover" />
                    )}
                    <span className="flex-1 text-sm font-medium">{c.name}</span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shop" className="block rounded-xl p-2 text-sm font-semibold text-primary hover:bg-muted">View all products →</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Explore</p>
            <ul className="grid grid-cols-2 gap-1 text-sm">
              {siteConfig.mainNav.filter((n) => !["/shop", "/gang-sheet-builder", "/design-studio"].includes(n.href)).map((n) => (
                <li key={n.href}><Link href={n.href} className="block rounded-lg p-2 hover:bg-muted">{n.title}</Link></li>
              ))}
              <li><Link href="/press-instructions" className="block rounded-lg p-2 hover:bg-muted">Press guide</Link></li>
              <li><Link href="/contact" className="block rounded-lg p-2 hover:bg-muted">Contact</Link></li>
              <li><Link href="/about" className="block rounded-lg p-2 hover:bg-muted">About</Link></li>
              <li><Link href="/track" className="flex items-center gap-1.5 rounded-lg p-2 hover:bg-muted"><MapPin className="size-3.5" />Track order</Link></li>
            </ul>
          </div>
          <div className="border-t pt-5">
            {user ? (
              <div className="grid gap-2">
                <Button asChild variant="outline" className="h-11 justify-start rounded-xl">
                  <Link href="/account"><User /> {user.name}</Link>
                </Button>
                <Button asChild variant="ghost" className="h-11 justify-start rounded-xl">
                  <Link href="/account/orders"><Package /> My orders</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="h-11 rounded-xl">
                  <Link href="/login"><LogIn /> Sign in</Link>
                </Button>
                <Button asChild className="h-11 rounded-xl">
                  <Link href="/register">Join free</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
