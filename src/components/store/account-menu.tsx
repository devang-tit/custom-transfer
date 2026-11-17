"use client";

import Link from "next/link";
import { LayoutGrid, LogOut, Package, Palette, Shield, User, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/lib/actions/auth";
import { initials } from "@/lib/format";

export type HeaderUser = { name: string; email: string; role: string } | null;

export function AccountMenu({ user }: { user: HeaderUser }) {
  if (!user) {
    return (
      <div className="hidden items-center gap-1 sm:flex">
        <Button asChild variant="ghost" className="h-9 rounded-xl px-3">
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild className="h-9 rounded-xl px-3.5">
          <Link href="/register">Create account</Link>
        </Button>
      </div>
    );
  }
  const isStaff = user.role === "ADMIN" || user.role === "STAFF";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="grid size-9 place-items-center rounded-full bg-ink-gradient p-[2px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label="Account menu"
        >
          <span className="grid size-full place-items-center rounded-full bg-background text-xs font-bold">{initials(user.name)}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/account"><LayoutGrid /> Dashboard</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/orders"><Package /> Orders</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/designs"><Palette /> Saved designs</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/wishlist"><Heart /> Wishlist</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/profile"><User /> Profile</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {isStaff && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin"><Shield /> Admin panel</Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full"><LogOut /> Sign out</button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
