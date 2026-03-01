import { CalendarDays } from "lucide-react";
import { requireCrmUser } from "@/lib/crm/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CalendarPage() {
  await requireCrmUser();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">CRM</p>
        <h1 className="mt-1 text-2xl font-semibold">Calendar</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5" />
            Schedule view coming next
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 dark:text-slate-300">
          This placeholder is ready for calendar integrations in the next iteration.
        </CardContent>
      </Card>
    </div>
  );
}
