import { requireCrmUser } from "@/lib/crm/auth";
import LeadDetailView from "@/components/crm/leads/LeadDetailView";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCrmUser();
  const { id } = await params;

  return <LeadDetailView leadId={id} currentUser={user} />;
}
