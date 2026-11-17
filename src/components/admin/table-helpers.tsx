import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { withParams } from "./segmented-links";

export function SortHeader({
  label,
  field,
  base,
  params,
  className,
}: {
  label: string;
  field: string;
  base: string;
  params: Record<string, string | undefined>;
  className?: string;
}) {
  const active = params.sort === field;
  const dir = active && params.dir === "asc" ? "asc" : "desc";
  const nextDir = active ? (dir === "asc" ? "desc" : "asc") : "desc";
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <Link
      href={withParams(base, params, { sort: field, dir: nextDir, page: undefined })}
      scroll={false}
      className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground", className)}
    >
      {label}
      <Icon className={cn("size-3", !active && "opacity-40")} />
    </Link>
  );
}

export function PaginationBar({
  page,
  pageSize,
  total,
  base,
  params,
}: {
  page: number;
  pageSize: number;
  total: number;
  base: string;
  params: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  const link = (p: number) => withParams(base, params, { page: p > 1 ? String(p) : undefined });
  const btn = "inline-flex h-8 items-center gap-1 rounded-lg border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted";
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row">
      <p className="tabular-nums">
        Showing <span className="font-medium text-foreground">{from}</span>–<span className="font-medium text-foreground">{to}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={link(page - 1)} className={btn} scroll={false}>
            <ChevronLeft className="size-4" /> Prev
          </Link>
        ) : (
          <span className={cn(btn, "pointer-events-none opacity-40")}>
            <ChevronLeft className="size-4" /> Prev
          </span>
        )}
        <span className="px-1 tabular-nums">
          Page {page} / {pages}
        </span>
        {page < pages ? (
          <Link href={link(page + 1)} className={btn} scroll={false}>
            Next <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span className={cn(btn, "pointer-events-none opacity-40")}>
            Next <ChevronRight className="size-4" />
          </span>
        )}
      </div>
    </div>
  );
}

/** Horizontal scroll wrapper for wide tables. */
export function TableWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("overflow-x-auto", className)}>{children}</div>;
}

/** Compact age like "3h" / "2d". Pass `now` from the server when rendering in client components so SSR and hydration agree. */
export function relativeAge(date: Date | string, now: number = Date.now()): string {
  const ms = now - new Date(date).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  return `${mo}mo`;
}
