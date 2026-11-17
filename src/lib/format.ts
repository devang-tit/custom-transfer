import { siteConfig } from "@/config/site";

const moneyFmt = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
});

/** Format integer cents as currency, e.g. 1299 -> "$12.99" */
export function formatMoney(cents: number | null | undefined): string {
  return moneyFmt.format((cents ?? 0) / 100);
}

/** Compact money for charts/KPIs: 1234500 -> "$12.3K" */
export function formatMoneyCompact(cents: number): string {
  return new Intl.NumberFormat(siteConfig.locale, {
    style: "currency",
    currency: siteConfig.currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(cents / 100);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat(siteConfig.locale).format(n);
}

export function formatDate(d: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(siteConfig.locale, opts ?? { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString(siteConfig.locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatInches(w: number, h: number): string {
  return `${trimNum(w)}" × ${trimNum(h)}"`;
}

function trimNum(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
