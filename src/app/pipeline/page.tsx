import { requireCrmUser } from "@/lib/crm/auth";
import PipelineBoard from "@/components/crm/pipeline/PipelineBoard";

export default async function PipelinePage() {
  await requireCrmUser();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">CRM</p>
        <h1 className="mt-1 text-2xl font-semibold">Pipeline</h1>
      </div>
      <PipelineBoard />
    </div>
  );
}
