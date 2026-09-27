import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Clock3, MapPinned, Settings2, UsersRound } from "lucide-react";
import { JsonLd } from "@/components/common/SEO";
import { CommercialCta, ManagedOfficeRequirementForm } from "../_components/CommercialPhase1Client";

const canonicalUrl = "https://www.westsiderealty.in/commercial/hyderabad/managed-office-space";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Managed Office Space in Hyderabad | Furnished & Plug-and-Play Offices",
  description:
    "Share your team size, preferred location and move-in timeline. Westside Realty helps identify managed, furnished and plug-and-play office options across Hyderabad for 20 to 1,000+ seats.",
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title: "Managed Office Space in Hyderabad | Westside Realty",
    description:
      "Requirement-led search for managed, furnished and plug-and-play office options across Hyderabad seat bands and locations.",
    url: canonicalUrl,
    siteName: "RE/MAX Westside Realty",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Managed Office Space in Hyderabad | Westside Realty",
    description: "Share team size and move-in timeline for managed office options in Hyderabad.",
  },
  robots: { index: true, follow: true },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.westsiderealty.in" },
    { "@type": "ListItem", position: 2, name: "Commercial Hyderabad", item: "https://www.westsiderealty.in/commercial/hyderabad" },
    { "@type": "ListItem", position: 3, name: "Managed Office Space", item: canonicalUrl },
  ],
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Managed Office Space in Hyderabad",
  description:
    "Managed, furnished and plug-and-play office advisory page for Hyderabad team requirements across seat bands, locations and move-in timelines.",
  url: canonicalUrl,
  isPartOf: { "@type": "WebSite", name: "RE/MAX Westside Realty", url: "https://www.westsiderealty.in" },
  about: ["Managed office space Hyderabad", "Furnished office Hyderabad", "Plug-and-play office Hyderabad"],
};

const seatBands = ["20–50 seats", "51–100 seats", "101–250 seats", "251–500 seats", "501–1,000 seats", "1,000+ seats"];

const definitions = [
  ["Managed office", "An operator-supported office setup where services, operations and readiness are bundled depending on the selected option."],
  ["Furnished office", "A ready or near-ready office with furniture or fit-out elements already in place, subject to layout and specification checks."],
  ["Plug-and-play office", "A faster move-in format where workstations and core services may already be usable, with feature depth varying by option."],
];

const comparison = [
  [UsersRound, "Team size", "Seat count, privacy needs, expansion plans and whether a dedicated suite is required."],
  [MapPinned, "Location fit", "Employee commute, client access, metro or road connectivity and corridor preference."],
  [Clock3, "Move-in readiness", "Availability date, fit-out state, IT readiness and handover expectations."],
  [Settings2, "Operating terms", "Lock-in, deposit, included services, meeting rooms, 24/7 access, backup power and parking where available."],
];

export default function HyderabadManagedOfficePage() {
  return (
    <main className="bg-[#f8f5ef] text-slate-950">
      <JsonLd jsonLd={[breadcrumbSchema, webPageSchema]} />

      <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(176,138,66,0.18),transparent_34%),linear-gradient(135deg,#ffffff_0%,#f7f1e4_48%,#eef2f7_100%)]">
        <div className="mx-auto grid min-h-[650px] max-w-7xl items-end gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-10 lg:py-24">
          <div className="pb-6">
            <Link href="/commercial/hyderabad" className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9f7a35] hover:text-[#7d5e28]">Commercial Hyderabad</Link>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-7xl">
              Managed Office Space in Hyderabad for Growing Teams
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
              Share team size, preferred location and move-in timeline. Westside identifies suitable managed, furnished and plug-and-play options without turning the search into a desk-booking marketplace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CommercialCta href="#managed-office-requirement" label="Share Team Requirement" pageType="managed_office" intent="managed_office" />
              <CommercialCta href="/commercial/hyderabad/office-space-for-lease" label="Conventional Lease" pageType="managed_office" intent="managed_office" variant="secondary" />
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Supported team sizes</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {seatBands.map((band) => (
                <div key={band} className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-900">
                  {band}
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-600">
              Seat bands help qualify the brief. They are not separate SEO pages and do not imply guaranteed availability in every corridor.
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9f7a35]">Managed, furnished, plug-and-play</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">The right format depends on control, speed and operating responsibility.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Managed-office searches sit between coworking and conventional leasing. The right option depends on team privacy, brand control, move-in urgency, customization needs and how much operating responsibility the company wants to carry.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {definitions.map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <Building2 className="h-5 w-5 text-[#9f7a35]" />
                <h2 className="mt-4 text-xl font-semibold text-slate-950">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9f7a35]">Comparison criteria</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Do not compare only per-seat price.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Per-seat pricing can hide differences in privacy, included services, meeting-room access, lock-in, customization, parking and growth flexibility. Westside starts by clarifying how the team will use the office.
            </p>
            <Link href="/commercial/hyderabad/office-space-for-lease" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#8c672e]">
              Compare with conventional office leasing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {comparison.map(([Icon, title, text]) => {
              const LucideIcon = Icon as typeof UsersRound;
              return (
                <div key={String(title)} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <LucideIcon className="h-5 w-5 text-[#9f7a35]" />
                  <h3 className="mt-4 text-xl font-semibold text-slate-950">{title as string}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{text as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9f7a35]">Location selection</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Location still matters, even when the office is managed.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Gachibowli, Financial District, HITEC City, Madhapur, Raidurg, Kondapur and Kokapet can each fit different team profiles. Specific features such as meeting rooms, 24/7 access, power backup, branding or parking depend on the selected option and operator.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Good fit for</p>
            <div className="mt-5 grid gap-3">
              {["Project teams needing a faster move-in", "Growing teams that need private managed space", "GCC pods and expansion teams testing location fit", "Companies comparing furnished offices against a long-term lease"].map((item) => (
                <div key={item} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#b08a42]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[#111827] px-5 py-16 text-white sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d7b56d]">Requirement-first managed office search</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Tell us the seat count and move-in window. We will narrow suitable options.</h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Share the requirement first so availability, commercials and operator fit can be checked against real market options before a shortlist is discussed.
            </p>
          </div>
          <ManagedOfficeRequirementForm />
        </div>
      </section>
    </main>
  );
}
