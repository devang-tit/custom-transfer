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
  { id: "under-100", label: "Under ₹100", min: 0, max: 9999 },
  { id: "100-500", label: "₹100 – ₹500", min: 10000, max: 49999 },
  { id: "500-1000", label: "₹500 – ₹1,000", min: 50000, max: 99999 },
  { id: "1000-plus", label: "₹1,000 & up", min: 100000, max: Infinity },
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
