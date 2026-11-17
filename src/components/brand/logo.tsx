import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

/** CMYK mark: three overlapping ink drops on a key-black tile. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-8", className)} aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="var(--ink-key)" />
      <g style={{ mixBlendMode: "screen" }}>
        <circle cx="15.5" cy="16" r="8" fill="var(--ink-cyan)" opacity="0.95" />
        <circle cx="24.5" cy="16" r="8" fill="var(--ink-magenta)" opacity="0.95" />
        <circle cx="20" cy="24" r="8" fill="var(--ink-yellow)" opacity="0.95" />
      </g>
    </svg>
  );
}

export function Logo({
  className,
  href = "/",
  showText = true,
  textClassName,
}: {
  className?: string;
  href?: string | null;
  showText?: boolean;
  textClassName?: string;
}) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {showText && (
        <span className={cn("font-heading text-xl font-bold tracking-tight", textClassName)}>
          {siteConfig.name}
        </span>
      )}
    </span>
  );
  if (href === null) return content;
  return (
    <Link href={href} aria-label={`${siteConfig.name} home`} className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      {content}
    </Link>
  );
}
