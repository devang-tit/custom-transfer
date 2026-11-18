"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Banknote, Check, ChevronLeft, CreditCard, Flame, Lock, LoaderCircle, Mail, MapPin, Pencil, ShieldCheck, ShoppingBag, Smartphone, Truck, Info } from "lucide-react";
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
import { confirmRazorpayPayment, placeOrder, type RazorpayCheckout } from "@/app/(store)/_actions/checkout";
import { INDIAN_STATES, isValidGstin, isValidPin, normalizeIndianMobile } from "@/lib/india";
import { useHydrated } from "../use-hydrated";
import { CouponInput } from "./coupon-input";
import { TotalsTable } from "./totals";
import { useCoupon } from "./use-coupon";
import { loadRazorpay, openRazorpay } from "./razorpay";
import { PaymentBadges } from "../social-icons";

type Prefill = { email: string; name: string; phone: string; address: Partial<AddressInput> | null; signedIn: boolean };

const STEPS = [
  { id: "contact", label: "Contact", icon: Mail },
  { id: "shipping", label: "Address", icon: MapPin },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "payment", label: "Payment", icon: CreditCard },
] as const;

type PayMethod = "online" | "cod";

/** `razorpay`: Razorpay keys are configured (otherwise online payment runs in demo mode). */
export function CheckoutFlow({ settings, prefill, razorpay }: { settings: StoreSettings; prefill: Prefill; razorpay: boolean }) {
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
    country: "IN",
  });
  const [gstin, setGstin] = useState("");
  const [payMethod, setPayMethod] = useState<PayMethod>("online");
  const [pendingRzp, setPendingRzp] = useState<RazorpayCheckout | null>(null);
  const [shippingMethod, setShippingMethod] = useState(settings.shippingMethods[0]?.id ?? "standard");
  const [rush, setRush] = useState(false);
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();

  const totals = useMemo(
    () => computeTotals({ subtotal, settings, shippingMethodId: shippingMethod, coupon, rush, cod: payMethod === "cod" }),
    [subtotal, settings, shippingMethod, coupon, rush, payMethod]
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
      if (!normalizeIndianMobile(contact.phone)) e.phone = "Enter a valid 10-digit mobile number";
    }
    if (i === 1) {
      (["name", "line1", "city", "state", "zip"] as const).forEach((k) => {
        if (!String(address[k] ?? "").trim()) e[`address.${k}`] = "Required";
      });
      if (address.zip && !isValidPin(address.zip)) e["address.zip"] = "Enter a 6-digit PIN code";
      if (gstin.trim() && !isValidGstin(gstin)) e.gstin = "Enter a valid 15-character GSTIN";
    }
    if (i === 3 && payMethod === "cod") {
      if (!settings.codEnabled) e.payMethod = "Cash on Delivery isn’t available";
      else if (totals.total > settings.codMaxOrder) e.payMethod = `COD is available up to ${formatMoney(settings.codMaxOrder)}. Please pay online.`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const next = (i: number) => {
    if (!validate(i)) return;
    if (i === 0 && !address.name.trim()) setAddress((a) => ({ ...a, name: contact.name }));
    setStep(i + 1);
  };

  /** Opens Razorpay for an order; on success verifies the payment and goes to the confirmation page. */
  async function payOnline(rzp: RazorpayCheckout) {
    if (!(await loadRazorpay())) {
      toast.error("Couldn’t load the payment window. Check your connection and try again.");
      setPendingRzp(rzp);
      return;
    }
    const result = await openRazorpay(
      {
        key: rzp.keyId,
        amount: rzp.amount,
        currency: rzp.currency,
        name: rzp.name,
        description: rzp.description,
        order_id: rzp.orderId,
        prefill: rzp.prefill,
        theme: { color: "#000000" },
      },
      (message) => toast.error(message)
    );
    if (result.status === "dismissed") {
      setPendingRzp(rzp);
      toast.info(`Payment not completed. Order ${rzp.orderNumber} is saved — tap Pay to try again.`);
      return;
    }
    const confirmed = await confirmRazorpayPayment({
      orderNumber: rzp.orderNumber,
      razorpayOrderId: result.response.razorpay_order_id,
      razorpayPaymentId: result.response.razorpay_payment_id,
      razorpaySignature: result.response.razorpay_signature,
    });
    if (!confirmed.ok) {
      toast.error(confirmed.error);
      return;
    }
    router.push(confirmed.url);
  }

  const submit = () => {
    if (!validate(0)) return setStep(0);
    if (!validate(1)) return setStep(1);
    if (!validate(3)) return;
    start(async () => {
      if (pendingRzp && payMethod === "online") {
        await payOnline(pendingRzp);
        return;
      }
      const res = await placeOrder({
        contact: { email: contact.email, name: contact.name, phone: contact.phone },
        address: { ...address, country: "IN", company: address.company || undefined, line2: address.line2 || undefined },
        gstin: gstin.trim() || undefined,
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
        payment: { method: payMethod === "cod" ? "cod" : razorpay ? "razorpay" : "demo" },
      });
      if (!res.ok) {
        toast.error(res.error);
        const f = res.field ?? "";
        if (f.startsWith("contact")) setStep(0);
        else if (f.startsWith("address") || f === "gstin") setStep(1);
        else if (f === "shippingMethod") setStep(2);
        else if (f.startsWith("payment")) setErrors({ payMethod: res.error });
        return;
      }
      if ("razorpay" in res) await payOnline(res.razorpay);
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
              <Field label="Mobile number" error={errors.phone}>
                <div className="flex">
                  <span className="grid h-11 place-items-center rounded-l-xl border border-r-0 bg-muted px-3 text-sm text-muted-foreground">+91</span>
                  <Input type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" value={contact.phone} onChange={(e) => { const v = e.target.value; setContact((prev) => ({ ...prev, phone: v })); }} className="h-11 rounded-l-none rounded-r-xl" />
                </div>
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
            summary={<>{address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} – {address.zip}</>}
          >
            <div className="grid gap-4 sm:grid-cols-6">
              <Field label="Recipient name" error={errors["address.name"]} className="sm:col-span-3">
                <Input autoComplete="shipping name" value={address.name} onChange={(e) => { const v = e.target.value; setAddress((prev) => ({ ...prev, name: v })); }} className="h-11 rounded-xl" />
              </Field>
              <Field label="Company (optional)" className="sm:col-span-3">
                <Input autoComplete="shipping organization" value={address.company} onChange={(e) => { const v = e.target.value; setAddress((prev) => ({ ...prev, company: v })); }} className="h-11 rounded-xl" />
              </Field>
              <Field label="Flat, house no., building" error={errors["address.line1"]} className="sm:col-span-6">
                <Input autoComplete="shipping address-line1" value={address.line1} onChange={(e) => { const v = e.target.value; setAddress((prev) => ({ ...prev, line1: v })); }} className="h-11 rounded-xl" />
              </Field>
              <Field label="Area, street, landmark (optional)" className="sm:col-span-6">
                <Input autoComplete="shipping address-line2" value={address.line2} onChange={(e) => { const v = e.target.value; setAddress((prev) => ({ ...prev, line2: v })); }} className="h-11 rounded-xl" />
              </Field>
              <Field label="City / town" error={errors["address.city"]} className="sm:col-span-2">
                <Input autoComplete="shipping address-level2" value={address.city} onChange={(e) => { const v = e.target.value; setAddress((prev) => ({ ...prev, city: v })); }} className="h-11 rounded-xl" />
              </Field>
              <Field label="State" error={errors["address.state"]} className="sm:col-span-2">
                <select
                  value={address.state}
                  autoComplete="shipping address-level1"
                  onChange={(e) => { const v = e.target.value; setAddress((prev) => ({ ...prev, state: v })); }}
                  className="h-11 w-full rounded-xl border bg-transparent px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40 dark:bg-input/30"
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st.code} value={st.name}>{st.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="PIN code" error={errors["address.zip"]} className="sm:col-span-2">
                <Input inputMode="numeric" autoComplete="shipping postal-code" maxLength={6} placeholder="380054" value={address.zip} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setAddress((prev) => ({ ...prev, zip: v })); }} className="h-11 rounded-xl tabular-nums" />
              </Field>
              <Field label="GSTIN (optional, for a business invoice)" error={errors.gstin} className="sm:col-span-4">
                <Input autoCapitalize="characters" maxLength={15} placeholder="24ABCDE1234F1Z5" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} className="h-11 rounded-xl font-mono uppercase" />
              </Field>
              <Field label="Country" className="sm:col-span-2">
                <Input value="India" readOnly disabled className="h-11 rounded-xl" />
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
            <div className="grid gap-2 sm:grid-cols-2">
              <PayOption
                active={payMethod === "online"}
                onSelect={() => { setPayMethod("online"); setErrors({}); }}
                icon={Smartphone}
                title="Pay online"
                detail="UPI, cards, netbanking & wallets"
                note={razorpay ? "Secured by Razorpay" : "Demo mode: no real payment"}
              />
              <PayOption
                active={payMethod === "cod"}
                disabled={!settings.codEnabled}
                onSelect={() => { setPayMethod("cod"); setErrors({}); }}
                icon={Banknote}
                title="Cash on Delivery"
                detail={settings.codFee ? `+${formatMoney(settings.codFee)} COD fee` : "No extra fee"}
                note={settings.codEnabled ? `For orders up to ${formatMoney(settings.codMaxOrder)}` : "Not available"}
              />
            </div>
            {errors.payMethod && <p className="text-sm text-destructive">{errors.payMethod}</p>}
            {payMethod === "online" && !razorpay && (
              <div className="flex items-start gap-3 rounded-2xl border p-3.5 text-xs">
                <Info className="mt-0.5 size-4 shrink-0" />
                <p>
                  <strong>Demo mode:</strong> online payments aren’t connected yet, so this places a test order marked as paid. Add your Razorpay keys to take real payments.
                </p>
              </div>
            )}
            {payMethod === "online" && razorpay && (
              <div className="flex items-start gap-3 rounded-2xl border p-3.5 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" />
                <p>A secure Razorpay window opens to complete your payment. Your order is confirmed as soon as the payment succeeds.</p>
              </div>
            )}
            <Button onClick={submit} disabled={pending} className="h-13 w-full rounded-2xl text-base">
              {pending ? <LoaderCircle className="size-5 animate-spin" /> : payMethod === "cod" ? <Banknote className="size-4.5" /> : <Lock className="size-4.5" />}
              {pending
                ? "Placing your order…"
                : payMethod === "cod"
                  ? `Place order · pay ${formatMoney(totals.total)} on delivery`
                  : pendingRzp
                    ? `Retry payment · ${formatMoney(pendingRzp.amount)}`
                    : `Pay ${formatMoney(totals.total)}`}
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
            <TotalsTable totals={totals} shippingLabel={method?.label ?? "Shipping"} />
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

function PayOption({
  active,
  disabled,
  onSelect,
  icon: Icon,
  title,
  detail,
  note,
}: {
  active: boolean;
  disabled?: boolean;
  onSelect: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
  note: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "flex items-start gap-3 rounded-2xl border bg-card p-4 text-left transition-all hover:border-foreground/60 disabled:cursor-not-allowed disabled:opacity-50",
        active && "border-foreground ring-1 ring-foreground"
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted"><Icon className="size-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{detail}</span>
        <span className="mt-1 block text-[11px] text-muted-foreground">{note}</span>
      </span>
      <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border", active ? "border-foreground bg-foreground" : "border-input")}>
        {active && <span className="size-1.5 rounded-full bg-background" />}
      </span>
    </button>
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
