import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResetForm } from "@/components/auth/reset-form";
import { findValidResetToken } from "@/lib/password-reset";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
  // Keep the token out of Referer headers.
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const valid = await findValidResetToken(token);

  if (!valid) {
    return (
      <div className="grid gap-8">
        <div className="grid gap-5 rounded-2xl border bg-card p-6 text-center shadow-premium">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <Link2Off className="size-7" />
          </div>
          <div className="grid gap-1.5">
            <h1 className="text-2xl font-bold">This link has expired</h1>
            <p className="text-sm text-muted-foreground">
              Reset links work once and expire after an hour. Requesting a new link also cancels older ones.
            </p>
          </div>
          <Button asChild className="h-11 rounded-xl shadow-glow">
            <Link href="/forgot-password">Send me a new link</Link>
          </Button>
        </div>
        <Link href="/login" className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold sm:text-4xl">Choose a new password</h1>
        <p className="text-muted-foreground">
          For <span className="font-medium text-foreground">{valid.user.email}</span>. You&apos;ll be signed out everywhere else.
        </p>
      </div>
      <ResetForm token={token} email={valid.user.email} />
      <Link href="/login" className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
    </div>
  );
}
