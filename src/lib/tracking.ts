/** Public tracking page for a courier + AWB/tracking number, or null when unknown (the number is still shown). */
export function trackingUrl(carrier: string | null | undefined, tracking: string | null | undefined): string | null {
  if (!tracking) return null;
  const c = (carrier ?? "").toLowerCase().replace(/\s+/g, "");
  const t = encodeURIComponent(tracking.trim());
  if (c.includes("delhivery")) return `https://www.delhivery.com/track/package/${t}`;
  if (c.includes("bluedart")) return `https://www.bluedart.com/web/guest/trackdartresultthirdparty?trackFor=0&trackNo=${t}`;
  if (c.includes("shiprocket")) return `https://shiprocket.co/tracking/${t}`;
  if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${t}`;
  if (c.includes("dhl")) return `https://www.dhl.com/in-en/home/tracking.html?tracking-id=${t}`;
  if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${t}`;
  return null;
}
