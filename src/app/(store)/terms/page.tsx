import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/content/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Terms of service" };

const n = siteConfig.name;
const sections: LegalSection[] = [
  {
    id: "agreement",
    title: "Agreement to terms",
    body: (
      <p>
        By accessing the {n} website or placing an order, you agree to these Terms of Service. If you do not agree, please do not use the site. We may update these terms from time to time; continued use after changes means you accept the revised terms.
      </p>
    ),
  },
  {
    id: "orders",
    title: "Orders & pricing",
    body: (
      <>
        <p>All products are made to order. Prices are shown in {siteConfig.currency} and may change without notice, but the price confirmed at checkout is the price you pay.</p>
        <ul>
          <li>We reserve the right to refuse or cancel any order, including orders that appear fraudulent or infringe on third-party rights.</li>
          <li>Quantity discounts are calculated per line item at checkout.</li>
          <li>Promotional codes cannot be combined unless stated otherwise.</li>
        </ul>
      </>
    ),
  },
  {
    id: "artwork",
    title: "Your artwork & content",
    body: (
      <>
        <p>
          You retain ownership of artwork you upload. By submitting it, you grant {n} a limited license to reproduce it solely to fulfil your order and to display it to you in your account.
        </p>
        <p>
          <strong>You confirm you own or have permission to print every design you submit.</strong> We may decline to print content that infringes trademarks or copyrights, or that is hateful, violent or otherwise unlawful.
        </p>
      </>
    ),
  },
  {
    id: "quality",
    title: "Print quality",
    body: (
      <p>
        We review every file before printing, but final quality depends on the resolution and accuracy of the files you supply. Colors may vary slightly between screens and printed output. Low-resolution files flagged by our tools or team are printed at your own risk if you choose to proceed.
      </p>
    ),
  },
  {
    id: "payment",
    title: "Payment",
    body: (
      <p>
        Payment is due at checkout unless you have an approved invoice account. Payments are processed by secure third-party providers; we never store full card numbers on our servers.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <p>
        To the fullest extent permitted by law, {n}&apos;s liability for any claim related to an order is limited to the amount paid for that order. We are not liable for indirect or consequential losses, including garments damaged by incorrect pressing.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about these terms? Email <strong>{siteConfig.contact.email}</strong> or write to {siteConfig.contact.address}.
      </p>
    ),
  },
];

export default function TermsPage() {
  return <LegalPage eyebrow="Legal" title="Terms of service" description={`The rules for using ${n} and ordering custom prints.`} updated="November 1, 2026" sections={sections} />;
}
