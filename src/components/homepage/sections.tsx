type AnyProps = Record<string, unknown>;

function BaseSection({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
    </section>
  );
}

export function HeroSection(_: AnyProps) {
  return <BaseSection title="Market Intelligence" description="Live market summary is loading." />;
}

export function LiveMarketPulseBar(_: AnyProps) {
  return <BaseSection title="Live Market Pulse" description="Pulse signals are being refreshed." />;
}

export function DataCoverageSnapshotStrip(_: AnyProps) {
  return <BaseSection title="Coverage Snapshot" description="Coverage baseline is available." />;
}

export function InstitutionalCapitalActivitySection(_: AnyProps) {
  return <BaseSection title="Capital Activity" description="Institutional capital activity feed." />;
}

export function InstitutionalCaseStudiesSection(_: AnyProps) {
  return <BaseSection title="Case Studies" description="Recent transaction case studies." />;
}

export function InvestorOutcomesAllocationPerformanceSection(_: AnyProps) {
  return <BaseSection title="Allocation Outcomes" description="Portfolio allocation outcomes summary." />;
}

export function PrivateAllocationWindowsSection(_: AnyProps) {
  return <BaseSection title="Private Allocation Windows" description="Private windows are updated periodically." />;
}

export function CapitalAllocationSignalsSection(_: AnyProps) {
  return <BaseSection title="Allocation Signals" description="Signal stack for timing and conviction." />;
}

export function CapitalAllocationFrameworkSection(_: AnyProps) {
  return <BaseSection title="Allocation Framework" description="Disciplined framework for decisioning." />;
}

export function EntryTimingCycleSignalsSection(_: AnyProps) {
  return <BaseSection title="Entry Timing" description="Cycle stage and timing guidance." />;
}

export function InstitutionalCapitalFlowsSection(_: AnyProps) {
  return <BaseSection title="Capital Flows" description="Institutional movement across corridors." />;
}

export function InstitutionalResearchReportsPreviewSection(_: AnyProps) {
  return <BaseSection title="Research Reports" description="Institutional research previews." />;
}

export function InstitutionalResearchMethodologySection(_: AnyProps) {
  return <BaseSection title="Methodology" description="How intelligence signals are derived." />;
}

export function RecentInstitutionalMovesSection(_: AnyProps) {
  return <BaseSection title="Recent Moves" description="Recent institutional participation highlights." />;
}

export function InstitutionalTrustAuthoritySection(_: AnyProps) {
  return <BaseSection title="Trust & Authority" description="Credibility and governance indicators." />;
}

export function InstitutionalIntelligenceSection(_: AnyProps) {
  return <BaseSection title="Intelligence Layer" description="Structured project and market narratives." />;
}

export function LuxuryMarketsSection(_: AnyProps) {
  return <BaseSection title="Luxury Markets" description="Premium corridors and demand pockets." />;
}

export function TrustAuthoritySection(_: AnyProps) {
  return <BaseSection title="Trust Signals" description="Advisory trust and operating principles." />;
}
