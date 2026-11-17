import Link from "next/link";
import { Sparkles } from "lucide-react";

export function AnnouncementBar({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="relative overflow-hidden bg-ink-key text-white">
      <div className="pointer-events-none absolute inset-0 bg-ink-gradient opacity-25" />
      <div className="container-page relative flex h-9 items-center justify-center gap-2 text-center text-xs font-medium sm:text-[13px]">
        <Sparkles className="hidden size-3.5 shrink-0 text-ink-yellow sm:block" />
        <span className="truncate">{text}</span>
        <Link href="/pricing" className="hidden shrink-0 underline-offset-4 hover:underline md:inline">
          See pricing →
        </Link>
      </div>
    </div>
  );
}
