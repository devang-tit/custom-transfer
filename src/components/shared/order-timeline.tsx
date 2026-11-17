import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_FLOW, statusMeta, type OrderStatus } from "@/lib/order-status";
import { formatDateTime } from "@/lib/format";

/** Horizontal progress stepper for the happy path (customer-facing). */
export function OrderProgress({ status, className }: { status: string; className?: string }) {
  const steps: OrderStatus[] = ORDER_FLOW.filter((s) => s !== "PENDING");
  const current = steps.indexOf(status as OrderStatus);
  const cancelled = status === "CANCELLED" || status === "REFUNDED";
  return (
    <ol className={cn("grid gap-3 sm:grid-cols-6", className)}>
      {steps.map((s, i) => {
        const done = !cancelled && current >= i;
        const active = !cancelled && current === i;
        return (
          <li key={s} className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
            <div className="flex w-full items-center gap-2">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors",
                  done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground",
                  active && "ring-4 ring-primary/20"
                )}
              >
                {done && !active ? <Check className="size-3.5" /> : i + 1}
              </span>
              {i < steps.length - 1 && (
                <span className={cn("hidden h-0.5 flex-1 rounded-full sm:block", !cancelled && current > i ? "bg-primary" : "bg-border")} />
              )}
            </div>
            <span className={cn("text-sm sm:text-xs", done ? "font-medium text-foreground" : "text-muted-foreground")}>
              {statusMeta(s).label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export type TimelineEvent = {
  id: string;
  status: string | null;
  message: string;
  author: string;
  createdAt: Date | string;
};

/** Vertical event log (newest first). */
export function OrderTimeline({ events, className }: { events: TimelineEvent[]; className?: string }) {
  const sorted = [...events].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return (
    <ol className={cn("relative space-y-5 border-l border-border pl-6", className)}>
      {sorted.map((e, i) => {
        const m = e.status ? statusMeta(e.status) : null;
        return (
          <li key={e.id} className="relative">
            <span
              className={cn(
                "absolute top-1 -left-[29.5px] size-3 rounded-full ring-4 ring-background",
                i === 0 ? (m?.dot ?? "bg-primary") : "bg-muted-foreground/40"
              )}
            />
            <p className="text-sm font-medium">{e.message}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDateTime(e.createdAt)}
              {e.author !== "system" && <> · {e.author}</>}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
