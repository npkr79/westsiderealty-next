import CrmShell from "@/components/crm/CrmShell";
import SimulationEngineConsole from "@/components/crm/simulation/SimulationEngineConsole";
import { requireCrmUser } from "@/lib/crm/auth";

export default async function AdminSimulationPage() {
  const user = await requireCrmUser(["admin"]);

  return (
    <CrmShell user={user}>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Admin</p>
          <h1 className="mt-1 text-2xl font-semibold">CRM Simulation Engine</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Controlled simulation for lead flow, agent productivity, funnel behavior, intent, and WhatsApp workflows.
          </p>
        </div>
        <SimulationEngineConsole />
      </div>
    </CrmShell>
  );
}
