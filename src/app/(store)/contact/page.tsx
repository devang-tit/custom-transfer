import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/content/page-hero";
import { ContactForm } from "@/components/content/contact-form";
import type { ContactSubject } from "@/components/content/contact-subjects";
import { siteConfig } from "@/config/site";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Questions about an order, artwork or a bulk quote? Our production team replies within one business day.",
};
export const dynamic = "force-dynamic";

const SUBJECT_ALIASES: Record<string, ContactSubject> = {
  account: "Account",
  order: "Order question",
  artwork: "Artwork help",
  quote: "Bulk / wholesale quote",
  pressing: "Pressing help",
  wholesale: "Bulk / wholesale quote",
};

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const order = typeof sp.order === "string" ? sp.order : undefined;
  const subjectParam = typeof sp.subject === "string" ? sp.subject.toLowerCase() : undefined;
  const subject = subjectParam ? SUBJECT_ALIASES[subjectParam] : order ? "Order question" : undefined;

  const cards = [
    { icon: Mail, label: "Email", value: siteConfig.contact.email, href: `mailto:${siteConfig.contact.email}` },
    { icon: Phone, label: "Phone", value: siteConfig.contact.phone, href: `tel:${siteConfig.contact.phone.replace(/[^+\d]/g, "")}` },
    { icon: Clock, label: "Hours", value: siteConfig.contact.hours },
    { icon: MapPin, label: "Studio & pickup", value: siteConfig.contact.address },
  ];

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={<>Let&apos;s make something <span className="text-ink-gradient">loud</span>.</>}
        description="Order questions, artwork help, bulk quotes — real humans from our production floor answer every message."
      />
      <div className="container-page grid gap-8 py-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-12 lg:py-16">
        <section className="relative self-start rounded-3xl border bg-card p-5 shadow-premium sm:p-8">
          <h2 className="text-2xl font-bold">Send us a message</h2>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">
            Have an order? Include the number and we&apos;ll pull it up instantly.
          </p>
          <ContactForm defaults={{ name: user?.name, email: user?.email, subject, orderNumber: order }} />
        </section>

        <div className="grid content-start gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {cards.map(({ icon: Icon, label, value, href }) => {
              const body = (
                <>
                  <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <Icon className="size-4.5" />
                  </span>
                  <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
                  <span className="text-sm font-semibold">{value}</span>
                </>
              );
              return href ? (
                <a key={label} href={href} className="grid gap-2 rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-premium">
                  {body}
                </a>
              ) : (
                <div key={label} className="grid gap-2 rounded-2xl border bg-card p-5">
                  {body}
                </div>
              );
            })}
          </div>

          {/* Stylized map illustration */}
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border bg-muted/40">
            <svg viewBox="0 0 400 250" className="absolute inset-0 size-full" aria-hidden="true">
              <defs>
                <pattern id="map-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M20 0H0V20" fill="none" stroke="currentColor" strokeOpacity="0.07" />
                </pattern>
              </defs>
              <rect width="400" height="250" fill="url(#map-grid)" className="text-foreground" />
              <path d="M-10 170 C80 150 120 200 200 175 S330 120 420 140" fill="none" stroke="var(--ink-cyan)" strokeOpacity="0.5" strokeWidth="14" strokeLinecap="round" />
              <g stroke="currentColor" strokeOpacity="0.14" strokeWidth="6" fill="none" className="text-foreground">
                <path d="M0 80 H400" />
                <path d="M140 0 V250" />
                <path d="M270 0 L330 250" />
                <path d="M0 220 L180 30" strokeWidth="3" />
              </g>
              <g fill="currentColor" fillOpacity="0.06" className="text-foreground">
                <rect x="160" y="96" width="44" height="30" rx="4" />
                <rect x="212" y="96" width="38" height="56" rx="4" />
                <rect x="40" y="100" width="80" height="40" rx="4" />
                <rect x="290" y="30" width="70" height="36" rx="4" />
              </g>
              <circle cx="200" cy="112" r="36" fill="var(--primary)" fillOpacity="0.12">
                <animate attributeName="r" values="22;40;22" dur="3s" repeatCount="indefinite" />
                <animate attributeName="fill-opacity" values="0.2;0.04;0.2" dur="3s" repeatCount="indefinite" />
              </circle>
              <path d="M200 128 C186 108 178 98 178 88 a22 22 0 0 1 44 0 C222 98 214 108 200 128 Z" fill="var(--primary)" />
              <circle cx="200" cy="88" r="8" fill="white" />
            </svg>
            <div className="absolute right-4 bottom-4 left-4 flex items-center justify-between gap-3 rounded-2xl glass border p-3.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{siteConfig.name} Studio</p>
                <p className="truncate text-xs text-muted-foreground">{siteConfig.contact.address}</p>
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(siteConfig.contact.address)}`}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
              >
                Directions
              </a>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Looking for quick answers? Browse the <Link href="/faq" className="font-medium text-primary hover:underline">FAQ</Link> or the{" "}
            <Link href="/press-instructions" className="font-medium text-primary hover:underline">press guide</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
