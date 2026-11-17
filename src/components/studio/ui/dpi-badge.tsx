import { cn } from "@/lib/utils";
import { dpiLevel } from "@/components/studio/lib/geometry";

const STYLES = {
  vector: "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  great: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  ok: "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  low: "bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:text-rose-300",
} as const;

export function DpiBadge({ dpi, className, compact }: { dpi: number | null; className?: string; compact?: boolean }) {
  const level = dpiLevel(dpi);
  const label = level === "vector" ? "Vector" : `${dpi} DPI`;
  const hint = level === "great" ? "" : level === "ok" ? " · fair" : level === "low" ? " · low" : "";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ring-1 ring-inset whitespace-nowrap",
        STYLES[level],
        className
      )}
      title={
        level === "vector"
          ? "Vector artwork prints sharp at any size"
          : level === "low"
            ? "Below 150 DPI — likely to print blurry. Reduce the size or upload a larger file."
            : level === "ok"
              ? "150–299 DPI — acceptable, 300 DPI recommended"
              : "300+ DPI — excellent"
      }
    >
      <span className={cn("size-1.5 rounded-full", level === "low" ? "bg-rose-500" : level === "ok" ? "bg-amber-500" : level === "great" ? "bg-emerald-500" : "bg-sky-500")} />
      {label}
      {!compact && hint}
    </span>
  );
}

export function DpiDot({ dpi }: { dpi: number | null }) {
  const level = dpiLevel(dpi);
  return (
    <span
      className={cn(
        "size-2 shrink-0 rounded-full",
        level === "low" ? "bg-rose-500" : level === "ok" ? "bg-amber-500" : level === "great" ? "bg-emerald-500" : "bg-sky-500"
      )}
    />
  );
}
