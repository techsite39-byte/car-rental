import type { ReactNode } from "react";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import "./admin.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="admin-route-loading">Loading workspace…</div>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
