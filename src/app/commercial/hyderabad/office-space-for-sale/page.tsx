import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, FileSearch, KeyRound, MapPinned, ShieldCheck } from "lucide-react";
import { JsonLd } from "@/components/common/SEO";
import { CommercialCta, OfficeSaleRequirementForm } from "../_components/CommercialPhase1Client";

const canonicalUrl = "https://www.westsiderealty.in/commercial/hyderabad/office-space-for-sale";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Office Space for Sale in Hyderabad | Commercial Office Purchase Advisory",
  description:
    "Evaluate commercial office space for sale in Hyderabad across end-use, vacant and pre-leased opportunities. Share your budget, location preference and purchase purpose for a curated shortlist.",
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title: "Office Space for Sale in Hyderabad | Westside Realty",
    description:
      "Commercial office purchase advisory for Hyderabad end-users and investors evaluating vacant or pre-leased office assets.",
    url: canonicalUrl,
    siteName: "RE/MAX Westside Realty",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Office Space for Sale in Hyderabad | Westside Realty",
    description: "Share a Hyderabad office purchase requirement for a curated commercial acquisition search.",
  },
  robots: { index: true, follow: true },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.westsiderealty.in" },
    { "@type": "ListItem", position: 2, name: "Commercial Hyderabad", item: "https://www.westsiderealty.in/commercial/hyderabad" },
    { "@type": "ListItem", position: 3, name: "Office Space for Sale", item: canonicalUrl },
  ],
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Office Space for Sale in Hyderabad",
  description:
    "Commercial office purchase advisory page for Hyderabad office buyers, end-users and investors evaluating office acquisition requirements.",
  url: canonicalUrl,
  isPartOf: { "@type": "WebSite", name: "RE/MAX Westside Realty", url: "https://www.westsiderealty.in" },
  about: ["Office space for sale Hyderabad", "Commercial office purchase Hyderabad", "Buy office space Hyderabad"],
};

const purchasePaths = [
  {
    title: "Own-use office purchase",
    text: "For founders, companies and family offices comparing office ownership against long-term rent exposure and control over fit-out decisions.",
  },
  {
    title: "Vacant office acquisition",
    text: "For buyers who want possession-led office options and need to evaluate building operations, floor efficiency, parking and readiness.",
  },
  {
    title: "Pre-leased office purchase",
    text: "For buyers open to income-producing offices, with yield and tenant diligence handled as an investment question rather than a generic sale search.",
  },
];

const evaluationFactors = [
  "Clear ownership, title and transfer documentation",
  "Vacant versus leased status and handover expectations",
  "Usable area, floor plate, frontage and efficiency",
  "Fit-out condition, services, parking and common-area quality",
  "Building operations, maintenance charges and long-term liquidity",
  "Tenant profile and lease terms when evaluating pre-leased assets",
];

const supplyChannels = [
  ["Developer inventory", "Relevant unsold or resale office stock from commercial and mixed-use projects where purchase is feasible."],
  ["Professional landlords", "Institutional or professionally managed supply where documentation, operations and commercial terms need careful review."],
  ["Private-owner opportunities", "Privately held offices that may suit end-use or investment buyers when the asset matches the brief."],
  ["Pre-leased assets", "Income-producing offices should be evaluated for tenant, lease quality, lock-in, escalation and exit."],
];

export default function HyderabadOfficeSalePage() {
  return (
    <main className="bg-[#f8f5ef] text-slate-950">
      <JsonLd jsonLd={[breadcrumbSchema, webPageSchema]} />

      <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(135deg,#fdf8ec_0%,#ffffff_48%,#eef2f7_100%)]">
        <div className="mx-auto grid min-h-[650px] max-w-7xl items-end gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-10 lg:py-24">
          <div className="pb-6">
            <Link href="/commercial/hyderabad" className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9f7a35] hover:text-[#7d5e28]">Commercial Hyderabad</Link>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-7xl">
              Buy Commercial Office Space in Hyderabad
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
              Evaluate office acquisition options across Hyderabad for own use, vacant purchase or investment-led office ownership. Westside starts from the purchase brief before narrowing suitable opportunities.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CommercialCta href="#office-sale-requirement" label="Discuss Office Purchase" pageType="commercial_office_sale" intent="office_purchase" />
              <CommercialCta href="/commercial-investments" label="Pre-Leased Investments" pageType="commercial_office_sale" intent="office_purchase" variant="secondary" />
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Office purchase is not one intent</p>
            <div className="mt-5 grid gap-4">
              {purchasePaths.map((path, index) => (
                <div key={path.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold text-[#9f7a35]">0{index + 1}</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{path.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{path.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9f7a35]">Acquisition advisory</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">The page owns office purchase intent, not yield-investment intent.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              A buyer may want an office for operations, capital allocation or a future income strategy. This page keeps the core question around acquiring office property. Users focused primarily on pre-leased yields should use the commercial investments pathway.
            </p>
            <Link href="/commercial-investments" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#8c672e]">
              View commercial investment advisory <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {evaluationFactors.map((factor) => (
              <div key={factor} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <ShieldCheck className="h-5 w-5 text-[#9f7a35]" />
                <p className="mt-4 text-sm leading-7 text-slate-700">{factor}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9f7a35]">Supply channels</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">A sale search should compare source quality, not just quoted area.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Batch 1 does not publish fake inventory cards. The page remains useful by helping the buyer define the purchase brief and by explaining the supply channels Westside can evaluate when real opportunities are available.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {supplyChannels.map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <Building2 className="h-5 w-5 text-[#9f7a35]" />
                <h3 className="mt-4 text-xl font-semibold text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9f7a35]">Location and readiness</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Compare corridors by business use, access and exit options.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Financial District, Gachibowli, HITEC City, Madhapur, Kokapet and adjacent corridors can play different roles depending on end-use versus investment requirements. Phase 1 keeps location-sale demand inside this parent page instead of creating thin micro-market sale pages.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                [MapPinned, "Location fit", "Employee access, customer access, building visibility and corridor maturity."],
                [KeyRound, "Possession fit", "Vacant, fitted, leased or under preparation each changes risk and timeline."],
                [FileSearch, "Due diligence", "Title, society or building operations, charges, tenant terms and transfer process."],
              ].map(([Icon, title, text]) => {
                const LucideIcon = Icon as typeof MapPinned;
                return (
                  <div key={String(title)}>
                    <LucideIcon className="h-5 w-5 text-[#9f7a35]" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-950">{title as string}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{text as string}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[#111827] px-5 py-16 text-white sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d7b56d]">Requirement-first</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Share the acquisition brief before asking for a property list.</h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Office purchase decisions depend on purpose, budget, floor size, location, vacant or leased status and timeline. The form captures those controlled values without requiring sensitive free-text details.
            </p>
          </div>
          <OfficeSaleRequirementForm />
        </div>
      </section>
    </main>
  );
}
