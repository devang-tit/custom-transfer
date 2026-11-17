"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { resetPasswordAction, type ResetState } from "@/lib/actions/auth";
import { FormError, FormField } from "@/components/auth/form-field";
import { PasswordInput, PasswordStrength } from "@/components/auth/password-input";
import { useFormAction } from "@/components/auth/use-form-action";

export function ResetForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const { state, pending, onSubmit } = useFormAction<ResetState>(resetPasswordAction, undefined);

  if (state?.ok) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5 rounded-2xl border bg-card p-6 text-center shadow-premium">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="size-7" />
        </div>
        <div className="grid gap-1.5">
          <h2 className="text-xl font-semibold">Password updated</h2>
          <p className="text-sm text-muted-foreground">You&apos;re signed in. For your security, other devices have been signed out and we&apos;ve emailed you a confirmation.</p>
        </div>
        <Button
          className="h-11 rounded-xl"
          onClick={() => {
            router.push(state.redirectTo ?? "/account");
            router.refresh();
          }}
        >
          Continue to your account <ArrowRight data-icon="inline-end" />
        </Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      <input type="hidden" name="token" value={token} />
      {/* Lets password managers save the new password against the right account. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <FormError message={state?.error} />
      <FormField label="New password" htmlFor="password" error={state?.fieldErrors?.password}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!state?.fieldErrors?.password}
        />
      </FormField>
      <PasswordStrength password={password} />
      <FormField label="Confirm new password" htmlFor="confirmPassword" error={state?.fieldErrors?.confirmPassword}>
        <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" aria-invalid={!!state?.fieldErrors?.confirmPassword} />
      </FormField>
      <Button type="submit" disabled={pending} className="h-11 rounded-xl text-[15px] shadow-glow">
        {pending && <Loader2 className="animate-spin" />}
        Update password
      </Button>
    </form>
  );
}
