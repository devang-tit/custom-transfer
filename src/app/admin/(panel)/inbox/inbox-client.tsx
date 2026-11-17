"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { Check, Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteMessage, setMessageStatus } from "./actions";

/** Marks a NEW message as read once it's actually opened in the reading pane. */
export function MarkRead({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const done = useRef<string | null>(null);
  useEffect(() => {
    if (status !== "NEW" || done.current === id) return;
    done.current = id;
    void setMessageStatus({ id, status: "READ" }).then(() => router.refresh());
  }, [id, status, router]);
  return null;
}

export function MessageActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (r.message) toast.success(r.message);
        after?.();
        router.refresh();
      } else toast.error(r.error);
    });
  return (
    <div className="flex gap-1.5">
      {status !== "REPLIED" ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setMessageStatus({ id, status: "REPLIED" }))}>
          <Check /> Mark replied
        </Button>
      ) : (
        <span className="inline-flex h-7 items-center gap-1 rounded-md bg-emerald-500/10 px-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <Check className="size-3.5" /> Replied
        </span>
      )}
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setMessageStatus({ id, status: "NEW" }))} aria-label="Mark unread">
        <Mail />
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => deleteMessage(id), () => router.push("/admin/inbox"))} aria-label="Delete message">
        <Trash2 />
      </Button>
    </div>
  );
}
