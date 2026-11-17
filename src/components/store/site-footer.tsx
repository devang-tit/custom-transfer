import Link from "next/link";
import { siteConfig } from "@/config/site";
import { NewsletterForm } from "./newsletter-form";
import { FacebookIcon, InstagramIcon, PaymentBadges, TikTokIcon, YouTubeIcon } from "./social-icons";

const columns = [
  {
    title: "Shop",
    links: [
      { label: "DTF Transfers", href: "/shop?category=dtf-transfers" },
      { label: "Gang Sheets", href: "/shop?category=gang-sheets" },
      { label: "UV DTF", href: "/shop?category=uv-dtf" },
      { label: "Screen Print Transfers", href: "/shop?category=screen-print-transfers" },
      { label: "Custom Apparel", href: "/shop?category=custom-apparel" },
      { label: "Supplies", href: "/shop?category=supplies" },
    ],
  },
  {
    title: "Tools",
    links: [
      { label: "Gang Sheet Builder", href: "/gang-sheet-builder" },
      { label: "Design Studio", href: "/design-studio" },
      { label: "Track an order", href: "/track" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "FAQ", href: "/faq" },
      { label: "Press instructions", href: "/press-instructions" },
      { label: "Contact us", href: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Shipping & returns", href: "/shipping-returns" },
      { label: "Terms of service", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
    ],
  },
];

const policies = [
  { label: "Terms of service", href: "/terms" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "Shipping & returns", href: "/shipping-returns" },
  { label: "Contact", href: "/contact" },
];

export function SiteFooter() {
  const social = [
    { label: "Instagram", href: siteConfig.social.instagram, Icon: InstagramIcon },
    { label: "Facebook", href: siteConfig.social.facebook, Icon: FacebookIcon },
    { label: "TikTok", href: siteConfig.social.tiktok, Icon: TikTokIcon },
    { label: "YouTube", href: siteConfig.social.youtube, Icon: YouTubeIcon },
  ];
  return (
    <footer className="mt-auto bg-[#333333] text-white">
      <div className="container-page">
        <div className="grid gap-12 py-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="text-2xl font-bold">Join our email list</h2>
            <p className="mt-2 max-w-sm text-sm text-white/70">
              Printing tips, new transfer finishes and members-only offers. No spam, unsubscribe anytime.
            </p>
            <NewsletterForm tone="inverted" className="mt-6" />
            <ul className="mt-8 space-y-1.5 text-sm text-white/70">
              <li>{siteConfig.contact.address}</li>
              <li>
                {siteConfig.contact.phone} · {siteConfig.contact.email}
              </li>
              <li>{siteConfig.contact.hours}</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-7">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-medium">{col.title}</p>
                <ul className="mt-4 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 border-t border-white/15 py-5 text-xs text-white/70 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>
              © {new Date().getFullYear()} {siteConfig.name}
            </span>
            {policies.map((p) => (
              <Link key={p.href} href={p.href} className="hover:text-white hover:underline underline-offset-4">
                {p.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {social.map(({ label, href, Icon }) => (
                <a key={label} href={href} aria-label={label} className="grid size-8 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white">
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
            <PaymentBadges />
          </div>
        </div>
      </div>
    </footer>
  );
}
