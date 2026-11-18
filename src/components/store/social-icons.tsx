/** Inline brand marks (lucide v1 ships no brand icons). */
export function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-7.5h2.5l.4-3H13.5V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z" />
    </svg>
  );
}
export function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.6 3c.4 2 1.7 3.4 3.9 3.6v3.1c-1.4 0-2.7-.4-3.9-1.1v6.1c0 3.3-2.4 5.8-5.7 5.8S5 18 5 14.8c0-3.3 2.8-5.8 6.2-5.4v3.2c-1.5-.4-3 .6-3 2.2 0 1.4 1.1 2.5 2.5 2.5 1.5 0 2.6-1 2.6-2.8V3h3.3z" />
    </svg>
  );
}
export function YouTubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.6 7.2c-.2-.9-.9-1.6-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8c.2.9.9 1.6 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3L10 15z" />
    </svg>
  );
}

/** Minimal payment method marks for footer/checkout trust rows. */
export function PaymentBadges({ className }: { className?: string }) {
  const badge = "inline-flex h-7 items-center rounded-md border bg-card px-2 text-[10px] font-bold tracking-wide text-muted-foreground";
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-1.5">
        {["UPI", "RuPay", "VISA", "Mastercard", "Netbanking", "COD"].map((m) => (
          <span key={m} className={badge}>
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
