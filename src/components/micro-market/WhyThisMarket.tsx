import type { WhyThisMarket as WhyThisMarketType } from "@/services/microMarketViewModel";
import SectionShell from "./SectionShell";

interface WhyThisMarketProps {
  data: WhyThisMarketType;
}

const chipClass =
  "inline-flex min-w-max snap-start whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-white/8 dark:text-slate-200";

function ChipBlock({
  label,
  chips,
}: {
  label: string;
  chips: string[];
}) {
  if (chips.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </h3>
      <div className="mt-4 flex flex-wrap gap-3">
        {chips.map((chip) => (
          <span key={chip} className={chipClass}>
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function WhyThisMarket({ data }: WhyThisMarketProps) {
  return (
    <SectionShell
      id="why-this-market"
      eyebrow="Investment rationale"
      title="Why This Market"
      description="Key drivers that make this corridor attractive for investment."
    >
      <div className="space-y-8">
        <ChipBlock label="Who is buying" chips={data.whoIsBuying} />
        <ChipBlock label="Why now" chips={data.whyNow} />
        <ChipBlock label="Migration trend" chips={data.migrationTrend} />
      </div>
    </SectionShell>
  );
}
