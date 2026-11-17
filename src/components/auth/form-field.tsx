import { cn } from "@/lib/utils";

/** Premium-sized input styling shared by auth, account and contact forms. */
export const fieldInputClass =
  "h-11 rounded-xl bg-background px-3.5 text-[15px] shadow-xs dark:bg-input/20";

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  action,
  className,
  children,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  error?: string | string[];
  hint?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const message = Array.isArray(error) ? error[0] : error;
  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {action}
      </div>
      {children}
      {message ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          {message}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormError({ message, className }: { message?: string; className?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive",
        className
      )}
    >
      {message}
    </div>
  );
}
