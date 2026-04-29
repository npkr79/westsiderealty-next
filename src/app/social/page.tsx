import { redirect } from 'next/navigation';
import { requireCrmUser } from '@/lib/crm/auth';
import SocialMediaDashboard from '@/components/crm/social/SocialMediaDashboard';

// Auth-protected: must NOT be statically generated or ISR-cached, otherwise
// requireCrmUser() runs without a cookie context during revalidation and throws
// (manifests as "Unhandled Rejection: Error: ..." → 500 in production).
export const dynamic = 'force-dynamic';

export default async function SocialPage() {
  const user = await requireCrmUser();
  if (user.role !== 'admin') {
    redirect('/dashboard/agent');
  }
  return <SocialMediaDashboard />;
}
