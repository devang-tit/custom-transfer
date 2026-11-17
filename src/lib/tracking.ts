/** Public carrier tracking page for a tracking number, or null for unknown carriers. */
export function trackingUrl(carrier: string | null | undefined, tracking: string | null | undefined): string | null {
  if (!tracking) return null;
  const c = (carrier ?? "").toLowerCase();
  const t = encodeURIComponent(tracking);
  if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${t}`;
  if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${t}`;
  if (c.includes("usps")) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`;
  if (c.includes("dhl")) return `https://www.dhl.com/en/express/tracking.html?AWB=${t}`;
  return null;
}
