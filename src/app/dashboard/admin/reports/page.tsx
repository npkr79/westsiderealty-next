import { requireCrmUser } from "@/lib/crm/auth";
import AdminReportsClient from "@/components/crm/reports/AdminReportsClient";

export default async function AdminReportsPage() {
  await requireCrmUser(["admin"]);
  return <AdminReportsClient />;
}
