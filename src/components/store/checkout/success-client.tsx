"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/stores/cart";

/** Clears the cart once the confirmation page mounts. */
export function ClearCartOnMount() {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}

const colors = ["var(--ink-cyan)", "var(--ink-magenta)", "var(--ink-yellow)", "var(--primary)"];

export function CelebrationBadge() {
  const reduce = useReducedMotion();
  const dots = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * Math.PI * 2;
    const dist = 70 + (i % 3) * 18;
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, c: colors[i % 4]!, s: 6 + (i % 3) * 3 };
  });
  return (
    <div className="relative mx-auto grid size-24 place-items-center">
      {!reduce &&
        dots.map((d, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{ width: d.s, height: d.s, background: d.c }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{ x: d.x, y: d.y, opacity: [0, 1, 0], scale: [0, 1, 0.6] }}
            transition={{ duration: 1.4, delay: 0.15 + i * 0.015, ease: "easeOut" }}
          />
        ))}
      <motion.span
        initial={reduce ? false : { scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="grid size-20 place-items-center rounded-full bg-ink-gradient shadow-glow"
      >
        <span className="grid size-[4.5rem] place-items-center rounded-full bg-background">
          <Check className="size-9 text-primary" strokeWidth={3} />
        </span>
      </motion.span>
    </div>
  );
}

export function CopyOrderNumber({ number }: { number: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(number).then(() => {
          setCopied(true);
          toast.success("Order number copied");
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 font-mono text-sm font-semibold transition-colors hover:border-primary/40"
    >
      {number}
      {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5 text-muted-foreground" />}
    </button>
  );
}
