/**
 * India-specific reference data and validators (client- and server-safe).
 */

/** States & union territories with their GST state codes (first two digits of a GSTIN). */
export const INDIAN_STATES = [
  { code: "AN", gst: "35", name: "Andaman and Nicobar Islands" },
  { code: "AP", gst: "37", name: "Andhra Pradesh" },
  { code: "AR", gst: "12", name: "Arunachal Pradesh" },
  { code: "AS", gst: "18", name: "Assam" },
  { code: "BR", gst: "10", name: "Bihar" },
  { code: "CH", gst: "04", name: "Chandigarh" },
  { code: "CG", gst: "22", name: "Chhattisgarh" },
  { code: "DH", gst: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "DL", gst: "07", name: "Delhi" },
  { code: "GA", gst: "30", name: "Goa" },
  { code: "GJ", gst: "24", name: "Gujarat" },
  { code: "HR", gst: "06", name: "Haryana" },
  { code: "HP", gst: "02", name: "Himachal Pradesh" },
  { code: "JK", gst: "01", name: "Jammu and Kashmir" },
  { code: "JH", gst: "20", name: "Jharkhand" },
  { code: "KA", gst: "29", name: "Karnataka" },
  { code: "KL", gst: "32", name: "Kerala" },
  { code: "LA", gst: "38", name: "Ladakh" },
  { code: "LD", gst: "31", name: "Lakshadweep" },
  { code: "MP", gst: "23", name: "Madhya Pradesh" },
  { code: "MH", gst: "27", name: "Maharashtra" },
  { code: "MN", gst: "14", name: "Manipur" },
  { code: "ML", gst: "17", name: "Meghalaya" },
  { code: "MZ", gst: "15", name: "Mizoram" },
  { code: "NL", gst: "13", name: "Nagaland" },
  { code: "OD", gst: "21", name: "Odisha" },
  { code: "PY", gst: "34", name: "Puducherry" },
  { code: "PB", gst: "03", name: "Punjab" },
  { code: "RJ", gst: "08", name: "Rajasthan" },
  { code: "SK", gst: "11", name: "Sikkim" },
  { code: "TN", gst: "33", name: "Tamil Nadu" },
  { code: "TS", gst: "36", name: "Telangana" },
  { code: "TR", gst: "16", name: "Tripura" },
  { code: "UP", gst: "09", name: "Uttar Pradesh" },
  { code: "UK", gst: "05", name: "Uttarakhand" },
  { code: "WB", gst: "19", name: "West Bengal" },
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

/** Finds a state by its code ("GJ"), GST code ("24") or name ("Gujarat", case-insensitive). */
export function findState(value: string | null | undefined): IndianState | undefined {
  const v = (value ?? "").trim().toLowerCase();
  if (!v) return undefined;
  return INDIAN_STATES.find((s) => s.code.toLowerCase() === v || s.gst === v || s.name.toLowerCase() === v);
}

/** 6-digit PIN code, first digit 1–9. */
export const PIN_RE = /^[1-9][0-9]{5}$/;
export function isValidPin(pin: string): boolean {
  return PIN_RE.test(pin.replace(/\s/g, ""));
}

/** Indian mobile number: 10 digits starting 6–9, optional +91 / 0 prefix. Returns "+91 XXXXX XXXXX" or null. */
export function normalizeIndianMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

/** GSTIN format: 2-digit state code, PAN (10), entity number, "Z", checksum. */
export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export function isValidGstin(gstin: string): boolean {
  const g = gstin.trim().toUpperCase();
  return GSTIN_RE.test(g) && INDIAN_STATES.some((s) => s.gst === g.slice(0, 2));
}

export type GstSplit = { intraState: boolean; cgst: number; sgst: number; igst: number };

/**
 * Splits GST for an invoice: CGST + SGST (half each) when the buyer's state is the seller's
 * state, IGST otherwise. Amounts in paise; any odd paisa goes to CGST.
 */
export function splitGst(tax: number, sellerState: string | null | undefined, buyerState: string | null | undefined): GstSplit {
  const seller = findState(sellerState);
  const buyer = findState(buyerState);
  const intraState = !!seller && !!buyer && seller.code === buyer.code;
  if (!intraState) return { intraState, cgst: 0, sgst: 0, igst: tax };
  const sgst = Math.floor(tax / 2);
  return { intraState, cgst: tax - sgst, sgst, igst: 0 };
}

/** Couriers offered in Admin → order → Shipping. */
export const COURIERS = ["Delhivery", "Blue Dart", "DTDC", "Shiprocket", "India Post", "Ekart", "Xpressbees"] as const;
