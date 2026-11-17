import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return children;
}
