import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/page-header";
import { emailTransportInfo } from "@/lib/email/mailer";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const me = await requireAdmin();
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Settings" description="Store details, checkout rules, shipping rates and email notifications." />
      <SettingsForm initial={settings} readOnly={me.role !== "ADMIN"} email={emailTransportInfo()} />
    </div>
  );
}
