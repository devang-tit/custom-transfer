"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FileDropzone, type UploadedArtwork } from "@/components/shared/file-dropzone";
import { slugify } from "@/lib/format";
import { deleteCategory, saveCategory } from "./actions";

type Cat = { id: string; name: string; slug: string; description: string; image: string; sortOrder: number };

export function CategoryDialog({ category }: { category?: Cat }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Cat, "id">>(
    category ?? { name: "", slug: "", description: "", image: "", sortOrder: 0 }
  );
  const [file, setFile] = useState<UploadedArtwork | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setForm(category ?? { name: "", slug: "", description: "", image: "", sortOrder: 0 });
          setFile(null);
        }
      }}
    >
      <DialogTrigger asChild>
        {category ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${category.name}`}>
            <Pencil />
          </Button>
        ) : (
          <Button>
            <Plus /> New category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>Categories appear in the shop filters and navigation.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await saveCategory({ id: category?.id, ...form, image: file?.url ?? form.image });
              if (r.ok) {
                toast.success(r.message);
                setOpen(false);
                router.refresh();
              } else toast.error(r.error);
            });
          }}
        >
          <div className="grid grid-cols-[1fr_96px] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: category ? f.slug : slugify(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-sort">Order</Label>
              <Input id="cat-sort" type="number" min={0} value={form.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value) || 0)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input id="cat-slug" value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} className="font-mono text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea id="cat-desc" value={form.description} onChange={(e) => set("description", e.target.value)} className="min-h-20" />
          </div>
          <div className="space-y-1.5">
            <Label>Cover image</Label>
            {form.image && !file ? (
              <div className="flex items-center gap-3 rounded-xl border p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.image} alt="" className="size-14 rounded-lg object-cover" />
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">{form.image}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => set("image", "")}>
                  Replace
                </Button>
              </div>
            ) : (
              <FileDropzone value={file} onChange={setFile} compact label="Upload cover image" accept="image/*" />
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />} {category ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteCategoryButton({ id, name, disabled }: { id: string; name: string; disabled?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (disabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0}>
            <Button variant="ghost" size="icon-sm" disabled aria-label={`Delete ${name}`}>
              <Trash2 />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Only empty categories can be deleted</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Delete ${name}`} disabled={pending}>
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{name}”?</AlertDialogTitle>
          <AlertDialogDescription>This category has no products. This can’t be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={() =>
              start(async () => {
                const r = await deleteCategory(id);
                if (r.ok) {
                  toast.success(r.message);
                  router.refresh();
                } else toast.error(r.error);
              })
            }
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
