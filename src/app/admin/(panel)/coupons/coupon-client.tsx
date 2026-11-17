"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Ellipsis, Loader2, Pause, Pencil, Play, Plus, Shuffle, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteCoupon, saveCoupon, toggleCoupon } from "./actions";

export type CouponForm = {
  id?: string;
  code: string;
  description: string;
  type: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  value: string;
  minSubtotal: string;
  maxUses: string;
  startsAt: string;
  expiresAt: string;
  active: boolean;
};

const EMPTY: CouponForm = { code: "", description: "", type: "PERCENT", value: "10", minSubtotal: "0.00", maxUses: "", startsAt: "", expiresAt: "", active: true };

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "INK" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function CouponDialog({ coupon, open: controlled, onOpenChange }: { coupon?: CouponForm; open?: boolean; onOpenChange?: (o: boolean) => void }) {
  const router = useRouter();
  const [internal, setInternal] = useState(false);
  const open = controlled ?? internal;
  const setOpen = onOpenChange ?? setInternal;
  const [f, setF] = useState<CouponForm>(coupon ?? EMPTY);
  const [pending, start] = useTransition();
  const set = <K extends keyof CouponForm>(k: K, v: CouponForm[K]) => setF((p) => ({ ...p, [k]: v }));

  return (
    <>
      {controlled === undefined && (
        <Button
          onClick={() => {
            setF(coupon ?? { ...EMPTY, code: randomCode() });
            setOpen(true);
          }}
        >
          <Plus /> New coupon
        </Button>
      )}
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (o) setF(coupon ?? { ...EMPTY, code: randomCode() });
          setOpen(o);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{coupon?.id ? `Edit ${coupon.code}` : "New coupon"}</DialogTitle>
            <DialogDescription>Customers enter the code in their cart or at checkout.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const r = await saveCoupon({
                  id: f.id,
                  code: f.code,
                  description: f.description,
                  type: f.type,
                  value: f.type === "FIXED" ? Math.round((parseFloat(f.value) || 0) * 100) : Math.round(Number(f.value) || 0),
                  minSubtotal: Math.round((parseFloat(f.minSubtotal) || 0) * 100),
                  maxUses: f.maxUses ? Math.round(Number(f.maxUses)) : null,
                  startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : null,
                  expiresAt: f.expiresAt ? new Date(f.expiresAt).toISOString() : null,
                  active: f.active,
                });
                if (r.ok) {
                  toast.success(r.message);
                  setOpen(false);
                  router.refresh();
                } else toast.error(r.error);
              });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="c-code">Code</Label>
              <div className="flex gap-2">
                <Input id="c-code" required value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase().replace(/\s/g, ""))} className="font-mono tracking-wide" />
                <Button type="button" variant="outline" size="icon" onClick={() => set("code", randomCode())} aria-label="Generate random code">
                  <Shuffle />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-desc">Description (internal)</Label>
              <Input id="c-desc" value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="e.g. Instagram giveaway" />
            </div>
            <div className="space-y-1.5">
              <Label>Discount type</Label>
              <ToggleGroup type="single" variant="outline" value={f.type} onValueChange={(v) => v && set("type", v as CouponForm["type"])} className="w-full">
                <ToggleGroupItem value="PERCENT" className="flex-1">Percent</ToggleGroupItem>
                <ToggleGroupItem value="FIXED" className="flex-1">Fixed amount</ToggleGroupItem>
                <ToggleGroupItem value="FREE_SHIPPING" className="flex-1">Free shipping</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {f.type !== "FREE_SHIPPING" && (
                <div className="space-y-1.5">
                  <Label htmlFor="c-val">{f.type === "PERCENT" ? "Percent off" : "Amount off ($)"}</Label>
                  <Input id="c-val" type="number" step={f.type === "PERCENT" ? 1 : 0.01} min={0} value={f.value} onChange={(e) => set("value", e.target.value)} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="c-min">Min. order ($)</Label>
                <Input id="c-min" type="number" step="0.01" min={0} value={f.minSubtotal} onChange={(e) => set("minSubtotal", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-max">Max uses</Label>
                <Input id="c-max" type="number" min={1} value={f.maxUses} onChange={(e) => set("maxUses", e.target.value)} placeholder="Unlimited" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-start">Starts</Label>
                <Input id="c-start" type="datetime-local" value={f.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-end">Ends</Label>
                <Input id="c-end" type="datetime-local" value={f.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} />
              </div>
            </div>
            <label className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <span>
                <span className="block font-medium">Active</span>
                <span className="text-xs text-muted-foreground">Paused codes are rejected at checkout.</span>
              </span>
              <Switch checked={f.active} onCheckedChange={(v) => set("active", v)} />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="animate-spin" />} {f.id ? "Save coupon" : "Create coupon"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CouponRowActions({ coupon }: { coupon: CouponForm }) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(r.message);
        router.refresh();
      } else toast.error(r.error);
    });
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${coupon.code}`} disabled={pending}>
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => setEdit(true)}>
            <Pencil /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              void navigator.clipboard?.writeText(coupon.code);
              toast.success(`Copied ${coupon.code}`);
            }}
          >
            <Copy /> Copy code
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => run(() => toggleCoupon(coupon.id!, !coupon.active))}>
            {coupon.active ? <Pause /> : <Play />} {coupon.active ? "Pause" : "Activate"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => run(() => deleteCoupon(coupon.id!))}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CouponDialog coupon={coupon} open={edit} onOpenChange={setEdit} />
    </>
  );
}
