"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Search, X, Zap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAYMENT_LABELS: Record<string, string> = { all: "Any payment", PAID: "Paid", UNPAID: "Unpaid", REFUNDED: "Refunded", FAILED: "Failed" };

export function OrdersFilters({
  params,
  ranges,
}: {
  params: Record<string, string | undefined>;
  ranges: { key: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();

  const push = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, ...overrides, page: undefined })) if (v) next.set(k, v);
    start(() => router.push(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false }));
  };

  const hasFilters = !!(params.q || (params.payment && params.payment !== "all") || params.rush || params.range);

  return (
    <div className={cn("flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center", pending && "opacity-70")}>
      <form
        className="relative flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
          push({ q: q || undefined });
        }}
      >
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          key={params.q ?? ""}
          name="q"
          type="search"
          defaultValue={params.q ?? ""}
          aria-label="Search orders"
          placeholder="Search order #, customer, email or tracking…"
          className="h-9 w-full rounded-lg border bg-background pr-3 pl-9 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
        />
      </form>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={params.payment ?? "all"} onValueChange={(v) => push({ payment: v === "all" ? undefined : v })}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="Payment">{PAYMENT_LABELS[params.payment ?? "all"] ?? "Any payment"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any payment</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="UNPAID">Unpaid</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={params.range ?? "any"} onValueChange={(v) => push({ range: v === "any" ? undefined : v })}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="Date">{ranges.find((r) => r.key === params.range)?.label ?? "Any date"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any date</SelectItem>
            {ranges.map((r) => (
              <SelectItem key={r.key} value={r.key}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant={params.rush === "1" ? "default" : "outline"}
          className="h-9"
          aria-pressed={params.rush === "1"}
          onClick={() => push({ rush: params.rush === "1" ? undefined : "1" })}
        >
          <Zap className={cn(params.rush === "1" && "fill-current")} /> Rush only
        </Button>
        {hasFilters && (
          <Button type="button" variant="ghost" className="h-9" onClick={() => push({ q: undefined, payment: undefined, rush: undefined, range: undefined })}>
            <X /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}
