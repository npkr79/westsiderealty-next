import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, FileSearch, Landmark, MapPinned, Search, ShieldCheck } from "lucide-react";
import { JsonLd } from "@/components/common/SEO";
import CommercialLandingForm from "./CommercialLandingForm";

const canonicalUrl = "https://www.westsiderealty.in/commercial";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Commercial Property for Sale in Hyderabad & Bengaluru | REMAX Westside Realty",
  description:
    "Explore Grade-A office spaces, pre-leased assets and commercial property investment opportunities in Hyderabad and Bengaluru with REMAX Westside Realty.",
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title: "Commercial Property for Sale in Hyderabad & Bengaluru | REMAX Westside Realty",
    description:
      "Advisory-led commercial property sales and investment search across Hyderabad and Bengaluru for investors, HNIs, family offices and corporate buyers.",
    url: canonicalUrl,
    siteName: "RE/MAX Westside Realty",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Commercial Property for Sale in Hyderabad & Bengaluru | REMAX Westside Realty",
    description: "Commercial property purchase advisory for Hyderabad and Bengaluru investors and business owners.",
  },
  robots: { index: true, follow: true },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.westsiderealty.in" },
    { "@type": "ListItem", position: 2, name: "Commercial", item: canonicalUrl },
  ],
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Commercial Property for Sale in Hyderabad and Bengaluru",
  description:
    "Commercial real estate sales and investment advisory hub for Grade-A office acquisitions, pre-leased assets, corporate office purchases and select high-street retail investments.",
  url: canonicalUrl,
  isPartOf: { "@type": "WebSite", name: "RE/MAX Westside Realty", url: "https://www.westsiderealty.in" },
  about: [
    "Commercial property for sale in Hyderabad",
    "Commercial property for sale in Bengaluru",
    "Grade-A office space for sale",
    "Pre-leased commercial property investment",
    "Commercial real estate investment",
  ],
};

const categories = [
  {
    title: "Grade-A Office Spaces",
    text: "Office units, full-floor opportunities and larger acquisitions for buyers comparing building quality, access, specifications and long-term liquidity.",
    icon: Building2,
  },
  {
    title: "Pre-Leased Investments",
    text: "Commercial assets with existing leases and rental income, subject to tenant, documentation, escalation and lock-in verification.",
    icon: FileSearch,
  },
  {
    title: "Corporate Office Acquisitions",
    text: "Properties for founders, business owners and companies seeking to own their office premises instead of continuing long-term rent exposure.",
    icon: Landmark,
  },
  {
    title: "High-Street Retail Investments",
    text: "Select retail assets where suitable inventory exists and the frontage, tenant profile and trading catchment can be responsibly evaluated.",
    icon: ShieldCheck,
  },
];

const processSteps = [
  "Understand investment budget and acquisition requirements.",
  "Identify relevant developer, owner and market opportunities.",
  "Compare acquisition costs, lease quality, asset specifications and suitability.",
  "Coordinate introductions, negotiations and transaction support.",
];

const hyderabadCorridors = ["Financial District", "Gachibowli", "HITEC City", "Madhapur", "Raidurg", "Kokapet"];
const bengaluruCorridors = ["Outer Ring Road", "Whitefield", "Electronic City", "North Bengaluru", "CBD-adjacent business districts"];

export default function CommercialLandingPage() {
  return (
    <main className="bg-[#f8fafc] text-slate-950">
      <JsonLd jsonLd={[breadcrumbSchema, webPageSchema]} />

      <section className="relative isolate overflow-hidden border-b border-slate-200 bg-white">
        <Image
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1800&q=78&auto=format&fit=crop"
          alt="Bright Grade-A commercial office towers for commercial property advisory"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/92 to-white/55" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(248,250,252,0)_62%,#f8fafc_100%)]" />

        <div className="relative mx-auto grid min-h-[700px] max-w-7xl items-end gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-24">
          <div className="max-w-3xl pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#1f5f8b]">Commercial Real Estate · Hyderabad &amp; Bengaluru</p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-7xl">
              Commercial Properties for Sale in Hyderabad &amp; Bengaluru
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
              Explore Grade-A office acquisitions, pre-leased commercial assets and investment opportunities through REMAX Westside Realty. We help investors and businesses evaluate commercial property purchases based on their capital, requirements and investment objectives.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#commercial-opportunities" className="inline-flex min-h-12 items-center justify-center rounded-sm bg-[#1f5f8b] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#174b70]">
                Explore Commercial Opportunities
              </Link>
              <Link href="#commercial-requirement" className="inline-flex min-h-12 items-center justify-center rounded-sm border border-slate-300 bg-white/80 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-950 transition hover:border-[#1f5f8b] hover:text-[#1f5f8b]">
                Discuss Your Investment Requirement
              </Link>
            </div>
          </div>

          <div className="rounded-sm border border-white/80 bg-white/90 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.14)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Qualified purchase enquiries</p>
            <div className="mt-5 grid gap-4">
              {["₹5 crore and above preferred", "Hyderabad and Bengaluru coverage", "Advisory-led, not an open inventory marketplace"].map((item) => (
                <div key={item} className="flex items-start gap-3 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-[#1f5f8b]" />
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="commercial-opportunities" className="px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1f5f8b]">Investment categories</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Four commercial purchase routes, one qualified advisory workflow.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Availability changes by owner, developer, building and timing. This page explains the categories Westside can evaluate without claiming live stock until an opportunity is verified.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {categories.map(({ title, text, icon: Icon }) => (
              <div key={title} className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
                <Icon className="h-6 w-6 text-[#1f5f8b]" />
                <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="rounded-sm border border-slate-200 bg-[#f8fafc] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1f5f8b]">Hyderabad</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Western corridor depth for office buyers and investors.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Hyderabad commercial searches often compare Financial District, Gachibowli, HITEC City, Madhapur, Raidurg and Kokapet based on access, tenant profile, floor plates, parking and acquisition objective.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {hyderabadCorridors.map((corridor) => (
                <span key={corridor} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">{corridor}</span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/commercial/hyderabad" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1f5f8b]">
                Hyderabad commercial hub <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/commercial/hyderabad/office-space-for-sale" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1f5f8b]">
                Office space for sale <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-sm border border-slate-200 bg-[#f8fafc] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1f5f8b]">Bengaluru</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Commercial purchase enquiries without thin inventory pages.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Bengaluru commercial requirements may involve Outer Ring Road, Whitefield, Electronic City, North Bengaluru and other business districts. Westside captures the brief here instead of publishing unverified Bengaluru listings.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {bengaluruCorridors.map((corridor) => (
                <span key={corridor} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">{corridor}</span>
              ))}
            </div>
            <Link href="#commercial-requirement" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#1f5f8b]">
              Share Bengaluru requirement <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1f5f8b]">Our advisory approach</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Commercial acquisition support starts with the buyer brief.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Westside does not guarantee availability, returns, appreciation or transaction outcomes. The role is to help buyers compare real opportunities responsibly when they match the brief.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {processSteps.map((step, index) => (
              <div key={step} className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f2f8] text-sm font-semibold text-[#1f5f8b]">0{index + 1}</span>
                <p className="mt-4 text-sm leading-7 text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#0f2740] px-5 py-16 text-white sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9dd3f0]">Investment qualification</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Useful for HNIs, family offices, investors and corporate buyers.</h2>
            <p className="mt-4 text-base leading-8 text-slate-200">
              The strongest commercial purchase briefs usually clarify city, budget range, use case, timing and asset preference before specific properties are discussed.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              [Search, "Requirement first", "Budget, city, acquisition purpose and acceptable timeline."],
              [MapPinned, "Market fit", "Corridor, building quality, access and tenant or end-use suitability."],
              [ShieldCheck, "Diligence lens", "Title, lease quality, charges, handover and negotiation support."],
            ].map(([Icon, title, text]) => {
              const LucideIcon = Icon as typeof Search;
              return (
                <div key={String(title)} className="rounded-sm border border-white/15 bg-white/8 p-5">
                  <LucideIcon className="h-5 w-5 text-[#9dd3f0]" />
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1f5f8b]">Commercial purchase brief</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Request Commercial Property Options</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Share only the essentials. The form does not require email or company name, and it captures attribution for the `/commercial` page through the existing CRM workflow.
            </p>
          </div>
          <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-7 lg:p-8">
            <CommercialLandingForm />
          </div>
        </div>
      </section>
    </main>
  );
}
