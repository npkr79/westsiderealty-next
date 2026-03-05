import { requireCrmUser } from "@/lib/crm/auth";
import LeadsTableView from "@/components/crm/leads/LeadsTableView";

export default async function LeadsPage() {
  const user = await requireCrmUser();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">CRM</p>
        <h1 className="mt-1 text-2xl font-semibold">Leads</h1>
      </div>
      <LeadsTableView currentUserRole={user.role} />
    </div>
  );
}

