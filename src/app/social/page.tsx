import { redirect } from 'next/navigation';
import { requireCrmUser } from '@/lib/crm/auth';
import SocialMediaDashboard from '@/components/crm/social/SocialMediaDashboard';

export default async function SocialPage() {
  const user = await requireCrmUser();
  if (user.role !== 'admin') {
    redirect('/dashboard/agent');
  }
  return <SocialMediaDashboard />;
}
