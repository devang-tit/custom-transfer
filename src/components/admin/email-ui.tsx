"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { resendOrderEmail } from "@/app/admin/(panel)/orders/actions";

const STATUS_STYLE: Record<string, string> = {
  SENT: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  OUTBOX: "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  FAILED: "bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:text-rose-300",
};
const STATUS_LABEL: Record<string, string> = { SENT: "Sent", OUTBOX: "Outbox", FAILED: "Failed" };

export function EmailStatusPill({ status, error }: { status: string; error?: string | null }) {
  return (
    <span
      title={error ?? undefined}
      className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset", STATUS_STYLE[status] ?? STATUS_STYLE.OUTBOX)}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

/** Opens the logged email in a sandboxed iframe. */
export function EmailPreviewButton({ id, subject, to, label = "Preview" }: { id: string; subject: string; to: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Eye /> {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[85vh] max-w-3xl flex-col gap-3 p-4 sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{subject}</DialogTitle>
            <DialogDescription>To {to}</DialogDescription>
          </DialogHeader>
          {open && <iframe title={subject} src={`/api/admin/emails/${id}`} sandbox="allow-popups allow-popups-to-escape-sandbox" className="min-h-0 w-full flex-1 rounded-lg border bg-white" />}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Resend buttons on the order page. */
export function ResendEmailButtons({ orderId, paid }: { orderId: string; paid: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [which, setWhich] = useState<"confirmation" | "status" | null>(null);
  const run = (kind: "confirmation" | "status") => {
    setWhich(kind);
    start(async () => {
      const r = await resendOrderEmail({ orderId, kind });
      if (r.ok) toast.success(r.message);
      else toast.error(r.error);
      setWhich(null);
      router.refresh();
    });
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" disabled={pending || !paid} onClick={() => run("confirmation")}>
        {pending && which === "confirmation" ? <Loader2 className="animate-spin" /> : <RotateCw />} Resend confirmation
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => run("status")}>
        {pending && which === "status" ? <Loader2 className="animate-spin" /> : <RotateCw />} Email current status
      </Button>
    </div>
  );
}
