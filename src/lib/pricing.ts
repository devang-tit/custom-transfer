/**
 * Pricing engine shared by client (live price previews) and server (authoritative
 * recalculation at checkout). Pure functions only — no DB, no React.
 * All amounts are integer paise (₹1 = 100).
 */
import { formatMoney } from "@/lib/format";
import type {
  CouponLike,
  LineSelection,
  PriceTier,
  PricingProduct,
  ShippingMethod,
  StoreSettings,
} from "@/lib/types";

export const DEFAULT_TIERS: PriceTier[] = [
  { minQty: 1, discountPct: 0 },
  { minQty: 10, discountPct: 10 },
  { minQty: 25, discountPct: 20 },
  { minQty: 50, discountPct: 30 },
  { minQty: 100, discountPct: 40 },
];

export function tierDiscountPct(tiers: PriceTier[], qty: number): number {
  const list = tiers.length ? tiers : DEFAULT_TIERS;
  let pct = 0;
  for (const t of [...list].sort((a, b) => a.minQty - b.minQty)) {
    if (qty >= t.minQty) pct = t.discountPct;
  }
  return pct;
}

/** Next tier the customer could unlock (for "Add 5 more to save 20%" nudges). */
export function nextTier(tiers: PriceTier[], qty: number): PriceTier | null {
  const list = (tiers.length ? tiers : DEFAULT_TIERS).slice().sort((a, b) => a.minQty - b.minQty);
  return list.find((t) => t.minQty > qty) ?? null;
}

export type LinePrice = {
  /** Effective per-unit price after tier discount (rounded) */
  unitPrice: number;
  /** Per-unit price before tier discount */
  baseUnitPrice: number;
  discountPct: number;
  quantity: number;
  total: number;
  /** Human label for the chosen variant */
  variantLabel: string;
};

export function priceLine(product: PricingProduct, sel: LineSelection): LinePrice {
  const opts = product.options ?? {};
  const isApparel = product.type === "APPAREL";

  if (isApparel) {
    const sizeQty = sel.apparelSizes ?? {};
    const quantity = Object.values(sizeQty).reduce((a, b) => a + (b > 0 ? b : 0), 0) || sel.quantity || 0;
    const locations = (opts.printLocations ?? []).filter((l) => sel.printLocations?.includes(l.id));
    const printCost = locations.reduce((s, l) => s + l.price, 0);
    const baseUnit = product.basePrice + printCost;
    const discountPct = tierDiscountPct(product.tiers, quantity);
    // Size upcharges are added per garment, then tier discount applied to the whole line.
    let gross = 0;
    const entries = Object.entries(sizeQty).filter(([, q]) => q > 0);
    if (entries.length) {
      for (const [size, q] of entries) {
        const up = opts.apparelSizes?.find((s) => s.size === size)?.upcharge ?? 0;
        gross += (baseUnit + up) * q;
      }
    } else {
      gross = baseUnit * quantity;
    }
    const total = Math.round(gross * (1 - discountPct / 100));
    const unitPrice = quantity ? Math.round(total / quantity) : 0;
    const colorLabel = sel.color ? `${sel.color}` : "";
    const locLabel = locations.map((l) => l.label).join(" + ");
    return {
      unitPrice,
      baseUnitPrice: baseUnit,
      discountPct,
      quantity,
      total,
      variantLabel: [colorLabel, locLabel].filter(Boolean).join(" · ") || "Custom apparel",
    };
  }

  const size = opts.sizes?.find((s) => s.id === sel.sizeId) ?? opts.sizes?.[0];
  const finish = opts.finishes?.find((f) => f.id === sel.finishId);
  const baseUnit = (size?.price ?? product.basePrice) + (finish?.price ?? 0);
  const quantity = Math.max(0, Math.floor(sel.quantity || 0));
  const discountPct = tierDiscountPct(product.tiers, quantity);
  const unitPrice = Math.round(baseUnit * (1 - discountPct / 100));
  return {
    unitPrice,
    baseUnitPrice: baseUnit,
    discountPct,
    quantity,
    total: unitPrice * quantity,
    variantLabel: [size?.label, finish && finish.id !== "standard" ? finish.label : null].filter(Boolean).join(" · "),
  };
}

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "InkForge",
  supportEmail: "hello@inkforge.example",
  supportPhone: "+91 98765 43210",
  taxRate: 18,
  freeShippingThreshold: 99900, // ₹999
  rushFeePct: 25,
  orderPrefix: "IF",
  announcement: "Free shipping on orders above ₹999 · Same-day dispatch on orders placed before 2 pm IST",
  announcementEnabled: true,
  shippingMethods: [
    { id: "standard", label: "Standard delivery", description: "3–6 working days across India", price: 7900, freeEligible: true },
    { id: "express", label: "Express delivery", description: "1–3 working days to metro cities", price: 14900 },
    { id: "pickup", label: "Studio pickup", description: "Ahmedabad studio · ready the same day", price: 0 },
  ],
  notifications: {
    customerOrderConfirmation: true,
    customerStatusUpdates: true,
    statusEmailFor: ["IN_PRODUCTION", "READY", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"],
    customerArtworkChanges: true,
    customerOrderUpdates: true,
    adminNewOrder: true,
    adminEmail: "",
  },
  pricesIncludeTax: true,
  legalName: "InkForge Prints",
  gstin: "",
  storeState: "GJ",
  chargesGstRate: 18,
  codEnabled: true,
  codFee: 4900, // ₹49
  codMaxOrder: 1000000, // ₹10,000
};

export type CartTotals = {
  subtotal: number;
  discount: number;
  shipping: number;
  rushFee: number;
  /** Cash-on-delivery handling fee (0 unless paying by COD) */
  codFee: number;
  /** GST amount. When `taxIncluded`, it is already inside `total` (shown as "incl. GST"). */
  tax: number;
  taxIncluded: boolean;
  total: number;
  freeShippingApplied: boolean;
  /** Paise remaining until free shipping (0 if reached) */
  freeShippingRemaining: number;
  couponError?: string;
};

export function couponDiscount(coupon: CouponLike | null | undefined, subtotal: number): { discount: number; freeShipping: boolean; error?: string } {
  if (!coupon) return { discount: 0, freeShipping: false };
  if (subtotal < coupon.minSubtotal) {
    return { discount: 0, freeShipping: false, error: `Minimum order of ${formatMoney(coupon.minSubtotal)} required` };
  }
  if (coupon.type === "PERCENT") return { discount: Math.round((subtotal * Math.min(coupon.value, 100)) / 100), freeShipping: false };
  if (coupon.type === "FIXED") return { discount: Math.min(coupon.value, subtotal), freeShipping: false };
  if (coupon.type === "FREE_SHIPPING") return { discount: 0, freeShipping: true };
  return { discount: 0, freeShipping: false };
}

/** GST contained in a GST-inclusive amount: amount − amount / (1 + rate). */
export function includedGst(amount: number, ratePct: number): number {
  if (amount <= 0 || ratePct <= 0) return 0;
  return amount - amount / (1 + ratePct / 100);
}

/** One cart line for GST purposes: its (inclusive) amount and GST rate. */
export type TaxLine = { amount: number; gstRate?: number | null };

/**
 * Cart/order totals. Amounts are integer paise.
 * - pricesIncludeTax (India B2C): line prices and charges already include GST. Tax is the GST
 *   contained in them (per-line rates; discount spread proportionally) and is NOT added again.
 * - Otherwise GST/tax is added on top at the default rate.
 * Pass `lines` with per-line GST rates for an exact figure; without them the default rate is used.
 */
export function computeTotals(input: {
  subtotal: number;
  settings: StoreSettings;
  shippingMethodId?: string;
  coupon?: CouponLike | null;
  rush?: boolean;
  cod?: boolean;
  lines?: TaxLine[];
}): CartTotals {
  const { subtotal, settings } = input;
  const method: ShippingMethod | undefined =
    settings.shippingMethods.find((m) => m.id === input.shippingMethodId) ?? settings.shippingMethods[0];
  const c = couponDiscount(input.coupon, subtotal);
  const discounted = Math.max(0, subtotal - c.discount);
  const freeByThreshold = !!method?.freeEligible && discounted >= settings.freeShippingThreshold;
  const freeShippingApplied = (c.freeShipping && !!method?.freeEligible) || freeByThreshold;
  const shipping = subtotal === 0 ? 0 : freeShippingApplied ? 0 : (method?.price ?? 0);
  const rushFee = input.rush ? Math.round((discounted * settings.rushFeePct) / 100) : 0;
  const codFee = input.cod && subtotal > 0 ? settings.codFee : 0;
  const charges = shipping + rushFee + codFee;
  const defaultRate = settings.taxRate;

  let tax: number;
  let total: number;
  if (settings.pricesIncludeTax) {
    const lines = input.lines?.length ? input.lines : [{ amount: subtotal, gstRate: defaultRate }];
    const lineSum = lines.reduce((s, l) => s + l.amount, 0) || 1;
    const goodsGst = lines.reduce((s, l) => {
      const net = l.amount - (c.discount * l.amount) / lineSum;
      return s + includedGst(net, l.gstRate ?? defaultRate);
    }, 0);
    tax = Math.round(goodsGst + includedGst(charges, settings.chargesGstRate));
    total = discounted + charges;
  } else {
    tax = Math.round(((discounted + rushFee + codFee) * defaultRate) / 100 + (shipping * settings.chargesGstRate) / 100);
    total = discounted + charges + tax;
  }
  return {
    subtotal,
    discount: c.discount,
    shipping,
    rushFee,
    codFee,
    tax,
    taxIncluded: settings.pricesIncludeTax,
    total,
    freeShippingApplied,
    freeShippingRemaining: Math.max(0, settings.freeShippingThreshold - discounted),
    couponError: c.error,
  };
}

/** Gang sheet helpers — standard roll width is 22". */
export const GANG_SHEET_WIDTH = 22;
/** Minimum recommended print resolution */
export const MIN_DPI = 150;
export const IDEAL_DPI = 300;

export function effectiveDpi(naturalPx: number, printInches: number): number {
  if (!printInches) return 0;
  return Math.round(naturalPx / printInches);
}
