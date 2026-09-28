import Link from "next/link";
import { MoveRight } from "lucide-react";
import { JsonLd } from "@/components/common/SEO";
import type { CorridorPageData } from "../_data/corridorPages";
import { CorridorPrimaryCta, OfficeLeasingCorridorForm } from "./OfficeLeasingCorridorClient";

const parentUrl = "https://www.westsiderealty.in/commercial/hyderabad/office-space-for-lease";

const formats = [
  {
    title: "Bare shell",
    text: "Works when the company wants more control over workplace design and can allow for fit-out planning, approvals, capex and a longer handover timeline.",
  },
  {
    title: "Warm shell",
    text: "Useful when base services are available but the occupier still needs to plan the final workplace layout, finishes, meeting rooms and operating setup.",
  },
  {
    title: "Fitted / plug-and-play",
    text: "Can reduce move-in time, but the team still needs to check seat density, meeting-room mix, power, services, condition and total operating cost.",
  },
  {
    title: "Managed handoff",
    text: "May suit teams that want a more serviced operating model, provided tenure, brand control, privacy and commercial structure match the business requirement.",
  },
];

export function OfficeLeasingCorridorPage({ page }: { page: CorridorPageData }) {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.westsiderealty.in" },
      { "@type": "ListItem", position: 2, name: "Commercial Hyderabad", item: "https://www.westsiderealty.in/commercial/hyderabad" },
      { "@type": "ListItem", position: 3, name: "Office Space for Lease", item: parentUrl },
      { "@type": "ListItem", position: 4, name: page.h1, item: page.canonicalUrl },
    ],
  };

  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.h1,
    description: page.metaDescription,
    url: page.canonicalUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "RE/MAX Westside Realty",
      url: "https://www.westsiderealty.in",
    },
    about: [
      "Office space for lease in Hyderabad",
      page.corridorLabel,
      "Corporate office leasing",
    ],
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080808] text-white">
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
          outline: none;
        }
        .co-field:focus { border-color: rgba(200,169,110,0.82); box-shadow: 0 0 0 1px rgba(200,169,110,0.18); }
        .co-field::placeholder { color: rgba(226,232,240,0.42); }
        .co-field option { background: #101010; color: #fff; }
      `}</style>

      <section className="relative px-5 pb-16 pt-28 sm:px-8 lg:px-10 lg:pb-24 lg:pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,169,110,0.16),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_38%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#c8a96e]">
              <Link href="/commercial/hyderabad/office-space-for-lease" className="hover:text-[#e2c889]">Hyderabad office leasing</Link>
              <span className="text-slate-600">/</span>
              <span>{page.eyebrow}</span>
            </div>
            <h1 className="max-w-5xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-7xl">{page.h1}</h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">{page.heroLead}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <CorridorPrimaryCta corridor={page} label={page.primaryCta} />
              <Link
                href={page.otherCorridor.href}
                className="inline-flex min-h-12 items-center justify-center rounded-sm border border-white/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:border-[#c8a96e] hover:text-[#c8a96e]"
              >
                {page.otherCorridor.label}
              </Link>
            </div>
          </div>
          <div className="border border-white/10 bg-black/45 p-6 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Requirement-led corridor search</p>
            <div className="mt-5 grid gap-4">
              {page.heroPoints.map((point, index) => (
                <div key={point} className="grid grid-cols-[2.5rem_1fr] gap-3 border-l border-[#c8a96e]/60 pl-4">
                  <span className="text-sm font-semibold text-[#c8a96e]">0{index + 1}</span>
                  <span className="text-base font-semibold leading-7 text-slate-100">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0d0d0d] px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c8a96e]">Corridor Fit</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">{page.whyTitle}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">{page.whyIntro}</p>
          </div>
          <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
            {page.whyCards.map((card) => (
              <article key={card.title} className="bg-[#101010] p-6">
                <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f1e8] px-5 py-16 text-[#141414] sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d6b2f]">Location Comparison</p>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">{page.comparisonTitle}</h2>
            <p className="mt-4 text-sm leading-7 text-neutral-600">{page.comparisonIntro}</p>
          </div>
          <div className="grid gap-4">
            {page.comparisonRows.map((row) => (
              <article key={row.label} className="border border-black/10 bg-white p-5">
                <h3 className="text-lg font-semibold">{row.label}</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-600">{row.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#080808] px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c8a96e]">Office Formats</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Choose the space format before comparing rent.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">{page.formatsIntro}</p>
          </div>
          <div className="mt-8 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {formats.map((format) => (
              <article key={format.title} className="bg-[#101010] p-5">
                <h3 className="text-lg font-semibold text-white">{format.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{format.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0d0d0d] px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c8a96e]">Requirement Size</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Match the corridor to the operating requirement.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">{page.requirementIntro}</p>
          </div>
          <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3">
            {page.requirementCards.map((card) => (
              <article key={card.title} className="bg-[#101010] p-5">
                <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f1e8] px-5 py-16 text-[#141414] sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d6b2f]">Lease Evaluation</p>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Compare commercial terms with workplace reality.</h2>
              <p className="mt-4 text-sm leading-7 text-neutral-600">
                A corridor shortlist should compare rent, readiness, employee access and operating reliability in one decision, especially when several buildings appear suitable on paper.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden border border-black/10 bg-black/10 sm:grid-cols-2">
              {page.leaseCards.map((card) => (
                <article key={card.title} className="bg-white p-5">
                  <h3 className="text-lg font-semibold">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-neutral-600">{card.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#080808] px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c8a96e]">Nearby Context</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Keep adjacent corridors in the comparison, not in the keyword target.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">{page.adjacentContext}</p>
            <div className="mt-6 rounded-sm border border-white/10 bg-[#111111] p-5">
              <h3 className="text-lg font-semibold text-white">{page.otherCorridor.label}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{page.otherCorridor.text}</p>
              <Link href={page.otherCorridor.href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#c8a96e] hover:text-[#e2c889]">
                View corridor guide <MoveRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-1">
            {page.nearbyCards.map((card) => (
              <article key={card.title} className="bg-[#101010] p-5">
                <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#080808] px-5 py-12 sm:px-8 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-4xl">
          <OfficeLeasingCorridorForm corridor={page} />
        </div>
      </section>

      <section className="bg-[#101010] px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c8a96e]">Corridor FAQ</p>
          <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Questions before shortlisting offices in {page.corridorLabel}.</h2>
          <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {page.faqs.map((faq) => (
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

      <section className="border-t border-white/10 bg-[#0d0d0d] px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c8a96e]">Related Office Leasing Paths</p>
            <p className="mt-2 text-sm text-slate-400">Use the parent page for a broad Hyderabad leasing search, or compare the other corridor guide.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/commercial/hyderabad/office-space-for-lease" className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-[#c8a96e]">
              Hyderabad office leasing <MoveRight className="h-4 w-4" />
            </Link>
            <Link href={page.otherCorridor.href} className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-[#c8a96e]">
              {page.otherCorridor.label} <MoveRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
