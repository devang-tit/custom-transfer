import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBand({
  title = "Ready to press something amazing?",
  description = "Upload your art or build a gang sheet in minutes. Orders placed before 2pm CT ship the same day.",
  primary = { href: "/gang-sheet-builder", label: "Build a gang sheet" },
  secondary = { href: "/shop", label: "Shop transfers" },
}: {
  title?: string;
  description?: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="container-page py-16 sm:py-20">
      <div className="relative overflow-hidden rounded-3xl bg-ink-key px-6 py-12 text-white sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute -top-24 -left-20 size-80 rounded-full bg-ink-cyan/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-24 size-80 rounded-full bg-ink-magenta/40 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-10" />
        <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
            <p className="mt-3 text-white/70">{description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="h-12 rounded-xl bg-white px-6 text-[15px] text-ink-key hover:bg-white/90">
              <Link href={primary.href}>
                <Layers data-icon="inline-start" /> {primary.label}
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-xl border-white/25 bg-white/5 px-6 text-[15px] text-white hover:bg-white/10 hover:text-white dark:border-white/25 dark:bg-white/5">
              <Link href={secondary.href}>
                {secondary.label} <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
