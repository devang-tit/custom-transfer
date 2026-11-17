import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgePercent, Check, Clock, Layers, Package, Ruler, Shirt, Sparkles, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CtaBand } from "@/components/content/cta-band";
import { PageHero, SectionHeading } from "@/components/content/page-hero";
import { getProducts } from "@/lib/catalog";
import { formatMoney } from "@/lib/format";
import { DEFAULT_TIERS, priceLine } from "@/lib/pricing";
import { toPricingProduct, type ProductDTO } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Transparent pricing for custom DTF transfers, gang sheets, UV DTF and custom apparel. Bulk discounts up to 40% — no setup fees.",
};
export const dynamic = "force-dynamic";

function perSqIn(cents: number, w: number, h: number) {
  const v = cents / 100 / (w * h);
  return `$${v.toFixed(3)}`;
}

function TierTable({ product, highlight }: { product: ProductDTO; highlight?: boolean }) {
  const tiers = (product.tiers.length ? product.tiers : DEFAULT_TIERS).slice().sort((a, b) => a.minQty - b.minQty);
  const sizes = product.options.sizes ?? [];
  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-card", highlight && "shadow-premium")}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-5 py-3.5 font-semibold">Size</th>
              {tiers.map((t) => (
                <th key={t.minQty} className="px-4 py-3.5 text-right font-semibold whitespace-nowrap">
                  {t.minQty}+ pcs
                  {t.discountPct > 0 && <span className="ml-1.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">−{t.discountPct}%</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {sizes.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-muted/40">
                <td className="px-5 py-3 font-medium whitespace-nowrap">{s.label}</td>
                {tiers.map((t) => {
                  const p = priceLine(toPricingProduct(product), { sizeId: s.id, quantity: Math.max(1, t.minQty) });
                  return (
                    <td key={t.minQty} className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(p.unitPrice)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t bg-muted/30 px-5 py-2.5 text-xs text-muted-foreground">Price per piece. Quantity discounts apply per line item, per size.</p>
    </div>
  );
}

function SheetTable({ product }: { product: ProductDTO }) {
  const sizes = product.options.sizes ?? [];
  const best = sizes.reduce((b, s) => (s.price / (s.width * s.height) < b.price / (b.width * b.height) ? s : b), sizes[0]!);
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-5 py-3.5 font-semibold">Sheet size</th>
              <th className="px-4 py-3.5 text-right font-semibold">Price</th>
              <th className="px-4 py-3.5 text-right font-semibold">Per sq. inch</th>
              <th className="hidden px-5 py-3.5 font-semibold sm:table-cell">Fits about</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sizes.map((s) => {
              const fits = Math.floor(s.width / 11) * Math.floor(s.height / 11);
              return (
                <tr key={s.id} className={cn("transition-colors hover:bg-muted/40", s.id === best.id && "bg-primary/[0.04]")}>
                  <td className="px-5 py-3 font-medium whitespace-nowrap">
                    {s.label}
                    {s.id === best.id && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase">Best value</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatMoney(s.price)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{perSqIn(s.price, s.width, s.height)}</td>
                  <td className="hidden px-5 py-3 text-muted-foreground sm:table-cell">{fits > 0 ? `${fits} full-front 11" prints` : `${Math.floor(s.width / 4) * Math.floor(s.height / 4)} 4" logos`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {product.tiers.length > 1 && (
        <p className="border-t bg-muted/30 px-5 py-2.5 text-xs text-muted-foreground">
          Ordering multiple copies? {product.tiers.filter((t) => t.discountPct > 0).map((t) => `${t.minQty}+ sheets save ${t.discountPct}%`).join(" · ")}
        </p>
      )}
    </div>
  );
}

export default async function PricingPage() {
  const [products, settings] = await Promise.all([getProducts({ orderBy: { sortOrder: "asc" } }), getSettings()]);
  const by = (slug: string) => products.find((p) => p.slug === slug);
  const dtf = by("custom-dtf-transfers");
  const gang = by("dtf-gang-sheet");
  const uvGang = by("uv-dtf-gang-sheet");
  const uvStickers = by("uv-dtf-stickers");
  const apparel = products.filter((p) => p.type === "APPAREL");
  const firstApparel = apparel[0];
  const lowest = Math.min(...products.flatMap((p) => (p.options.sizes ?? []).map((s) => s.price)).filter((n) => n > 0));
  const maxDiscount = Math.max(...products.flatMap((p) => p.tiers.map((t) => t.discountPct)), 0);

  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title={
          <>
            Honest pricing. <span className="text-ink-gradient">Bigger runs, bigger savings.</span>
          </>
        }
        description="No setup fees, no screen charges, no minimums on DTF. Pay per transfer or pack a gang sheet — the price you see is the price you pay."
      >
        <div className="grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Sparkles, value: `${formatMoney(lowest)}`, label: "Transfers from" },
            { icon: BadgePercent, value: `Up to ${maxDiscount}%`, label: "Bulk discounts" },
            { icon: Truck, value: formatMoney(settings.freeShippingThreshold).replace(".00", ""), label: "Free shipping over" },
            { icon: Clock, value: "Same day", label: "Production before 2pm" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="rounded-2xl border bg-card/80 p-4 text-left backdrop-blur">
              <Icon className="mb-2 size-5 text-primary" />
              <p className="font-heading text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </PageHero>

      {/* Quantity tiers */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading eyebrow="Volume pricing" title="The more you press, the less you pay" description="Discounts apply automatically in your cart — no codes needed." />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {DEFAULT_TIERS.map((t, i) => (
            <div
              key={t.minQty}
              className={cn(
                "relative overflow-hidden rounded-2xl border bg-card p-5",
                i === DEFAULT_TIERS.length - 1 && "col-span-2 border-transparent bg-ink-key text-white md:col-span-1"
              )}
            >
              <div className="absolute inset-x-0 bottom-0 h-1 bg-ink-gradient" style={{ opacity: 0.25 + i * 0.18 }} />
              <p className={cn("text-sm", i === DEFAULT_TIERS.length - 1 ? "text-white/70" : "text-muted-foreground")}>
                {t.minQty === 1 ? "1–9 pieces" : DEFAULT_TIERS[i + 1] ? `${t.minQty}–${DEFAULT_TIERS[i + 1]!.minQty - 1} pieces` : `${t.minQty}+ pieces`}
              </p>
              <p className="mt-2 font-heading text-3xl font-bold">{t.discountPct ? `${t.discountPct}% off` : "List price"}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DTF by size */}
      {dtf && (
        <section className="container-page pb-16 sm:pb-20">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading className="mb-0" eyebrow="DTF transfers" title="Priced by size" description={dtf.shortDescription ?? undefined} />
            <Button asChild className="h-11 shrink-0 rounded-xl px-5">
              <Link href={`/products/${dtf.slug}`}>
                Order DTF transfers <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
          <TierTable product={dtf} highlight />
          {dtf.options.finishes && dtf.options.finishes.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {dtf.options.finishes.map((f) => (
                <span key={f.id} className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm">
                  <Sparkles className="size-3.5 text-primary" />
                  {f.label}
                  <span className="text-muted-foreground">{f.price ? `+${formatMoney(f.price)}/pc` : "included"}</span>
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Gang sheets */}
      {(gang || uvGang) && (
        <section className="border-y bg-muted/30">
          <div className="container-page py-16 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
              <div>
                <SectionHeading eyebrow="Gang sheets" title="Pack it full, pay once" description="One flat price per 22-inch-wide sheet. Fit as many designs as you like — logos, full fronts, sleeves and neck labels together." />
                <ul className="grid gap-3 text-sm">
                  {["Smart auto-pack fills every inch of film", "Live DPI check flags blurry art before you order", "Mix any number of designs and sizes", "Lowest cost per square inch in the shop"].map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                        <Check className="size-3" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild className="h-11 rounded-xl px-5 shadow-glow">
                    <Link href="/gang-sheet-builder">
                      <Layers data-icon="inline-start" /> Open the builder
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-11 rounded-xl px-5">
                    <Link href="/products/upload-gang-sheet">Upload a ready file</Link>
                  </Button>
                </div>
              </div>
              <Tabs defaultValue={gang ? "dtf" : "uv"} className="min-w-0">
                <TabsList className="mb-4 h-10 rounded-xl p-1">
                  {gang && (
                    <TabsTrigger value="dtf" className="rounded-lg px-4">
                      DTF gang sheets
                    </TabsTrigger>
                  )}
                  {uvGang && (
                    <TabsTrigger value="uv" className="rounded-lg px-4">
                      UV DTF gang sheets
                    </TabsTrigger>
                  )}
                </TabsList>
                {gang && (
                  <TabsContent value="dtf">
                    <SheetTable product={gang} />
                  </TabsContent>
                )}
                {uvGang && (
                  <TabsContent value="uv">
                    <SheetTable product={uvGang} />
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>
        </section>
      )}

      {/* UV DTF */}
      {uvStickers && (
        <section className="container-page py-16 sm:py-20">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading className="mb-0" eyebrow="UV DTF" title="Stickers & decals for hard goods" description={uvStickers.shortDescription ?? undefined} />
            <Button asChild variant="outline" className="h-11 shrink-0 rounded-xl px-5">
              <Link href={`/products/${uvStickers.slug}`}>
                Order UV DTF <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
          <TierTable product={uvStickers} />
        </section>
      )}

      {/* Apparel */}
      {firstApparel && (
        <section className="border-y bg-muted/30">
          <div className="container-page py-16 sm:py-20">
            <SectionHeading eyebrow="Custom apparel" title="Printed, pressed & bagged for you" description="Garment price + print locations. Size upcharges apply to 2XL and up. Volume discounts kick in at 12 pieces." />
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="grid gap-3 lg:col-span-2 sm:grid-cols-2">
                {apparel.map((p) => (
                  <Link key={p.id} href={`/products/${p.slug}`} className="group flex items-center justify-between gap-4 rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-premium">
                    <div className="flex items-center gap-4">
                      <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                        <Shirt className="size-5" />
                      </span>
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.turnaround}</p>
                      </div>
                    </div>
                    <p className="text-right">
                      <span className="block text-xs text-muted-foreground">Blank from</span>
                      <span className="font-heading text-lg font-bold">{formatMoney(p.basePrice)}</span>
                    </p>
                  </Link>
                ))}
              </div>
              <div className="grid content-start gap-4">
                <div className="rounded-2xl border bg-card p-5">
                  <p className="mb-3 flex items-center gap-2 font-semibold">
                    <Ruler className="size-4 text-primary" /> Print locations
                  </p>
                  <ul className="grid gap-2 text-sm">
                    {firstApparel.options.printLocations?.map((l) => (
                      <li key={l.id} className="flex justify-between">
                        <span className="text-muted-foreground">{l.label}</span>
                        <span className="font-medium tabular-nums">+{formatMoney(l.price)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border bg-card p-5">
                  <p className="mb-3 flex items-center gap-2 font-semibold">
                    <Package className="size-4 text-primary" /> Size upcharges & volume
                  </p>
                  <ul className="grid gap-2 text-sm">
                    {firstApparel.options.apparelSizes
                      ?.filter((s) => s.upcharge > 0)
                      .map((s) => (
                        <li key={s.size} className="flex justify-between">
                          <span className="text-muted-foreground">{s.size}</span>
                          <span className="font-medium tabular-nums">+{formatMoney(s.upcharge)}</span>
                        </li>
                      ))}
                    {firstApparel.tiers
                      .filter((t) => t.discountPct > 0)
                      .map((t) => (
                        <li key={t.minQty} className="flex justify-between">
                          <span className="text-muted-foreground">{t.minQty}+ garments</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">−{t.discountPct}%</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Shipping & rush */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading eyebrow="Shipping & turnaround" title="Fast by default. Faster when you need it." />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
          <div className="grid gap-3 sm:grid-cols-2">
            {settings.shippingMethods.map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-4 rounded-2xl border bg-card p-5">
                <div>
                  <p className="font-semibold">{m.label}</p>
                  <p className="text-sm text-muted-foreground">{m.description}</p>
                  {m.freeEligible && <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">Free over {formatMoney(settings.freeShippingThreshold)}</p>}
                </div>
                <p className="font-heading text-lg font-bold">{m.price ? formatMoney(m.price) : "Free"}</p>
              </div>
            ))}
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-ink-key p-6 text-white">
            <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-ink-magenta/40 blur-3xl" />
            <Zap className="relative mb-4 size-7 text-ink-yellow" />
            <p className="relative font-heading text-2xl font-bold">Rush production</p>
            <p className="relative mt-2 text-sm text-white/70">
              Jump the queue for +{settings.rushFeePct}% of your subtotal. Rush orders are printed first and ship within hours of artwork approval.
            </p>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
