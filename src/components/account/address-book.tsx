"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useFormAction } from "@/components/auth/use-form-action";
import { Building2, Check, Loader2, MapPin, MoreHorizontal, Pencil, Phone, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { FormError, FormField, fieldInputClass } from "@/components/auth/form-field";
import { deleteAddressAction, saveAddressAction, setDefaultAddressAction, type FormState } from "@/app/(store)/account/actions";
import { cn } from "@/lib/utils";

export type AddressData = {
  id: string;
  label: string;
  name: string;
  company: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
};

export function AddressBook({ addresses }: { addresses: AddressData[] }) {
  const [editing, setEditing] = useState<AddressData | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const closeDialog = useCallback(() => setOpen(false), []);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-1">
          <h2 className="text-2xl font-bold sm:text-[1.75rem]">Addresses</h2>
          <p className="text-sm text-muted-foreground">Saved addresses autofill at checkout.</p>
        </div>
        {addresses.length > 0 && (
          <Button onClick={openNew} className="h-10 rounded-xl px-4">
            <Plus data-icon="inline-start" /> Add address
          </Button>
        )}
      </div>

      {addresses.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <div
              key={a.id}
              className={cn(
                "relative rounded-2xl border bg-card p-5 transition-shadow hover:shadow-premium",
                a.isDefault && "border-primary/40 ring-1 ring-primary/20"
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <MapPin className="size-4" />
                  </span>
                  <span className="font-semibold">{a.label}</span>
                  {a.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      <Check className="size-3" /> Default
                    </span>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="rounded-lg" aria-label="Address actions" disabled={pending}>
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      onSelect={() => {
                        setEditing(a);
                        setOpen(true);
                      }}
                    >
                      <Pencil /> Edit
                    </DropdownMenuItem>
                    {!a.isDefault && (
                      <DropdownMenuItem
                        onSelect={() =>
                          start(async () => {
                            const res = await setDefaultAddressAction(a.id);
                            if (res.error) toast.error(res.error);
                            else toast.success(`${a.label} is now your default address`);
                          })
                        }
                      >
                        <Star /> Set as default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() =>
                        start(async () => {
                          const res = await deleteAddressAction(a.id);
                          if (res.error) toast.error(res.error);
                          else toast.success("Address deleted");
                        })
                      }
                    >
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <address className="grid gap-0.5 text-sm not-italic">
                <span className="font-medium">{a.name}</span>
                {a.company && (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="size-3.5" /> {a.company}
                  </span>
                )}
                <span className="text-muted-foreground">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                </span>
                <span className="text-muted-foreground">
                  {a.city}, {a.state} {a.zip} · {a.country}
                </span>
                {a.phone && (
                  <span className="mt-1 inline-flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="size-3.5" /> {a.phone}
                  </span>
                )}
              </address>
            </div>
          ))}
          <button
            type="button"
            onClick={openNew}
            className="grid min-h-40 place-items-center rounded-2xl border-2 border-dashed text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/40 hover:text-foreground"
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="size-4" /> Add another address
            </span>
          </button>
        </div>
      ) : (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Add your studio or home address to check out faster."
          action={
            <Button onClick={openNew} className="rounded-xl">
              <Plus data-icon="inline-start" /> Add address
            </Button>
          }
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit address" : "Add a new address"}</DialogTitle>
            <DialogDescription>We ship to all 50 states. Double-check the ZIP for accurate rates.</DialogDescription>
          </DialogHeader>
          {/* key forces a fresh form state per address */}
          <AddressForm key={editing?.id ?? "new"} address={editing} onDone={closeDialog} isFirst={addresses.length === 0} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddressForm({ address, onDone, isFirst }: { address: AddressData | null; onDone: () => void; isFirst: boolean }) {
  const { state, pending, onSubmit } = useFormAction<FormState>(saveAddressAction, undefined);
  const [isDefault, setIsDefault] = useState(address?.isDefault ?? isFirst);
  const fe = state?.fieldErrors;

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message ?? "Saved");
      onDone();
    }
  }, [state, onDone]);

  const v = (k: keyof AddressData) => (address ? String(address[k] ?? "") : "");

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {address && <input type="hidden" name="id" value={address.id} />}
      {isDefault && <input type="hidden" name="isDefault" value="on" />}
      <FormError message={state?.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Label" htmlFor="label" error={fe?.label}>
          <Input id="label" name="label" defaultValue={v("label") || "Home"} placeholder="Home, Studio…" className={fieldInputClass} />
        </FormField>
        <FormField label="Full name" htmlFor="name" error={fe?.name}>
          <Input id="name" name="name" defaultValue={v("name")} autoComplete="name" className={fieldInputClass} />
        </FormField>
      </div>
      <FormField label={<>Company <span className="font-normal text-muted-foreground">(optional)</span></>} htmlFor="company">
        <Input id="company" name="company" defaultValue={v("company")} autoComplete="organization" className={fieldInputClass} />
      </FormField>
      <FormField label="Street address" htmlFor="line1" error={fe?.line1}>
        <Input id="line1" name="line1" defaultValue={v("line1")} autoComplete="address-line1" className={fieldInputClass} />
      </FormField>
      <FormField label={<>Apt, suite <span className="font-normal text-muted-foreground">(optional)</span></>} htmlFor="line2">
        <Input id="line2" name="line2" defaultValue={v("line2")} autoComplete="address-line2" className={fieldInputClass} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-[1.4fr_0.8fr_1fr]">
        <FormField label="City" htmlFor="city" error={fe?.city}>
          <Input id="city" name="city" defaultValue={v("city")} autoComplete="address-level2" className={fieldInputClass} />
        </FormField>
        <FormField label="State" htmlFor="state" error={fe?.state}>
          <Input id="state" name="state" defaultValue={v("state")} autoComplete="address-level1" maxLength={30} className={fieldInputClass} />
        </FormField>
        <FormField label="ZIP" htmlFor="zip" error={fe?.zip}>
          <Input id="zip" name="zip" defaultValue={v("zip")} autoComplete="postal-code" className={fieldInputClass} />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Country" htmlFor="country" error={fe?.country}>
          <Input id="country" name="country" defaultValue={v("country") || "US"} autoComplete="country" className={fieldInputClass} />
        </FormField>
        <FormField label={<>Phone <span className="font-normal text-muted-foreground">(optional)</span></>} htmlFor="phone">
          <Input id="phone" name="phone" type="tel" defaultValue={v("phone")} autoComplete="tel" className={fieldInputClass} />
        </FormField>
      </div>
      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <Checkbox checked={isDefault} onCheckedChange={(c) => setIsDefault(c === true)} disabled={address?.isDefault} />
        Use as my default shipping address
      </label>
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone} className="h-10 rounded-xl">
          Cancel
        </Button>
        <Button type="submit" disabled={pending} className="h-10 rounded-xl px-5">
          {pending && <Loader2 className="animate-spin" />}
          {address ? "Save changes" : "Add address"}
        </Button>
      </div>
    </form>
  );
}
