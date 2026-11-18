import type { Metadata } from "next";
import Image from "next/image";
import { Droplets, Gauge, HeartHandshake, Leaf, ScanSearch, Truck, UploadCloud, Flame, Printer } from "lucide-react";
import { CtaBand } from "@/components/content/cta-band";
import { PageHero, SectionHeading } from "@/components/content/page-hero";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About us",
  description: `${siteConfig.name} is an independent DTF print studio helping brands, print shops and creators press vivid, durable designs.`,
};

const values = [
  { icon: Droplets, title: "Color obsessed", body: "Calibrated printers, ICC-profiled film and daily nozzle checks mean your reds stay red and your skin tones look human." },
  { icon: Gauge, title: "Speed without shortcuts", body: "Same-day production on orders placed before 2 pm IST — and every sheet still gets cured and inspected by hand." },
  { icon: HeartHandshake, title: "Real humans", body: "Our prepress team checks every file and emails you before printing anything that might disappoint." },
  { icon: Leaf, title: "Lower-impact inks", body: "Water-based, Oeko-Tex certified pigment inks and recyclable packaging wherever we can." },
];

const process = [
  { icon: UploadCloud, title: "Upload or build", body: "Drop in files or arrange a gang sheet online. Live DPI checks catch problems early." },
  { icon: ScanSearch, title: "Prepress review", body: "We check resolution, transparency and thin lines, and contact you if anything needs a tweak." },
  { icon: Printer, title: "Print", body: "Printed on industrial DTF lines with a bright white underbase for punchy color on any garment." },
  { icon: Flame, title: "Cure & inspect", body: "Powdered, cured and inspected sheet by sheet so every transfer presses perfectly." },
  { icon: Truck, title: "Ship", body: "Packed flat and shipped fast — with live tracking in your account." },
];

const team = [
  { name: "Jordan Ellis", role: "Founder & CEO", tint: "from-ink-cyan to-primary" },
  { name: "Priya Shah", role: "Head of Prepress", tint: "from-primary to-ink-magenta" },
  { name: "Marcus Webb", role: "Production Lead", tint: "from-ink-magenta to-orange-400" },
  { name: "Lena Ortiz", role: "Customer Success", tint: "from-amber-400 to-ink-magenta" },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Our story"
        title={<>Built by printers, <span className="text-ink-gradient">for makers.</span></>}
        description={`${siteConfig.name} started in a 600 sq ft garage with one heat press and a lot of ruined shirts. Today we print millions of transfers a year for brands, print shops, schools and creators — and we still sweat every detail.`}
      />

      <section className="container-page grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16">
        <div className="relative mx-auto aspect-square w-full max-w-md">
          <div className="absolute inset-6 rounded-[2.5rem] bg-ink-gradient opacity-20 blur-2xl" />
          {[
            { src: "/images/products/gang-sheet.svg", cls: "top-0 left-0 w-[58%] -rotate-6" },
            { src: "/images/products/tee-white.svg", cls: "top-[18%] right-0 w-[52%] rotate-6" },
            { src: "/images/products/dtf-transfers.svg", cls: "bottom-0 left-[18%] w-[54%] rotate-2" },
          ].map((img) => (
            <div key={img.src} className={`absolute aspect-square overflow-hidden rounded-3xl border shadow-premium ${img.cls}`}>
              <Image src={img.src} alt="" fill sizes="300px" className="object-cover" unoptimized />
            </div>
          ))}
        </div>
        <div>
          <SectionHeading eyebrow="Why we exist" title="Great prints shouldn't need a big minimum." className="mb-5" />
          <div className="grid gap-4 text-muted-foreground">
            <p>
              We were small shop owners first. We know what it&apos;s like to need 18 shirts for a Saturday event, or to pay for 500 screen prints when you only needed 50. Direct-to-film changed that — so we built the shop we always wanted to order from.
            </p>
            <p>
              No minimums, transparent pricing, a gang sheet builder that actually saves film, and a team that tells you <em>before</em> printing if your file will look soft.
            </p>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["2.4M+", "Transfers printed"],
              ["18k", "Happy customers"],
              ["24h", "Avg. turnaround"],
              ["4.9★", "Average rating"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-2xl border bg-card p-4">
                <dt className="font-heading text-2xl font-bold">{v}</dt>
                <dd className="text-xs text-muted-foreground">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="container-page py-16 sm:py-20">
          <SectionHeading eyebrow="What we value" title="The InkForge standard" align="center" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, body }) => (
              <div key={title} className="group rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-premium">
                <span className="mb-4 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-heading text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <SectionHeading eyebrow="How it works" title="From upload to doorstep" description="Every order follows the same careful five-step path." />
        <ol className="relative grid gap-6 md:grid-cols-5 md:gap-4">
          <div className="pointer-events-none absolute top-6 right-[10%] left-[10%] hidden h-0.5 bg-ink-gradient opacity-40 md:block" />
          {process.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
              <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl border bg-background shadow-sm">
                <Icon className="size-5 text-primary" />
                <span className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background">{i + 1}</span>
              </span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page pb-4">
        <SectionHeading eyebrow="The crew" title="Meet the people behind the press" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {team.map((m) => (
            <div key={m.name} className="rounded-2xl border bg-card p-5">
              <div className={`mb-4 grid aspect-square place-items-center rounded-2xl bg-gradient-to-br ${m.tint} font-heading text-4xl font-bold text-white/95`}>
                {m.name.split(" ").map((p) => p[0]).join("")}
              </div>
              <p className="font-semibold">{m.name}</p>
              <p className="text-sm text-muted-foreground">{m.role}</p>
            </div>
          ))}
        </div>
      </section>

      <CtaBand title="Let's print your next drop" />
    </>
  );
}
