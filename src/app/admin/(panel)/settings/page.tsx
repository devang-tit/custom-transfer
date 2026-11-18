import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/page-header";
import { emailTransportInfo } from "@/lib/email/mailer";
import { razorpayMode } from "@/lib/razorpay";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const me = await requireAdmin();
  const settings = await getSettings();
  const payments = { razorpay: razorpayMode(), webhook: !!process.env.RAZORPAY_WEBHOOK_SECRET?.trim() };
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Settings" description="Store details, GST, payments, shipping rates and email notifications." />
      <SettingsForm initial={settings} readOnly={me.role !== "ADMIN"} email={emailTransportInfo()} payments={payments} />
    </div>
  );
}
