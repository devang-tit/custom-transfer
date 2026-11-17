import { Inter } from "next/font/google";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { AdminShell } from "@/components/admin/admin-shell";
import { getNavCounts } from "../_lib/metrics";

/** The admin uses Inter (exposed as --font-admin, consumed by the .admin-theme tokens). */
const inter = Inter({ subsets: ["latin"], variable: "--font-admin" });

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [counts, settings] = await Promise.all([getNavCounts(), getSettings()]);
  return (
    <AdminShell
      user={{ name: user.name, email: user.email, role: user.role }}
      counts={counts}
      storeName={settings.storeName}
      fontClass={inter.variable}
    >
      {children}
    </AdminShell>
  );
}
