"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { Zap, Search, Palette, CircleCheck, CircleAlert, Package, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRODUCTION_COLUMNS, ORDER_STATUS_META, type OrderStatus } from "@/lib/order-status";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { relativeAge } from "@/components/admin/table-helpers";
import { updateOrderStatus } from "../orders/actions";
import type { BoardCard } from "../../_lib/production";


const COLUMN_ACCENT: Record<string, string> = {
  ARTWORK_REVIEW: "bg-amber-500",
  IN_PRODUCTION: "bg-violet-500",
  QUALITY_CHECK: "bg-sky-500",
  READY: "bg-cyan-500",
  SHIPPED: "bg-indigo-500",
};

export function ProductionBoard({ initial, now }: { initial: BoardCard[]; now: number }) {
  const router = useRouter();
  const [cards, setCards] = useState(initial);
  const [rushOnly, setRushOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, start] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter(
      (c) => (!rushOnly || c.isRush) && (!q || c.number.toLowerCase().includes(q) || c.customerName.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q))
    );
  }, [cards, rushOnly, query]);

  const byColumn = useMemo(() => {
    const map = new Map<string, BoardCard[]>(PRODUCTION_COLUMNS.map((c) => [c, []]));
    for (const c of visible) map.get(c.status)?.push(c);
    for (const list of map.values()) list.sort((a, b) => Number(b.isRush) - Number(a.isRush) || +new Date(a.createdAt) - +new Date(b.createdAt));
    return map;
  }, [visible]);

  const active = cards.find((c) => c.id === activeId) ?? null;

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const id = String(e.active.id);
    const to = e.over?.id ? String(e.over.id) : null;
    const card = cards.find((c) => c.id === id);
    if (!card || !to || card.status === to) return;
    const from = card.status;
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, status: to } : c)));
    start(async () => {
      const res = await updateOrderStatus({ orderId: id, status: to as OrderStatus, notify: true });
      if (res.ok) {
        toast.success(`${card.number} → ${ORDER_STATUS_META[to as OrderStatus].label}`, {
          action: {
            label: "Undo",
            onClick: () => {
              setCards((cs) => cs.map((c) => (c.id === id ? { ...c, status: from } : c)));
              void updateOrderStatus({ orderId: id, status: from as OrderStatus, message: "Status change undone", notify: false }).then(() => router.refresh());
            },
          },
        });
        router.refresh();
      } else {
        setCards((cs) => cs.map((c) => (c.id === id ? { ...c, status: from } : c)));
        toast.error(res.error);
      }
    });
  };

  const rushCount = cards.filter((c) => c.isRush && c.status !== "SHIPPED").length;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative w-full sm:max-w-xs">
          <span className="sr-only">Filter cards</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by order, customer, product…"
            className="h-9 w-full rounded-lg border bg-card pr-3 pl-9 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
          />
        </label>
        <Button variant={rushOnly ? "default" : "outline"} className="h-9" aria-pressed={rushOnly} onClick={() => setRushOnly((v) => !v)}>
          <Zap className={cn(rushOnly && "fill-current")} /> Rush only
          <span className="rounded bg-foreground/10 px-1 text-xs tabular-nums">{rushCount}</span>
        </Button>
        <p className="text-xs text-muted-foreground sm:ml-auto">Tip: drag a card, or focus it and press Space then arrow keys.</p>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
          {PRODUCTION_COLUMNS.map((col) => (
            <Column key={col} status={col} cards={byColumn.get(col) ?? []} now={now} />
          ))}
        </div>
        <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
          {active ? <CardView card={active} now={now} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({ status, cards, now }: { status: OrderStatus; cards: BoardCard[]; now: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = ORDER_STATUS_META[status];
  const value = cards.reduce((s, c) => s + c.total, 0);
  return (
    <section
      ref={setNodeRef}
      aria-label={meta.label}
      className={cn(
        "flex w-[290px] shrink-0 snap-start flex-col rounded-xl border bg-muted/50 transition-colors dark:bg-muted/30",
        isOver && "border-primary/60 bg-primary/5 ring-2 ring-primary/20"
      )}
    >
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span className={cn("size-2 rounded-full", COLUMN_ACCENT[status])} />
        <h2 className="text-sm font-semibold">{meta.label}</h2>
        <span className="rounded-md bg-background px-1.5 text-xs font-medium text-muted-foreground tabular-nums ring-1 ring-border">{cards.length}</span>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">{formatMoney(value)}</span>
      </header>
      <div className="flex min-h-40 flex-1 flex-col gap-2 p-2 pt-1">
        {cards.map((c) => (
          <DraggableCard key={c.id} card={c} now={now} />
        ))}
        {!cards.length && (
          <div className="grid flex-1 place-items-center rounded-lg border border-dashed py-8 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Package className="size-3.5" /> Drop orders here
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

function DraggableCard({ card, now }: { card: BoardCard; now: number }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={cn("touch-none outline-none", isDragging && "opacity-30")}>
      <CardView card={card} now={now} />
    </div>
  );
}

function CardView({ card, now, overlay }: { card: BoardCard; now: number; overlay?: boolean }) {
  const age = relativeAge(card.createdAt, now);
  const ageDays = (now - new Date(card.createdAt).getTime()) / 86400000;
  const { total, approved, changes } = card.artwork;
  return (
    <article
      className={cn(
        "group relative rounded-lg border bg-card p-3 shadow-xs transition-shadow hover:shadow-md",
        card.isRush && "border-amber-500/40",
        overlay && "rotate-2 cursor-grabbing shadow-xl ring-2 ring-primary/30"
      )}
    >
      {card.isRush && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-amber-500" />}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/admin/orders/${card.id}`}
            className="flex items-center gap-1.5 text-sm font-semibold hover:text-primary"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {card.number}
            {card.isRush && (
              <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1 py-px text-[10px] font-bold tracking-wide text-amber-700 uppercase dark:text-amber-400">
                <Zap className="size-2.5 fill-current" /> Rush
              </span>
            )}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{card.customerName}</p>
        </div>
        <GripVertical className="size-4 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground" />
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <div className="flex -space-x-2">
          {card.thumbs.map((t, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={t} alt="" className="size-8 rounded-md border-2 border-card bg-checker object-cover" />
          ))}
        </div>
        <p className="min-w-0 truncate text-xs text-muted-foreground" title={card.summary}>
          {card.itemCount} item{card.itemCount === 1 ? "" : "s"} · {card.units} pcs
        </p>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t pt-2 text-xs">
        {total > 0 ? (
          changes > 0 ? (
            <span className="inline-flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
              <CircleAlert className="size-3.5" /> {changes} needs changes
            </span>
          ) : approved === total ? (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <CircleCheck className="size-3.5" /> Art approved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
              <Palette className="size-3.5" /> Art {approved}/{total}
            </span>
          )
        ) : (
          <span className="text-muted-foreground">No artwork</span>
        )}
        <span className={cn("tabular-nums", ageDays > 2 && card.status !== "SHIPPED" ? "font-semibold text-rose-600 dark:text-rose-400" : "text-muted-foreground")} title="Time since order was placed">
          {age}
        </span>
      </div>
    </article>
  );
}
