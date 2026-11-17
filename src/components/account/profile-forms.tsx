"use client";

import { useEffect, useState } from "react";
import { useFormAction } from "@/components/auth/use-form-action";
import { KeyRound, Loader2, ShieldAlert, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FormError, FormField, fieldInputClass } from "@/components/auth/form-field";
import { PasswordInput, PasswordStrength } from "@/components/auth/password-input";
import { changePasswordAction, updateProfileAction, type FormState } from "@/app/(store)/account/actions";

function useToastOnSuccess(state: FormState, after?: () => void) {
  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message ?? "Saved");
      after?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}

function Card({ icon: Icon, title, description, children }: { icon: typeof UserRound; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 rounded-2xl border bg-card p-5 sm:p-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <div>
        <span className="mb-3 grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-4.5" />
        </span>
        <h3 className="font-heading font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}

export function ProfileForm({
  user,
}: {
  user: { name: string; email: string; phone: string | null; company: string | null; marketingOptIn: boolean };
}) {
  const { state, pending, onSubmit } = useFormAction<FormState>(updateProfileAction, undefined);
  const [optIn, setOptIn] = useState(user.marketingOptIn);
  useToastOnSuccess(state);
  const fe = state?.fieldErrors;

  return (
    <Card icon={UserRound} title="Personal details" description="Used on invoices and shipping labels.">
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        {optIn && <input type="hidden" name="marketingOptIn" value="on" />}
        <FormError message={state?.error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full name" htmlFor="name" error={fe?.name}>
            <Input id="name" name="name" defaultValue={user.name} autoComplete="name" className={fieldInputClass} />
          </FormField>
          <FormField label="Email" htmlFor="email" hint="Contact support to change your email.">
            <Input id="email" value={user.email} disabled className={fieldInputClass} />
          </FormField>
          <FormField label="Phone" htmlFor="phone" error={fe?.phone}>
            <Input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ""} autoComplete="tel" placeholder="(555) 555-0100" className={fieldInputClass} />
          </FormField>
          <FormField label="Company" htmlFor="company" error={fe?.company}>
            <Input id="company" name="company" defaultValue={user.company ?? ""} autoComplete="organization" className={fieldInputClass} />
          </FormField>
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border bg-muted/30 p-4">
          <span>
            <span className="block text-sm font-medium">Deals & product drops</span>
            <span className="block text-xs text-muted-foreground">Occasional emails about sales, new finishes and restocks.</span>
          </span>
          <Switch checked={optIn} onCheckedChange={setOptIn} />
        </label>
        <div className="flex justify-end">
          <Button type="submit" disabled={pending} className="h-10 rounded-xl px-5">
            {pending && <Loader2 className="animate-spin" />} Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function PasswordForm() {
  const { state, pending, onSubmit } = useFormAction<FormState>(changePasswordAction, undefined);
  const [formKey, setFormKey] = useState(0);
  const [pw, setPw] = useState("");
  useToastOnSuccess(state, () => {
    setPw("");
    setFormKey((k) => k + 1);
  });
  const fe = state?.fieldErrors;

  return (
    <Card icon={KeyRound} title="Password" description="Use a strong password you don't use anywhere else.">
      <form key={formKey} onSubmit={onSubmit} className="grid gap-4" noValidate>
        <FormField label="Current password" htmlFor="currentPassword" error={fe?.currentPassword}>
          <PasswordInput id="currentPassword" name="currentPassword" autoComplete="current-password" aria-invalid={!!fe?.currentPassword} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="New password" htmlFor="newPassword" error={fe?.newPassword}>
            <PasswordInput id="newPassword" name="newPassword" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} aria-invalid={!!fe?.newPassword} />
          </FormField>
          <FormField label="Confirm new password" htmlFor="confirmPassword" error={fe?.confirmPassword}>
            <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" aria-invalid={!!fe?.confirmPassword} />
          </FormField>
        </div>
        <PasswordStrength password={pw} />
        <div className="flex justify-end">
          <Button type="submit" disabled={pending} className="h-10 rounded-xl px-5">
            {pending && <Loader2 className="animate-spin" />} Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function DangerZone() {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-destructive/25 bg-destructive/[0.03] p-5 sm:flex-row sm:items-center sm:p-6">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
        <ShieldAlert className="size-4.5" />
      </span>
      <div className="flex-1">
        <h3 className="font-heading font-semibold">Delete account</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Permanently remove your account, saved designs and addresses. Order records are kept for tax purposes. Contact support to request deletion.
        </p>
      </div>
      <Button asChild variant="destructive" className="h-10 rounded-xl px-4">
        <a href="/contact?subject=account">Request deletion</a>
      </Button>
    </section>
  );
}
