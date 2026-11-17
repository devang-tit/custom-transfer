import { getCurrentUser } from "@/lib/auth";
import { StudioTopbar } from "@/components/studio/studio-topbar";

export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <StudioTopbar user={user ? { name: user.name, role: user.role } : null} />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
