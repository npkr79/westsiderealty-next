import { requireCrmUser } from "@/lib/crm/auth";
import ArticlesManager from "@/components/admin/ArticlesManager";

export default async function ArticlesPage() {
  await requireCrmUser(["admin"]);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Articles</h1>
        <p className="mt-1 text-sm text-slate-500">Upload and manage real estate articles manually.</p>
      </div>
      <ArticlesManager />
    </div>
  );
}
