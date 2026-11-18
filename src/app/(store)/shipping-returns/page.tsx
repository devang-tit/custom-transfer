import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/content/legal-page";
import { siteConfig } from "@/config/site";
import { formatMoney } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Shipping & returns" };
export const dynamic = "force-dynamic";

export default async function ShippingReturnsPage() {
  const settings = await getSettings();
  const sections: LegalSection[] = [
    {
      id: "production",
      title: "Production times",
      body: (
        <ul>
          <li><strong>DTF transfers & gang sheets:</strong> same-day production for orders placed before 2 pm IST, Monday to Saturday.</li>
          <li><strong>UV DTF:</strong> 1–2 working days.</li>
          <li><strong>Custom apparel:</strong> 3–4 working days.</li>
          <li><strong>Screen print transfers:</strong> about 5 working days.</li>
          <li><strong>Rush production:</strong> +{settings.rushFeePct}% of subtotal — printed first in the queue.</li>
        </ul>
      ),
    },
    {
      id: "shipping",
      title: "Shipping options",
      body: (
        <>
          <ul>
            {settings.shippingMethods.map((m) => (
              <li key={m.id}>
                <strong>{m.label}</strong> ({m.description}) — {m.price ? formatMoney(m.price) : "Free"}
                {m.freeEligible ? `, free on orders over ${formatMoney(settings.freeShippingThreshold)}` : ""}
              </li>
            ))}
          </ul>
          <p>We deliver to most serviceable PIN codes across India through Delhivery, Blue Dart and India Post. Metro cities usually receive orders in 2–3 days; other locations in 4–6 days. Delivery estimates start once your order ships, not when it&apos;s placed. Tracking (AWB) is emailed and shown in your account.</p>
        </>
      ),
    },
    {
      id: "cod",
      title: "Cash on Delivery",
      body: settings.codEnabled ? (
        <p>
          Cash on Delivery is available on orders up to {formatMoney(settings.codMaxOrder)}
          {settings.codFee ? ` for a handling fee of ${formatMoney(settings.codFee)}` : ""}. Pay the courier by cash or UPI when your parcel arrives. Repeatedly refused COD parcels may lose COD eligibility.
        </p>
      ) : (
        <p>Cash on Delivery is currently unavailable. Pay securely online with UPI, cards, netbanking or wallets.</p>
      ),
    },
    {
      id: "pickup",
      title: "Studio pickup",
      body: <p>Choose Studio pickup at checkout and collect from {siteConfig.contact.address} during business hours ({siteConfig.contact.hours}). We&apos;ll email you when it&apos;s ready.</p>,
    },
    {
      id: "reprints",
      title: "Damaged or defective prints",
      body: <p>If anything arrives damaged or with a printing defect, contact us within 14 days of delivery with your order number and photos. We&apos;ll reprint the affected items free of charge or issue a refund. Refunds go back to the original payment method (UPI, card or bank) within 5–7 working days; COD orders are refunded to your bank account or UPI ID.</p>,
    },
    {
      id: "returns",
      title: "Returns",
      body: (
        <>
          <p>Because every product is custom printed to order, we can&apos;t accept returns for change of mind, ordering the wrong size, or issues caused by the supplied artwork (low resolution, typos, missing transparency).</p>
          <p>Unopened, non-custom supplies (teflon sheets, pillows, tape) can be returned within 30 days for a refund, minus return shipping.</p>
        </>
      ),
    },
    {
      id: "lost",
      title: "Lost packages",
      body: <p>If tracking shows no movement for 5 working days, or a package is marked delivered but not received, let us know and we&apos;ll open a claim with the courier and arrange a replacement where appropriate.</p>,
    },
  ];
  return (
    <LegalPage
      eyebrow="Policies"
      title="Shipping & returns"
      description="Production times, delivery options, and what happens if something isn't right."
      updated="18 November 2026"
      sections={sections}
    />
  );
}
