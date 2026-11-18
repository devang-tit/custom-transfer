import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Check, Flame, Gauge, Minus, Thermometer, Timer } from "lucide-react";
import { PageHero } from "@/components/content/page-hero";
import { PrintButton } from "@/components/account/print-button";
import { CtaBand } from "@/components/content/cta-band";

export const metadata: Metadata = {
  title: "Heat press instructions",
  description: "Temperatures, times, pressure and peel instructions for DTF transfers, UV DTF decals and screen print transfers, plus a troubleshooting guide.",
};

const toc = [
  { id: "dtf", label: "DTF transfers" },
  { id: "fabrics", label: "Fabric settings" },
  { id: "uv-dtf", label: "UV DTF decals" },
  { id: "screen-print", label: "Screen print transfers" },
  { id: "compatibility", label: "Compatibility" },
  { id: "troubleshooting", label: "Troubleshooting" },
  { id: "care", label: "Wash & care" },
];

const fabricRows = [
  { fabric: "100% cotton", temp: "154–160°C / 310–320°F", time: "12–15 s", pressure: "Medium–firm", peel: "Hot or cold" },
  { fabric: "Poly-cotton blends", temp: "149–154°C / 300–310°F", time: "10–12 s", pressure: "Medium", peel: "Hot or cold" },
  { fabric: "100% polyester", temp: "138–143°C / 280–290°F", time: "10–12 s", pressure: "Medium", peel: "Cold" },
  { fabric: "Nylon / windbreakers", temp: "132–138°C / 270–280°F", time: "8–10 s", pressure: "Light–medium", peel: "Cold" },
  { fabric: "Canvas, denim, totes", temp: "157–163°C / 315–325°F", time: "15–20 s", pressure: "Firm", peel: "Hot or cold" },
  { fabric: "Fleece & hoodies", temp: "149–154°C / 300–310°F", time: "12–15 s", pressure: "Medium (use a pillow)", peel: "Cold" },
];

const compat: { surface: string; dtf: boolean; uv: boolean; sp: boolean }[] = [
  { surface: "Cotton & blends", dtf: true, uv: false, sp: true },
  { surface: "Polyester & performance wear", dtf: true, uv: false, sp: true },
  { surface: "Nylon", dtf: true, uv: false, sp: false },
  { surface: "Hats (structured)", dtf: true, uv: false, sp: true },
  { surface: "Glass, tumblers, mugs", dtf: false, uv: true, sp: false },
  { surface: "Metal, wood, acrylic", dtf: false, uv: true, sp: false },
  { surface: "Phone cases, laptops", dtf: false, uv: true, sp: false },
];

const troubleshooting = [
  { problem: "Transfer won't release from the film", fix: "Press 5 seconds longer or increase pressure. If peeling hot, try waiting until fully cool and peel slowly at a low angle." },
  { problem: "Edges lifting after peeling", fix: "Re-press for 5–8 seconds with a teflon sheet or parchment on top. Use a pressing pillow so seams and zippers don't steal pressure." },
  { problem: "Shiny or glossy finish", fix: "Normal after the first press. A second 5-second press with a teflon sheet or kraft paper gives a soft matte finish." },
  { problem: "Cracking after washing", fix: "Usually too little time or pressure. Confirm your press temperature with a heat gun — many presses run 10–15°C cooler than they display." },
  { problem: "Dye migration on polyester", fix: "Lower the temperature to 132–138°C and peel cold. Sublimated or dark red polyester may need a blocker garment." },
  { problem: "UV DTF decal bubbling", fix: "Clean the surface with isopropyl alcohol, apply on a flat or gently curved area, and burnish from the center outward with a squeegee." },
];

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="relative flex gap-4">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{n}</span>
      <div className="pt-1">
        <p className="font-semibold">{title}</p>
        <div className="mt-1 text-sm text-muted-foreground">{children}</div>
      </div>
    </li>
  );
}

function Yes({ v }: { v: boolean }) {
  return v ? (
    <span className="inline-grid size-6 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
      <Check className="size-3.5" />
    </span>
  ) : (
    <span className="inline-grid size-6 place-items-center rounded-full bg-muted text-muted-foreground">
      <Minus className="size-3.5" />
    </span>
  );
}

export default function PressInstructionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Press guide"
        title={<>Press it <span className="text-ink-gradient">perfectly</span>, every time.</>}
        description="Our production team's settings for every product we make. Print this page and keep it next to your press."
      >
        <div className="no-print">
          <PrintButton label="Print this guide" />
        </div>
      </PageHero>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16 lg:py-16">
        <aside className="no-print lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Contents</p>
          <nav className="flex gap-2 overflow-x-auto no-scrollbar lg:grid lg:gap-0.5">
            {toc.map((t) => (
              <a key={t.id} href={`#${t.id}`} className="shrink-0 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground lg:border-0 lg:py-2">
                {t.label}
              </a>
            ))}
          </nav>
        </aside>

        <article className="grid min-w-0 gap-16">
          <section id="dtf" className="scroll-mt-28">
            <h2 className="mb-2 text-3xl font-bold">DTF transfers</h2>
            <p className="mb-6 text-muted-foreground">Works on light and dark garments. No weeding, no pre-treatment.</p>
            <div className="mb-8 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Thermometer, label: "Temperature", value: "150–160°C", sub: "300–315°F" },
                { icon: Timer, label: "Time", value: "10–15 sec", sub: "+ 5 s finishing press" },
                { icon: Gauge, label: "Pressure", value: "Medium–firm", sub: "40–60 PSI" },
              ].map(({ icon: Icon, label, value, sub }) => (
                <div key={label} className="relative overflow-hidden rounded-2xl border bg-card p-5">
                  <Icon className="mb-3 size-5 text-primary" />
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
                  <p className="font-heading text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>
            <ol className="grid gap-5">
              <Step n={1} title="Pre-press the garment">2–3 seconds to remove moisture and wrinkles. Moisture is the #1 cause of poor adhesion.</Step>
              <Step n={2} title="Position the transfer">Place the transfer ink-side down. Use heat tape on slick fabrics so it can&apos;t shift.</Step>
              <Step n={3} title="Press">Press at the settings above. Use a pressing pillow for seams, zippers or thick hoodies.</Step>
              <Step n={4} title="Peel">
                <strong className="text-foreground">Hot peel:</strong> peel smoothly within 2–3 seconds. <strong className="text-foreground">Cold peel:</strong> wait until fully cool (about 30 seconds) then peel. Either works with our film — if anything resists, let it cool and peel slower.
              </Step>
              <Step n={5} title="Finishing press">Cover with a teflon sheet or parchment and press 5 more seconds for maximum wash durability and a soft matte feel.</Step>
            </ol>
          </section>

          <section id="fabrics" className="scroll-mt-28">
            <h2 className="mb-2 text-2xl font-bold">Settings by fabric</h2>
            <p className="mb-6 text-sm text-muted-foreground">Always test on a scrap or inside hem first — presses vary.</p>
            <div className="overflow-hidden rounded-2xl border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      {["Fabric", "Temperature", "Time", "Pressure", "Peel"].map((h) => (
                        <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {fabricRows.map((r) => (
                      <tr key={r.fabric}>
                        <td className="px-4 py-3 font-medium">{r.fabric}</td>
                        <td className="px-4 py-3 tabular-nums">{r.temp}</td>
                        <td className="px-4 py-3">{r.time}</td>
                        <td className="px-4 py-3">{r.pressure}</td>
                        <td className="px-4 py-3">{r.peel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section id="uv-dtf" className="scroll-mt-28">
            <h2 className="mb-2 text-2xl font-bold">UV DTF decals</h2>
            <p className="mb-6 text-muted-foreground">No heat press needed. Works on glass, metal, wood, plastic and acrylic.</p>
            <ol className="grid gap-5">
              <Step n={1} title="Clean the surface">Wipe with isopropyl alcohol and let it dry completely. Oils and dust prevent bonding.</Step>
              <Step n={2} title="Peel the backing (film A)">Peel slowly from a corner. The design stays on the clear top film.</Step>
              <Step n={3} title="Apply & burnish">Place the decal and press firmly from the center outward with a squeegee or your thumb for 30–60 seconds.</Step>
              <Step n={4} title="Remove the top film (film B)">Peel back slowly at a low angle. If any piece lifts, lay it back down and burnish again.</Step>
              <Step n={5} title="Let it cure">Wait 24 hours before washing. Top-rack dishwasher safe after curing; hand washing extends life.</Step>
            </ol>
          </section>

          <section id="screen-print" className="scroll-mt-28">
            <h2 className="mb-2 text-2xl font-bold">Screen print (plastisol) transfers</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border bg-card p-5">
                <Flame className="mb-3 size-5 text-ink-magenta" />
                <p className="font-semibold">Standard plastisol</p>
                <p className="mt-1 text-sm text-muted-foreground">177°C (350°F) · 7–8 seconds · firm pressure · peel hot immediately.</p>
              </div>
              <div className="rounded-2xl border bg-card p-5">
                <Flame className="mb-3 size-5 text-ink-yellow" />
                <p className="font-semibold">Puff transfers</p>
                <p className="mt-1 text-sm text-muted-foreground">166°C (330°F) · 10 seconds · light pressure so the ink can rise · peel hot.</p>
              </div>
            </div>
          </section>

          <section id="compatibility" className="scroll-mt-28">
            <h2 className="mb-6 text-2xl font-bold">What works where</h2>
            <div className="overflow-hidden rounded-2xl border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-semibold">Surface</th>
                      <th className="px-4 py-3 text-center font-semibold">DTF</th>
                      <th className="px-4 py-3 text-center font-semibold">UV DTF</th>
                      <th className="px-4 py-3 text-center font-semibold">Screen print</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {compat.map((r) => (
                      <tr key={r.surface}>
                        <td className="px-4 py-3 font-medium">{r.surface}</td>
                        <td className="px-4 py-3 text-center"><Yes v={r.dtf} /></td>
                        <td className="px-4 py-3 text-center"><Yes v={r.uv} /></td>
                        <td className="px-4 py-3 text-center"><Yes v={r.sp} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section id="troubleshooting" className="scroll-mt-28">
            <h2 className="mb-6 text-2xl font-bold">Troubleshooting</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {troubleshooting.map((t) => (
                <div key={t.problem} className="rounded-2xl border bg-card p-5">
                  <p className="flex items-start gap-2 font-semibold">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                    {t.problem}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{t.fix}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="care" className="scroll-mt-28">
            <h2 className="mb-4 text-2xl font-bold">Wash & care (share with your customers)</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {[
                "Wait 24 hours before the first wash",
                "Turn garments inside out",
                "Machine wash cold with mild detergent",
                "No bleach or fabric softener",
                "Tumble dry low or hang dry",
                "Don't iron directly on the print",
              ].map((c) => (
                <li key={c} className="flex items-center gap-2.5 rounded-xl bg-muted/50 px-4 py-3 text-sm">
                  <Check className="size-4 shrink-0 text-primary" /> {c}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              Still having trouble? <Link href="/contact?subject=pressing" className="font-medium text-primary hover:underline">Send us a photo</Link> — we&apos;ll help you dial it in.
            </p>
          </section>
        </article>
      </div>
      <div className="no-print">
        <CtaBand />
      </div>
    </>
  );
}
