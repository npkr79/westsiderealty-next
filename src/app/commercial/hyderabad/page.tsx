import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, MapPinned, Search, ShieldCheck } from "lucide-react";
import { JsonLd } from "@/components/common/SEO";
import { CommercialCta, HubRequirementForm, ServicePathwayTracker } from "./_components/CommercialPhase1Client";

const canonicalUrl = "https://www.westsiderealty.in/commercial/hyderabad";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Commercial Real Estate Advisory in Hyderabad | Office Leasing, Sale & Investment",
  description:
    "Share one Hyderabad commercial requirement. Westside Realty helps companies and investors evaluate office leasing, managed offices, office purchase and commercial investment options across Hyderabad.",
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title: "Commercial Real Estate Advisory in Hyderabad | Westside Realty",
    description:
      "A requirement-led commercial real estate advisory hub for Hyderabad office leasing, managed offices, office purchase and investment pathways.",
    url: canonicalUrl,
    siteName: "RE/MAX Westside Realty",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Commercial Real Estate Advisory in Hyderabad | Westside Realty",
    description: "Choose the right Hyderabad commercial property pathway with Westside Realty.",
  },
  robots: { index: true, follow: true },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.westsiderealty.in" },
    { "@type": "ListItem", position: 2, name: "Commercial Hyderabad", item: canonicalUrl },
  ],
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Hyderabad Commercial Real Estate Advisory",
  description:
    "Commercial real estate advisory hub for Hyderabad office leasing, managed offices, office purchase and commercial investment pathways.",
  url: canonicalUrl,
  isPartOf: { "@type": "WebSite", name: "RE/MAX Westside Realty", url: "https://www.westsiderealty.in" },
  about: [
    "Commercial real estate Hyderabad",
    "Office leasing advisory Hyderabad",
    "Managed office space Hyderabad",
    "Commercial office purchase Hyderabad",
  ],
};

const pathways = [
  {
    title: "Office Space for Lease",
    href: "/commercial/hyderabad/office-space-for-lease",
    eyebrow: "Corporate offices",
    text: "For companies comparing Grade-A office options, fit-out conditions, lease terms, floor plates and move-in timelines across Hyderabad.",
    intent: "commercial_lease" as const,
  },
  {
    title: "Managed Offices",
    href: "/commercial/hyderabad/managed-office-space",
    eyebrow: "Furnished / plug-and-play",
    text: "For teams that need managed, furnished or plug-and-play options across seat bands, locations and move-in timelines.",
    intent: "managed_office" as const,
  },
  {
    title: "Office Space for Sale",
    href: "/commercial/hyderabad/office-space-for-sale",
    eyebrow: "Office acquisition",
    text: "For end-users and investors evaluating commercial office ownership, vacant units or pre-leased purchase possibilities.",
    intent: "office_purchase" as const,
  },
  {
    title: "Commercial Investments",
    href: "/commercial-investments",
    eyebrow: "Yield / pre-leased",
    text: "For investors focused on income-producing, pre-leased or yield-oriented commercial property opportunities.",
    intent: "commercial_investment" as const,
  },
];

const searchModel = [
  "Developer and landlord conversations where suitable supply exists",
  "Professional and institutional landlord options when terms and operations matter",
  "Private-owner opportunities when they match the requirement responsibly",
  "Managed-office operators for furnished and plug-and-play requirements",
];

const corridors = [
  {
    title: "Gachibowli + Financial District",
    text: "A core western office corridor for corporate occupiers comparing institutional buildings, ORR access, employee commute and expansion flexibility.",
  },
  {
    title: "HITEC City + Madhapur",
    text: "A mature technology and services corridor where business continuity, metro access and employee familiarity often shape office decisions.",
  },
  {
    title: "Kokapet / Neopolis context",
    text: "An emerging commercial and investment corridor to evaluate carefully around timing, readiness, access and future supply rather than as a standalone Phase-1 office page.",
  },
];

export default function HyderabadCommercialHubPage() {
  return (
    <main className="bg-[#f7f4ee] text-slate-950">
      <JsonLd jsonLd={[breadcrumbSchema, webPageSchema]} />

      <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(176,138,66,0.18),transparent_36%),linear-gradient(135deg,#fffaf0_0%,#f8fafc_52%,#eef2f7_100%)]">
        <div className="mx-auto grid min-h-[680px] max-w-7xl items-end gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-24">
          <div className="pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9f7a35]">Commercial Real Estate · Hyderabad</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-7xl">
              Hyderabad Commercial Real Estate Advisory
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
              Start with one commercial requirement. Westside helps companies and investors choose the right pathway across office leasing, managed offices, office purchase and commercial investment.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CommercialCta href="#commercial-requirement" label="Share Commercial Requirement" pageType="commercial_hyderabad_hub" intent="commercial_hub" />
              <CommercialCta href="/commercial/hyderabad/office-space-for-lease" label="Office Leasing" pageType="commercial_hyderabad_hub" intent="commercial_lease" variant="secondary" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Choose the right commercial path</p>
            <div className="mt-5 grid gap-3">
              {pathways.map((pathway, index) => (
                <Link key={pathway.title} href={pathway.href} className="group grid grid-cols-[2.25rem_1fr_auto] items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#b08a42]/50 hover:shadow-md">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">0{index + 1}</span>
                  <span>
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9f7a35]">{pathway.eyebrow}</span>
                    <span className="mt-1 block text-base font-semibold text-slate-950">{pathway.title}</span>
                  </span>
                  <ArrowRight className="mt-2 h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#9f7a35]" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9f7a35]">Commercial pathways</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Start from the requirement, then choose the route.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Commercial users arrive with different jobs to solve. A company looking for a fitted office, a team comparing managed-office seats and an investor evaluating income-producing assets should not land in the same generic funnel.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {pathways.map((pathway) => (
              <ServicePathwayTracker key={pathway.title} href={pathway.href} intent={pathway.intent}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9f7a35]">{pathway.eyebrow}</p>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{pathway.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{pathway.text}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                  Open pathway <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </ServicePathwayTracker>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9f7a35]">Advisory search model</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">A commercial search should not depend on one public listing grid.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Westside works from the brief first: business use, size or seats, preferred corridors, timing, ownership versus lease preference and the level of readiness needed. The search then narrows to options that can be responsibly evaluated.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {searchModel.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <CheckCircle2 className="h-5 w-5 text-[#9f7a35]" />
                <p className="mt-4 text-sm leading-7 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9f7a35]">Hyderabad context</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Use corridors to clarify the brief, not to create thin pages.</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Phase 1 keeps location targeting disciplined. The hub introduces the main commercial corridors while the existing leasing parent remains the owner of broad Hyderabad office rent and lease demand.
              </p>
            </div>
            <div className="grid gap-4">
              {corridors.map((corridor) => (
                <div key={corridor.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <MapPinned className="h-5 w-5 text-[#9f7a35]" />
                  <h3 className="mt-4 text-xl font-semibold text-slate-950">{corridor.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{corridor.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#111827] px-5 py-16 text-white sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d7b56d]">Building intelligence later</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Building-level demand should become permanent entity content, not short-lived inventory pages.</h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Future commercial building pages should describe durable building facts and attach time-sensitive availability only when it is verified. Batch 1 keeps this as a future architecture path.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              [Building2, "Entity first", "Permanent building profiles should outlive availability."],
              [ShieldCheck, "Verified claims", "No fake availability, pricing or building-specific promises."],
              [Search, "Requirement-led", "Search begins with the brief until structured inventory exists."],
            ].map(([Icon, title, text]) => {
              const LucideIcon = Icon as typeof Building2;
              return (
                <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <LucideIcon className="h-5 w-5 text-[#d7b56d]" />
                  <h3 className="mt-4 text-lg font-semibold">{title as string}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{text as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <HubRequirementForm />
        </div>
      </section>
    </main>
  );
}
