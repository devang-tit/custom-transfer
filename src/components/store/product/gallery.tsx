"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name, badge }: { images: string[]; name: string; badge?: string | null }) {
  const list = images.length ? images : ["/images/placeholder.svg"];
  const [active, setActive] = useState(0);
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row lg:sticky lg:top-24">
      {list.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto sm:w-20 sm:flex-col">
          {list.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden border bg-muted transition-all sm:size-20",
                active === i ? "border-foreground" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-square flex-1 overflow-hidden bg-muted">
        <AnimatePresence mode="wait">
          <motion.img
            key={list[active]}
            src={list[active]}
            alt={name}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="size-full object-cover"
          />
        </AnimatePresence>
        {badge && (
          <span className="absolute top-4 right-4 rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground">{badge}</span>
        )}
      </div>
    </div>
  );
}
