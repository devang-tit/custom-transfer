import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { CheckoutFlow } from "@/components/store/checkout/checkout-flow";
import { stripeEnabled } from "@/app/(store)/_actions/payment-lib";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage(props: PageProps<"/checkout">) {
  const sp = await props.searchParams;
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  const address = user
    ? await db.address.findFirst({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }] })
    : null;
  return (
    <CheckoutFlow
      settings={settings}
      stripe={stripeEnabled()}
      canceled={typeof sp.canceled === "string" ? sp.canceled.slice(0, 20) : undefined}
      prefill={{
        signedIn: !!user,
        email: user?.email ?? "",
        name: user?.name ?? "",
        phone: user?.phone ?? "",
        address: address
          ? { name: address.name, company: address.company ?? "", line1: address.line1, line2: address.line2 ?? "", city: address.city, state: address.state, zip: address.zip, country: address.country }
          : null,
      }}
    />
  );
}
