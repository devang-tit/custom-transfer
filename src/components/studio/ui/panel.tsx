import { cn } from "@/lib/utils";

export function PanelSection({
  title,
  action,
  children,
  className,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-b px-4 py-4 last:border-b-0", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h3 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function FieldRow({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
