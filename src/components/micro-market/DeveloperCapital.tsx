import type { DeveloperCapital as DeveloperCapitalType } from "@/services/microMarketViewModel";
import SectionShell from "./SectionShell";
import MetricCard from "./MetricCard";
import ProgressBar from "./ProgressBar";

interface DeveloperCapitalProps {
  data: DeveloperCapitalType;
}

export default function DeveloperCapital({ data }: DeveloperCapitalProps) {
  return (
    <SectionShell
      id="developers-capital"
      eyebrow="Capital flow"
      title="Developers & Capital"
      description="Developer strength, institutional entry, and premium migration."
    >
      <div className="space-y-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {data.developerStrength != null && (
            <div>
              <ProgressBar
                value={data.developerStrength}
                max={100}
                label="Developer strength"
                showValue
              />
            </div>
          )}
          <MetricCard
            label="New developer entries"
            value={data.institutionalEntry != null ? String(data.institutionalEntry) : "—"}
          />
          {data.institutionalEntryScore != null && (
            <MetricCard
              label="Institutional entry score"
              value={String(data.institutionalEntryScore)}
            />
          )}
          {data.landBankingActivity && (
            <MetricCard
              label="Land banking activity"
              value={data.landBankingActivity}
            />
          )}
          {data.capitalConvictionBand && (
            <MetricCard
              label="Capital conviction band"
              value={data.capitalConvictionBand}
            />
          )}
          {data.premiumMigration.projects != null && (
            <MetricCard
              label="Premium projects"
              value={String(data.premiumMigration.projects)}
            />
          )}
        </div>
        {(data.premiumMigration.density != null || data.premiumMigration.share != null) && (
          <div className="flex flex-wrap gap-4 pt-2">
            {data.premiumMigration.density != null && (
              <span className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium dark:bg-slate-800">
                Premium density: {Math.round(data.premiumMigration.density)}
              </span>
            )}
            {data.premiumMigration.share != null && (
              <span className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium dark:bg-slate-800">
                Institutional share: {Math.round(data.premiumMigration.share * 100)}%
              </span>
            )}
          </div>
        )}
      </div>
    </SectionShell>
  );
}
