"use client";

import { useRouter } from "next/navigation";
import { COURIERS } from "@/lib/india";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, CircleX, Ellipsis, FileText, Loader2, PackageCheck, Printer, RotateCcw, Ban, CreditCard, Send, Lock, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ORDER_FLOW, ORDER_STATUSES, ORDER_STATUS_META, type OrderStatus } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import {
  addOrderNote,
  markOrderPaid,
  saveInternalNotes,
  setArtworkStatus,
  updateOrderStatus,
  updateShipping,
} from "../actions";

type Res = { ok: true; message?: string } | { ok: false; error: string };

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<Res>, onOk?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        if (res.message) toast.success(res.message);
        onOk?.();
        router.refresh();
      } else toast.error(res.error);
    });
  return { pending, run };
}

export function StatusUpdater({ orderId, status }: { orderId: string; status: string }) {
  const idx = ORDER_FLOW.indexOf(status as OrderStatus);
  const suggested = idx >= 0 && idx < ORDER_FLOW.length - 1 ? ORDER_FLOW[idx + 1]! : (status as OrderStatus);
  const [next, setNext] = useState<OrderStatus>(suggested);
  const [message, setMessage] = useState("");
  const [notify, setNotify] = useState(true);
  const { pending, run } = useAction();

  return (
    <div className="space-y-3">
      {idx >= 0 && idx < ORDER_FLOW.length - 1 && (
        <Button
          className="h-10 w-full justify-between"
          disabled={pending}
          onClick={() => run(() => updateOrderStatus({ orderId, status: suggested, notify: true }))}
        >
          <span>Advance to {ORDER_STATUS_META[suggested].label}</span>
          {pending ? <Loader2 className="animate-spin" /> : <PackageCheck />}
        </Button>
      )}
      <div className="space-y-2 rounded-lg border border-dashed p-3">
        <Label className="text-xs text-muted-foreground">Or set a specific status</Label>
        <Select value={next} onValueChange={(v) => setNext(v as OrderStatus)}>
          <SelectTrigger className="w-full">
            <SelectValue>
              <span className={cn("size-2 rounded-full", ORDER_STATUS_META[next].dot)} />
              {ORDER_STATUS_META[next].label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                <span className={cn("size-2 rounded-full", ORDER_STATUS_META[s].dot)} />
                {ORDER_STATUS_META[s].label}
                {s === status && <span className="text-xs text-muted-foreground">(current)</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Optional message for the timeline…"
          className="min-h-16 text-sm"
        />
        <label className="flex items-center justify-between gap-2 text-sm">
          <span>Notify customer</span>
          <Switch checked={notify} onCheckedChange={setNotify} />
        </label>
        <Button
          variant="outline"
          className="w-full"
          disabled={pending || (next === status && !message)}
          onClick={() =>
            run(
              () => updateOrderStatus({ orderId, status: next, message: message || undefined, notify }),
              () => setMessage("")
            )
          }
        >
          Update status
        </Button>
      </div>
    </div>
  );
}

export function ArtworkActions({ itemId, status }: { itemId: string; status: string }) {
  const { pending, run } = useAction();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  return (
    <div className="flex items-center gap-1.5">
      {status !== "APPROVED" ? (
        <Button size="sm" disabled={pending} onClick={() => run(() => setArtworkStatus({ itemId, decision: "APPROVED" }))}>
          {pending ? <Loader2 className="animate-spin" /> : <Check />} Approve
        </Button>
      ) : (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setArtworkStatus({ itemId, decision: "PENDING" }))}>
          <RotateCcw /> Reset
        </Button>
      )}
      {status !== "NEEDS_CHANGES" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setOpen(true)}>
          <PencilLine /> Request changes
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request artwork changes</DialogTitle>
            <DialogDescription>The customer sees this note on their order page.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-1.5">
            {["Resolution too low for print size", "Background not transparent", "Text too thin to print (min 1pt)", "Please send a vector / PDF file"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setNote(t)}
                className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                {t}
              </button>
            ))}
          </div>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Explain what needs to change…" className="min-h-24" autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!note.trim() || pending}
              onClick={() =>
                run(
                  () => setArtworkStatus({ itemId, decision: "NEEDS_CHANGES", note }),
                  () => {
                    setOpen(false);
                    setNote("");
                  }
                )
              }
            >
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const CARRIERS = [...COURIERS, "Studio pickup"];

export function ShippingForm({
  orderId,
  carrier,
  trackingNumber,
  status,
}: {
  orderId: string;
  carrier: string | null;
  trackingNumber: string | null;
  status: string;
}) {
  const [c, setC] = useState(carrier ?? "Delhivery");
  const [t, setT] = useState(trackingNumber ?? "");
  const { pending, run } = useAction();
  const canShip = !["SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].includes(status);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[140px_1fr] gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Carrier</Label>
          <Select value={c} onValueChange={setC}>
            <SelectTrigger className="w-full">
              <SelectValue>{c}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CARRIERS.map((x) => (
                <SelectItem key={x} value={x}>
                  {x}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tracking" className="text-xs text-muted-foreground">
            Tracking number
          </Label>
          <Input id="tracking" value={t} onChange={(e) => setT(e.target.value)} placeholder="AWB number" className="font-mono" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" disabled={pending} onClick={() => run(() => updateShipping({ orderId, carrier: c, trackingNumber: t }))}>
          Save
        </Button>
        {canShip && (
          <Button className="flex-1" disabled={pending || !t.trim()} onClick={() => run(() => updateShipping({ orderId, carrier: c, trackingNumber: t, markShipped: true }))}>
            <Send /> Mark shipped
          </Button>
        )}
      </div>
    </div>
  );
}

export function InternalNotesForm({ orderId, initial }: { orderId: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const { pending, run } = useAction();
  const dirty = value !== initial;
  return (
    <div className="space-y-2">
      <Textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="Press settings, reprint notes, special handling…" className="min-h-24 text-sm" />
      <Button size="sm" variant="outline" disabled={!dirty || pending} onClick={() => run(() => saveInternalNotes({ orderId, internalNotes: value }))}>
        {pending && <Loader2 className="animate-spin" />} Save notes
      </Button>
    </div>
  );
}

export function NoteComposer({ orderId }: { orderId: string }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const { pending, run } = useAction();
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={visible ? "Write an update the customer will see…" : "Add an internal note for your team…"}
        className="min-h-16 border-0 bg-transparent p-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Switch checked={visible} onCheckedChange={setVisible} />
          {visible ? "Visible to customer" : (
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3" /> Internal only
            </span>
          )}
        </label>
        <Button size="sm" disabled={!message.trim() || pending} onClick={() => run(() => addOrderNote({ orderId, message, visible }), () => setMessage(""))}>
          {visible ? "Post update" : "Add note"}
        </Button>
      </div>
    </div>
  );
}

export function OrderActionsMenu({ orderId, status, paymentStatus }: { orderId: string; status: string; paymentStatus: string }) {
  const { pending, run } = useAction();
  const [confirm, setConfirm] = useState<null | "cancel" | "refund">(null);
  const closed = status === "CANCELLED" || status === "REFUNDED";
  return (
    <>
      <Button asChild variant="outline">
        <a href={`/admin/orders/${orderId}/invoice?type=invoice`} target="_blank" rel="noreferrer">
          <Printer /> Invoice
        </a>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="More actions" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Ellipsis />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Documents</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <a href={`/admin/orders/${orderId}/invoice?type=invoice`} target="_blank" rel="noreferrer">
              <FileText /> Print invoice
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`/admin/orders/${orderId}/invoice?type=packing`} target="_blank" rel="noreferrer">
              <Printer /> Print packing slip
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {paymentStatus !== "PAID" && paymentStatus !== "REFUNDED" && (
            <DropdownMenuItem onSelect={() => run(() => markOrderPaid({ orderId }))}>
              <CreditCard /> Mark as paid
            </DropdownMenuItem>
          )}
          {!closed && (
            <DropdownMenuItem onSelect={() => setConfirm("cancel")}>
              <Ban /> Cancel order
            </DropdownMenuItem>
          )}
          {paymentStatus === "PAID" && (
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirm("refund")}>
              <CircleX /> Refund order
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "refund" ? "Refund this order?" : "Cancel this order?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "refund"
                ? "The order will be marked refunded and the payment status set to Refunded. Process the refund in your payment provider as well."
                : "The order will be cancelled and removed from the production queue. The customer will see this on their order page."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep order</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() =>
                run(() => updateOrderStatus({ orderId, status: confirm === "refund" ? "REFUNDED" : "CANCELLED", notify: true }), () => setConfirm(null))
              }
            >
              {confirm === "refund" ? "Refund order" : "Cancel order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
