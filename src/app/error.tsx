"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 text-center shadow-premium">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Something smudged</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error stopped this page from loading. Try again — if it keeps happening, let us know.
        </p>
        {error.digest && <p className="mt-3 font-mono text-xs text-muted-foreground">Ref: {error.digest}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={reset} className="h-10 rounded-xl px-4">
            <RotateCw data-icon="inline-start" /> Try again
          </Button>
          <Button asChild variant="outline" className="h-10 rounded-xl px-4">
            <Link href="/">
              <Home data-icon="inline-start" /> Go home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
