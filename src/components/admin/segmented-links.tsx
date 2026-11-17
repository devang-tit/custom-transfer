import Link from "next/link";
import { cn } from "@/lib/utils";

/** Server-rendered segmented control that navigates via query params. */
export function SegmentedLinks({
  items,
  active,
  className,
}: {
  items: { key: string; label: React.ReactNode; href: string; count?: number }[];
  active: string;
  className?: string;
}) {
  return (
    <div className={cn("no-scrollbar inline-flex max-w-full items-center gap-1 overflow-x-auto", className)}>
      {items.map((it) => {
        const on = it.key === active;
        return (
          <Link
            key={it.key}
            href={it.href}
            scroll={false}
            aria-current={on ? "page" : undefined}
            className={cn(
              "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-[550] whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              on ? "bg-black/[0.08] text-foreground dark:bg-white/[0.12]" : "text-muted-foreground hover:bg-black/[0.05] hover:text-foreground dark:hover:bg-white/[0.06]"
            )}
          >
            {it.label}
            {typeof it.count === "number" && (
              <span className={cn("text-xs tabular-nums", on ? "text-foreground/70" : "text-muted-foreground/80")}>{it.count}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

/** Build a URL from current params with overrides (undefined/'' removes a key). */
export function withParams(
  base: string,
  current: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>
): string {
  const params = new URLSearchParams();
  const merged = { ...current, ...overrides };
  for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "") params.set(k, v);
  const s = params.toString();
  return s ? `${base}?${s}` : base;
}
