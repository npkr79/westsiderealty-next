import { requireCrmUser } from "@/lib/crm/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  await requireCrmUser();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">CRM</p>
        <h1 className="mt-1 text-2xl font-semibold">Settings</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workspace settings</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 dark:text-slate-300">
          Profile, preferences, and notification controls will live here. This foundation is ready for Phase 2 settings forms.
        </CardContent>
      </Card>
    </div>
  );
}
