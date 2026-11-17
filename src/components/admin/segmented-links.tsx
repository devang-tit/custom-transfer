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
    <div className={cn("no-scrollbar inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border bg-muted/60 p-0.5", className)}>
      {items.map((it) => {
        const on = it.key === active;
        return (
          <Link
            key={it.key}
            href={it.href}
            scroll={false}
            aria-current={on ? "page" : undefined}
            className={cn(
              "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              on ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {it.label}
            {typeof it.count === "number" && (
              <span className={cn("rounded px-1 text-[11px] tabular-nums", on ? "bg-muted text-foreground" : "text-muted-foreground/80")}>{it.count}</span>
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
