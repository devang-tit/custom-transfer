import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sparkline({ data, className, color = "var(--chart-1)" }: { data: number[]; className?: string; color?: string }) {
  if (data.length < 2) return null;
  const w = 120;
  const h = 36;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 2 - ((v - min) / (max - min || 1)) * (h - 4)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const id = `spark-${Math.abs(data.reduce((a, b) => a * 31 + Math.round(b), 7)) % 100000}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn("h-9 w-28", className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Delta({ value, className, invert = false }: { value: number | null; className?: string; invert?: boolean }) {
  if (value === null) return <span className={cn("text-xs font-medium text-muted-foreground", className)}>New</span>;
  const up = value >= 0;
  const good = invert ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums",
        good ? "text-[#0c7a43] dark:text-emerald-400" : "text-[#c70a24] dark:text-rose-400",
        className
      )}
    >
      <Icon className="size-3" />
      {Math.abs(value).toFixed(Math.abs(value) < 10 ? 1 : 0)}%
    </span>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  series,
  hint,
  color,
}: {
  label: string;
  value: React.ReactNode;
  delta?: number | null;
  icon: LucideIcon;
  series?: number[];
  hint?: string;
  color?: string;
}) {
  return (
    <div data-admin-card className="relative overflow-hidden rounded-xl bg-card p-4">
      <p className="flex items-center justify-between gap-2 text-[13px] font-medium">
        <span className="border-b border-dashed border-muted-foreground/50 pb-px">{label}</span>
        <Icon className="size-3.5 text-muted-foreground/70" aria-hidden />
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xl leading-7 font-semibold tracking-[-0.02em] tabular-nums">{value}</p>
          <div className="mt-1 flex items-center gap-2">
            {delta !== undefined && <Delta value={delta} />}
            {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
          </div>
        </div>
        {series && series.length > 1 && <Sparkline data={series} color={color} />}
      </div>
    </div>
  );
}
