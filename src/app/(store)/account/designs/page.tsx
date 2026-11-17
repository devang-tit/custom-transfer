import type { Metadata } from "next";
import Link from "next/link";
import { Layers, Palette, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { DesignCard } from "@/components/account/design-card";
import { AccountPageHeader } from "@/components/account/section";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Saved designs" };
export const dynamic = "force-dynamic";

export default async function DesignsPage() {
  const user = await requireUser("/account/designs");
  const designs = await db.savedDesign.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, kind: true, previewUrl: true, widthIn: true, heightIn: true, updatedAt: true },
  });

  const actions = (
    <>
      <Button asChild variant="outline" className="h-10 rounded-xl px-4">
        <Link href="/design-studio">
          <Shirt data-icon="inline-start" /> New apparel design
        </Link>
      </Button>
      <Button asChild className="h-10 rounded-xl px-4">
        <Link href="/gang-sheet-builder">
          <Layers data-icon="inline-start" /> New gang sheet
        </Link>
      </Button>
    </>
  );

  return (
    <div>
      <AccountPageHeader title="Saved designs" description="Designs you save in the gang sheet builder or design studio live here, ready to edit or reorder." actions={designs.length ? actions : undefined} />
      {designs.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {designs.map((d) => (
            <DesignCard key={d.id} design={d} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Palette}
          title="No saved designs yet"
          description="Build a gang sheet or design a custom tee and hit save — it'll show up here, ready to edit or reorder."
          action={<div className="flex flex-wrap justify-center gap-2">{actions}</div>}
        />
      )}
    </div>
  );
}
