import { requireCrmUser } from "@/lib/crm/auth";
import RoleDashboardPlaceholder from "@/components/crm/RoleDashboardPlaceholder";

export default async function PartnerDashboardPage() {
  await requireCrmUser(["channel_partner"]);
  return (
    <RoleDashboardPlaceholder
      title="Channel Partner Dashboard"
      description="Manage partner-led opportunities and maintain consistent handoffs with advisory teams."
    />
  );
}
