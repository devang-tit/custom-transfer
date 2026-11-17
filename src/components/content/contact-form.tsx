"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormError, FormField, fieldInputClass } from "@/components/auth/form-field";
import { useFormAction } from "@/components/auth/use-form-action";
import { submitContactAction, type ContactState } from "@/app/(store)/contact/actions";
import { CONTACT_SUBJECTS } from "@/components/content/contact-subjects";

export function ContactForm({
  defaults,
}: {
  defaults: { name?: string; email?: string; subject?: string; orderNumber?: string };
}) {
  const { state, pending, onSubmit } = useFormAction<ContactState>(submitContactAction, undefined);
  const [subject, setSubject] = useState<string>(defaults.subject ?? "");
  const fe = state?.fieldErrors;

  if (state?.ok) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid place-items-center gap-4 py-12 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-8" />
        </span>
        <div>
          <h3 className="text-2xl font-bold">Message sent!</h3>
          <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
            Thanks for reaching out. A member of our team will reply to your email within one business day.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      <FormError message={state?.error} />
      {/* Honeypot */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Name" htmlFor="name" error={fe?.name}>
          <Input id="name" name="name" defaultValue={defaults.name} autoComplete="name" className={fieldInputClass} aria-invalid={!!fe?.name} />
        </FormField>
        <FormField label="Email" htmlFor="email" error={fe?.email}>
          <Input id="email" name="email" type="email" defaultValue={defaults.email} autoComplete="email" className={fieldInputClass} aria-invalid={!!fe?.email} />
        </FormField>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Topic" htmlFor="subject" error={fe?.subject}>
          <Select name="subject" value={subject} onValueChange={setSubject}>
            <SelectTrigger id="subject" className="w-full rounded-xl bg-background px-3.5 text-[15px] data-[size=default]:h-11 dark:bg-input/20" aria-invalid={!!fe?.subject}>
              <SelectValue placeholder="What can we help with?" />
            </SelectTrigger>
            <SelectContent>
              {CONTACT_SUBJECTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={<>Order number <span className="font-normal text-muted-foreground">(optional)</span></>} htmlFor="orderNumber" error={fe?.orderNumber}>
          <Input id="orderNumber" name="orderNumber" defaultValue={defaults.orderNumber} placeholder="IF-10482" className={`${fieldInputClass} font-mono`} />
        </FormField>
      </div>
      <FormField label="Message" htmlFor="message" error={fe?.message}>
        <Textarea
          id="message"
          name="message"
          rows={6}
          placeholder="Tell us about your project, quantities, deadlines…"
          className="min-h-36 rounded-xl bg-background px-3.5 py-3 text-[15px] dark:bg-input/20"
          aria-invalid={!!fe?.message}
        />
      </FormField>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">We typically reply in under 4 hours during business hours.</p>
        <Button type="submit" disabled={pending} className="h-11 rounded-xl px-6 text-[15px] shadow-glow">
          {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Send data-icon="inline-start" />}
          Send message
        </Button>
      </div>
    </form>
  );
}
