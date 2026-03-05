import { requireCrmUser } from "@/lib/crm/auth";
import CapitalFlowAnalyticsDashboard from "@/components/crm/analytics/CapitalFlowAnalyticsDashboard";

export default async function AnalyticsDashboardPage() {
  await requireCrmUser(["analyst"]);
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Analytics cockpit</p>
        <h1 className="mt-1 text-2xl font-semibold">Capital Flow Analytics</h1>
      </div>
      <CapitalFlowAnalyticsDashboard />
    </div>
  );
}
