"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2, Megaphone, Store, Receipt, Truck, Mail, Send, ServerCog, CreditCard, CircleCheck, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Panel } from "@/components/admin/page-header";
import { computeTotals } from "@/lib/pricing";
import { formatMoney, slugify } from "@/lib/format";
import type { StoreSettings } from "@/lib/types";
import type { StripeStatus } from "@/lib/stripe-webhook";
import { ORDER_STATUS_META, type OrderStatus } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import { saveStoreSettings, sendTestEmailAction } from "./actions";

type MethodRow = { id: string; label: string; description: string; price: string; freeEligible: boolean };

/** Statuses a customer can be emailed about, in lifecycle order. */
const EMAILABLE_STATUSES: OrderStatus[] = ["ARTWORK_REVIEW", "IN_PRODUCTION", "QUALITY_CHECK", "READY", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

type EmailInfo = { mode: "smtp" | "outbox"; host?: string; from: string };

export function SettingsForm({ initial, readOnly, email, stripe }: { initial: StoreSettings; readOnly: boolean; email: EmailInfo; stripe: StripeStatus }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [s, setS] = useState({
    storeName: initial.storeName,
    supportEmail: initial.supportEmail,
    supportPhone: initial.supportPhone,
    orderPrefix: initial.orderPrefix,
    taxRate: String(initial.taxRate),
    freeShippingThreshold: (initial.freeShippingThreshold / 100).toFixed(2),
    rushFeePct: String(initial.rushFeePct),
    announcement: initial.announcement,
    announcementEnabled: initial.announcementEnabled,
  });
  const [methods, setMethods] = useState<MethodRow[]>(
    initial.shippingMethods.map((m) => ({ id: m.id, label: m.label, description: m.description, price: (m.price / 100).toFixed(2), freeEligible: !!m.freeEligible }))
  );
  const [notif, setNotif] = useState(initial.notifications);
  const [testTo, setTestTo] = useState(initial.notifications.adminEmail || initial.supportEmail);
  const [testing, startTest] = useTransition();
  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => setS((p) => ({ ...p, [k]: v }));
  const setN = <K extends keyof typeof notif>(k: K, v: (typeof notif)[K]) => setNotif((p) => ({ ...p, [k]: v }));
  const toggleStatus = (st: string) =>
    setNotif((p) => ({ ...p, statusEmailFor: p.statusEmailFor.includes(st) ? p.statusEmailFor.filter((x) => x !== st) : [...p.statusEmailFor, st] }));
  const cents = (v: string) => Math.round((parseFloat(v) || 0) * 100);

  const payload = {
    storeName: s.storeName,
    supportEmail: s.supportEmail,
    supportPhone: s.supportPhone,
    orderPrefix: s.orderPrefix.toUpperCase(),
    taxRate: Number(s.taxRate) || 0,
    freeShippingThreshold: cents(s.freeShippingThreshold),
    rushFeePct: Number(s.rushFeePct) || 0,
    announcement: s.announcement,
    announcementEnabled: s.announcementEnabled,
    shippingMethods: methods.map((m) => ({ id: m.id || slugify(m.label), label: m.label, description: m.description, price: cents(m.price), freeEligible: m.freeEligible })),
    notifications: { ...notif, adminEmail: notif.adminEmail.trim(), statusEmailFor: EMAILABLE_STATUSES.filter((st) => notif.statusEmailFor.includes(st)) },
  };
  // Example checkout to make the numbers tangible.
  const example = computeTotals({ subtotal: 6000, settings: { ...initial, ...payload }, shippingMethodId: payload.shippingMethods[0]?.id, rush: true });

  return (
    <form
      className="space-y-4 pb-10"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveStoreSettings(payload);
          if (r.ok) {
            toast.success(r.message);
            router.refresh();
          } else toast.error(r.error);
        });
      }}
    >
      <fieldset disabled={readOnly || pending} className="space-y-4">
        {readOnly && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300">Only administrators can change store settings.</p>}
        <Panel title={<Title icon={Store}>Store details</Title>} description="Shown on invoices, emails and the storefront.">
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Store name"><Input value={s.storeName} onChange={(e) => set("storeName", e.target.value)} /></F>
            <F label="Order number prefix" hint={`Next orders look like ${s.orderPrefix || "IF"}-10234`}>
              <Input value={s.orderPrefix} onChange={(e) => set("orderPrefix", e.target.value.toUpperCase())} maxLength={6} className="font-mono" />
            </F>
            <F label="Support email"><Input type="email" value={s.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} /></F>
            <F label="Support phone"><Input value={s.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} /></F>
          </div>
        </Panel>

        <Panel title={<Title icon={Receipt}>Checkout</Title>} description="Tax, rush production and the free-shipping threshold.">
          <div className="grid gap-4 sm:grid-cols-3">
            <F label="Tax rate (%)"><Input type="number" step="0.01" min={0} max={30} value={s.taxRate} onChange={(e) => set("taxRate", e.target.value)} /></F>
            <F label="Rush fee (% of subtotal)"><Input type="number" step="1" min={0} value={s.rushFeePct} onChange={(e) => set("rushFeePct", e.target.value)} /></F>
            <F label="Free shipping over ($)" hint="Applies to methods marked eligible.">
              <Input type="number" step="0.01" min={0} value={s.freeShippingThreshold} onChange={(e) => set("freeShippingThreshold", e.target.value)} />
            </F>
          </div>
          <div className="mt-4 rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
            Example: a {formatMoney(6000)} cart with rush via {payload.shippingMethods[0]?.label ?? "first method"} → shipping{" "}
            <span className="font-medium text-foreground">{example.shipping ? formatMoney(example.shipping) : "free"}</span>, rush{" "}
            <span className="font-medium text-foreground">{formatMoney(example.rushFee)}</span>, tax <span className="font-medium text-foreground">{formatMoney(example.tax)}</span>, total{" "}
            <span className="font-semibold text-foreground">{formatMoney(example.total)}</span>.
          </div>
        </Panel>

        <Panel
          title={<Title icon={Truck}>Shipping methods</Title>}
          description="Shown at checkout in this order."
          action={
            <Button type="button" variant="outline" size="sm" onClick={() => setMethods((m) => [...m, { id: "", label: "", description: "", price: "0.00", freeEligible: false }])}>
              <Plus /> Add method
            </Button>
          }
          bodyClassName="p-0"
        >
          <div className="hidden grid-cols-[1fr_1.4fr_110px_110px_40px] gap-3 border-b bg-muted/40 px-5 py-2 text-xs font-medium text-muted-foreground md:grid">
            <span>Name</span>
            <span>Description</span>
            <span>Price</span>
            <span>Free over threshold</span>
            <span />
          </div>
          <ul className="divide-y">
            {methods.map((m, i) => (
              <li key={i} className="grid gap-3 px-5 py-3 md:grid-cols-[1fr_1.4fr_110px_110px_40px] md:items-center">
                <div className="space-y-1">
                  <Input aria-label="Method name" value={m.label} placeholder="Standard" onChange={(e) => setMethods((all) => all.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  <Input
                    aria-label="Method id"
                    value={m.id}
                    placeholder={slugify(m.label) || "id"}
                    onChange={(e) => setMethods((all) => all.map((x, j) => (j === i ? { ...x, id: slugify(e.target.value) } : x)))}
                    className="h-7 font-mono text-xs"
                  />
                </div>
                <Input aria-label="Description" value={m.description} placeholder="3–5 business days" onChange={(e) => setMethods((all) => all.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input aria-label="Price" type="number" step="0.01" min={0} value={m.price} onChange={(e) => setMethods((all) => all.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} className="pl-6" />
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground md:justify-center">
                  <Switch checked={m.freeEligible} onCheckedChange={(v) => setMethods((all) => all.map((x, j) => (j === i ? { ...x, freeEligible: v } : x)))} />
                  <span className="md:sr-only">Free over threshold</span>
                </label>
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${m.label || "method"}`} disabled={methods.length <= 1} onClick={() => setMethods((all) => all.filter((_, j) => j !== i))}>
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={<Title icon={CreditCard}>Payments</Title>} description="Stripe Checkout status. Keys are managed in your hosting environment variables.">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <StatusRow
              ok={stripe.enabled}
              label={stripe.enabled ? `Stripe connected${stripe.mode !== "unknown" ? ` · ${stripe.mode} mode` : ""}` : "Demo card payments"}
              hint={stripe.enabled ? "Customers pay on Stripe’s secure checkout page." : "Set STRIPE_SECRET_KEY to take real payments."}
            />
            {stripe.enabled && (
              <StatusRow
                ok={!!stripe.webhook}
                label={stripe.webhook ? "Webhook connected" : "Webhook not connected"}
                hint={
                  stripe.webhook?.source === "env"
                    ? "Using STRIPE_WEBHOOK_SECRET."
                    : stripe.webhook
                      ? `${stripe.webhook.url} · set up automatically on deploy`
                      : "Deploy to production with NEXT_PUBLIC_SITE_URL set and it’s created automatically."
                }
              />
            )}
          </div>
        </Panel>

        <Panel
          title={<Title icon={Mail}>Email notifications</Title>}
          description="Automatic emails for orders. Every email is recorded in the Email log."
        >
          <div className="space-y-5">
            <div
              className={cn(
                "flex flex-col gap-3 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between",
                email.mode === "smtp" ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"
              )}
            >
              <div className="flex items-start gap-2.5">
                <ServerCog className={cn("mt-0.5 size-4 shrink-0", email.mode === "smtp" ? "text-emerald-600" : "text-amber-600")} />
                <div>
                  <p className="font-medium">{email.mode === "smtp" ? `Sending through SMTP (${email.host})` : "Dev outbox: emails are saved, not sent"}</p>
                  <p className="text-xs text-muted-foreground">
                    {email.mode === "smtp" ? (
                      <>From <span className="font-mono">{email.from}</span>. Replies go to the support email.</>
                    ) : (
                      <>Set <span className="font-mono">SMTP_HOST</span>, <span className="font-mono">SMTP_USER</span>, <span className="font-mono">SMTP_PASS</span> and <span className="font-mono">EMAIL_FROM</span> in .env to deliver real email.</>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Input type="email" aria-label="Send test email to" value={testTo} onChange={(e) => setTestTo(e.target.value)} className="h-8 w-52" />
                <Button
                  type="button"
                  variant="outline"
                  disabled={testing || !testTo}
                  onClick={() =>
                    startTest(async () => {
                      const r = await sendTestEmailAction({ to: testTo });
                      if (r.ok) toast.success(r.message);
                      else toast.error(r.error);
                    })
                  }
                >
                  {testing ? <Loader2 className="animate-spin" /> : <Send />} Send test
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">To customers</p>
              <Toggle label="Order confirmation" hint="Receipt with items and totals when payment succeeds." checked={notif.customerOrderConfirmation} onChange={(v) => setN("customerOrderConfirmation", v)} />
              <Toggle
                label="Status updates"
                hint="Sent when your team changes an order’s status with “notify customer” on. Waits 10s so an Undo cancels it."
                checked={notif.customerStatusUpdates}
                onChange={(v) => setN("customerStatusUpdates", v)}
              />
              {notif.customerStatusUpdates && (
                <div className="ml-0.5 border-l-2 pt-1 pb-2 pl-4">
                  <div className="flex flex-wrap gap-1.5">
                    {EMAILABLE_STATUSES.map((st) => {
                      const on = notif.statusEmailFor.includes(st);
                      return (
                        <button
                          key={st}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleStatus(st)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                            on ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {ORDER_STATUS_META[st].label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">“Ready” emails go to local-pickup orders only. Shipped orders get the “Shipped” email with tracking instead.</p>
                </div>
              )}
              <Toggle label="Artwork change requests" hint="When prepress marks artwork as “needs changes”, with your note." checked={notif.customerArtworkChanges} onChange={(v) => setN("customerArtworkChanges", v)} />
              <Toggle label="Team updates" hint="When you post an order note with “visible to customer” on." checked={notif.customerOrderUpdates} onChange={(v) => setN("customerOrderUpdates", v)} />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">To your team</p>
              <Toggle label="New order alert" hint="An email for every paid order, flagged when it’s a rush." checked={notif.adminNewOrder} onChange={(v) => setN("adminNewOrder", v)} />
              {notif.adminNewOrder && (
                <div className="max-w-sm pt-1">
                  <F label="Send alerts to" hint={`Leave blank to use the support email (${s.supportEmail || "not set"}).`}>
                    <Input type="email" value={notif.adminEmail} placeholder={s.supportEmail} onChange={(e) => setN("adminEmail", e.target.value)} />
                  </F>
                </div>
              )}
            </div>
          </div>
        </Panel>

        <Panel title={<Title icon={Megaphone}>Announcement bar</Title>} description="The slim banner at the very top of the storefront.">
          <div className="space-y-3">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">Show announcement</span>
              <Switch checked={s.announcementEnabled} onCheckedChange={(v) => set("announcementEnabled", v)} />
            </label>
            <Input value={s.announcement} onChange={(e) => set("announcement", e.target.value)} maxLength={200} />
            {s.announcementEnabled && s.announcement && (
              <div className="rounded-lg bg-ink-key px-4 py-2 text-center text-xs font-medium text-white">{s.announcement}</div>
            )}
          </div>
        </Panel>
      </fieldset>

      {!readOnly && (
        <div className="sticky bottom-4 z-10 flex justify-end">
          <Button type="submit" size="lg" disabled={pending} className="shadow-glow">
            {pending ? <Loader2 className="animate-spin" /> : <Save />} Save settings
          </Button>
        </div>
      )}
    </form>
  );
}

function StatusRow({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg border p-3", ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5")}>
      {ok ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />}
      <div className="min-w-0">
        <p className="font-medium">{label}</p>
        <p className="truncate text-xs text-muted-foreground" title={hint}>{hint}</p>
      </div>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg py-2">
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5" />
    </label>
  );
}

function F({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px]">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Title({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground" /> {children}
    </span>
  );
}
