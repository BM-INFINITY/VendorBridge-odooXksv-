import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";

// Protected dashboard layout — wraps all ERP pages with Sidebar + Header.
// If session is missing, middleware already redirects — this is a safety net.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <AppShell user={session.user as any}>{children}</AppShell>;
}
