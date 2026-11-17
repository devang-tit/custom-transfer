"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

/** Query-param search input (`q`). Resets pagination on submit. */
export function SearchBox({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("q") ?? "";
  return (
    <form
      role="search"
      className="relative w-full sm:w-72"
      onSubmit={(e) => {
        e.preventDefault();
        const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
        const next = new URLSearchParams(params.toString());
        if (q) next.set("q", q);
        else next.delete("q");
        next.delete("page");
        router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
      }}
    >
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      {/* Keyed on the URL value so back/forward navigation resets the field without syncing state in an effect. */}
      <input
        key={current}
        name="q"
        type="search"
        defaultValue={current}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-lg border bg-card pr-3 pl-9 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
      />
    </form>
  );
}
