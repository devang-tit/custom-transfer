import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/account/print-button";
import { TaxInvoice } from "@/components/shared/tax-invoice";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/account/orders/[number]/invoice">): Promise<Metadata> {
  const { number } = await params;
  return { title: `Invoice ${number}` };
}

export default async function InvoicePage({ params }: PageProps<"/account/orders/[number]/invoice">) {
  const { number } = await params;
  const user = await requireUser(`/account/orders/${number}/invoice`);
  const [order, settings] = await Promise.all([
    db.order.findFirst({ where: { number, userId: user.id }, include: { items: true } }),
    getSettings(),
  ]);
  if (!order) notFound();

  return (
    <div className="grid gap-4">
      {/* Print only the invoice sheet, regardless of the surrounding store layout. */}
      <style>{`@media print {
        body * { visibility: hidden !important; }
        #invoice, #invoice * { visibility: visible !important; }
        #invoice { position: absolute; inset: 0 auto auto 0; width: 100%; border: 0 !important; box-shadow: none !important; }
        @page { margin: 14mm; }
      }`}</style>
      <div className="no-print flex items-center justify-between gap-3">
        <Link href={`/account/orders/${order.number}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to order
        </Link>
        <PrintButton />
      </div>
      <div id="invoice" className="overflow-hidden rounded-2xl border">
        <TaxInvoice order={order} settings={settings} />
      </div>
    </div>
  );
}
