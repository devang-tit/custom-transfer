"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronLeft, CreditCard, Flame, Lock, LoaderCircle, Mail, MapPin, Pencil, ShieldCheck, ShoppingBag, Truck, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { useCart, cartSubtotal } from "@/stores/cart";
import { computeTotals } from "@/lib/pricing";
import { formatMoney } from "@/lib/format";
import type { AddressInput, StoreSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { placeOrder } from "@/app/(store)/_actions/checkout";
import { useHydrated } from "../use-hydrated";
import { CouponInput } from "./coupon-input";
import { TotalsTable } from "./totals";
import { useCoupon } from "./use-coupon";
import { cardBrand, formatCardNumber, formatExpiry, luhnValid, expiryValid } from "./card-utils";
import { PaymentBadges } from "../social-icons";

type Prefill = { email: string; name: string; phone: string; address: Partial<AddressInput> | null; signedIn: boolean };

const STEPS = [
  { id: "contact", label: "Contact", icon: Mail },
  { id: "shipping", label: "Address", icon: MapPin },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "payment", label: "Payment", icon: CreditCard },
] as const;

export function CheckoutFlow({ settings, prefill, stripe, canceled }: { settings: StoreSettings; prefill: Prefill; stripe: boolean; canceled?: string }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const items = useCart((s) => s.items);
  const couponCode = useCart((s) => s.couponCode);
  const subtotal = cartSubtotal(hydrated ? items : []);
  const { coupon, description, error: couponError } = useCoupon(subtotal);

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contact, setContact] = useState({ email: prefill.email, name: prefill.name, phone: prefill.phone });
  const [address, setAddress] = useState<AddressInput>({
    name: prefill.address?.name ?? prefill.name,
    company: prefill.address?.company ?? "",
    line1: prefill.address?.line1 ?? "",
    line2: prefill.address?.line2 ?? "",
    city: prefill.address?.city ?? "",
    state: prefill.address?.state ?? "",
    zip: prefill.address?.zip ?? "",
    country: prefill.address?.country ?? "US",
  });
  const [shippingMethod, setShippingMethod] = useState(settings.shippingMethods[0]?.id ?? "standard");
  const [rush, setRush] = useState(false);
  const [notes, setNotes] = useState("");
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "", name: "" });
  const [pending, start] = useTransition();

  const totals = useMemo(
    () => computeTotals({ subtotal, settings, shippingMethodId: shippingMethod, coupon, rush }),
    [subtotal, settings, shippingMethod, coupon, rush]
  );

  if (!hydrated) return <div className="container-page min-h-[60vh] py-16"><div className="h-10 w-56 animate-pulse rounded-xl bg-muted" /></div>;
  if (!items.length) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Nothing to check out yet"
          description="Your cart is empty. Add some transfers or build a gang sheet first."
          action={<Button asChild className="h-11 rounded-xl px-5"><Link href="/shop">Browse products</Link></Button>}
        />
      </div>
    );
  }

  function validate(i: number): boolean {
    const e: Record<string, string> = {};
    if (i === 0) {
      if (!/^\S+@\S+\.\S+$/.test(contact.email)) e.email = "Enter a valid email";
      if (contact.name.trim().length < 2) e.name = "Enter your full name";
    }
    if (i === 1) {
      (["name", "line1", "city", "state", "zip"] as const).forEach((k) => {
        if (!String(address[k] ?? "").trim()) e[`address.${k}`] = "Required";
      });
    }
    if (i === 3 && !stripe) {
      if (!luhnValid(card.number)) e.cardNumber = "Invalid card number";
      if (!expiryValid(card.expiry)) e.expiry = "Invalid expiry";
      if (!/^\d{3,4}$/.test(card.cvc)) e.cvc = "Invalid CVC";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const next = (i: number) => {
    if (!validate(i)) return;
    if (i === 0 && !address.name.trim()) setAddress((a) => ({ ...a, name: contact.name }));
    setStep(i + 1);
  };

  const submit = () => {
    if (!validate(0)) return setStep(0);
    if (!validate(1)) return setStep(1);
    if (!validate(3)) return;
    start(async () => {
      const res = await placeOrder({
        contact: { email: contact.email, name: contact.name, phone: contact.phone || undefined },
        address: { ...address, company: address.company || undefined, line2: address.line2 || undefined },
        shippingMethod,
        rush,
        notes: notes || undefined,
        couponCode: couponCode && coupon ? couponCode : undefined,
        items: items.map((i) => ({
          productId: i.productId,
          selection: i.selection,
          artworkUrl: i.artworkUrl,
          artworkName: i.artworkName,
          designId: i.designId,
          image: i.image,
          notes: i.notes,
        })),
        payment: stripe ? { method: "stripe" } : { method: "demo", cardNumber: card.number.replace(/\s/g, ""), expiry: card.expiry.replace(/\s/g, ""), cvc: card.cvc },
      });
      if (!res.ok) {
        toast.error(res.error);
        const f = res.field ?? "";
        if (f.startsWith("contact")) setStep(0);
        else if (f.startsWith("address")) setStep(1);
        else if (f === "shippingMethod") setStep(2);
        else if (f.startsWith("payment")) setErrors({ [f.replace("payment.", "")]: res.error });
        return;
      }
      if (res.external) window.location.href = res.url;
      else router.push(res.url);
    });
  };

  const method = settings.shippingMethods.find((m) => m.id === shippingMethod);

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="flex items-center justify-between gap-4">
        <Link href="/cart" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="size-4" /> Back to cart</Link>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Lock className="size-3.5" /> SSL secured checkout</span>
      </div>
      <h1 className="mt-4 text-4xl font-bold">Checkout</h1>

      {canceled && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p>Payment for order <strong>{canceled}</strong> was canceled. Your cart is still here — you can try again whenever you’re ready.</p>
        </div>
      )}

      <ol className="mt-8 grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              disabled={i > step}
              onClick={() => i < step && setStep(i)}
              className={cn("flex w-full flex-col gap-2 text-left", i < step && "cursor-pointer")}
            >
              <span className={cn("h-1 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-border")} />
              <span className={cn("flex items-center gap-1.5 text-xs font-semibold sm:text-sm", i <= step ? "text-foreground" : "text-muted-foreground")}>
                {i < step ? <Check className="size-3.5 text-primary" /> : <s.icon className="hidden size-3.5 sm:block" />}
                {s.label}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_25rem]">
        <div className="space-y-4">
          {/* Contact */}
          <StepCard index={0} step={step} title="Contact information" onEdit={() => setStep(0)} summary={<>{contact.name} · {contact.email}</>}>
            {!prefill.signedIn && (
              <p className="text-sm text-muted-foreground">
                Have an account? <Link href="/login?next=/checkout" className="font-semibold text-primary hover:underline">Sign in</Link> for faster checkout and order history.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" error={errors.email} className="sm:col-span-2">
                <Input type="email" autoComplete="email" value={contact.email} onChange={(e) => { const v = e.target.value; setContact((prev) => ({ ...prev, email: v })); }} className="h-11 rounded-xl" />
              </Field>
              <Field label="Full name" error={errors.name}>
                <Input autoComplete="name" value={contact.name} onChange={(e) => { const v = e.target.value; setContact((prev) => ({ ...prev, name: v })); }} className="h-11 rounded-xl" />
              </Field>
              <Field label="Phone (optional)">
                <Input type="tel" autoComplete="tel" value={contact.phone} onChange={(e) => { const v = e.target.value; setContact((prev) => ({ ...prev, phone: v })); }} className="h-11 rounded-xl" />
              </Field>
            </div>
            <StepActions onNext={() => next(0)} />
          </StepCard>

          {/* Address */}
          <StepCard
            index={1}
            step={step}
            title="Shipping address"
            onEdit={() => setStep(1)}
            summary={<>{address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.zip}</>}
          >
            <div className="grid gap-4 sm:grid-cols-6">
              <Field label="Recipient name" error={errors["address.name"]} className="sm:col-span-3">
                <Input autoComplete="shipping name" value={address.name} onChange={(e) => { const v = e.target.value; setAddress((prev) => ({ ...prev, name: v })); }} className="h-11 rounded-xl" />
              </Field>
              <Field label="Company (optional)" className="sm:col-span-3">
                <Input autoComplete="shipping organization" value={address.company} onChange={(e) => { const v = e.target.value; setAddress((prev) => ({ ...prev, company: v })); }} className="h-11 rounded-xl" />
              </Field>
              <Field label="Street address" error={errors["address.line1"]} className="sm:col-span-4">
                <Input autoComplete="shipping address-line1" value={address.line1} onChange={(e) => { const v = e.target.value; setAddress((prev) => ({ ...prev, line1: v })); }} className="h-11 rounded-xl" />
              </Field>
              <Field label="Apt / suite" className="sm:col-span-2">
                <Input autoComplete="shipping address-line2" value={address.line2} onChange={(e) => { const v = e.target.value; setAddress((prev) => ({ ...prev, line2: v })); }} className="h-11 rounded-xl" />
              </Field>
              <Field label="City" error={errors["address.city"]} className="sm:col-span-2">
                <Input autoComplete="shipping address-level2" value={address.city} onChange={(e) => { const v = e.target.value; setAddress((prev) => ({ ...prev, city: v })); }} className="h-11 rounded-xl" />
              </Field>
              <Field label="State" error={errors["address.state"]} className="sm:col-span-1">
                <Input autoComplete="shipping address-level1" value={address.state} maxLength={30} onChange={(e) => { const v = e.target.value; setAddress((prev) => ({ ...prev, state: v })); }} className="h-11 rounded-xl" />
              </Field>
              <Field label="ZIP" error={errors["address.zip"]} className="sm:col-span-1">
                <Input autoComplete="shipping postal-code" value={address.zip} onChange={(e) => { const v = e.target.value; setAddress((prev) => ({ ...prev, zip: v })); }} className="h-11 rounded-xl" />
              </Field>
              <Field label="Country" className="sm:col-span-2">
                <select
                  value={address.country}
                  onChange={(e) => { const v = e.target.value; setAddress((prev) => ({ ...prev, country: v })); }}
                  className="h-11 w-full rounded-xl border bg-transparent px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40 dark:bg-input/30"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                </select>
              </Field>
            </div>
            <StepActions onBack={() => setStep(0)} onNext={() => next(1)} />
          </StepCard>

          {/* Delivery */}
          <StepCard index={2} step={step} title="Delivery & production" onEdit={() => setStep(2)} summary={<>{method?.label} · {rush ? "Rush production" : "Standard production"}</>}>
            <div className="grid gap-2 sm:grid-cols-2">
              {settings.shippingMethods.map((m) => {
                const free = m.freeEligible && subtotal - totals.discount >= settings.freeShippingThreshold;
                const on = m.id === shippingMethod;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setShippingMethod(m.id)}
                    className={cn("flex items-start gap-3 rounded-2xl border bg-card p-4 text-left transition-all hover:border-primary/50", on && "border-primary bg-primary/5 ring-1 ring-primary")}
                  >
                    <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border", on ? "border-primary bg-primary" : "border-input")}>
                      {on && <span className="size-1.5 rounded-full bg-primary-foreground" />}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{m.label}</span>
                      <span className="block text-xs text-muted-foreground">{m.description}</span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{m.price === 0 || free ? <span className="text-success">Free</span> : formatMoney(m.price)}</span>
                  </button>
                );
              })}
            </div>
            <label className={cn("flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors", rush ? "border-ink-magenta/40 bg-ink-magenta/5" : "bg-card")}>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink-magenta/15 text-ink-magenta"><Flame className="size-5" /></span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">Rush production (+{settings.rushFeePct}%)</span>
                <span className="block text-xs text-muted-foreground">Jump the queue — printed within 4 business hours of artwork approval.</span>
              </span>
              <Switch checked={rush} onCheckedChange={setRush} aria-label="Rush production" />
            </label>
            <Field label="Order notes (optional)">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={1000} placeholder="Deadlines, delivery instructions, anything we should know" className="rounded-xl" />
            </Field>
            <StepActions onBack={() => setStep(1)} onNext={() => next(2)} nextLabel="Continue to payment" />
          </StepCard>

          {/* Payment */}
          <StepCard index={3} step={step} title="Payment" onEdit={() => setStep(3)} summary={null}>
            {stripe ? (
              <div className="flex items-start gap-3 rounded-2xl border bg-muted/40 p-4 text-sm">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                <p>You’ll be redirected to <strong>Stripe</strong> to pay securely with card, Apple Pay or Google Pay. Your order is confirmed as soon as payment succeeds.</p>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3.5 text-xs">
                  <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p>
                    <strong>Demo mode</strong> — no real charge. Use <code className="rounded bg-background px-1 py-0.5 font-mono">4242 4242 4242 4242</code>, any future date and any CVC.
                    Use <code className="rounded bg-background px-1 py-0.5 font-mono">4000 0000 0000 0002</code> to simulate a decline.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-4">
                  <Field label="Card number" error={errors.cardNumber} className="sm:col-span-4">
                    <div className="relative">
                      <Input
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="1234 1234 1234 1234"
                        value={card.number}
                        onChange={(e) => { const v = formatCardNumber(e.target.value); setCard((prev) => ({ ...prev, number: v })); }}
                        className="h-11 rounded-xl pr-24 font-mono tracking-wider"
                      />
                      <span className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {card.number ? cardBrand(card.number) : "Card"}
                      </span>
                    </div>
                  </Field>
                  <Field label="Name on card" className="sm:col-span-2">
                    <Input autoComplete="cc-name" value={card.name} onChange={(e) => { const v = e.target.value; setCard((prev) => ({ ...prev, name: v })); }} className="h-11 rounded-xl" />
                  </Field>
                  <Field label="Expiry" error={errors.expiry}>
                    <Input inputMode="numeric" autoComplete="cc-exp" placeholder="MM / YY" value={card.expiry} onChange={(e) => { const v = formatExpiry(e.target.value); setCard((prev) => ({ ...prev, expiry: v })); }} className="h-11 rounded-xl font-mono" />
                  </Field>
                  <Field label="CVC" error={errors.cvc}>
                    <Input inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4} value={card.cvc} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setCard((prev) => ({ ...prev, cvc: v })); }} className="h-11 rounded-xl font-mono" />
                  </Field>
                </div>
              </>
            )}
            <Button onClick={submit} disabled={pending} className="h-13 w-full rounded-2xl text-base shadow-glow">
              {pending ? <LoaderCircle className="size-5 animate-spin" /> : <Lock className="size-4.5" />}
              {pending ? "Placing your order…" : stripe ? `Continue to secure payment · ${formatMoney(totals.total)}` : `Pay ${formatMoney(totals.total)}`}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              By placing your order you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/shipping-returns" className="underline">Shipping & Returns</Link> policy.
            </p>
          </StepCard>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-5 rounded-3xl border bg-card p-5 shadow-premium sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-semibold">Order summary</h2>
              <Link href="/cart" className="text-xs font-semibold text-primary hover:underline">Edit cart</Link>
            </div>
            <ul className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {items.map((i) => (
                <li key={i.id} className="flex gap-3">
                  <span className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={i.image} alt="" className="size-14 rounded-xl border bg-checker object-contain" />
                    <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">{i.quantity}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-medium">{i.name}</span>
                    <span className="line-clamp-1 text-xs text-muted-foreground">{i.variantLabel}</span>
                  </span>
                  <span className="text-sm font-medium tabular-nums">{formatMoney(i.total)}</span>
                </li>
              ))}
            </ul>
            <CouponInput subtotal={subtotal} error={couponError} description={description} />
            <TotalsTable totals={totals} shippingLabel={method?.label ?? "Shipping"} taxRate={settings.taxRate} />
            <PaymentBadges className="flex justify-center" />
          </div>
        </aside>
      </div>
    </div>
  );
}

function StepCard({
  index,
  step,
  title,
  summary,
  onEdit,
  children,
}: {
  index: number;
  step: number;
  title: string;
  summary: React.ReactNode;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  const active = index === step;
  const done = index < step;
  return (
    <section className={cn("rounded-3xl border bg-card transition-shadow", active && "shadow-premium ring-1 ring-primary/20")}>
      <header className="flex items-center gap-3 px-5 py-4 sm:px-6">
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold",
            done ? "bg-success text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          {done ? <Check className="size-4" /> : index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className={cn("font-heading text-lg font-semibold", !active && !done && "text-muted-foreground")}>{title}</h2>
          {done && summary && <p className="truncate text-sm text-muted-foreground">{summary}</p>}
        </div>
        {done && (
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10">
            <Pencil className="size-3" /> Edit
          </button>
        )}
      </header>
      <AnimatePresence initial={false}>
        {active && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="space-y-5 border-t px-5 py-5 sm:px-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function StepActions({ onBack, onNext, nextLabel = "Continue" }: { onBack?: () => void; onNext: () => void; nextLabel?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      {onBack ? (
        <Button type="button" variant="ghost" onClick={onBack} className="h-11 rounded-xl"><ChevronLeft className="size-4" /> Back</Button>
      ) : <span />}
      <Button type="button" onClick={onNext} className="h-11 rounded-xl px-6">{nextLabel}</Button>
    </div>
  );
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  // Wrapping <label> gives every input an accessible name without manual ids.
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="block text-xs font-semibold">{label}</span>
      {children}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}
