import { PageHero } from "@/components/content/page-hero";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

export function LegalPage({
  eyebrow,
  title,
  description,
  updated,
  sections,
}: {
  eyebrow: string;
  title: string;
  description: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={description} align="left">
        <p className="text-sm text-muted-foreground">Last updated {updated}</p>
      </PageHero>
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16 lg:py-16">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">On this page</p>
          <nav className="flex gap-2 overflow-x-auto no-scrollbar lg:grid lg:gap-0.5 lg:overflow-visible">
            {sections.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="shrink-0 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:border-0 lg:px-3 lg:py-2"
              >
                <span className="mr-2 font-mono text-xs text-muted-foreground/60">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </a>
            ))}
          </nav>
        </aside>
        <article className="max-w-3xl">
          <div className="mb-10 rounded-2xl border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
            This is a generic template provided for demonstration. Have it reviewed by a qualified professional before relying on it for your business.
          </div>
          <div className="grid gap-12">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <h2 className="mb-4 flex items-baseline gap-3 text-2xl font-bold">
                  <span className="font-mono text-sm font-medium text-primary">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </h2>
                <div className="grid gap-4 leading-relaxed text-muted-foreground [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_strong]:text-foreground [&_ul]:grid [&_ul]:gap-2">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </>
  );
}
