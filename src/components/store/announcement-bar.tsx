import Link from "next/link";

/** Slim announcement strip above the header (text from Admin → Settings). */
export function AnnouncementBar({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="border-b bg-background text-foreground">
      <div className="container-page flex min-h-9 items-center justify-center gap-3 py-2 text-center text-xs">
        <span>{text}</span>
        <Link href="/pricing" className="hidden shrink-0 underline underline-offset-4 hover:no-underline md:inline">
          See pricing
        </Link>
      </div>
    </div>
  );
}
