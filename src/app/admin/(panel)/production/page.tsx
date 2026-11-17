import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { getProductionBoard } from "../../_lib/production";
import { ProductionBoard } from "./board";

export const metadata = { title: "Production board" };

export default async function ProductionPage() {
  await requireAdmin();
  const { cards, now } = await getProductionBoard();
  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        title="Production board"
        description="Drag orders between stages. Rush orders float to the top. Shipped shows the last 7 days."
      />
      {/* Remount when server data changes so local optimistic state starts from fresh props. */}
      <ProductionBoard key={now} initial={cards} now={now} />
    </div>
  );
}
