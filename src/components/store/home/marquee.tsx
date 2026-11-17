const items = ["DTF Transfers", "Gang Sheets", "UV DTF Decals", "Glitter Finish", "Glow in the Dark", "Puff Screen Prints", "Neck Labels", "Custom Hoodies", "Left Chest Logos", "Cup Wraps"];
const dots = ["bg-ink-cyan", "bg-ink-magenta", "bg-ink-yellow", "bg-primary"];

export function Marquee() {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y bg-card py-4">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-card to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-card to-transparent" />
      <div className="flex w-max animate-marquee items-center gap-8 motion-reduce:animate-none">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-8 font-heading text-lg font-semibold whitespace-nowrap text-foreground/80 sm:text-xl">
            {t}
            <span className={`size-2.5 rounded-full ${dots[i % dots.length]}`} />
          </span>
        ))}
      </div>
    </div>
  );
}
