import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  className,
  align = "center",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  align?: "center" | "left";
}) {
  return (
    <section className={cn("relative overflow-hidden border-b", className)}>
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-70 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[56rem] -translate-x-1/2 rounded-full bg-ink-gradient opacity-[0.16] blur-3xl dark:opacity-25" />
      <div className={cn("container-page relative py-16 sm:py-20 lg:py-24", align === "center" && "text-center")}>
        {eyebrow && (
          <p
            className={cn(
              "mb-4 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase backdrop-blur",
            )}
          >
            <span className="size-1.5 rounded-full bg-ink-gradient" />
            {eyebrow}
          </p>
        )}
        <h1 className={cn("text-4xl font-bold sm:text-5xl lg:text-6xl", align === "center" && "mx-auto max-w-4xl")}>{title}</h1>
        {description && (
          <p className={cn("mt-5 text-lg text-muted-foreground", align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl")}>{description}</p>
        )}
        {children && <div className={cn("mt-8", align === "center" && "flex justify-center")}>{children}</div>}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  align = "left",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("mb-8 grid gap-2", align === "center" && "mx-auto max-w-2xl text-center", className)}>
      {eyebrow && <p className="text-xs font-semibold tracking-wider text-primary uppercase">{eyebrow}</p>}
      <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  );
}
