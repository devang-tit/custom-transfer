import Link from "next/link";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { Logo } from "@/components/brand/logo";
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

export function SiteFooter() {
  const social = [
    { label: "Instagram", href: siteConfig.social.instagram, Icon: InstagramIcon },
    { label: "Facebook", href: siteConfig.social.facebook, Icon: FacebookIcon },
    { label: "TikTok", href: siteConfig.social.tiktok, Icon: TikTokIcon },
    { label: "YouTube", href: siteConfig.social.youtube, Icon: YouTubeIcon },
  ];
  return (
    <footer className="relative mt-auto overflow-hidden border-t bg-muted/30">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[60rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="container-page relative">
        <div className="grid gap-8 border-b py-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">
              Get first dibs on <span className="text-ink-gradient">new finishes & deals</span>
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Monthly tips for better prints, early access to new transfer types, and members-only promo codes. No spam.
            </p>
          </div>
          <NewsletterForm className="lg:ml-auto" />
        </div>

        <div className="grid gap-10 py-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">{siteConfig.description}</p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" />{siteConfig.contact.address}</li>
              <li className="flex items-center gap-2"><Phone className="size-4 shrink-0" />{siteConfig.contact.phone}</li>
              <li className="flex items-center gap-2"><Mail className="size-4 shrink-0" />{siteConfig.contact.email}</li>
              <li className="flex items-center gap-2"><Clock className="size-4 shrink-0" />{siteConfig.contact.hours}</li>
            </ul>
            <div className="mt-5 flex gap-2">
              {social.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid size-9 place-items-center rounded-xl border bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:col-span-8">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t py-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} {siteConfig.name}. Printed with care in Austin, TX.</p>
          <PaymentBadges />
        </div>
      </div>
    </footer>
  );
}
