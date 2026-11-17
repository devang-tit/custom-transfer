import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { BrandPanel } from "@/components/auth/brand-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/config/site";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="relative flex flex-col">
        <header className="flex items-center justify-between px-5 py-5 sm:px-10">
          <Logo />
          <div className="flex items-center gap-1">
            <Link href="/shop" className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              Back to store
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-5 py-8 sm:px-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </main>
        <footer className="px-5 py-6 text-center text-xs text-muted-foreground sm:px-10">
          © {new Date().getFullYear()} {siteConfig.name} ·{" "}
          <Link href="/terms" className="hover:text-foreground">Terms</Link> ·{" "}
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
        </footer>
      </div>
      <BrandPanel />
    </div>
  );
}
