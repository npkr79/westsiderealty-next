import type {
  InfrastructureFuture as InfrastructureFutureType,
  InfrastructureTimelineStep,
} from "@/services/microMarketViewModel";
import SectionShell from "./SectionShell";
import ProgressBar from "./ProgressBar";

interface InfrastructureFutureProps {
  data: InfrastructureFutureType;
}

function InfrastructureTimeline({ steps }: { steps: InfrastructureTimelineStep[] }) {
  if (steps.length === 0) return null;

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Timeline (announced vs active)
      </h3>
      <div className="flex items-center gap-0">
        {steps.map((step, i) => (
          <div key={step.label} className="flex flex-1 items-center">
            <div className="flex min-w-0 flex-1 flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  step.status === "completed"
                    ? "bg-emerald-500 text-white"
                    : step.status === "active"
                      ? "border-2 border-emerald-500 bg-white text-emerald-600 dark:bg-slate-900"
                      : "border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                }`}
              >
                {step.status === "completed" ? "✓" : i + 1}
              </div>
              <p
                className={`mt-1.5 truncate text-center text-[10px] font-medium ${
                  step.status === "active"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 min-w-[12px] ${
                  step.status === "completed"
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

export default function InfrastructureFuture({ data }: InfrastructureFutureProps) {
  const hasContent =
    data.majorInfrastructure ||
    data.impactSignals ||
    data.timeline.length > 0 ||
    data.impactProbability != null ||
    data.majorCorridorCatalysts.length > 0;

  if (!hasContent) return null;

  return (
    <SectionShell
      id="infrastructure-future"
      eyebrow="Future outlook"
      title="Infrastructure & Future"
      description="Major infrastructure, impact signals, and corridor catalysts."
    >
      <div className="space-y-8">
        {data.timeline.length > 0 && (
          <InfrastructureTimeline steps={data.timeline} />
        )}

        <div className="grid gap-8 sm:grid-cols-2">
          {data.impactProbability != null && (
            <ProgressBar
              value={data.impactProbability}
              max={100}
              label="Impact probability"
              showValue
            />
          )}
        </div>

        {data.majorCorridorCatalysts.length > 0 && (
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Major corridor catalysts
            </h3>
            <div className="flex flex-wrap gap-3">
              {data.majorCorridorCatalysts.map((catalyst) => (
                <span
                  key={catalyst}
                  className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-white/8 dark:text-slate-200"
                >
                  {catalyst}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.majorInfrastructure && (
          <div>
            <h3 className="text-base font-semibold text-foreground">Major infrastructure</h3>
            <p className="mt-2 text-muted-foreground leading-relaxed">{data.majorInfrastructure}</p>
          </div>
        )}

        {data.impactSignals && (
          <div>
            <h3 className="text-base font-semibold text-foreground">Impact signals</h3>
            <p className="mt-2 text-muted-foreground leading-relaxed">{data.impactSignals}</p>
          </div>
        )}
      </div>
    </SectionShell>
  );
}
