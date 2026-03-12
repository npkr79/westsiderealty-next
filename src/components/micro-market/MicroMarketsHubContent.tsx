"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { MicroMarketCacheRow } from "@/services/microMarketViewModel";

type MicroMarketHubItem = MicroMarketCacheRow;
type TabKey = "all" | "high-growth" | "luxury" | "affordable";

const GOLD = "#c9a96e";
const NAVY = "#0a0f1e";

// ─── Filter helpers ────────────────────────────────────────────────────────────

const getAvgPrice = (m: MicroMarketHubItem) => {
  const min = m.price_per_sqft_min ?? 0;
  const max = m.price_per_sqft_max ?? 0;
  return min && max ? (min + max) / 2 : min || max || 0;
};

const isHighGrowth = (m: MicroMarketHubItem) =>
  (m.annual_appreciation_min != null && m.annual_appreciation_min > 12) ||
  (m.rental_yield_min != null && m.rental_yield_min >= 7);

const isLuxury = (m: MicroMarketHubItem) => getAvgPrice(m) > 10000;

const isAffordable = (m: MicroMarketHubItem) =>
  getAvgPrice(m) < 8000 && getAvgPrice(m) > 0;

function getBadges(m: MicroMarketHubItem) {
  const badges: { label: string; cls: string }[] = [];
  if ((m.annual_appreciation_min ?? 0) >= 15 || (m.rental_yield_min ?? 0) >= 8)
    badges.push({ label: "Top Pick", cls: "bg-amber-500 text-white" });
  if ((m.rental_yield_min ?? 0) >= 5)
    badges.push({ label: "High Yield", cls: "bg-emerald-600 text-white" });
  if (isLuxury(m))
    badges.push({ label: "Luxury", cls: "bg-purple-600 text-white" });
  return badges;
}

function getSignal(m: MicroMarketHubItem) {
  const a = m.annual_appreciation_min ?? 0;
  const y = m.rental_yield_min ?? 0;
  if (a >= 15 || y >= 7)
    return { label: "Buy", cls: "bg-green-100 text-green-700 border border-green-200" };
  if (a >= 10 || y >= 5)
    return { label: "Watch", cls: "bg-amber-100 text-amber-700 border border-amber-200" };
  return { label: "Hold", cls: "bg-slate-100 text-slate-600 border border-slate-200" };
}

function fmtINR(val: number | null | undefined) {
  if (val == null) return null;
  return `₹${val.toLocaleString("en-IN")}`;
}

function stripHtml(html: string | null | undefined) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-full px-5 py-2.5 text-center"
      style={{
        backgroundColor: "rgba(255,255,255,0.08)",
        border: `1px solid rgba(201,169,110,0.35)`,
      }}
    >
      <p className="text-sm font-semibold text-white">{value}</p>
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
        {label}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass = "text-slate-800",
  bgClass = "bg-slate-50",
}: {
  label: string;
  value: string;
  valueClass?: string;
  bgClass?: string;
}) {
  return (
    <div className={`rounded-lg p-2 text-center ${bgClass}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

function MarketCard({
  market,
  citySlug,
}: {
  market: MicroMarketHubItem;
  citySlug: string;
}) {
  const badges = getBadges(market);
  const href = `/${citySlug}/${market.url_slug ?? market.id}`;
  const initial = (market.micro_market_name ?? "M").charAt(0).toUpperCase();

  const priceDisplay =
    market.price_per_sqft_min && market.price_per_sqft_max
      ? `${fmtINR(market.price_per_sqft_min)} – ${fmtINR(market.price_per_sqft_max)}`
      : fmtINR(market.price_per_sqft_min ?? market.price_per_sqft_max) ?? "—";

  const yieldDisplay =
    market.rental_yield_min && market.rental_yield_max
      ? `${market.rental_yield_min}–${market.rental_yield_max}%`
      : market.rental_yield_min
        ? `${market.rental_yield_min}%+`
        : "—";

  const growthDisplay = market.annual_appreciation_min
    ? `${market.annual_appreciation_min}%+`
    : "—";

  const hook = stripHtml(market.hero_hook);

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
      style={{ borderColor: "#e8e4dc" }}
    >
      {/* Gold left border — expands on hover */}
      <div
        className="absolute left-0 top-0 h-full w-0 transition-all duration-200 group-hover:w-1"
        style={{ backgroundColor: GOLD }}
      />

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ backgroundColor: NAVY }}
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold leading-snug text-slate-900">
              {market.micro_market_name ?? "Market"}
            </h3>
            {badges.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {badges.map((b) => (
                  <span
                    key={b.label}
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${b.cls}`}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Price/sqft" value={priceDisplay} />
          <Stat
            label="Growth"
            value={growthDisplay}
            valueClass="text-emerald-700"
            bgClass="bg-emerald-50"
          />
          <Stat
            label="Yield"
            value={yieldDisplay}
            valueClass="text-blue-700"
            bgClass="bg-blue-50"
          />
        </div>

        {/* Hero hook */}
        {hook && (
          <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">
            {hook}
          </p>
        )}

        {/* CTA */}
        <Link
          href={href}
          className="mt-auto flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:opacity-80"
          style={{ backgroundColor: NAVY }}
        >
          View Market <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface MicroMarketsHubContentProps {
  markets: MicroMarketCacheRow[];
  citySlug: string;
  cityName: string;
}

export default function MicroMarketsHubContent({
  markets,
  citySlug,
  cityName,
}: MicroMarketsHubContentProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [showComparison, setShowComparison] = useState(false);

  const highGrowthMarkets = markets.filter(isHighGrowth);
  const luxuryMarkets = markets.filter(isLuxury);
  const affordableMarkets = markets.filter(isAffordable);

  const filtered: Record<TabKey, MicroMarketHubItem[]> = {
    all: markets,
    "high-growth": highGrowthMarkets,
    luxury: luxuryMarkets,
    affordable: affordableMarkets,
  };
  const visibleMarkets = filtered[activeTab];

  // Hero aggregate stats
  const allPrices = markets
    .flatMap((m) => [m.price_per_sqft_min, m.price_per_sqft_max])
    .filter((v): v is number => v != null);
  const allYields = markets
    .map((m) => m.rental_yield_min)
    .filter((v): v is number => v != null);
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : null;
  const avgYield =
    allYields.length > 0
      ? (allYields.reduce((a, b) => a + b, 0) / allYields.length).toFixed(1)
      : null;

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: markets.length },
    { key: "high-growth", label: "High Growth", count: highGrowthMarkets.length },
    { key: "luxury", label: "Luxury", count: luxuryMarkets.length },
    { key: "affordable", label: "Affordable", count: affordableMarkets.length },
  ];

  const faqs = [
    {
      question: `Which micro-market in ${cityName} offers the best ROI?`,
      answer: `Markets with 15%+ annual appreciation show the strongest growth. ROI depends on your investment timeline and risk appetite. The High Growth tab surfaces markets with above-average appreciation or rental yield.`,
    },
    {
      question: `What is the average price per sq.ft in ${cityName} micro-markets?`,
      answer: `Prices vary significantly by corridor and property type. Use the comparison table to compare price ranges across all markets side-by-side.`,
    },
    {
      question: `How do I choose between luxury and affordable micro-markets?`,
      answer: `Luxury markets typically offer stronger capital appreciation and premium tenant profiles. Affordable markets provide better rental yield ratios and lower entry capital. Your investment horizon and liquidity needs should guide this choice.`,
    },
    {
      question: `How often is this data updated?`,
      answer: `Price intelligence is refreshed regularly from RERA filings and developer data. Each market page shows the data freshness timestamp.`,
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f7f4" }}>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-20"
        style={{ backgroundColor: NAVY }}
      >
        {/* Dot grid overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(201,169,110,0.12) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10 container mx-auto max-w-5xl px-4 text-center">
          {/* Breadcrumb */}
          <nav
            className="mb-6 flex items-center justify-center gap-2 text-xs"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <span>/</span>
            <Link
              href={`/${citySlug}`}
              className="transition-colors hover:text-white"
            >
              {cityName}
            </Link>
            <span>/</span>
            <span className="text-white">Investment Areas</span>
          </nav>

          {/* Eyebrow */}
          <p
            className="mb-4 text-xs font-semibold uppercase tracking-[0.25em]"
            style={{ color: GOLD }}
          >
            {cityName} · Real Estate Intelligence
          </p>

          {/* H1 */}
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            {cityName} Real Estate
            <br />
            Micro-Market Insights
          </h1>

          {/* Subtitle */}
          <p
            className="mx-auto mt-5 max-w-2xl text-lg"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            Compare property trends, prices, and investment potential across{" "}
            <span className="font-semibold text-white">
              {markets.length} micro-markets
            </span>
          </p>

          {/* Stat pills */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {minPrice != null && maxPrice != null && (
              <StatPill
                label="Price Range"
                value={`${fmtINR(minPrice)} – ${fmtINR(maxPrice)}`}
              />
            )}
            <StatPill label="Micro-Markets" value={String(markets.length)} />
            {avgYield && <StatPill label="Avg Yield" value={`${avgYield}%`} />}
          </div>
        </div>
      </section>

      {/* ── STICKY FILTER TABS ───────────────────────────────────────────────── */}
      <div className="sticky top-16 z-20 border-b bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex items-center gap-1.5 overflow-x-auto py-3">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-150"
                style={
                  activeTab === tab.key
                    ? { backgroundColor: GOLD, borderColor: GOLD, color: "#1a1a1a" }
                    : {
                        backgroundColor: "transparent",
                        borderColor: "#e8e4dc",
                        color: "#6b7280",
                      }
                }
              >
                {tab.label}
                <span
                  className="rounded-full px-1.5 py-0.5 text-xs font-semibold"
                  style={
                    activeTab === tab.key
                      ? { backgroundColor: "rgba(0,0,0,0.15)", color: "#1a1a1a" }
                      : { backgroundColor: "#f3f4f6", color: "#9ca3af" }
                  }
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MARKETS GRID ─────────────────────────────────────────────────────── */}
      <section className="container mx-auto max-w-6xl px-4 py-12">
        {visibleMarkets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
              style={{ backgroundColor: NAVY }}
            >
              0
            </div>
            <h3 className="text-lg font-semibold text-slate-700">
              No markets in this category
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try a different filter or view all markets.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleMarkets.map((market) => (
              <MarketCard key={market.id} market={market} citySlug={citySlug} />
            ))}
          </div>
        )}
      </section>

      {/* ── COMPARISON TABLE ─────────────────────────────────────────────────── */}
      {markets.length > 0 && (
        <section className="border-t bg-white py-12">
          <div className="container mx-auto max-w-5xl px-4">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="flex w-full items-center justify-between rounded-xl border px-6 py-4 text-left transition-colors hover:bg-slate-50"
              style={{ borderColor: "#e8e4dc" }}
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Market Comparison
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Side-by-side view of all {markets.length} markets
                </p>
              </div>
              {showComparison ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </button>

            {showComparison && (
              <div
                className="mt-4 overflow-hidden rounded-xl border"
                style={{ borderColor: "#e8e4dc" }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: NAVY }}>
                        {[
                          "Market",
                          "Price Range",
                          "Growth",
                          "Yield",
                          "Signal",
                          "Action",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                            style={{ color: "rgba(255,255,255,0.65)" }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {markets.map((m, i) => {
                        const signal = getSignal(m);
                        const priceRange =
                          m.price_per_sqft_min && m.price_per_sqft_max
                            ? `${fmtINR(m.price_per_sqft_min)} – ${fmtINR(m.price_per_sqft_max)}/sqft`
                            : fmtINR(m.price_per_sqft_min ?? m.price_per_sqft_max)
                              ? `${fmtINR(m.price_per_sqft_min ?? m.price_per_sqft_max)}/sqft`
                              : "—";
                        const href = `/${citySlug}/${m.url_slug ?? m.id}`;
                        const rowBg = i % 2 === 0 ? "#ffffff" : "#fafaf8";

                        return (
                          <tr
                            key={m.id}
                            className="border-t transition-colors hover:bg-amber-50/40"
                            style={{ borderColor: "#f0ede8", backgroundColor: rowBg }}
                          >
                            <td
                              className="px-4 py-3 font-medium"
                              style={{ backgroundColor: rowBg }}
                            >
                              <Link
                                href={href}
                                className="hover:underline"
                                style={{ color: NAVY }}
                              >
                                {m.micro_market_name ?? "—"}
                              </Link>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                              {priceRange}
                            </td>
                            <td className="px-4 py-3 font-medium text-emerald-700">
                              {m.annual_appreciation_min
                                ? `${m.annual_appreciation_min}%+`
                                : "—"}
                            </td>
                            <td className="px-4 py-3 text-blue-700">
                              {m.rental_yield_min
                                ? `${m.rental_yield_min}%+`
                                : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${signal.cls}`}
                              >
                                {signal.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Link
                                href={href}
                                className="inline-flex items-center gap-1 rounded-md border px-3 py-1 text-xs font-medium transition-colors hover:bg-slate-100"
                                style={{ borderColor: "#e8e4dc", color: "#374151" }}
                              >
                                View <ArrowRight className="h-3 w-3" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── CTA SECTION ──────────────────────────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: NAVY }}>
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: GOLD }}
          >
            Expert Advisory
          </p>
          <h2 className="text-3xl font-bold text-white">
            Talk to a {cityName} Specialist
          </h2>
          <p
            className="mx-auto mt-4 max-w-lg text-base"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            Get personalised investment guidance across {cityName}&apos;s top
            micro-markets. Our advisors have deep local knowledge and live
            transaction data.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="rounded-lg px-7 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: GOLD, color: NAVY }}
            >
              Book a Free Consultation
            </Link>
            <Link
              href={`/${citySlug}/projects`}
              className="rounded-lg border px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              style={{ borderColor: "rgba(255,255,255,0.3)" }}
            >
              Browse {cityName} Projects
            </Link>
          </div>
        </div>
      </section>

      {/* ── Explore by Region (Goa only) ─────────────────────────────────────── */}
      {citySlug === "goa" && (
        <section className="container mx-auto max-w-4xl px-4 py-14 border-t border-slate-100">
          <h2 className="mb-1 text-lg font-semibold text-slate-800">Explore by Region</h2>
          <p className="mb-8 text-sm text-slate-500">Browse Goa real estate by region — North Goa and South Goa offer distinct lifestyle and investment profiles.</p>
          <div className="grid sm:grid-cols-2 gap-10">
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">North Goa Markets</h3>
              <ul className="space-y-2">
                {[
                  { name: "Calangute", slug: "calangute" },
                  { name: "Baga", slug: "baga" },
                  { name: "Anjuna", slug: "anjuna" },
                  { name: "Assagao", slug: "assagao" },
                  { name: "Vagator", slug: "vagator" },
                  { name: "Siolim", slug: "siolim" },
                  { name: "Candolim", slug: "candolim" },
                  { name: "Morjim", slug: "morjim" },
                  { name: "Arpora", slug: "arpora" },
                  { name: "Mapusa", slug: "mapusa" },
                  { name: "Porvorim", slug: "porvorim" },
                ].map((m) => (
                  <li key={m.slug}>
                    <Link
                      href={`/goa/${m.slug}`}
                      className="text-sm text-slate-600 hover:text-slate-900 hover:underline underline-offset-2 transition-colors"
                    >
                      {m.name} Real Estate
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">South Goa Markets</h3>
              <ul className="space-y-2">
                {[
                  { name: "Margao", slug: "margao" },
                  { name: "Colva", slug: "colva" },
                  { name: "Benaulim", slug: "benaulim" },
                  { name: "Cavelossim", slug: "cavelossim" },
                  { name: "Varca", slug: "varca" },
                  { name: "Bogmalo", slug: "bogmalo" },
                  { name: "Vasco da Gama", slug: "vasco-da-gama" },
                  { name: "Dabolim", slug: "dabolim" },
                  { name: "Ponda", slug: "ponda" },
                ].map((m) => (
                  <li key={m.slug}>
                    <Link
                      href={`/goa/${m.slug}`}
                      className="text-sm text-slate-600 hover:text-slate-900 hover:underline underline-offset-2 transition-colors"
                    >
                      {m.name} Real Estate
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* ── FAQs ─────────────────────────────────────────────────────────────── */}
      <section className="container mx-auto max-w-2xl px-4 py-16">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Common Questions
        </p>
        <h2 className="mb-8 text-center text-2xl font-bold text-slate-900">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border-b"
              style={{ borderColor: "#e8e4dc" }}
            >
              <AccordionTrigger className="py-4 text-left font-medium text-slate-800 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-4 leading-relaxed text-slate-500">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
