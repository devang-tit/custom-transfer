import Image from "next/image";
import { Star } from "lucide-react";

const collage = [
  { src: "/images/products/tee-black.svg", className: "top-[8%] left-[6%] w-[44%] -rotate-6" },
  { src: "/images/products/gang-sheet.svg", className: "top-[4%] right-[4%] w-[40%] rotate-6" },
  { src: "/images/products/dtf-glitter.svg", className: "top-[40%] left-[24%] w-[46%] rotate-2 z-10" },
  { src: "/images/products/hoodie.svg", className: "bottom-[2%] left-[2%] w-[36%] rotate-[8deg]" },
  { src: "/images/products/uv-cup-wrap.svg", className: "right-[2%] bottom-[6%] w-[38%] -rotate-[7deg]" },
];

export function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-ink-key text-white lg:flex lg:flex-col">
      <div className="pointer-events-none absolute inset-0 opacity-90">
        <div className="absolute -top-32 -left-24 size-[28rem] rounded-full bg-ink-cyan/40 blur-3xl" />
        <div className="absolute top-1/3 -right-24 size-[26rem] rounded-full bg-ink-magenta/40 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 size-[26rem] rounded-full bg-primary/50 blur-3xl" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.15] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <div className="relative flex flex-1 flex-col justify-between p-10 xl:p-14">
        <div className="relative mx-auto aspect-square w-full max-w-[460px]">
          {collage.map((c, i) => (
            <div
              key={c.src}
              className={`absolute aspect-square overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/15 animate-float ${c.className}`}
              style={{ animationDelay: `${i * 0.8}s` }}
            >
              <Image src={c.src} alt="" fill sizes="240px" className="object-cover" unoptimized />
            </div>
          ))}
        </div>

        <div className="relative space-y-8">
          <figure className="rounded-2xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur">
            <div className="mb-3 flex gap-0.5 text-amber-300">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="size-4" fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <blockquote className="font-heading text-lg leading-snug text-white/95">
              “We moved our whole merch line to InkForge gang sheets. Colors are brighter, turnaround is same-day, and the builder saves us hours every week.”
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-3 text-sm text-white/70">
              <span className="grid size-9 place-items-center rounded-full bg-ink-gradient text-xs font-bold text-white">MR</span>
              <span>
                <span className="block font-medium text-white">Maya Reyes</span>
                Founder, Wildflower Boutique
              </span>
            </figcaption>
          </figure>
          <dl className="grid grid-cols-3 gap-4">
            {[
              ["2.4M+", "Transfers printed"],
              ["4.9/5", "Avg. rating"],
              ["24h", "Turnaround"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="font-heading text-2xl font-bold">{v}</dt>
                <dd className="text-xs text-white/60">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
