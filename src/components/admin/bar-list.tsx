import { cn } from "@/lib/utils";

/** Ranked list with proportional bars (server component). */
export function BarList({
  items,
  format,
  className,
  color = "bg-primary/12 dark:bg-primary/20",
}: {
  items: { key: string; label: React.ReactNode; value: number; extra?: React.ReactNode }[];
  format: (v: number) => string;
  className?: string;
  color?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className={cn("space-y-1.5", className)}>
      {items.map((it) => (
        <li key={it.key} className="relative flex items-center justify-between gap-3 overflow-hidden rounded-md px-2.5 py-2 text-sm">
          <span className={cn("absolute inset-y-0 left-0 rounded-md", color)} style={{ width: `${Math.max(2, (it.value / max) * 100)}%` }} />
          <span className="relative flex min-w-0 items-center gap-2 truncate font-medium">{it.label}</span>
          <span className="relative flex shrink-0 items-center gap-2 tabular-nums">
            {it.extra}
            <span className="font-semibold">{format(it.value)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
