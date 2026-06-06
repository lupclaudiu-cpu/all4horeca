import type { Metadata } from "next";
import { AdminShell } from "@/features/admin/admin-shell";
import { requireServerRole } from "@/lib/auth/server-role";

export const metadata: Metadata = {
  title: { default: "Super Admin", template: "%s | ALL4HORECA Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireServerRole(["super_admin"], "/admin");
  return (
    <AdminShell>{children}</AdminShell>
  );
}
