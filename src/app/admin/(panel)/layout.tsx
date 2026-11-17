import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { getNavCounts } from "../_lib/metrics";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const counts = await getNavCounts();
  return (
    <AdminShell user={{ name: user.name, email: user.email, role: user.role }} counts={counts}>
      {children}
    </AdminShell>
  );
}
