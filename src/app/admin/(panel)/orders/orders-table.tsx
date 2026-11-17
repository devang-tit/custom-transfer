"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Zap, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/status-badge";
import { SortHeader } from "@/components/admin/table-helpers";
import { ORDER_STATUSES, ORDER_STATUS_META } from "@/lib/order-status";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { bulkUpdateStatus } from "./actions";

export type OrderRow = {
  id: string;
  number: string;
  customerName: string;
  email: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  isRush: boolean;
  shippingMethod: string;
  itemCount: number;
  thumbs: string[];
};

export function OrdersTable({ orders, params }: { orders: OrderRow[]; params: Record<string, string | undefined> }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [pending, start] = useTransition();
  const allChecked = orders.length > 0 && orders.every((o) => selected.has(o.id));
  const someChecked = orders.some((o) => selected.has(o.id));

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const applyBulk = () => {
    if (!bulkStatus) return;
    start(async () => {
      const res = await bulkUpdateStatus({ ids: [...selected], status: bulkStatus as (typeof ORDER_STATUSES)[number] });
      if (res.ok) {
        toast.success(res.message);
        setSelected(new Set());
        setBulkStatus("");
        router.refresh();
      } else toast.error(res.error);
    });
  };

  return (
    <div className="relative">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-accent/50 px-4 py-2 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <span className="text-muted-foreground">·</span>
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger size="sm" className="w-44 bg-background">
              <SelectValue placeholder="Change status to…" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {ORDER_STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" disabled={!bulkStatus || pending} onClick={applyBulk}>
            {pending ? "Updating…" : "Apply"}
          </Button>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelected(new Set())}>
            <X /> Clear
          </Button>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10 pl-4">
                <Checkbox
                  aria-label="Select all"
                  checked={allChecked ? true : someChecked ? "indeterminate" : false}
                  onCheckedChange={(v) => setSelected(v ? new Set(orders.map((o) => o.id)) : new Set())}
                />
              </TableHead>
              <TableHead>
                <SortHeader label="Order" field="number" base="/admin/orders" params={params} />
              </TableHead>
              <TableHead>
                <SortHeader label="Date" field="createdAt" base="/admin/orders" params={params} />
              </TableHead>
              <TableHead>
                <SortHeader label="Customer" field="customerName" base="/admin/orders" params={params} />
              </TableHead>
              <TableHead>Items</TableHead>
              <TableHead>
                <SortHeader label="Status" field="status" base="/admin/orders" params={params} />
              </TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="pr-4 text-right">
                <SortHeader label="Total" field="total" base="/admin/orders" params={params} className="justify-end" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => {
              const checked = selected.has(o.id);
              return (
                <TableRow
                  key={o.id}
                  data-state={checked ? "selected" : undefined}
                  className="cursor-pointer"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button,a,[role=checkbox]")) return;
                    router.push(`/admin/orders/${o.id}`);
                  }}
                >
                  <TableCell className="pl-4">
                    <Checkbox aria-label={`Select ${o.number}`} checked={checked} onCheckedChange={() => toggle(o.id)} />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/admin/orders/${o.id}`} className="inline-flex items-center gap-1.5 hover:text-primary">
                      {o.number}
                      {o.isRush && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1 py-px text-[10px] font-bold tracking-wide text-amber-700 uppercase dark:text-amber-400">
                          <Zap className="size-2.5 fill-current" />
                          Rush
                        </span>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                  <TableCell>
                    <p className="font-medium">{o.customerName}</p>
                    <p className="text-xs text-muted-foreground">{o.email}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {o.thumbs.map((t, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={t} alt="" className="size-7 rounded-md border-2 border-card bg-muted object-cover" />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">{o.itemCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={o.paymentStatus} />
                  </TableCell>
                  <TableCell className={cn("pr-4 text-right font-semibold tabular-nums", o.paymentStatus === "REFUNDED" && "text-muted-foreground line-through")}>
                    {formatMoney(o.total)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
