import { requireCrmUser } from "@/lib/crm/auth";
import RoutingQueue from "@/components/crm/routing/RoutingQueue";
import WhatsAppAutomationPanel from "@/components/crm/routing/WhatsAppAutomationPanel";
import ManualLeadEntryPanel from "@/components/crm/routing/ManualLeadEntryPanel";

export default async function RoutingPage() {
  await requireCrmUser(["admin", "sales_head", "team_lead"]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">CRM</p>
        <h1 className="mt-1 text-2xl font-semibold">Institutional Lead Assignment Control Center</h1>
      </div>
      <RoutingQueue />
      <ManualLeadEntryPanel />
      <WhatsAppAutomationPanel />
    </div>
  );
}
