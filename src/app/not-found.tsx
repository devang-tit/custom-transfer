import Link from "next/link";
import { ArrowLeft, Layers, Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-ink-gradient opacity-20 blur-3xl" />
      <header className="container-page relative flex items-center justify-between py-5">
        <Logo />
        <Link href="/shop" className="text-sm text-muted-foreground hover:text-foreground">
          Shop
        </Link>
      </header>
      <main className="container-page relative flex flex-1 flex-col items-center justify-center py-16 text-center">
        <p className="font-heading text-[7rem] leading-none font-extrabold tracking-tighter text-ink-gradient sm:text-[10rem]">404</p>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">This page didn&apos;t make it off the press</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          The link may be broken or the page may have moved. Try searching the catalog or jump back to something good.
        </p>
        <form action="/shop" className="relative mt-8 w-full max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            placeholder="Search transfers, gang sheets, apparel…"
            aria-label="Search products"
            className="h-12 w-full rounded-2xl border bg-background pr-28 pl-11 text-[15px] shadow-premium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button type="submit" className="absolute top-1.5 right-1.5 h-9 rounded-xl px-4">
            Search
          </Button>
        </form>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline" className="h-10 rounded-xl px-4">
            <Link href="/">
              <ArrowLeft data-icon="inline-start" /> Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-10 rounded-xl px-4">
            <Link href="/shop">
              <ShoppingBag data-icon="inline-start" /> Shop all
            </Link>
          </Button>
          <Button asChild className="h-10 rounded-xl px-4">
            <Link href="/gang-sheet-builder">
              <Layers data-icon="inline-start" /> Gang sheet builder
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
