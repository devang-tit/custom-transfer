/**
 * Central brand + store configuration. Rename the store here.
 */
export const siteConfig = {
  name: "InkForge",
  tagline: "Custom DTF transfers & apparel printing",
  description:
    "Premium custom DTF transfers, gang sheets, UV DTF stickers and custom printed apparel, shipped across India. Upload your art, build a gang sheet online and get vivid, wash-tested prints fast.",
  // NEXT_PUBLIC_VERCEL_URL is set automatically on Vercel (used for preview deployments).
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "http://localhost:3000"),
  currency: "INR",
  locale: "en-IN",
  /** All dates and times are shown in Indian Standard Time. */
  timeZone: "Asia/Kolkata",
  contact: {
    // Placeholders: replace with your real business details.
    email: "hello@inkforge.example",
    phone: "+91 98765 43210",
    address: "Unit 12, Print Park, SG Highway, Ahmedabad, Gujarat 380054",
    hours: "Mon–Sat · 10 am–7 pm IST",
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
