import type { DemandLiquidity as DemandLiquidityType } from "@/services/microMarketViewModel";
import SectionShell from "./SectionShell";
import MetricCard from "./MetricCard";
import ProgressBar from "./ProgressBar";

interface DemandLiquidityProps {
  data: DemandLiquidityType;
}

export default function DemandLiquidity({ data }: DemandLiquidityProps) {
  const completionStr =
    data.completion != null ? `${Math.round(data.completion * 100)}%` : "—";
  const delayRatioStr =
    data.exitVisibility.delayRatio != null
      ? `${Math.round(data.exitVisibility.delayRatio * 100)}%`
      : "—";
  const exitScoreStr =
    data.exitVisibilityScore != null
      ? String(data.exitVisibilityScore)
      : "—";

  return (
    <SectionShell
      id="demand-liquidity"
      eyebrow="Exit visibility"
      title="Demand & Liquidity"
      description="Completion rates, exit visibility, and demand signals for investors."
    >
      <div className="space-y-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Completion ratio" value={completionStr} />
          <MetricCard label="Delay ratio (exit)" value={delayRatioStr} />
          {data.exitVisibilityScore != null && (
            <MetricCard
              label="Exit visibility score"
              value={exitScoreStr}
            />
          )}
          {data.rentalDemandSignal && (
            <MetricCard
              label="Rental demand signal"
              value={data.rentalDemandSignal}
            />
          )}
          {data.buyerProfileMix && (
            <MetricCard
              label="Buyer profile mix"
              value={data.buyerProfileMix}
            />
          )}
        </div>

        {data.demandBar != null && (
          <div className="pt-2">
          <ProgressBar
            value={data.demandBar}
            max={100}
            label="Demand level"
            showValue
          />
          </div>
        )}
      </div>
    </SectionShell>
  );
}
