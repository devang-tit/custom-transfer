import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder shown while the canvas editor chunk loads. */
export function EditorSkeleton({ label = "Loading editor…" }: { label?: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-12 items-center gap-2 border-b px-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="size-8 rounded-lg" />
        ))}
        <Skeleton className="ml-auto h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-72 shrink-0 space-y-4 border-r p-4 lg:block">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
        <div className="relative flex flex-1 items-center justify-center bg-muted/40 bg-dots">
          <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <div className="size-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            {label}
          </div>
        </div>
        <div className="hidden w-80 shrink-0 space-y-4 border-l p-4 lg:block">
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
