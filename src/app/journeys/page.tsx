import { requireCrmUser } from "@/lib/crm/auth";
import JourneyQueueMonitor from "@/components/crm/journeys/JourneyQueueMonitor";

export default async function JourneysPage() {
  await requireCrmUser(["admin", "sales_head", "team_lead"]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Journey operations</p>
        <h1 className="mt-1 text-2xl font-semibold">Background Journey Execution Monitor</h1>
      </div>
      <JourneyQueueMonitor />
    </div>
  );
}

