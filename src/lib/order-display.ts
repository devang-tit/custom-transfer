import { splitGst } from "@/lib/india";

/** Human label for Order.paymentMethod. */
export function paymentMethodLabel(method: string | null | undefined): string {
  switch (method) {
    case "razorpay":
      return "Razorpay (UPI / card / netbanking)";
    case "cod":
      return "Cash on Delivery";
    case "demo":
      return "Demo payment";
    case "manual":
      return "Marked paid manually";
    case null:
    case undefined:
    case "":
      return "—";
    default:
      return method.charAt(0).toUpperCase() + method.slice(1);
  }
}

/** GST rows for an order total: CGST + SGST within the seller's state, IGST otherwise. */
export function gstRows(tax: number, sellerState: string, buyerState: string | null | undefined): { label: string; amount: number }[] {
  const s = splitGst(tax, sellerState, buyerState);
  return s.intraState
    ? [
        { label: "CGST", amount: s.cgst },
        { label: "SGST", amount: s.sgst },
      ]
    : [{ label: "IGST", amount: s.igst }];
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function below100(n: number): string {
  return n < 20 ? ONES[n]! : `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${ONES[n % 10]}` : ""}`;
}
function below1000(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", r ? below100(r) : ""].filter(Boolean).join(" ");
}

/** 104900 paise → "Rupees One Thousand Forty-Nine Only" (Indian numbering: lakh, crore). */
export function amountInWords(paise: number): string {
  const rupees = Math.floor(Math.max(0, paise) / 100);
  const p = Math.round(Math.max(0, paise) % 100);
  const parts: string[] = [];
  let n = rupees;
  const crore = Math.floor(n / 1e7);
  n %= 1e7;
  const lakh = Math.floor(n / 1e5);
  n %= 1e5;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) parts.push(`${below1000(crore)} Crore`);
  if (lakh) parts.push(`${below100(lakh)} Lakh`);
  if (thousand) parts.push(`${below100(thousand)} Thousand`);
  if (n) parts.push(below1000(n));
  const words = parts.join(" ") || "Zero";
  return `Rupees ${words}${p ? ` and ${below100(p)} Paise` : ""} Only`;
}
