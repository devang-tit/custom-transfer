"use client";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney, formatMoneyCompact, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const AXIS = { fontSize: 11, fill: "var(--muted-foreground)" };

type Row = Record<string, string | number>;

type TipEntry = { dataKey?: unknown; name?: unknown; value?: unknown; color?: string; payload?: unknown };
type TipProps = { active?: boolean; payload?: ReadonlyArray<TipEntry>; label?: unknown };

function ChartTooltip({
  active,
  payload,
  label,
  formatters,
}: TipProps & { formatters: Record<string, (v: number) => string> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-36 rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
      {label !== undefined && label !== null && <p className="mb-1.5 font-medium text-foreground">{String(label)}</p>}
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={String(p.dataKey)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-[3px]" style={{ background: p.color }} />
              {String(p.name ?? "")}
            </span>
            <span className="font-semibold text-foreground tabular-nums">
              {(formatters[String(p.dataKey)] ?? formatNumber)(Number(p.value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Revenue (area, left axis) + orders (bars, right axis). */
export function RevenueOrdersChart({ data, className }: { data: Row[]; className?: string }) {
  const dense = data.length > 40;
  return (
    <div className={cn("h-72 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} minTickGap={dense ? 28 : 12} />
          <YAxis
            yAxisId="rev"
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(v: number) => formatMoneyCompact(v)}
          />
          <YAxis yAxisId="ord" orientation="right" tick={AXIS} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            content={(p) => <ChartTooltip active={p.active} payload={p.payload as unknown as TipEntry[]} label={p.label} formatters={{ revenue: formatMoney, orders: formatNumber }} />}
          />
          <Bar yAxisId="ord" dataKey="orders" name="Orders" fill="var(--chart-2)" fillOpacity={0.32} radius={[3, 3, 0, 0]} maxBarSize={18} />
          <Area
            yAxisId="rev"
            dataKey="revenue"
            name="Revenue"
            type="monotone"
            stroke="var(--chart-1)"
            strokeWidth={2.25}
            fill="url(#rev-fill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  valueFormat = "number",
  className,
}: {
  data: { name: string; value: number; color: string }[];
  centerLabel: string;
  centerValue: string;
  valueFormat?: "number" | "money";
  className?: string;
}) {
  const format = valueFormat === "money" ? formatMoney : formatNumber;
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className={cn("flex flex-col items-center gap-5 sm:flex-row", className)}>
      <div className="relative size-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="100%" paddingAngle={2} stroke="none" isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={(p) => <ChartTooltip active={p.active} payload={p.payload as unknown as TipEntry[]} formatters={{ value: format }} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <p className="font-heading text-2xl font-semibold tabular-nums">{centerValue}</p>
          <p className="text-xs text-muted-foreground">{centerLabel}</p>
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: d.color }} />
              <span className="truncate text-muted-foreground">{d.name}</span>
            </span>
            <span className="shrink-0 tabular-nums">
              <span className="font-medium">{format(d.value)}</span>
              <span className="ml-1.5 text-xs text-muted-foreground">{total ? Math.round((d.value / total) * 100) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MonthlyRevenueChart({ data, className }: { data: Row[]; className?: string }) {
  return (
    <div className={cn("h-72 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => formatMoneyCompact(v)} />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            content={(p) => <ChartTooltip active={p.active} payload={p.payload as unknown as TipEntry[]} label={p.label} formatters={{ revenue: formatMoney, orders: formatNumber }} />}
          />
          <Bar dataKey="revenue" name="Revenue" fill="var(--chart-1)" radius={[5, 5, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AovTrendChart({ data, className }: { data: Row[]; className?: string }) {
  return (
    <div className={cn("h-56 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => formatMoneyCompact(v)} />
          <Tooltip content={(p) => <ChartTooltip active={p.active} payload={p.payload as unknown as TipEntry[]} label={p.label} formatters={{ aov: formatMoney }} />} />
          <Line dataKey="aov" name="Avg. order value" type="monotone" stroke="var(--chart-3)" strokeWidth={2.25} dot={{ r: 2.5, strokeWidth: 0, fill: "var(--chart-3)" }} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
