import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import {
  WhyThisMarket,
  SupplyDevelopment,
  DemandLiquidity,
  DeveloperCapital,
  InfrastructureFuture,
  RiskOutlook,
} from "./index";
import { ProjectsInMarketWithSkeleton } from "./ProjectsInMarketAsync";
import type { MicroMarketViewModel } from "@/services/microMarketViewModel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageCircle, Phone, School, Hospital, ShoppingBag, Pill, Shield, Database, Train } from "lucide-react";

function buildMapEmbedUrl(lat: number, lng: number): string {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`;
}

function formatPrice(min: number | null, max: number | null): string {
  if (min != null && max != null)
    return `₹${min.toLocaleString("en-IN")}–₹${max.toLocaleString("en-IN")}/sqft`;
  if (min != null) return `₹${min.toLocaleString("en-IN")}/sqft+`;
  if (max != null) return `Up to ₹${max.toLocaleString("en-IN")}/sqft`;
  return "Price on request";
}

function formatPct(min: number | null, max: number | null, suffix = ""): string {
  if (min != null && max != null) return `${min}%–${max}%${suffix}`;
  if (min != null) return `${min}%+${suffix}`;
  if (max != null) return `Up to ${max}%${suffix}`;
  return "—";
}

function formatPriceShort(min: number | null, max: number | null): string {
  if (min != null && max != null)
    return `₹${min.toLocaleString("en-IN")} – ₹${max.toLocaleString("en-IN")}`;
  if (min != null) return `₹${min.toLocaleString("en-IN")}+`;
  if (max != null) return `Up to ₹${max.toLocaleString("en-IN")}`;
  return "—";
}

function truncateHeroText(html: string): string {
  const plain = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (plain.length <= 200) return plain;
  const truncated = plain.substring(0, 200);
  const lastPeriod = truncated.lastIndexOf(".");
  return lastPeriod > 100 ? truncated.substring(0, lastPeriod + 1) : truncated + "...";
}

function formatPctShort(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${min}% – ${max}%`;
  if (min != null) return `${min}%+`;
  if (max != null) return `Up to ${max}%`;
  return "—";
}

function signalDotColor(value: string | null): string {
  if (!value) return "bg-gray-300";
  const v = value.toLowerCase();
  if (["accumulation", "expansion", "active", "high", "strong"].some((kw) => v.includes(kw)))
    return "bg-green-500";
  if (["low", "emerging", "early"].some((kw) => v === kw)) return "bg-red-400";
  return "bg-amber-400";
}

// CHANGE 6: updated shape — no icon, add subtitle
interface SnapshotMetric {
  label: string;
  value: string;
  subtitle: string;
}

interface CommuteEntry {
  destination: string;
  distance: string;
  time: string;
}

interface LocationData {
  commuteMatrix: CommuteEntry[];
  topSchools: string[];
  topHospitals: string[];
  nearestMmtsStatus: string | null;
  connectivityDetails: string | null;
}

interface MarketMetrics {
  growthStage: string | null;
  priceCycleStage: string | null;
}

interface AiEnrichment {
  market_maturity: string | null;
  builder_activity: string | null;
  buyer_profile: string | null;
  rental_yield_min: number | null;
  rental_yield_max: number | null;
  price_per_sqft_current: number | null;
  market_summary: string | null;
  top_developers: string[] | null;
  confidence: string | null;
  fetched_at: string | null;
}

interface MarketAmenities {
  schools: boolean;
  hospitals: boolean;
  dailyConveniences: boolean;
  pharmacy: boolean;
}

interface MicroMarketPageContentProps {
  viewModel: MicroMarketViewModel;
  citySlug: string;
  cityName: string;
  mapCenter?: { lat: number; lng: number } | null;
  // CHANGE 1
  faqs?: Array<{ question: string; answer: string }>;
  faqSchemaJson?: string | null;
  // CHANGE 2
  availableBhkTypes?: string[];
  nearbyMarkets?: Array<{ micro_market_name: string; url_slug: string }>;
  amenities?: MarketAmenities | null;
  locationData?: LocationData | null;
  marketMetrics?: MarketMetrics | null;
  aiEnrichment?: AiEnrichment | null;
}

export default function MicroMarketPageContent({
  viewModel,
  citySlug,
  cityName,
  mapCenter,
  faqs,
  faqSchemaJson,
  availableBhkTypes,
  nearbyMarkets,
  amenities,
  locationData,
  marketMetrics,
  aiEnrichment,
}: MicroMarketPageContentProps) {
  const mapEmbedUrl = mapCenter ? buildMapEmbedUrl(mapCenter.lat, mapCenter.lng) : null;
  const {
    hero,
    whyThisMarket,
    supplyDevelopment,
    demandLiquidity,
    developerCapital,
    infrastructureFuture,
    riskOutlook,
  } = viewModel;

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: cityName, href: `/${citySlug}` },
    { name: "Investment Areas", href: `/${citySlug}/micro-markets` },
    { name: hero.name, href: undefined },
  ];

  const marketHealthSignals: Array<{ label: string; value: string | null }> = [
    {
      label: "Market Phase",
      value: aiEnrichment?.market_maturity ?? marketMetrics?.priceCycleStage ?? hero.keySignals.cycleStage,
    },
    {
      label: "Builder Activity",
      value: aiEnrichment?.builder_activity ?? hero.keySignals.institutionalConfidence,
    },
    {
      label: "Buyer Profile",
      value: aiEnrichment?.buyer_profile ?? null,
    },
    { label: "Growth Momentum", value: hero.keySignals.capitalMomentum },
  ];

  // CHANGE 6: buyer-friendly labels + subtitles, no icons
  const snapshotMetrics: SnapshotMetric[] = [
    {
      label: "Projects Launched",
      value:
        supplyDevelopment.projectActivity != null
          ? String(supplyDevelopment.projectActivity)
          : "—",
      subtitle: "new projects in this corridor",
    },
    {
      label: "Delivery Rate",
      value:
        demandLiquidity.completion != null
          ? `${Math.round(demandLiquidity.completion * 100)}%`
          : "—",
      subtitle: "projects delivered so far",
    },
    {
      label: "Market Activity",
      value:
        supplyDevelopment.velocityScore != null
          ? String(supplyDevelopment.velocityScore)
          : "—",
      subtitle: "activity score out of 100",
    },
    {
      label: "New Builders",
      value:
        developerCapital.institutionalEntry != null
          ? String(developerCapital.institutionalEntry)
          : "—",
      subtitle: "developers entered recently",
    },
    {
      label: "Top Builder Share",
      value:
        supplyDevelopment.tier1DeveloperShare != null
          ? String(Math.round(supplyDevelopment.tier1DeveloperShare))
          : "—",
      subtitle: "% projects by established builders",
    },
  ];

  const hasAnyStatData = snapshotMetrics.some((m) => m.value !== "—");
  const hasAnySignal = marketHealthSignals.some((sig) => sig.value);

  // Accordion summaries
  const whyInvestSummary =
    whyThisMarket.whyNow.slice(0, 3).join(" · ") ||
    "Growth drivers and buyer demand signals";
  const supplyDemandSummary =
    [
      supplyDevelopment.phaseExpansionSignal &&
        `${supplyDevelopment.phaseExpansionSignal} supply`,
      demandLiquidity.rentalDemandSignal &&
        `${demandLiquidity.rentalDemandSignal} rental demand`,
    ]
      .filter(Boolean)
      .join(" · ") || "Supply & demand overview";
  const developerSummary =
    [
      developerCapital.capitalConvictionBand &&
        `${developerCapital.capitalConvictionBand} conviction`,
      developerCapital.landBankingActivity &&
        `${developerCapital.landBankingActivity} land banking`,
    ]
      .filter(Boolean)
      .join(" · ") || "Developer activity and capital flows";
  const riskSummary =
    [infrastructureFuture.impactSignals, riskOutlook.execution]
      .filter(Boolean)
      .join(" · ") || "Risk factors and future outlook";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: hero.name,
    address: cityName,
    description: hero.hook ?? `${hero.name} residential corridor in ${cityName}`,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 1. BREADCRUMB */}
      <div className="container mx-auto px-4 py-4">
        <BreadcrumbNav
          items={breadcrumbItems.map((item) => ({
            label: item.name,
            href: item.href,
          }))}
        />
      </div>

      {/* 2. PAGE HERO — CHANGE 3: map removed from here */}
      <section className="w-full bg-[#FAFAFA] border-b border-gray-100">
        <div className="container mx-auto max-w-6xl px-4 py-10 lg:py-14">
          <div className="flex flex-col lg:flex-row lg:gap-12">
            {/* LEFT */}
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{hero.name}</h1>
              <p className="mt-1 text-sm font-medium text-gray-500 uppercase tracking-wide">
                {cityName} · Residential Corridor
              </p>
              {(aiEnrichment?.market_summary || hero.hook) && (
                <p className="mt-4 text-gray-600 leading-relaxed max-w-xl">
                  {aiEnrichment?.market_summary || truncateHeroText(hero.hook!)}
                </p>
              )}
              {/* RERA trust badges */}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full font-medium">
                  <Shield className="h-3 w-3 text-green-600" />
                  All projects RERA verified
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full font-medium">
                  <Database className="h-3 w-3 text-blue-600" />
                  Source: Telangana RERA
                </span>
              </div>
            </div>

            {/* RIGHT: Market Health card */}
            <div className="mt-8 lg:mt-0 lg:w-72 xl:w-80 shrink-0">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  Market Health
                </h2>
                {hasAnySignal ? (
                  <div className="space-y-3">
                    {marketHealthSignals.map((sig) => (
                      <div key={sig.label} className="flex items-center gap-3">
                        <span
                          className={`h-2.5 w-2.5 rounded-full shrink-0 ${signalDotColor(sig.value)}`}
                        />
                        <span className="text-xs text-gray-500 flex-1">{sig.label}</span>
                        <span className={`text-sm font-semibold ${sig.value ? "text-slate-800" : "text-slate-400"}`}>
                          {sig.value ?? "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Market data coming soon</p>
                )}
                {aiEnrichment?.fetched_at && (
                  <p className="text-xs text-slate-400 mt-3 text-right">
                    🤖 AI Analysis · {new Date(aiEnrichment.fetched_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dark stat band */}
          <div className="bg-slate-900 text-white w-full rounded-xl p-6 mt-6">
            <div className="grid grid-cols-3 divide-x divide-slate-700">
              <div className="pr-6">
                <p className="text-slate-400 text-xs uppercase tracking-wide">Price per sqft</p>
                <p className="text-white text-2xl font-bold mt-1">
                  {formatPriceShort(hero.priceRange.min, hero.priceRange.max)}
                </p>
                <p className="text-slate-400 text-xs mt-1">per square foot</p>
                {aiEnrichment?.price_per_sqft_current && (
                  <p className="text-slate-300 text-xs mt-1">
                    ₹{aiEnrichment.price_per_sqft_current.toLocaleString("en-IN")} current market rate
                  </p>
                )}
              </div>
              <div className="px-6">
                <p className="text-slate-400 text-xs uppercase tracking-wide">Annual Growth</p>
                <p className="text-white text-2xl font-bold mt-1">
                  {formatPctShort(hero.growth.min, hero.growth.max)}
                </p>
                <p className="text-slate-400 text-xs mt-1">year on year</p>
              </div>
              <div className="pl-6">
                <p className="text-slate-400 text-xs uppercase tracking-wide">Rental Yield</p>
                <p className="text-white text-2xl font-bold mt-1">
                  {formatPctShort(hero.rental.min, hero.rental.max)}
                </p>
                <p className="text-slate-400 text-xs mt-1">gross yield</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="container mx-auto max-w-6xl px-4">
        {/* 3. MARKET SNAPSHOT — only rendered when at least one metric has data */}
        {hasAnyStatData && (
          <section className="py-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {snapshotMetrics.map((m) => (
                <div
                  key={m.label}
                  className="bg-white border border-slate-200 rounded-xl p-5"
                >
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                    {m.label}
                  </p>
                  <p className={`text-3xl font-bold mt-0.5 ${m.value === "—" ? "text-slate-300" : "text-slate-900"}`}>{m.value}</p>
                  {m.value !== "—" && <p className="text-xs text-slate-400 mt-1">{m.subtitle}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. LOCATION & CONNECTIVITY — CHANGE 3+4: map moved here, new design */}
        <section className="mt-10 border-t border-gray-100 pt-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Location &amp; Connectivity</h2>
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            {/* Connectivity distance grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: "ORR", value: "Direct Access" },
                { label: "HITEC City", value: "~18 km" },
                { label: "Financial District", value: "~16 km" },
                { label: "Airport", value: "~30 km" },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Amenity chips */}
            {amenities && (amenities.schools || amenities.hospitals || amenities.dailyConveniences || amenities.pharmacy) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {amenities.schools && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-medium text-green-700">
                    <School className="h-3.5 w-3.5" />
                    Schools Nearby
                  </span>
                )}
                {amenities.hospitals && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-medium text-green-700">
                    <Hospital className="h-3.5 w-3.5" />
                    Healthcare Access
                  </span>
                )}
                {amenities.dailyConveniences && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-medium text-green-700">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Daily Conveniences
                  </span>
                )}
                {amenities.pharmacy && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-medium text-green-700">
                    <Pill className="h-3.5 w-3.5" />
                    Pharmacy Access
                  </span>
                )}
              </div>
            )}

            {/* Map — CHANGE 3: moved here from hero */}
            {mapEmbedUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-200 h-64 w-full mt-2">
                <iframe
                  src={mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`${hero.name} location map`}
                />
              </div>
            )}

            <p className="text-xs text-slate-400 mt-3">Source: RERA + Market Data</p>
          </div>
        </section>

        {/* 5. PROJECTS — heading rendered inside ProjectsInMarket */}
        <section className="py-8 mt-6 border-t border-gray-100">
          <ProjectsInMarketWithSkeleton
            citySlug={citySlug}
            microMarketSlug={viewModel.urlSlug}
            marketName={hero.name}
          />
        </section>

        {/* 6. MARKET INTELLIGENCE */}
        <section className="py-8 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Market Intelligence</h2>
          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem
              value="why-invest"
              className="rounded-xl border border-gray-200 bg-white px-4"
            >
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="flex flex-col items-start">
                  <span className="font-semibold text-slate-900">Why invest here?</span>
                  <span className="text-xs text-gray-400 font-normal mt-0.5">
                    {whyInvestSummary}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <WhyThisMarket data={whyThisMarket} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="supply-demand"
              className="rounded-xl border border-gray-200 bg-white px-4"
            >
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="flex flex-col items-start">
                  <span className="font-semibold text-slate-900">Supply &amp; Demand</span>
                  <span className="text-xs text-gray-400 font-normal mt-0.5">
                    {supplyDemandSummary}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-8">
                  <SupplyDevelopment data={supplyDevelopment} />
                  <DemandLiquidity data={demandLiquidity} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="developer-activity"
              className="rounded-xl border border-gray-200 bg-white px-4"
            >
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="flex flex-col items-start">
                  <span className="font-semibold text-slate-900">Developer Activity</span>
                  <span className="text-xs text-gray-400 font-normal mt-0.5">
                    {developerSummary}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <DeveloperCapital data={developerCapital} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="risk-outlook"
              className="rounded-xl border border-gray-200 bg-white px-4"
            >
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="flex flex-col items-start">
                  <span className="font-semibold text-slate-900">Risk &amp; Outlook</span>
                  <span className="text-xs text-gray-400 font-normal mt-0.5">{riskSummary}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-8">
                  <InfrastructureFuture data={infrastructureFuture} />
                  <RiskOutlook data={riskOutlook} />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* CHANGE 1: FAQ section — before CTA */}
        {faqs && faqs.length > 0 && (
          <section className="mt-16 border-t border-gray-100 pt-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border border-slate-200 rounded-lg px-4"
                >
                  <AccordionTrigger className="text-left font-medium text-slate-800 hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 pb-4 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        {/* Data sources badge */}
        {aiEnrichment?.fetched_at && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
            <span className="font-medium">Data Sources:</span>{" "}
            RERA Telangana (project counts, registrations) · AI Market Research (prices, signals, summary) · Updated{" "}
            {new Date(aiEnrichment.fetched_at).toLocaleDateString("en-IN")}
          </div>
        )}

        {/* Smart internal links — after FAQ, before CTA */}
        {((availableBhkTypes && availableBhkTypes.length > 0) ||
          (nearbyMarkets && nearbyMarkets.length > 0)) && (
          <section className="mt-12 pt-8 border-t border-slate-100">
            {availableBhkTypes && availableBhkTypes.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Search by type in {viewModel.hero.name}
                </h2>
                <div className="flex flex-wrap gap-2 mb-8">
                  {availableBhkTypes.map((bhk) => (
                    <a
                      key={bhk}
                      href={`/${citySlug}/${viewModel.urlSlug}?bhk=${bhk}`}
                      className="inline-flex items-center px-4 py-2 rounded-full border border-slate-200 bg-white text-sm text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      {bhk} in {viewModel.hero.name}
                    </a>
                  ))}
                </div>
              </>
            )}

            {nearbyMarkets && nearbyMarkets.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Explore nearby markets
                </h2>
                <div className="flex flex-wrap gap-2">
                  {nearbyMarkets.map((market) => (
                    <a
                      key={market.url_slug}
                      href={`/${citySlug}/${market.url_slug}`}
                      className="inline-flex items-center px-4 py-2 rounded-full border border-slate-200 bg-white text-sm text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      {market.micro_market_name}
                    </a>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* CTA STRIP — desktop inline */}
        <section className="py-8 mt-6 border-t border-gray-100 hidden sm:block mb-8">
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <h2 className="text-xl font-bold text-slate-900">
              Buying in {hero.name}? Talk to a local specialist.
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Our advisors know this corridor deeply.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://wa.me/917702455243"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp Us
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-gray-50 transition-colors"
              >
                <Phone className="h-4 w-4" />
                Request Callback
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* CTA STRIP — mobile sticky */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-4">
        <p className="text-xs font-semibold text-slate-800 text-center mb-3">
          Buying in {hero.name}? Talk to a specialist.
        </p>
        <div className="flex gap-3">
          <a
            href="https://wa.me/917702455243"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <a
            href="/contact"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-slate-800"
          >
            <Phone className="h-4 w-4" />
            Callback
          </a>
        </div>
      </div>

      {/* Existing JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* CHANGE 1: FAQ JSON-LD from database */}
      {faqSchemaJson && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: faqSchemaJson }}
        />
      )}
    </div>
  );
}
