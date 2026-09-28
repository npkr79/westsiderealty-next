import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MoveRight } from "lucide-react";
import { JsonLd } from "@/components/common/SEO";
import {
  CorporateOfficeLeasingCta,
  CorporateOfficeLeasingForm,
  CorporateOfficeLeasingTracker,
  MarketCorridorSelector,
  RequirementSizeSelector,
} from "./CorporateOfficeLeasingClient";

const canonicalUrl = "https://www.westsiderealty.in/commercial/hyderabad/office-space-for-lease";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Office Space for Lease in Hyderabad | Grade-A Corporate Leasing | Westside Realty",
  description:
    "Share one corporate office requirement in Hyderabad. Westside Realty evaluates suitable Grade-A office space options across key corridors and landlords.",
  alternates: { canonical: canonicalUrl },
  keywords:
    "office space for lease in Hyderabad, commercial office space for lease Hyderabad, Grade A office space Hyderabad, corporate office leasing Hyderabad",
  openGraph: {
    title: "Office Space for Lease in Hyderabad | Westside Realty",
    description:
      "Corporate office search and leasing advisory for Hyderabad. Share one requirement; Westside shortlists suitable Grade-A office options.",
    url: canonicalUrl,
    siteName: "RE/MAX Westside Realty",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Office Space for Lease in Hyderabad | Westside Realty",
    description:
      "Share one Hyderabad office requirement and receive a curated shortlist of suitable Grade-A office options.",
  },
  robots: { index: true, follow: true },
};

const corridors = [
  {
    name: "Financial District",
    note: "Hyderabad's established corporate core for larger occupiers that need institutional buildings, strong landlord depth and proximity to the western business district. It is often relevant for headquarters, GCC expansion and teams that need serious visitor access, parking review and future-growth flexibility.",
  },
  {
    name: "Gachibowli",
    note: "A mature office and technology district with wide occupier relevance across IT, BFSI, consulting and support teams. Gachibowli works well when a company wants to compare established business parks, employee commute patterns and multiple building options before committing.",
  },
  {
    name: "Raidurg",
    note: "A transit-linked office cluster near the HITEC City and Financial District belt. Raidurg is useful for teams that value metro access, centrality within the western employment corridor and a shorter shortlist of professional office environments.",
  },
  {
    name: "HITEC City",
    note: "One of Hyderabad's most mature office ecosystems, with deep technology, product and services occupier demand. It is usually relevant when business continuity, employee familiarity and access to a large technology workforce matter more than being in an emerging corridor.",
  },
  {
    name: "Kokapet / Neopolis",
    note: "An emerging expansion corridor for companies planning growth around newer infrastructure and future business districts. It can suit phased requirements, but timing, building readiness, access and surrounding employee convenience need careful comparison.",
  },
];

const searchScope = [
  {
    title: "Grade-A Business Parks",
    text: "Campus-style and multi-tower office environments that may fit larger or phased requirements.",
  },
  {
    title: "Developer Inventory",
    text: "Suitable options from active office developers, evaluated against your size, timing and fit-out needs.",
  },
  {
    title: "Institutional / Professional Landlords",
    text: "Professionally managed office supply where commercial terms, building operations and occupancy fit need review.",
  },
  {
    title: "Private-Owner Availability",
    text: "Relevant privately held office spaces when they match the requirement and can be evaluated responsibly.",
  },
  {
    title: "Suitable Corporate Office Opportunities",
    text: "Warm-shell, furnished, floor-plate and expansion options suitable for business use.",
  },
];

const process = [
  {
    title: "Share Your Requirement",
    text: "Area, location, fit-out, seats, budget and timeline.",
  },
  {
    title: "We Search The Market",
    text: "Westside evaluates suitable opportunities across relevant Hyderabad office markets.",
  },
  {
    title: "Receive A Curated Shortlist",
    text: "Options are narrowed based on requirement fit rather than a generic property catalogue.",
  },
  {
    title: "Site Visits & Commercial Evaluation",
    text: "Coordinate evaluation, inspections and commercial discussions.",
  },
];

const marketSignals = [
  {
    label: "Hyderabad Q2 gross leasing",
    value: "1.77 mn sq ft",
    source: "JLL Hyderabad Office Market Dynamics Q2 2026",
    href: "https://www.jll.com/en-in/insights/market-dynamics/hyderabad-office",
    note: "JLL also reported 1.33 mn sq ft of new supply in Q2 and continued rental growth in premium grade projects.",
  },
  {
    label: "Hyderabad H1 leasing",
    value: "5.2 MSF",
    source: "Cushman & Wakefield Hyderabad MarketBeat Q2 2026",
    href: "https://www.cushmanwakefield.com/en/india/insights/marketbeat-india/hyderabad-marketbeat",
    note: "Cushman reported Gachibowli as the most active office corridor in Q2, followed by Madhapur.",
  },
  {
    label: "Hyderabad H1 leasing",
    value: "About 7.2 mn sq ft",
    source: "Colliers India Office Snapshot Q2 2026",
    href: "https://www.colliers.com/en-in/news/press-release-india-office-market-q2-2026",
    note: "Colliers reported Hyderabad at about one-fifth of top-seven-city office demand in H1 2026.",
  },
  {
    label: "GCC share of India office take-up",
    value: "43% in H1 2026",
    source: "CBRE India Office Figures Q2 2026",
    href: "https://www.cbre.co.in/press-releases/indias-office-demand-and-supply-continue-to-scale-new-peaks-in-q2",
    note: "CBRE reported that Bengaluru, Hyderabad and Pune together accounted for 68% of large-format Q2 transactions.",
  },
];

const leaseEvaluationFactors = [
  {
    title: "Usable vs chargeable area",
    text: "Compare the usable area, carpet efficiency and common-area loading before treating two quoted areas as equivalent.",
  },
  {
    title: "Contiguous floor availability",
    text: "Larger mandates often need contiguous space, expansion rights or a phased move-in plan rather than scattered smaller pockets.",
  },
  {
    title: "Fit-out condition",
    text: "Bare shell, warm shell and fitted offices have very different timelines, capex needs and handover responsibilities.",
  },
  {
    title: "Rent, CAM and escalation structure",
    text: "Review base rent, maintenance charges, deposits, escalation clauses and what is included in the quoted commercial terms.",
  },
  {
    title: "Lease tenure and lock-in",
    text: "Match the lock-in and renewal structure to business certainty, headcount plan and potential relocation risk.",
  },
  {
    title: "Access, parking and employee commute",
    text: "Evaluate parking ratios, public transport, last-mile access and whether the location works for the actual employee base.",
  },
  {
    title: "Possession and expansion timeline",
    text: "Check readiness, fit-out period, statutory handovers and whether the building can support future growth.",
  },
];

const fitOutTerms = [
  {
    title: "Bare Shell",
    text: "A basic handover where the company usually plans and funds more of the interior build-out. It can offer control, but usually needs more time and capex.",
  },
  {
    title: "Warm Shell",
    text: "A partially prepared space, typically with core services in place. It is often a middle path when the occupier wants customization without starting from zero.",
  },
  {
    title: "Fitted / Plug-and-Play",
    text: "A ready or near-ready office with interiors, workstations or services already built. It can reduce move-in time, but must still be checked for layout fit and operating cost.",
  },
];

const faqs = [
  {
    question: "Which Hyderabad locations are suitable for corporate office leasing?",
    answer:
      "Financial District, Gachibowli, Raidurg, HITEC City and Kokapet / Neopolis are the main corridors Westside evaluates for suitable corporate office requirements. The right choice depends on employee commute, building readiness, floor-plate needs, fit-out, budget and expansion plans.",
  },
  {
    question: "Can Westside evaluate 50,000 sq ft or 100,000+ sq ft office requirements?",
    answer:
      "Yes, Westside can evaluate larger requirements where suitable market availability exists. For large spaces, the search usually focuses on contiguous floor availability, phased expansion, landlord capability, possession timelines and whether multiple buildings need to be compared.",
  },
  {
    question: "What is the difference between bare shell, warm shell and fitted office space?",
    answer:
      "Bare shell usually needs the most interior work. Warm shell has more base services ready. Fitted or plug-and-play space is closer to move-in condition. The right option depends on timeline, capex, brand standards and how much customization the company needs.",
  },
  {
    question: "Can Westside compare offices across multiple developers and landlords?",
    answer:
      "Yes. The page is built around one requirement and multiple suitable office options, so Westside can compare relevant buildings, landlords, fit-out conditions and commercial structures instead of pushing one isolated property.",
  },
  {
    question: "What information should a company provide before starting an office search?",
    answer:
      "Useful starting inputs include required area, seats, preferred corridors, current office location, fit-out preference, move-in timeline, rent budget, parking needs and whether the requirement is a relocation, expansion, consolidation or GCC setup.",
  },
  {
    question: "How does Westside's corporate office search process work?",
    answer:
      "Share one office brief, then Westside reviews relevant Hyderabad office options, narrows them around fit and timing, and helps coordinate shortlist evaluation, site visits and commercial discussions.",
  },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.westsiderealty.in" },
    { "@type": "ListItem", position: 2, name: "Commercial", item: "https://www.westsiderealty.in/commercial-investments" },
    { "@type": "ListItem", position: 3, name: "Hyderabad Office Leasing", item: canonicalUrl },
  ],
};

const webpageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Office Space for Lease in Hyderabad",
  description:
    "Corporate office search and leasing advisory page for Hyderabad office requirements across Financial District, Gachibowli, Raidurg, HITEC City, Kokapet and Madhapur.",
  url: canonicalUrl,
  isPartOf: {
    "@type": "WebSite",
    name: "RE/MAX Westside Realty",
    url: "https://www.westsiderealty.in",
  },
  about: [
    "Office space for lease in Hyderabad",
    "Corporate office leasing Hyderabad",
    "Grade A office space Hyderabad",
  ],
};

export default function HyderabadOfficeLeasingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080808] text-white">
      <CorporateOfficeLeasingTracker />
      <JsonLd jsonLd={[breadcrumbSchema, webpageSchema]} />
      <style>{`
        .co-field {
          width: 100%;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 2px;
          background: rgba(255,255,255,0.045);
          color: #fff;
          min-height: 46px;
          padding: 11px 13px;
          font-size: 14px;
          outline: none;
        }
        .co-field::placeholder { color: rgba(148,163,184,0.8); }
        .co-field:focus {
          border-color: rgba(200,169,110,0.8);
          box-shadow: 0 0 0 3px rgba(200,169,110,0.12);
        }
        .co-field option { color: #111; }
      `}</style>

      <section className="relative isolate overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1600&q=75&auto=format&fit=crop"
          alt="Modern corporate office workspace in a Grade-A business district"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,8,8,0.94)_0%,rgba(8,8,8,0.82)_42%,rgba(8,8,8,0.36)_100%)]" />
        <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-end gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-10 lg:py-20">
          <div className="max-w-3xl pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c8a96e]">Corporate Office Leasing · Hyderabad</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.06] text-white sm:text-5xl lg:text-6xl">
              Find the Right Office for Your Business in Hyderabad
            </h1>
            <p className="mt-6 max-w-2xl text-2xl font-semibold uppercase leading-tight tracking-[0.08em] text-[#f1d9a2] sm:text-3xl">
              One Requirement. Multiple Grade-A Office Options.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Share your office requirement once. Westside evaluates suitable options across Hyderabad&apos;s Grade-A office market based on location, area, fit-out, commercial terms and move-in timeline.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CorporateOfficeLeasingCta label="Get Matching Office Options" />
              <CorporateOfficeLeasingCta label="Discuss a Requirement" variant="secondary" />
            </div>
            <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
              {["One brief", "Market comparison", "Curated shortlist"].map((item) => (
                <div key={item} className="border-l border-[#c8a96e]/50 pl-4 text-sm font-medium text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="block pb-4">
            <div className="border border-white/10 bg-black/45 p-6 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Search-led leasing advisory</p>
              <div className="mt-5 grid gap-4 text-slate-100">
                {[
                  ["01", "Share one corporate office brief"],
                  ["02", "Compare suitable Grade-A options"],
                  ["03", "Shortlist around fit, timing and commercials"],
                ].map(([step, item]) => (
                  <div key={step} className="grid grid-cols-[2.5rem_1fr] gap-3 border-l border-[#c8a96e]/60 pl-4">
                    <span className="text-sm font-semibold text-[#c8a96e]">{step}</span>
                    <span className="text-base font-semibold leading-7">{item}</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm leading-7 text-slate-400">
                Useful when you need to compare the market, not chase one building at a time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0d0d0d] px-5 py-8 sm:px-8 lg:px-10">
        <RequirementSizeSelector />
      </section>

      <section className="bg-[#080808] px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c8a96e]">One Search Across The Market</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">What Westside searches across.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Instead of contacting multiple buildings independently, share one requirement. Westside evaluates suitable office opportunities across relevant supply categories around your brief.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
            {searchScope.map((item) => (
              <div key={item.title} className="bg-[#101010] p-6">
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#080808] px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c8a96e]">Hyderabad Office Market Coverage</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Where should your Hyderabad office be?</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Click a corridor to add it to the same office requirement form, or keep your location flexible and let the search begin from area, fit-out and timing.
            </p>
          </div>
          <MarketCorridorSelector corridors={corridors} />
        </div>
      </section>


      <section className="bg-[#101010] px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 border border-white/10 bg-[#141414] p-6 lg:grid-cols-[0.72fr_1.28fr] lg:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c8a96e]">Corridor Leasing Guides</p>
            <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">Need a location-specific office search?</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Start with the broad Hyderabad leasing page, or use a corridor guide when your requirement is already focused on a western office cluster.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/commercial/hyderabad/office-space-for-lease/gachibowli-financial-district" className="group border border-white/10 bg-[#101010] p-5 transition hover:border-[#c8a96e]/60">
              <h3 className="text-lg font-semibold text-white group-hover:text-[#c8a96e]">Gachibowli / Financial District</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">For corporate office searches around Gachibowli, Financial District and Nanakramguda.</p>
            </Link>
            <Link href="/commercial/hyderabad/office-space-for-lease/hitec-city-madhapur" className="group border border-white/10 bg-[#101010] p-5 transition hover:border-[#c8a96e]/60">
              <h3 className="text-lg font-semibold text-white group-hover:text-[#c8a96e]">HITEC City / Madhapur</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">For office requirements in Hyderabad&apos;s mature technology and business-services corridor.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#0d0d0d] px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c8a96e]">Illustrative Requirement</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Example office brief Westside can evaluate.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              For a requirement like this, Westside evaluates fit across availability, access, condition, commercials, readiness and expansion flexibility.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-5">
            {["75,000 SFT", "Financial District / Raidurg", "Warm Shell", "600-800 Seats", "Move-in Within 4 Months"].map((item) => (
              <div key={item} className="bg-[#101010] p-5">
                <p className="text-lg font-semibold leading-7 text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f1e8] px-5 py-16 text-[#141414] sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d6b2f]">How The Office Search Works</p>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">From one brief to a focused shortlist.</h2>
            <p className="mt-4 text-sm leading-7 text-neutral-600">
              A concise process for comparing suitable options without turning the page into a public property catalogue.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {process.map((step, index) => (
              <div key={step.title} className="border border-black/10 bg-white p-5">
                <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#141414] text-xs font-semibold text-white">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#080808] px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 border-y border-white/10 py-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c8a96e]">One Requirement. One Search.</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Use one advisor to compare the market.</h2>
          </div>
          <p className="text-sm leading-7 text-slate-400">
            Corporate occupiers often need to compare multiple buildings, landlords, fit-out conditions and commercial structures. Share one requirement with Westside and let our Corporate Leasing team identify and compare suitable options.
          </p>
        </div>
      </section>

      <section className="bg-[#080808] px-5 py-12 sm:px-8 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-4xl">
          <CorporateOfficeLeasingForm />
        </div>
      </section>

      <section className="bg-[#0d0d0d] px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c8a96e]">Market Context Updated: September 2026</p>
              <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Hyderabad Grade-A Office Leasing Market</h2>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                Hyderabad&apos;s office search is not one market. Corporate occupiers usually compare established corridors such as Financial District, Gachibowli, Raidurg and HITEC City with emerging expansion options around Kokapet and Neopolis.
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                GCC and enterprise demand has kept the office conversation focused on Grade-A buildings, landlord capability, large floor plates, employee access and expansion flexibility. The right shortlist changes with timing, fit-out condition, contiguous availability and how quickly a team needs to move.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
              {marketSignals.map((signal) => (
                <article key={`${signal.source}-${signal.label}`} className="bg-[#111111] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{signal.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{signal.value}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{signal.note}</p>
                  <a
                    href={signal.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.14em] text-[#c8a96e] hover:text-[#e2c889]"
                  >
                    Source: {signal.source}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f1e8] px-5 py-16 text-[#141414] sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d6b2f]">Corporate Lease Evaluation</p>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">What companies should compare before leasing an office.</h2>
              <p className="mt-4 text-sm leading-7 text-neutral-600">
                A corporate office search should compare more than rent. The shortlist needs to work operationally, financially and for the people who will use the workplace every day.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden border border-black/10 bg-black/10 sm:grid-cols-2">
              {leaseEvaluationFactors.map((factor) => (
                <article key={factor.title} className="bg-white p-5">
                  <h3 className="text-lg font-semibold">{factor.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-neutral-600">{factor.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#080808] px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c8a96e]">Fit-Out & Larger Requirements</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Plan the space type before comparing buildings.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              For 25,000 sq ft, 50,000 sq ft or 100,000+ sq ft requirements, the search often becomes a market-mapping exercise: which buildings can support the area, whether contiguous floors exist, what possession timeline is realistic and whether expansion can be phased.
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Westside evaluates larger corporate requirements where suitable market availability exists, without implying guaranteed space in any one building or corridor.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10">
            {fitOutTerms.map((term) => (
              <article key={term.title} className="bg-[#101010] p-5">
                <h3 className="text-lg font-semibold text-white">{term.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{term.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#101010] px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c8a96e]">Corporate Office Leasing FAQ</p>
          <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Questions companies usually ask before starting.</h2>
          <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left text-base font-semibold text-white">
                  <span>{faq.question}</span>
                  <span className="mt-1 text-[#c8a96e] transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-sm leading-7 text-slate-400">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#101010] px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 border border-white/10 bg-[#141414] p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c8a96e]">Have Grade-A Office Space Available For Lease?</p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Developers, landlords and owners can share current office availability with Westside for consideration against relevant corporate requirements.
            </p>
          </div>
          <Link
            href="/contact?topic=office-availability"
            className="inline-flex min-h-12 items-center justify-center rounded-sm border border-white/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:border-[#c8a96e] hover:text-[#c8a96e]"
          >
            Submit Office Availability
          </Link>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0d0d0d] px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c8a96e]">Related Commercial Paths</p>
            <p className="mt-2 text-sm text-slate-400">Lease office space and buy commercial property are different decisions.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/commercial-investments" className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-[#c8a96e]">
              Commercial investment advisory <MoveRight className="h-4 w-4" />
            </Link>
            <Link href="/commercial/pre-leased-mumbai" className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-[#c8a96e]">
              Pre-leased investments <MoveRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
