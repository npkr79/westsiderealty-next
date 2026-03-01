import { requireCrmUser } from "@/lib/crm/auth";
import InstitutionalAlertCommandCenter from "@/components/crm/alerts/InstitutionalAlertCommandCenter";

export default async function AlertsDashboardPage() {
  const user = await requireCrmUser(["admin", "sales_head", "team_lead", "agent"]);
  const canManageAll = user.role === "admin" || user.role === "sales_head" || user.role === "team_lead";

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Alert command center</p>
        <h1 className="mt-1 text-2xl font-semibold">Institutional Alert Command Center</h1>
      </div>
      <InstitutionalAlertCommandCenter currentUserId={user.id} canManageAll={canManageAll} />
    </div>
  );
}

