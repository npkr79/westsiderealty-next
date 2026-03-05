import type {
  SupplyDevelopment as SupplyDevelopmentType,
  PipelineStage,
} from "@/services/microMarketViewModel";
import SectionShell from "./SectionShell";
import MetricCard from "./MetricCard";
import ProgressBar from "./ProgressBar";

interface SupplyDevelopmentProps {
  data: SupplyDevelopmentType;
}

function PipelineTimeline({ stages }: { stages: PipelineStage[] }) {
  if (stages.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Supply pipeline
      </h3>
      <div className="flex items-center gap-0">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex flex-1 items-center">
            <div className="flex min-w-0 flex-1 flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  stage.status === "completed"
                    ? "bg-emerald-500 text-white"
                    : stage.status === "active"
                      ? "border-2 border-emerald-500 bg-white text-emerald-600 dark:bg-slate-900"
                      : "border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                }`}
              >
                {stage.status === "completed" ? "✓" : i + 1}
              </div>
              <p
                className={`mt-1.5 truncate text-center text-[10px] font-medium ${
                  stage.status === "active"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {stage.label}
              </p>
            </div>
            {i < stages.length - 1 && (
              <div
                className={`h-0.5 flex-1 min-w-[12px] ${
                  stage.status === "completed"
                    ? "bg-emerald-500"
                    : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SupplyDevelopment({ data }: SupplyDevelopmentProps) {
  return (
    <SectionShell
      id="supply-development"
      eyebrow="Market dynamics"
      title="Supply & Development"
      description="Project activity, supply trends, construction momentum, and pipeline."
    >
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Recent launches"
          value={data.projectActivity != null ? data.projectActivity.toLocaleString() : "—"}
        />
        <MetricCard
          label="Supply trend (completion)"
          value={
            data.supplyTrend != null ? `${Math.round(data.supplyTrend * 100)}%` : "—"
          }
        />
        {data.velocityScore != null && (
          <MetricCard
            label="Velocity score"
            value={String(Math.round(data.velocityScore))}
          />
        )}
        {data.tier1DeveloperShare != null && (
          <MetricCard
            label="Tier 1 developer share"
            value={`${Math.round(data.tier1DeveloperShare)}%`}
          />
        )}
        {data.phaseExpansionSignal && (
          <MetricCard label="Phase expansion" value={data.phaseExpansionSignal} />
        )}
        {data.supplyWaveIndicator && (
          <MetricCard label="Supply wave" value={data.supplyWaveIndicator} />
        )}
        {data.constructionMomentum != null && (
          <div className="sm:col-span-2">
            <ProgressBar
              value={data.constructionMomentum}
              max={100}
              label="Construction momentum"
              showValue
            />
          </div>
        )}
      </div>

      {data.pipelineStages.length > 0 && (
        <PipelineTimeline stages={data.pipelineStages} />
      )}
    </SectionShell>
  );
}
