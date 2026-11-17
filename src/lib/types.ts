// Shared domain types used by storefront, studio, admin and server actions.

export const PRODUCT_TYPES = [
  "DTF_TRANSFER",
  "GANG_SHEET",
  "UV_DTF",
  "SCREEN_PRINT",
  "APPAREL",
  "SUPPLIES",
] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  DTF_TRANSFER: "DTF Transfer",
  GANG_SHEET: "Gang Sheet",
  UV_DTF: "UV DTF",
  SCREEN_PRINT: "Screen Print Transfer",
  APPAREL: "Custom Apparel",
  SUPPLIES: "Supplies",
};

/** A sized option. Prices in cents. Dimensions in inches. */
export type SizeOption = {
  id: string;
  label: string;
  width: number;
  height: number;
  price: number;
};

export type ColorOption = { name: string; hex: string };
export type ApparelSizeOption = { size: string; upcharge: number };
export type PricedOption = { id: string; label: string; price: number; description?: string };

export type ProductOptions = {
  /** Transfers, gang sheets, UV DTF, screen prints */
  sizes?: SizeOption[];
  /** Optional finish add-on (glitter, glow, puff...) priced per piece */
  finishes?: PricedOption[];
  /** Apparel only */
  colors?: ColorOption[];
  apparelSizes?: ApparelSizeOption[];
  printLocations?: PricedOption[];
  /** Whether customer must upload artwork for this product */
  requiresArtwork?: boolean;
};

/** Quantity discount tier — applies when total quantity >= minQty */
export type PriceTier = { minQty: number; discountPct: number };

/** What the customer picked for a line item. Stored as JSON on OrderItem.selection. */
export type LineSelection = {
  sizeId?: string;
  finishId?: string;
  color?: string;
  /** Apparel: quantities per garment size, e.g. { S: 2, M: 5 } */
  apparelSizes?: Record<string, number>;
  /** Apparel: chosen print location ids */
  printLocations?: string[];
  /** Total quantity (for apparel = sum of apparelSizes) */
  quantity: number;
};

/** Minimal product shape needed for pricing (parsed JSON fields). */
export type PricingProduct = {
  id: string;
  type: ProductType | string;
  basePrice: number;
  options: ProductOptions;
  tiers: PriceTier[];
};

export type AddressInput = {
  name: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
};

export type ShippingMethod = {
  id: string;
  label: string;
  description: string;
  price: number; // cents
  /** Eligible for free shipping threshold */
  freeEligible?: boolean;
};

export type NotificationSettings = {
  /** Customer: receipt when an order is paid */
  customerOrderConfirmation: boolean;
  /** Customer: email when staff move an order to one of `statusEmailFor` with "notify customer" on */
  customerStatusUpdates: boolean;
  statusEmailFor: string[];
  /** Customer: email when prepress requests artwork changes */
  customerArtworkChanges: boolean;
  /** Customer: email when staff post a customer-visible note */
  customerOrderUpdates: boolean;
  /** Store: alert for every new paid order */
  adminNewOrder: boolean;
  /** Where store alerts go; empty = supportEmail */
  adminEmail: string;
};

export type StoreSettings = {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  taxRate: number; // percent, e.g. 8.25
  freeShippingThreshold: number; // cents
  rushFeePct: number; // percent of subtotal
  shippingMethods: ShippingMethod[];
  announcement: string;
  announcementEnabled: boolean;
  orderPrefix: string;
  notifications: NotificationSettings;
};

export type CouponLike = {
  code: string;
  type: "PERCENT" | "FIXED" | "FREE_SHIPPING" | string;
  value: number;
  minSubtotal: number;
};

/** Editor document persisted for saved designs & gang sheets. */
export type DesignItem = {
  id: string;
  kind: "image" | "text";
  src?: string; // image url
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fill?: string;
  x: number; // inches (gang sheet) or px (apparel) — see editor
  y: number;
  width: number;
  height: number;
  rotation: number;
  /** Natural pixel dimensions of the source image, used for DPI checks */
  naturalWidth?: number;
  naturalHeight?: number;
};
