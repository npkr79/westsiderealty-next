import { requireCrmUser } from "@/lib/crm/auth";
import SalesCockpitRealtime from "@/components/crm/dashboard/SalesCockpitRealtime";

export default async function SalesDashboardPage() {
  const user = await requireCrmUser(["sales_head"]);
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Institutional cockpit</p>
        <h1 className="mt-1 text-2xl font-semibold">Sales Head Dashboard</h1>
      </div>
      <SalesCockpitRealtime user={user} scope="all" />
    </div>
  );
}
