import { InlineLeadForm } from "@/components/common/InlineLeadForm";

export type AdvisorChip = { label: string; message: string };

export function CityAdvisorCTA({ chips: _ }: { chips: AdvisorChip[] }) {
  return (
    <InlineLeadForm
      sourcePage="/city"
      leadType="BUYER_REQUIREMENT"
      heading={undefined}
      subtext={undefined}
      ctaLabel="Request a Callback"
    />
  );
}
