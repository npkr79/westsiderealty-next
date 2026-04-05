import type { Metadata } from "next";
import SectionShell from "@/components/institutional-investment-commercial/SectionShell";
import InstitutionalLeadForm from "@/components/institutional-investment-commercial/InstitutionalLeadForm";
import {
  GCCShareChart,
  InflowGrowthChart,
  NetAbsorptionChart,
  YieldArbitrageChart,
} from "@/components/institutional-investment-commercial/InstitutionalChartPanels";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Institutional Investment Commercial | Westside Realty",
  description:
    "Institutional-grade commercial real estate outlook for Hyderabad: yield arbitrage, GCC demand, micro-market strategy, and capital structuring for global allocators.",
  alternates: { canonical: "/institutional-investment-commercial" },
};

const timeline = [
  "Institutional investments in Indian real estate reached $8.5B in 2025.",
  "Domestic pools now contribute over 50% of total deployment.",
  "Supply discipline in Hyderabad is compressing forward vacancy risk.",
  "GCC expansion is sustaining absorption velocity.",
  "Rental growth and MTM re-rating potential remains intact.",
];

const microMarkets = [
  {
    name: "HITEC City",
    thesis: "Core yield",
    detail: "Institutional-grade tenancy, mature infra, resilient rent collections.",
  },
  {
    name: "Financial District",
    thesis: "BFSI growth",
    detail: "Deeper global tenant stack with superior lease covenant quality.",
  },
  {
    name: "Kokapet",
    thesis: "Emerging skyline",
    detail: "Pipeline quality improving with stronger institutional design standards.",
  },
  {
    name: "Neopolis",
    thesis: "Future institutional node",
    detail: "Long-duration corridor with master-planned appreciation and leasing upside.",
  },
];

const activeInvestors = ["Blackstone", "Brookfield", "GIC", "CPP Investments", "ADIA"];

export default function InstitutionalInvestmentCommercialPage() {
  return (
    <main className="scroll-smooth bg-[#0F172A] text-white">
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(180,138,60,0.22),transparent_50%),radial-gradient(circle_at_80%_10%,rgba(51,65,85,0.6),transparent_45%),linear-gradient(180deg,rgba(15,23,42,0.45),rgba(15,23,42,0.92))]" />
        <div className="absolute -bottom-4 left-0 right-0 h-44 bg-[linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:32px_100%] opacity-30" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <p className="text-xs uppercase tracking-[0.26em] text-[#B48A3C]">Institutional Commercial Strategy</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Hyderabad: India’s Structural Yield Advantage for Global Institutional Capital
          </h1>
          <p className="mt-6 max-w-4xl text-base text-slate-200 md:text-lg">
            A once-in-a-cycle convergence of macro reform, GCC demand, and supply discipline is creating a
            high-conviction opportunity for deploying large-scale capital into stabilized Grade-A commercial
            assets.
          </p>
          <a
            href="#institutional-investment-memo"
            className="mt-10 inline-flex rounded-lg bg-[#B48A3C] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            Request Institutional Investment Memorandum
          </a>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 md:py-12">
        <SectionShell
          eyebrow="Why Now"
          title="Strategic Entry Window"
          description="Institutional positioning is shifting from optional to mandatory as transparency improves and leasing visibility deepens."
        >
          <div className="overflow-x-auto pb-2">
            <ol className="flex min-w-[900px] gap-4">
              {timeline.map((point, idx) => (
                <li key={point} className="relative w-56 rounded-xl border border-white/10 bg-slate-950/80 p-4">
                  <span className="text-xs font-semibold text-[#B48A3C]">0{idx + 1}</span>
                  <p className="mt-2 text-sm text-slate-200">{point}</p>
                </li>
              ))}
            </ol>
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Macro Paradigm Shift"
          title="Institutionalization of Indian Real Estate"
          description="RERA compliance, REIT monetization pathways, domestic institutional participation, and inflation protection are converging into an institution-friendly regime."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <ul className="space-y-3 text-sm text-slate-200 md:text-base">
              <li>RERA-led governance frameworks have improved underwriting trust and execution visibility.</li>
              <li>Listed REITs have institutionalized exit optionality and pricing discovery.</li>
              <li>Domestic capital participation now supports market depth across cycles.</li>
              <li>Commercial leases with escalation structures reinforce inflation-hedge characteristics.</li>
            </ul>
            <InflowGrowthChart />
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Global Yield Arbitrage"
          title="Hyderabad Offers a Structural Yield Premium"
          description="Relative to mature gateway markets, Hyderabad combines superior entry yields with stronger multi-year growth runway."
        >
          <YieldArbitrageChart />
        </SectionShell>

        <SectionShell
          eyebrow="Demand Engine"
          title="GCC Expansion Is the Core Leasing Catalyst"
          description="Hyderabad’s GCC ecosystem has evolved into a durable innovation and decision-making hub with deep tenant stickiness."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <ul className="space-y-3 text-sm text-slate-200 md:text-base">
              <li>Global capability centers are scaling from delivery units to innovation HQs.</li>
              <li>BFSI, AI, fintech, and life sciences are extending leasing tenures and quality.</li>
              <li>ESG-compliant Grade-A assets are becoming default institutional preference.</li>
            </ul>
            <GCCShareChart />
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="City Deep Dive"
          title="Hyderabad’s Structural Competitive Position"
          description="Talent density, policy speed, cost efficiency, and balanced sector demand support durable absorption quality."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <ul className="grid gap-3 text-sm text-slate-200 md:grid-cols-2">
              <li className="rounded-xl border border-white/10 bg-slate-950/70 p-4">Talent density with high STEM output</li>
              <li className="rounded-xl border border-white/10 bg-slate-950/70 p-4">Lower occupancy cost vs peer metros</li>
              <li className="rounded-xl border border-white/10 bg-slate-950/70 p-4">Fast policy execution and approvals</li>
              <li className="rounded-xl border border-white/10 bg-slate-950/70 p-4">Balanced demand across sectors</li>
            </ul>
            <NetAbsorptionChart />
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Institutional Micro-Markets"
          title="Corridor-Level Allocation Map"
          description="Each corridor offers a distinct risk-adjusted profile for entry, scale, and monetization."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {microMarkets.map((market) => (
              <article
                key={market.name}
                className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-5"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-[#B48A3C]">{market.thesis}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{market.name}</h3>
                <p className="mt-2 text-sm text-slate-300">{market.detail}</p>
              </article>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Capital Structuring"
          title="Flexible Structures for Institutional Mandates"
          description="Structure by risk appetite, duration, and control objectives."
        >
          <div className="grid gap-4 md:grid-cols-5">
            {["Senior Debt", "Mezzanine", "Preferred Equity", "SPV", "Co-investment"].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-slate-950/75 p-4 text-center text-sm text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Institutional Presence"
          title="Global Investors Already Active in India"
          description="The strategic question has shifted from whether to allocate to how quickly to scale."
        >
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
            {activeInvestors.map((name) => (
              <div key={name} className="rounded-lg border border-white/10 bg-slate-950/70 px-4 py-5 text-center text-sm font-semibold text-slate-100">
                {name}
              </div>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Exit Strategy"
          title="Institutional Exit Flywheel"
          description="Development to liquidity can be sequenced through a repeatable monetization stack."
        >
          <div className="grid gap-3 md:grid-cols-5">
            {["Development", "GCC Leasing", "Stabilization", "REIT", "Liquidity"].map((step) => (
              <div key={step} className="rounded-lg border border-white/10 bg-slate-950/75 p-4 text-center text-sm text-slate-200">
                {step}
              </div>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Risk Mitigation"
          title="Institutional Risk Control Framework"
          description="Underwriting is anchored to durable tenant quality, ESG readiness, and corridor resilience."
        >
          <ul className="grid gap-3 text-sm text-slate-200 md:grid-cols-2 lg:grid-cols-5">
            {["Tenant quality", "Long WALE", "ESG compliance", "Prime location", "Diversified leasing"].map((risk) => (
              <li key={risk} className="rounded-xl border border-white/10 bg-slate-950/75 p-4 text-center">
                {risk}
              </li>
            ))}
          </ul>
        </SectionShell>

        <SectionShell
          id="cta"
          eyebrow="Capital Access"
          title="Institutional Data Room + Investment Memorandum"
          description="For sovereign funds, private equity, family offices, and pension allocators deploying INR 100Cr+."
        >
          <InstitutionalLeadForm />
        </SectionShell>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Institutional Investment Commercial",
            description:
              "Institutional commercial real estate investment thesis and micro-market strategy for Hyderabad.",
            url: "https://www.westsiderealty.in/institutional-investment-commercial",
          }),
        }}
      />
    </main>
  );
}
