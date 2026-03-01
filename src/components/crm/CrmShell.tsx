import type { ReactNode } from "react";
import CrmSidebar from "@/components/crm/CrmSidebar";
import CrmHeader from "@/components/crm/CrmHeader";
import type { CrmUser } from "@/lib/crm/types";

interface CrmShellProps {
  user: CrmUser;
  children: ReactNode;
}

export default function CrmShell({ user, children }: CrmShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="md:flex">
        <CrmSidebar />
        <div className="min-w-0 flex-1">
          <CrmHeader user={user} />
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

