"use client";
import { useState } from "react";
import CrmSidebar from "./CrmSidebar";
import CrmHeader from "./CrmHeader";
import CrmBottomNav from "./CrmBottomNav";
import type { CrmUser } from "@/lib/crm/types";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface CrmShellProps {
  user: CrmUser;
  children: React.ReactNode;
}

export default function CrmShell({ user, children }: CrmShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  usePushNotifications(user?.id ?? null);
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar — drawer on mobile, fixed on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:block`}
      >
        <CrmSidebar onClose={() => setSidebarOpen(false)} />
      </div>
      {/* Main content */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        <CrmHeader user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      {/* Bottom nav — mobile only */}
      <CrmBottomNav />
    </div>
  );
}
