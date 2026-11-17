import type { Metadata } from "next";
import { AccountPageHeader } from "@/components/account/section";
import { DangerZone, PasswordForm, ProfileForm } from "@/components/account/profile-forms";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Profile & security" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser("/account/profile");
  return (
    <div>
      <AccountPageHeader title="Profile & security" description="Manage your personal details, password and email preferences." />
      <div className="grid grid-cols-1 gap-6">
        <ProfileForm user={user} />
        <PasswordForm />
        <DangerZone />
      </div>
    </div>
  );
}
