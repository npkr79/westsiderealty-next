import { requireCrmUser } from "@/lib/crm/auth";
import RevenuePipelineDashboard from "@/components/crm/revenue/RevenuePipelineDashboard";

export default async function CrmRevenueDashboardPage() {
  await requireCrmUser(["admin", "sales_head", "team_lead", "agent"]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">CRM</p>
        <h1 className="mt-1 text-2xl font-semibold">Revenue &amp; Pipeline Dashboard</h1>
      </div>
      <RevenuePipelineDashboard />
    </div>
  );
}

