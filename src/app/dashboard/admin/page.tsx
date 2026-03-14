import { requireCrmUser } from "@/lib/crm/auth";
import SalesCockpitRealtime from "@/components/crm/dashboard/SalesCockpitRealtime";
import DashboardMetricCards from "@/components/crm/dashboard/DashboardMetricCards";

export default async function AdminDashboardPage() {
  const user = await requireCrmUser(["admin"]);
  return (
    <div>
      <h1 style={{ fontSize: "18px", fontWeight: 500, marginBottom: "1.5rem" }}>
        Admin dashboard
      </h1>
      <DashboardMetricCards scope="all" userId={user.id} userRole="admin" />
      <div style={{ marginTop: "2rem" }}>
        <SalesCockpitRealtime user={user} scope="all" />
      </div>
    </div>
  );
}
