import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { TaxInvoice } from "@/components/shared/tax-invoice";
import { PrintButton } from "./print-button";

export async function generateMetadata(props: PageProps<"/admin/orders/[id]/invoice">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const o = await db.order.findUnique({ where: { id }, select: { number: true } });
  return { title: `${sp.type === "packing" ? "Packing slip" : "Invoice"} ${o?.number ?? ""}` };
}

export default async function InvoicePage(props: PageProps<"/admin/orders/[id]/invoice">) {
  await requireAdmin();
  const { id } = await props.params;
  const sp = await props.searchParams;
  const packing = sp.type === "packing";
  const [order, settings] = await Promise.all([db.order.findUnique({ where: { id }, include: { items: true } }), getSettings()]);
  if (!order) notFound();

  return (
    <div className="min-h-svh bg-muted/50 py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-4xl items-center justify-between px-4">
        <p className="text-sm text-muted-foreground">{packing ? "Packing slip" : settings.gstin ? "Tax invoice" : "Invoice"} preview</p>
        <PrintButton />
      </div>
      <div className="mx-auto max-w-4xl shadow-sm print:shadow-none sm:rounded-xl sm:overflow-hidden">
        <TaxInvoice order={order} settings={settings} variant={packing ? "packing" : "invoice"} />
      </div>
    </div>
  );
}
