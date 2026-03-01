import { requireCrmUser } from "@/lib/crm/auth";
import MarketingIntelligenceDashboard from "@/components/crm/marketing/MarketingIntelligenceDashboard";

export default async function MarketingDashboardPage() {
  await requireCrmUser(["marketing"]);
  return <MarketingIntelligenceDashboard />;
}
