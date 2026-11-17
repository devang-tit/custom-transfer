import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/content/page-hero";
import { FaqExplorer } from "@/components/content/faq-explorer";
import { FAQ } from "@/components/content/faq-data";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about ordering custom DTF transfers, artwork files, gang sheets, heat press settings, shipping and reprints.",
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.flatMap((c) => c.items).map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero
        eyebrow="Help center"
        title={<>Questions? <span className="text-ink-gradient">We&apos;ve got answers.</span></>}
        description="Everything you need to know about ordering, artwork, gang sheets and pressing — written by our production team."
      />
      <div className="container-page py-12 lg:py-16">
        <FaqExplorer categories={FAQ} />
      </div>
      <section className="container-page pb-16 sm:pb-20">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-3xl border bg-card p-6 sm:p-8">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <MessageSquare className="size-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold">Still stuck?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Our team answers every message within one business day — usually much faster.</p>
            </div>
            <Button asChild className="mt-auto h-11 w-fit rounded-xl px-5">
              <Link href="/contact">Contact support</Link>
            </Button>
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border bg-card p-6 sm:p-8">
            <span className="grid size-11 place-items-center rounded-xl bg-ink-magenta/10 text-ink-magenta">
              <BookOpen className="size-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold">Pressing for the first time?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Temperatures, timings, peel types and troubleshooting for every product we make.</p>
            </div>
            <Button asChild variant="outline" className="mt-auto h-11 w-fit rounded-xl px-5">
              <Link href="/press-instructions">Read the press guide</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
