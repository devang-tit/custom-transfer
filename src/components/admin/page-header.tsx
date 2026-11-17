import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Page title row: optional back button, bold title, actions on the right. */
export function PageHeader({
  title,
  description,
  actions,
  back,
  className,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-5 space-y-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-1.5">
          {back && (
            <Link
              href={back.href}
              aria-label={back.label}
              title={back.label}
              className="mt-px grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-black/[0.05] hover:text-foreground dark:hover:bg-white/10"
            >
              <ArrowLeft className="size-4" />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="text-xl leading-7 font-semibold tracking-[-0.02em]">{title}</h1>
            {description && <div className="mt-0.5 text-[13px] text-muted-foreground">{description}</div>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/** White card with a soft bevel, used for every admin section. */
export function Panel({
  title,
  description,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  const hasHeader = !!(title || action);
  return (
    <section data-admin-card className={cn("rounded-xl bg-card text-card-foreground", className)}>
      {hasHeader && (
        <header className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold tracking-normal">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn(hasHeader ? "px-4 pb-4" : "p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
