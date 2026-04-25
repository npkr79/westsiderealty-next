import type { ReactNode } from "react";
export const dynamic = "force-dynamic";
import CrmShell from "@/components/crm/CrmShell";
import { requireCrmUser } from "@/lib/crm/auth";

export default async function RoutingLayout({ children }: { children: ReactNode }) {
  const user = await requireCrmUser(["admin", "sales_head", "team_lead"]);
  return <CrmShell user={user}>{children}</CrmShell>;
}
