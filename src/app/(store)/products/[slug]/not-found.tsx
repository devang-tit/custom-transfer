import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <div className="container-page flex flex-col items-center py-28 text-center">
      <div className="grid size-16 place-items-center rounded-3xl bg-accent text-accent-foreground"><PackageSearch className="size-7" /></div>
      <h1 className="mt-6 text-3xl font-bold">We couldn’t find that product</h1>
      <p className="mt-2 max-w-md text-muted-foreground">It may have been renamed or retired. Browse the shop or build a custom gang sheet instead.</p>
      <div className="mt-6 flex gap-2">
        <Button asChild className="h-11 rounded-xl px-5"><Link href="/shop">Browse the shop</Link></Button>
        <Button asChild variant="outline" className="h-11 rounded-xl px-5"><Link href="/gang-sheet-builder">Open builder</Link></Button>
      </div>
    </div>
  );
}
