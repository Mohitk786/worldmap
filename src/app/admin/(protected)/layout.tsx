import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <div className="min-h-dvh bg-ink px-6 py-8 sm:px-10">{children}</div>;
}
