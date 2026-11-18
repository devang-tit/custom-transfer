import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/content/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Privacy policy" };

const n = siteConfig.name;
const sections: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: <p>This policy explains what personal information {n} collects, how we use it, and the choices you have. We only collect what we need to make and deliver your orders and run our store.</p>,
  },
  {
    id: "collect",
    title: "Information we collect",
    body: (
      <ul>
        <li><strong>Account details:</strong> name, email, phone, company and saved addresses.</li>
        <li><strong>Order details:</strong> items, artwork files, shipping address and order notes.</li>
        <li><strong>Payment details:</strong> processed by Razorpay — we receive only a payment confirmation and reference, never your card, UPI PIN or bank credentials.</li>
        <li><strong>Usage data:</strong> basic analytics such as pages visited and device type, used to improve the site.</li>
      </ul>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    body: (
      <ul>
        <li>To print, ship and support your orders.</li>
        <li>To send order updates and, if you opt in, occasional marketing emails.</li>
        <li>To prevent fraud and keep the site secure.</li>
      </ul>
    ),
  },
  {
    id: "artwork",
    title: "Your artwork",
    body: <p>Uploaded artwork is used only to fulfil your orders and to let you reorder. We never sell or reuse your designs. Files are retained for up to 24 months so you can reorder, unless you ask us to delete them sooner.</p>,
  },
  {
    id: "sharing",
    title: "Sharing",
    body: <p>We share information only with service providers that help us operate — payment processors (Razorpay), courier partners and email delivery — and only as needed. We do not sell personal information.</p>,
  },
  {
    id: "rights",
    title: "Your choices & rights",
    body: <p>You can update your details in your account, unsubscribe from marketing at any time, and request a copy, correction or deletion of your personal data (as provided under India’s Digital Personal Data Protection Act, 2023) by contacting <strong>{siteConfig.contact.email}</strong>.</p>,
  },
  {
    id: "cookies",
    title: "Cookies",
    body: <p>We use a secure session cookie to keep you signed in and local storage to remember your cart. Optional analytics cookies can be disabled in your browser settings.</p>,
  },
];

export default function PrivacyPage() {
  return <LegalPage eyebrow="Legal" title="Privacy policy" description="How we collect, use and protect your information." updated="18 November 2026" sections={sections} />;
}
