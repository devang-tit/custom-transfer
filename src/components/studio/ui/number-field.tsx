"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Compact numeric input that commits on blur/Enter, with an optional unit suffix.
 * While focused it edits a local draft (so partial values like "1." are allowed);
 * otherwise it always displays the controlled `value`.
 */
export function NumberField({
  value,
  onCommit,
  min,
  max,
  step = 0.25,
  unit,
  precision = 2,
  className,
  disabled,
  ariaLabel,
}: {
  value: number;
  onCommit: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  precision?: number;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const fmt = (n: number) => String(Number.isFinite(n) ? Number(n.toFixed(precision)) : 0);
  /** null = not editing → show the controlled value */
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? fmt(value);
  /** Set by Escape so the following blur discards the draft instead of committing it. */
  const discardRef = useRef(false);

  const clampValue = (n: number) => {
    let out = n;
    if (min !== undefined) out = Math.max(min, out);
    if (max !== undefined) out = Math.min(max, out);
    return out;
  };

  /** Commit a raw string; returns the formatted committed value (or the current value if invalid). */
  const commit = (raw: string): string => {
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(n)) return fmt(value);
    const v = clampValue(n);
    if (Math.abs(v - value) > 1e-9) onCommit(v);
    return fmt(v);
  };

  return (
    <div
      className={cn(
        "flex h-8 items-center rounded-lg border border-input bg-transparent text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      <input
        inputMode="decimal"
        aria-label={ariaLabel}
        disabled={disabled}
        value={text}
        onFocus={() => setDraft(fmt(value))}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => {
          if (!discardRef.current) commit(e.target.value);
          discardRef.current = false;
          setDraft(null);
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") {
            e.currentTarget.blur();
            return;
          }
          if (e.key === "Escape") {
            discardRef.current = true;
            e.currentTarget.blur();
            return;
          }
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const base = Number(e.currentTarget.value) || 0;
            const next = base + (e.key === "ArrowUp" ? step : -step) * (e.shiftKey ? 10 : 1);
            setDraft(commit(String(next)));
          }
        }}
        className="h-full w-full min-w-0 bg-transparent px-2 tabular-nums outline-none"
      />
      {unit && <span className="pr-2 text-xs text-muted-foreground">{unit}</span>}
    </div>
  );
}
