"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Layers, Loader2, MoreHorizontal, Pencil, Shirt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { deleteDesignAction, renameDesignAction } from "@/app/(store)/account/actions";
import { formatDate } from "@/lib/format";
import { PLACEHOLDER_IMAGE } from "@/lib/products";

export type DesignCardData = {
  id: string;
  name: string;
  kind: string;
  previewUrl: string | null;
  widthIn: number | null;
  heightIn: number | null;
  updatedAt: Date;
};

export function designHref(d: { id: string; kind: string }) {
  return d.kind === "GANG_SHEET" ? `/gang-sheet-builder?design=${d.id}` : `/design-studio?design=${d.id}`;
}

export function DesignCard({ design }: { design: DesignCardData }) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(design.name);
  const [pending, start] = useTransition();
  const isGang = design.kind === "GANG_SHEET";
  const href = designHref(design);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-premium">
      <Link href={href} className="relative aspect-[4/3] overflow-hidden bg-dots bg-muted/40">
        <Image
          src={design.previewUrl ?? PLACEHOLDER_IMAGE}
          alt={design.name}
          fill
          sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]"
          unoptimized
        />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur">
          {isGang ? <Layers className="size-3.5 text-primary" /> : <Shirt className="size-3.5 text-ink-magenta" />}
          {isGang ? "Gang sheet" : "Apparel"}
        </span>
      </Link>
      <div className="flex items-start gap-2 p-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{design.name}</p>
          <p className="text-xs text-muted-foreground">
            {design.widthIn && design.heightIn ? `${design.widthIn}" × ${design.heightIn}" · ` : ""}Edited {formatDate(design.updatedAt)}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="rounded-lg" aria-label="Design actions">
              {pending ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => router.push(href)}>
              <ExternalLink /> Open in editor
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
              <Pencil /> Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename design</DialogTitle>
            <DialogDescription>Give it a name you&apos;ll recognize later.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const res = await renameDesignAction(design.id, name);
                if (res.error) toast.error(res.error);
                else {
                  toast.success("Design renamed");
                  setRenameOpen(false);
                }
              });
            }}
            className="grid gap-4"
          >
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoFocus className="h-11 rounded-xl" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenameOpen(false)} className="h-10 rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={pending || !name.trim()} className="h-10 rounded-xl">
                {pending && <Loader2 className="animate-spin" />} Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{design.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the saved design. Orders that already used it are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                start(async () => {
                  const res = await deleteDesignAction(design.id);
                  if (res.error) toast.error(res.error);
                  else toast.success("Design deleted");
                })
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
