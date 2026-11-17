import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { AdminShell } from "@/components/admin/admin-shell";
import { ADMIN_NAV_COOKIE } from "@/components/admin/nav";
import { getNavCounts } from "../_lib/metrics";

/** The admin uses Inter (exposed as --font-admin, consumed by the .admin-theme tokens). */
const inter = Inter({ subsets: ["latin"], variable: "--font-admin" });

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [counts, settings, jar] = await Promise.all([getNavCounts(), getSettings(), cookies()]);
  return (
    <AdminShell
      user={{ name: user.name, email: user.email, role: user.role }}
      counts={counts}
      storeName={settings.storeName}
      fontClass={inter.variable}
      initialCollapsed={jar.get(ADMIN_NAV_COOKIE)?.value === "collapsed"}
    >
      {children}
    </AdminShell>
  );
}
