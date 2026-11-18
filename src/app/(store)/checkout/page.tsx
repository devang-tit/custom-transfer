import type { Metadata } from "next";
import { findState, normalizeIndianMobile } from "@/lib/india";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { CheckoutFlow } from "@/components/store/checkout/checkout-flow";
import { razorpayEnabled } from "@/lib/razorpay";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  const address = user
    ? await db.address.findFirst({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }] })
    : null;
  return (
    <CheckoutFlow
      settings={settings}
      razorpay={razorpayEnabled()}
      prefill={{
        signedIn: !!user,
        email: user?.email ?? "",
        name: user?.name ?? "",
        phone: nationalMobile(user?.phone),
        address: address
          ? { name: address.name, company: address.company ?? "", line1: address.line1, line2: address.line2 ?? "", city: address.city, state: findState(address.state)?.name ?? "", zip: address.zip, country: address.country }
          : null,
      }}
    />
  );
}

/** "+91 98250 12345" → "98250 12345" for the input next to the fixed +91 prefix. */
function nationalMobile(phone: string | null | undefined): string {
  if (!phone) return "";
  return (normalizeIndianMobile(phone) ?? phone).replace(/^\+91\s*/, "");
}
