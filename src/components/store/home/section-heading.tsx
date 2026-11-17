import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  action,
  invert = false,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  action?: React.ReactNode;
  invert?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className={cn(align === "center" && "max-w-2xl")}>
        {eyebrow && (
          <p className={cn("mb-3 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase", invert ? "text-white/60" : "text-primary")}>
            <span className="inline-flex gap-0.5">
              <span className="size-1.5 rounded-full bg-ink-cyan" />
              <span className="size-1.5 rounded-full bg-ink-magenta" />
              <span className="size-1.5 rounded-full bg-ink-yellow" />
            </span>
            {eyebrow}
          </p>
        )}
        <h2 className="text-3xl leading-tight font-bold sm:text-4xl lg:text-[2.75rem]">{title}</h2>
        {description && (
          <p className={cn("mt-3 max-w-2xl text-base leading-relaxed", invert ? "text-white/70" : "text-muted-foreground", align === "center" && "mx-auto")}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
