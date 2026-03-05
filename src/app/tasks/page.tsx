import { requireCrmUser } from "@/lib/crm/auth";
import TasksWorkspace from "@/components/crm/tasks/TasksWorkspace";

export default async function TasksPage() {
  await requireCrmUser();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">CRM</p>
        <h1 className="mt-1 text-2xl font-semibold">Tasks</h1>
      </div>
      <TasksWorkspace />
    </div>
  );
}
