export type ShopParams = {
  category?: string;
  type?: string; // comma separated ProductType list
  sort?: string;
  q?: string;
  price?: string; // preset id
};

export const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "rating", label: "Top rated" },
] as const;

export const PRICE_PRESETS = [
  { id: "under-5", label: "Under $5", min: 0, max: 499 },
  { id: "5-20", label: "$5 – $20", min: 500, max: 1999 },
  { id: "20-50", label: "$20 – $50", min: 2000, max: 4999 },
  { id: "50-plus", label: "$50 & up", min: 5000, max: Infinity },
] as const;

/** Build a /shop URL with a patch applied (undefined/"" removes a key). */
export function shopHref(current: ShopParams, patch: Partial<ShopParams>): string {
  const next = { ...current, ...patch };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) sp.set(k, String(v));
  const qs = sp.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

export function toggleInList(list: string | undefined, value: string): string | undefined {
  const set = new Set((list ?? "").split(",").filter(Boolean));
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return set.size ? [...set].join(",") : undefined;
}
