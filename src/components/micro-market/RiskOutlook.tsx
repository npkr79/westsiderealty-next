import type { RiskOutlook as RiskOutlookType } from "@/services/microMarketViewModel";
import SectionShell from "./SectionShell";
import MetricCard from "./MetricCard";
import ProgressBar from "./ProgressBar";

interface RiskOutlookProps {
  data: RiskOutlookType;
}

function ProbabilityBar({
  label,
  value,
  colorClass = "bg-primary",
}: {
  label: string;
  value: number;
  colorClass?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export default function RiskOutlook({ data }: RiskOutlookProps) {
  const supplyRiskStr =
    data.supplyRisk != null ? `${Math.round(data.supplyRisk * 100)}%` : "—";

  return (
    <SectionShell
      id="risk-outlook"
      eyebrow="Investment lens"
      title="Risk & Outlook"
      description="Supply risk, execution profile, Bull/Base/Bear outlook, and future cycle signals."
    >
      <div className="space-y-8">
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Bull / Base / Bear outlook
          </h3>
          <div className="space-y-4">
            <ProbabilityBar
              label="Bull"
              value={data.bullBaseBear.bull}
              colorClass="bg-emerald-500"
            />
            <ProbabilityBar
              label="Base"
              value={data.bullBaseBear.base}
              colorClass="bg-amber-500"
            />
            <ProbabilityBar
              label="Bear"
              value={data.bullBaseBear.bear}
              colorClass="bg-rose-500"
            />
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          {data.pricingOverheatingRisk != null && (
            <ProgressBar
              value={data.pricingOverheatingRisk}
              max={100}
              label="Pricing overheating risk"
              showValue
            />
          )}
          {data.executionRisk != null && (
            <ProgressBar
              value={data.executionRisk}
              max={100}
              label="Execution risk"
              showValue
            />
          )}
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <MetricCard label="Supply risk (delay)" value={supplyRiskStr} />
          {data.execution && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/30">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Execution
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">{data.execution}</p>
            </div>
          )}
        </div>

        {(data.futureCycle.rotationScore != null || data.futureCycle.momentumScore != null) && (
          <div className="flex flex-wrap gap-3 pt-2">
            {data.futureCycle.rotationScore != null && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium dark:bg-slate-800">
                Rotation: {Math.round(data.futureCycle.rotationScore)}
              </span>
            )}
            {data.futureCycle.momentumScore != null && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium dark:bg-slate-800">
                Momentum: {Math.round(data.futureCycle.momentumScore)}
              </span>
            )}
          </div>
        )}
      </div>
    </SectionShell>
  );
}
