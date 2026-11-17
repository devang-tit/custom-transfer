"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { registerAction, type AuthState } from "@/lib/actions/auth";
import { FormError, FormField, fieldInputClass } from "@/components/auth/form-field";
import { PasswordInput, PasswordStrength } from "@/components/auth/password-input";

export function RegisterForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(registerAction, undefined);
  const [values, setValues] = useState({ name: "", email: "", company: "", password: "" });
  const [optIn, setOptIn] = useState(true);
  const fe = state?.fieldErrors;
  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [k]: e.target.value }));

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      {optIn && <input type="hidden" name="marketingOptIn" value="on" />}
      <FormError message={state?.error} />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="name" error={fe?.name}>
          <Input id="name" name="name" autoComplete="name" placeholder="Riley Carter" value={values.name} onChange={set("name")} aria-invalid={!!fe?.name} className={fieldInputClass} />
        </FormField>
        <FormField label={<>Company <span className="font-normal text-muted-foreground">(optional)</span></>} htmlFor="company" error={fe?.company}>
          <Input id="company" name="company" autoComplete="organization" placeholder="Print shop or brand" value={values.company} onChange={set("company")} className={fieldInputClass} />
        </FormField>
      </div>
      <FormField label="Email" htmlFor="email" error={fe?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" value={values.email} onChange={set("email")} aria-invalid={!!fe?.email} className={fieldInputClass} />
      </FormField>
      <FormField label="Password" htmlFor="password" error={fe?.password}>
        <PasswordInput id="password" name="password" autoComplete="new-password" placeholder="At least 8 characters" value={values.password} onChange={set("password")} aria-invalid={!!fe?.password} />
        <PasswordStrength password={values.password} />
      </FormField>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-muted/40 p-3.5 text-sm">
        <Checkbox checked={optIn} onCheckedChange={(v) => setOptIn(v === true)} className="mt-0.5" />
        <span>
          <span className="font-medium">Send me deals & new product drops</span>
          <span className="block text-xs text-muted-foreground">Members get early access to sales. Unsubscribe anytime.</span>
        </span>
      </label>
      <Button type="submit" disabled={pending} className="h-11 rounded-xl text-[15px] shadow-glow">
        {pending ? <Loader2 className="animate-spin" /> : null}
        Create account
        {!pending && <ArrowRight data-icon="inline-end" />}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">Terms</Link> and{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>.
      </p>
    </form>
  );
}
