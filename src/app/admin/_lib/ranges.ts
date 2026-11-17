export type RangeKey = "7d" | "30d" | "90d" | "12m";

export const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
  { key: "12m", label: "12 months", days: 365 },
];

export function parseRange(v: string | string[] | undefined, fallback: RangeKey = "30d"): RangeKey {
  const s = Array.isArray(v) ? v[0] : v;
  return (RANGES.find((r) => r.key === s)?.key ?? fallback) as RangeKey;
}

export function rangeDays(key: RangeKey) {
  return RANGES.find((r) => r.key === key)!.days;
}

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function pctDelta(cur: number, prev: number): number | null {
  if (!prev) return cur ? null : 0;
  return ((cur - prev) / prev) * 100;
}

/** Normalize a searchParams value to a single string. */
export function sp(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
