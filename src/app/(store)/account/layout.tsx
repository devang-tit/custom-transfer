import Link from "next/link";
import { Layers, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountNav } from "@/components/account/account-nav";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, initials } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await requireUser("/account");
  const [orders, designs, wishlist] = await Promise.all([
    db.order.count({ where: { userId: user.id } }),
    db.savedDesign.count({ where: { userId: user.id } }),
    db.wishlistItem.count({ where: { userId: user.id } }),
  ]);
  const firstName = user.name.split(" ")[0];

  return (
    <div className="flex-1">
      <div className="relative overflow-hidden border-b bg-muted/30">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="pointer-events-none absolute -top-24 right-0 h-48 w-[40rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="container-page relative flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink-gradient font-heading text-lg font-bold text-white shadow-glow">
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold sm:text-3xl">Hi, {firstName} 👋</h1>
              <p className="truncate text-sm text-muted-foreground">
                {user.email}
                {user.company ? ` · ${user.company}` : ""} · Member since {formatDate(user.createdAt, { month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="h-10 rounded-xl px-4">
              <Link href="/design-studio">
                <Shirt data-icon="inline-start" /> Design apparel
              </Link>
            </Button>
            <Button asChild className="h-10 rounded-xl px-4">
              <Link href="/gang-sheet-builder">
                <Layers data-icon="inline-start" /> New gang sheet
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="container-page grid grid-cols-1 gap-6 py-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 lg:py-10">
        <AccountNav counts={{ "/account/orders": orders, "/account/designs": designs, "/account/wishlist": wishlist }} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
