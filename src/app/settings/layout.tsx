import type { ReactNode } from "react";
import CrmShell from "@/components/crm/CrmShell";
import { requireCrmUser } from "@/lib/crm/auth";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const user = await requireCrmUser();
  return <CrmShell user={user}>{children}</CrmShell>;
}
