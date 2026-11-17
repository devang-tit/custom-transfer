"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SaveDesignDialog({
  open,
  onOpenChange,
  defaultName,
  signedIn,
  onSave,
  nextPath,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName: string;
  signedIn: boolean;
  onSave: (name: string) => Promise<boolean>;
  nextPath: string;
}) {
  const [name, setName] = useState(defaultName);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) setName(defaultName);
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            setBusy(true);
            const ok = await onSave(name.trim());
            setBusy(false);
            if (ok) onOpenChange(false);
          }}
          className="grid gap-4"
        >
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Save design</DialogTitle>
            <DialogDescription>
              {signedIn
                ? "Saved designs appear under Account → Saved designs so you can reorder or edit them later."
                : "You're not signed in — we'll save this design, but sign in to find it again from your account."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="design-name">Design name</Label>
            <Input id="design-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoFocus className="h-10" />
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            {!signedIn ? (
              <Button asChild variant="link" className="px-0">
                <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>Sign in first</Link>
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" size="lg" disabled={busy || !name.trim()}>
              {busy ? <Loader2 className="animate-spin" /> : <Save />}
              Save design
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
