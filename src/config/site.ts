/**
 * Central brand + store configuration. Rename the store here.
 */
export const siteConfig = {
  name: "InkForge",
  tagline: "Custom DTF transfers & apparel printing",
  description:
    "Premium custom DTF transfers, gang sheets, UV DTF stickers and custom printed apparel. Upload your art, build a gang sheet online, and get vivid, wash-tested prints shipped fast.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  currency: "USD",
  locale: "en-US",
  contact: {
    email: "hello@inkforge.example",
    phone: "+1 (555) 014-2290",
    address: "1200 Press Ave, Suite 4, Austin, TX 78701",
    hours: "Mon–Fri · 8am–6pm CT",
  },
  social: {
    instagram: "#",
    facebook: "#",
    tiktok: "#",
    youtube: "#",
  },
  mainNav: [
    { title: "Shop", href: "/shop" },
    { title: "Gang Sheet Builder", href: "/gang-sheet-builder" },
    { title: "Design Studio", href: "/design-studio" },
    { title: "Pricing", href: "/pricing" },
    { title: "FAQ", href: "/faq" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
