import type { ReactNode } from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { Topbar } from "@/components/admin/Topbar";

export default function AdminShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-secondary/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 px-4 lg:px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
