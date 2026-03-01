import { requireCrmUser } from "@/lib/crm/auth";
import AutomationMonitorTable from "@/components/crm/automation/AutomationMonitorTable";

export default async function CrmAutomationMonitorPage() {
  await requireCrmUser(["admin", "sales_head", "team_lead", "agent"]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">CRM</p>
        <h1 className="mt-1 text-2xl font-semibold">Automation Monitor</h1>
      </div>
      <AutomationMonitorTable />
    </div>
  );
}

