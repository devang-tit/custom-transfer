"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction, type AuthState } from "@/lib/actions/auth";
import { FormError, FormField, fieldInputClass } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";

/** Demo credentials only work on a locally seeded database, so the helper is hidden in production builds. */
const SHOW_DEMO_ACCOUNTS = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === "true";

const DEMO = [
  { role: "Customer", email: "customer@inkforge.test", password: "Customer@123" },
  { role: "Admin", email: "admin@inkforge.test", password: "Admin@12345" },
];

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(loginAction, undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showDemo, setShowDemo] = useState(SHOW_DEMO_ACCOUNTS);

  return (
    <div className="grid gap-6">
      {showDemo && (
        <div className="relative rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
          <button
            type="button"
            onClick={() => setShowDemo(false)}
            className="absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Dismiss demo accounts"
          >
            <X className="size-3.5" />
          </button>
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="size-4 text-primary" /> Demo accounts
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Click to fill the form instantly.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {DEMO.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.password);
                }}
                className="rounded-xl border bg-background px-3 py-2 text-left transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <span className="block text-xs font-semibold">{d.role}</span>
                <span className="block truncate font-mono text-[11px] text-muted-foreground">{d.email}</span>
                <span className="block font-mono text-[11px] text-muted-foreground">{d.password}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form action={formAction} className="grid gap-5" noValidate>
        <input type="hidden" name="next" value={next ?? ""} />
        <FormError message={state?.error} />
        <FormField label="Email" htmlFor="email" error={state?.fieldErrors?.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!state?.fieldErrors?.email}
            className={fieldInputClass}
            required
          />
        </FormField>
        <FormField
          label="Password"
          htmlFor="password"
          error={state?.fieldErrors?.password}
          action={
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!state?.fieldErrors?.password}
            required
          />
        </FormField>
        <Button type="submit" disabled={pending} className="h-11 rounded-xl text-[15px] shadow-glow">
          {pending ? <Loader2 className="animate-spin" /> : null}
          Sign in
          {!pending && <ArrowRight data-icon="inline-end" />}
        </Button>
      </form>
    </div>
  );
}
