"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { subscribeNewsletter, type NewsletterState } from "@/app/(store)/_actions/newsletter";
import { cn } from "@/lib/utils";

export function NewsletterForm({ className, tone = "default" }: { className?: string; tone?: "default" | "inverted" }) {
  // Controlled so React 19's post-action form reset can't wipe the email on errors.
  const [email, setEmail] = useState("");
  const [state, action, pending] = useActionState<NewsletterState, FormData>(async (prev, fd) => {
    const res = await subscribeNewsletter(prev, fd);
    if (res?.ok) {
      toast.success("You’re on the list! Watch your inbox for drops & deals.");
      setEmail("");
    } else if (res?.error) toast.error(res.error);
    return res;
  }, undefined);

  return (
    <form action={action} className={cn("relative flex w-full max-w-md items-center", className)}>
      <label htmlFor="newsletter-email" className="sr-only">Email address</label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="you@brand.com"
        className={cn(
          "h-12 w-full rounded-[0.875rem] border pr-32 pl-4 text-sm outline-none transition-shadow focus-visible:ring-2",
          tone === "inverted" ? "border-white/30 bg-transparent text-white placeholder:text-white/50 focus-visible:ring-white/60" : "bg-background focus-visible:ring-ring/40"
        )}
      />
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "absolute right-1.5 inline-flex h-9 items-center gap-1.5 rounded-[0.625rem] px-3.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60",
          tone === "inverted" ? "bg-white text-black" : "bg-primary text-primary-foreground"
        )}
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : state?.ok ? <Check className="size-4" /> : null}
        Subscribe
        {!pending && !state?.ok && <ArrowRight className="size-3.5" />}
      </button>
    </form>
  );
}
