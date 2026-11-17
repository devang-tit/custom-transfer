"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setUserRole } from "../actions";

const LABELS: Record<string, string> = { CUSTOMER: "Customer", STAFF: "Staff — admin access, production", ADMIN: "Administrator — full access" };

export function RoleSelect({ userId, role, canEdit, isSelf }: { userId: string; role: string; canEdit: boolean; isSelf: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="space-y-1.5">
      <Select
        value={role}
        disabled={!canEdit || pending}
        onValueChange={(v) =>
          start(async () => {
            const r = await setUserRole({ userId, role: v as "CUSTOMER" | "STAFF" | "ADMIN" });
            if (r.ok) {
              toast.success(r.message);
              router.refresh();
            } else toast.error(r.error);
          })
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            <ShieldCheck className="text-muted-foreground" /> {LABELS[role]?.split(" — ")[0] ?? role}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(LABELS).map(([k, v]) => (
            <SelectItem key={k} value={k} disabled={isSelf && k !== "ADMIN"}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!canEdit && <p className="text-xs text-muted-foreground">Only administrators can change roles.</p>}
    </div>
  );
}
