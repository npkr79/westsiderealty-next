import { requireCrmUser } from "@/lib/crm/auth";
import SalesCockpitRealtime from "@/components/crm/dashboard/SalesCockpitRealtime";
import DashboardMetricCards from "@/components/crm/dashboard/DashboardMetricCards";

export default async function AgentDashboardPage() {
  const user = await requireCrmUser(["agent", "team_lead", "sales_head", "admin"]);
  const scope = user.role === "agent" ? "assigned" : "all";

  return (
    <div>
      <h1 style={{ fontSize: "18px", fontWeight: 500, marginBottom: "1.5rem" }}>
        Dashboard
      </h1>
      <DashboardMetricCards scope={scope} userId={user.id} userRole={user.role} />
      <div style={{ marginTop: "2rem" }}>
        <SalesCockpitRealtime user={user} scope={scope} />
      </div>
    </div>
  );
}
