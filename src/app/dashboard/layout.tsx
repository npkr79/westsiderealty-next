import type { ReactNode } from "react";
export const dynamic = "force-dynamic";
import CrmShell from "@/components/crm/CrmShell";
import { requireCrmUser } from "@/lib/crm/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireCrmUser();
  return <CrmShell user={user}>{children}</CrmShell>;
}

