"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordAction, type AuthState } from "@/lib/actions/auth";
import { FormField, fieldInputClass } from "@/components/auth/form-field";
import { useFormAction } from "@/components/auth/use-form-action";

type State = (AuthState & { sent?: boolean }) | undefined;

export function ForgotForm() {
  const { state, pending, onSubmit } = useFormAction<State>(forgotPasswordAction, undefined);

  if (state?.sent) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5 rounded-2xl border bg-card p-6 text-center shadow-premium">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="size-7" />
        </div>
        <div className="grid gap-1.5">
          <h2 className="text-xl font-semibold">Check your inbox</h2>
          <p className="text-sm text-muted-foreground">
            If an account exists for that email, we&apos;ve sent a link to reset your password. It expires in 1 hour. Check your spam folder if it doesn&apos;t arrive in a few minutes.
          </p>
        </div>
        <Button asChild variant="outline" className="h-11 rounded-xl">
          <Link href="/login">
            <ArrowLeft data-icon="inline-start" /> Back to sign in
          </Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      <FormField label="Email" htmlFor="email" error={state?.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" className={fieldInputClass} aria-invalid={!!state?.fieldErrors?.email} />
      </FormField>
      <Button type="submit" disabled={pending} className="h-11 rounded-xl text-[15px] shadow-glow">
        {pending && <Loader2 className="animate-spin" />}
        Send reset link
      </Button>
    </form>
  );
}
