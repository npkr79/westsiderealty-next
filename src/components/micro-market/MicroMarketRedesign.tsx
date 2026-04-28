"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { MicroMarketViewModel } from "@/services/microMarketViewModel";
import type { GoaMarketProject } from "@/components/micro-market/GoaProjectsInMarket";
import { buildCityUrl, buildDeveloperUrl, buildProjectsIndexUrl } from "@/lib/routes";

function slugifyDeveloper(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ─── Design System ────────────────────────────────────────────────────────────

const C = {
  bg: "#FAFAF7",
  bgWarm: "#F5F3EE",
  bgCard: "#FFFFFF",
  bgDark: "#1A1A1F",
  gold: "#B08D57",
  goldLight: "#C9A96E",
  accent: "#2D6A4F",
  text: "#1A1A1F",
  textMuted: "#7A7A7E",
  border: "rgba(0,0,0,0.07)",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeaturedProject {
  url_slug: string;
  project_name: string;
  developer_name: string | null;
  developer_url_slug?: string | null;
  micro_market_name: string | null;
  hero_image_url: string | null;
  price_per_sqft_min: number | null;
  price_per_sqft_max: number | null;
  min_area: number | null;
  max_area: number | null;
  price_range_text?: string | null;
}

interface NearbyMarket {
  micro_market_name: string;
  url_slug: string;
}

type MarketAmenities = {
  schools: boolean;
  hospitals: boolean;
  dailyConveniences: boolean;
  pharmacy: boolean;
};

type AiEnrichment = {
  market_maturity: string | null;
  builder_activity: string | null;
  buyer_profile: string | null;
  rental_yield_min: number | null;
  rental_yield_max: number | null;
  price_per_sqft_current: number | null;
  market_summary: string | null;
  top_developers: string[] | null;
  market_risks: string | null;
  confidence: string | null;
  zone_type: string | null;
  market_character: string | null;
  price_band_current: string | null;
  buyer_profile_detail: string | null;
  lifestyle_score: string | null;
  possession_wait: string | null;
  best_for: string | null;
  appreciation_5yr: string | null;
  rental_yield_detail: string | null;
  entry_timing: string | null;
  entry_reasoning: string | null;
  employment_drivers: string[] | null;
  infrastructure_pipeline: string[] | null;
  social_infrastructure: string | null;
  risk_level: string | null;
  primary_risk: string | null;
  secondary_risks: string[] | null;
  bull_case: string | null;
  bear_case: string | null;
  analyst_recommendation: string | null;
  commercial_rental_yield_min: number | null;
  commercial_rental_yield_max: number | null;
  commercial_rental_yield_detail: string | null;
  fetched_at: string | null;
  // Goa-specific fields
  lifestyle_summary?: string | null;
  nearest_beaches?: string[] | null;
  top_attractions?: string[] | null;
  airport_distances?: string[] | null;
  things_to_do?: string[] | null;
  dining_nightlife?: string[] | null;
};

type RentalIntelligence = {
  intelligence: Array<{
    intelligence_type: string;
    ai_verdict: string | null;
    vs_fd_rate: number | null;
    highlight_stat: string | null;
    data_period: string | null;
  }>;
  rentalRows: Array<{
    property_type: string;
    furnishing_type: string | null;
    rent_min: number | null;
    rent_max: number | null;
    rent_median: number | null;
    rent_psf_min: number | null;
    rent_psf_max: number | null;
  }>;
};

export interface AdvisorMarketIntel {
  market_name: string | null;
  market_slug: string | null;
  investment_verdict: string | null;
  outlook_base_case: string | null;
  growth_catalysts: unknown;  // may be string[] or {catalyst, timeline, expected_impact}[]
  risk_factors: unknown;      // may be string[] or {risk, likelihood, impact}[]
  appreciation_1yr_pct: number | null;
  appreciation_cagr_5yr: number | null;
  rental_yield_avg_pct: number | null;
  price_per_sqft_min: number | null;
  price_per_sqft_max: number | null;
  market_velocity_score: number | null;
  description: string | null;
}

export interface MicroMarketRedesignProps {
  viewModel: MicroMarketViewModel;
  citySlug: string;
  cityName: string;
  mapCenter?: { lat: number; lng: number } | null;
  faqs: Array<{ question: string; answer: string }>;
  faqSchemaJson?: string | null;
  availableBhkTypes: string[];
  nearbyMarkets: NearbyMarket[];
  amenities: MarketAmenities | null;
  locationData: {
    commuteMatrix: Array<{ destination: string; distance: string; time: string }>;
    topSchools: string[];
    topHospitals: string[];
    nearestMmtsStatus: string | null;
    connectivityDetails: string | null;
    growthStory?: string | null;
    infrastructureDetails?: string | null;
    inventoryDescription?: string | null;
    itCorridorInfluence?: string | null;
  };
  marketMetrics: { growthStage: string | null; priceCycleStage: string | null } | null;
  aiEnrichment: AiEnrichment | null;
  advisorMarket?: AdvisorMarketIntel | null;
  goaProjects: GoaMarketProject[];
  rentalIntelligence: RentalIntelligence | null;
  projects: FeaturedProject[];
  projectCount: number;
  /** developer name → developer_brands.url_slug, pre-resolved server-side */
  developerBrandSlugs?: Record<string, string>;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "16px 20px", background: C.bgCard,
      border: `1px solid ${C.border}`, borderRadius: 12, minWidth: 110,
    }}>
      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: color || C.gold, lineHeight: 1 }}>{value}</span>
      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, marginTop: 4, textAlign: "center" }}>{label}</span>
    </div>
  );
}

function Tag({ children, color = C.gold }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20,
      border: `1px solid ${color}33`,
      background: `${color}12`,
      color, fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 500,
    }}>{children}</span>
  );
}

function SectionHeading({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 600, color: C.text, margin: 0, lineHeight: 1.15 }}>{children}</h2>
      {sub && <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.textMuted, marginTop: 6, marginBottom: 0 }}>{sub}</p>}
    </div>
  );
}

function FaqAccordion({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  if (!faqs.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {faqs.map((faq, i) => (
        <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", background: C.bgCard }}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            style={{
              width: "100%", textAlign: "left", padding: "16px 20px",
              background: "transparent", border: "none", cursor: "pointer",
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
            }}
          >
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 500, color: C.text }}>{faq.question}</span>
            <span style={{ color: C.gold, fontSize: 18, flexShrink: 0, transition: "transform 0.2s", transform: openIndex === i ? "rotate(45deg)" : "none" }}>+</span>
          </button>
          {openIndex === i && (
            <div style={{ padding: "0 20px 16px", fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Strip HTML tags and decode common entities for plain-text display. */
function stripHtml(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, " ")           // remove all tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, "")
    .replace(/\s{2,}/g, " ")            // collapse multiple spaces
    .trim();
}

function ProjectCard({ project, citySlug }: { project: FeaturedProject; citySlug: string }) {
  const router = useRouter();
  const priceStr = project.price_per_sqft_min
    ? `₹${project.price_per_sqft_min.toLocaleString()}${project.price_per_sqft_max && project.price_per_sqft_max !== project.price_per_sqft_min ? `–${project.price_per_sqft_max.toLocaleString()}` : ""}/sqft`
    : (project.price_range_text ?? null);
  const areaStr = project.min_area
    ? `${project.min_area.toLocaleString()}${project.max_area && project.max_area !== project.min_area ? `–${project.max_area.toLocaleString()}` : ""} sqft`
    : null;
  const projectHref = `/${citySlug}/projects/${project.url_slug}`;
  const developerHref = project.developer_url_slug
    ? buildDeveloperUrl(project.developer_url_slug)
    : null;

  return (
    // Outer div navigates to project on click; no <a> wrapping so we can have a proper <a> inside for the developer
    <div
      className="mm-proj-card"
      role="link"
      tabIndex={0}
      onClick={() => router.push(projectHref)}
      onKeyDown={(e) => { if (e.key === "Enter") router.push(projectHref); }}
      style={{
        background: C.bgCard, borderRadius: 14,
        border: `1px solid ${C.border}`, overflow: "hidden",
        transition: "transform 0.22s, box-shadow 0.22s", cursor: "pointer",
      }}
    >
      <div style={{ height: 180, position: "relative", background: "#E8E4DC" }}>
        {project.hero_image_url ? (
          <Image src={project.hero_image_url} alt={project.project_name} fill style={{ objectFit: "cover" }} />
        ) : (
          <div style={{
            width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(135deg, #E8E4DC 0%, #D4CFC5 100%)`,
          }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.textMuted }}>
              {project.project_name.split(" ").map(w => w[0]).join("").slice(0, 3)}
            </span>
          </div>
        )}
      </div>
      <div style={{ padding: "16px" }}>
        {project.developer_name && developerHref ? (
          <Link
            href={developerHref}
            onClick={(e) => e.stopPropagation()}
            style={{ textDecoration: "none" }}
          >
            <p style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", transition: "color 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.gold; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
            >
              {project.developer_name}
            </p>
          </Link>
        ) : (
          <p style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {project.micro_market_name || project.developer_name || ""}
          </p>
        )}
        <h3 style={{ margin: "4px 0 8px", fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: C.text, lineHeight: 1.25 }}>
          {project.project_name}
        </h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {priceStr && <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.gold, fontWeight: 500 }}>{priceStr}</span>}
          {areaStr && <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted }}>· {areaStr}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MicroMarketRedesign({
  viewModel,
  citySlug,
  cityName,
  faqs,
  availableBhkTypes,
  nearbyMarkets,
  amenities,
  locationData,
  marketMetrics,
  aiEnrichment,
  advisorMarket,
  rentalIntelligence,
  goaProjects,
  projects,
  projectCount,
  developerBrandSlugs = {},
}: MicroMarketRedesignProps) {
  const { hero, riskOutlook, developerCapital } = viewModel;
  const [amenityTab, setAmenityTab] = useState<"schools" | "healthcare" | "shopping">("schools");

  const marketName = hero.name;
  const rawHook = hero.hook || aiEnrichment?.market_summary || advisorMarket?.description || null;
  // hero_hook is sometimes stored as HTML in the DB — strip tags for plain-text display
  const hook = rawHook ? stripHtml(rawHook) : null;

  // Derived investment signals — advisor table takes priority, aiEnrichment as fallback
  const bullCase = advisorMarket?.outlook_base_case || aiEnrichment?.bull_case || null;
  const bearCase = aiEnrichment?.bear_case || null;
  const verdict = advisorMarket?.investment_verdict || aiEnrichment?.analyst_recommendation || null;
  const entryTiming = aiEnrichment?.entry_timing || null;
  const entryReasoning = aiEnrichment?.entry_reasoning || null;
  const primaryRisk = aiEnrichment?.primary_risk || null;

  // Normalize mixed arrays — items may be strings or objects like
  // {catalyst, timeline, expected_impact} / {risk, likelihood, impact}
  function toStringArr(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const val = o.catalyst ?? o.risk ?? o.factor ?? o.driver ?? o.title ?? o.name ?? Object.values(o)[0] ?? "";
        return String(val).trim();
      }
      return String(item ?? "").trim();
    }).filter(Boolean);
  }

  // Merge advisor risk_factors with aiEnrichment secondary_risks (deduplicated)
  const advisorRisks = toStringArr(advisorMarket?.risk_factors);
  const aiSecondaryRisks = aiEnrichment?.secondary_risks || [];
  const secondaryRisks = [...advisorRisks, ...aiSecondaryRisks.filter(r => !advisorRisks.includes(r))];
  const topDevelopers = aiEnrichment?.top_developers || [];
  const infraPipeline = aiEnrichment?.infrastructure_pipeline || [];
  // Merge advisor growth_catalysts with aiEnrichment employment_drivers
  const advisorCatalysts = toStringArr(advisorMarket?.growth_catalysts);
  const aiDrivers = aiEnrichment?.employment_drivers || [];
  const employmentDrivers = [...advisorCatalysts, ...aiDrivers.filter(d => !advisorCatalysts.includes(d))];

  // Price metrics
  const priceMin = hero.priceRange.min;
  const priceMax = hero.priceRange.max;
  const growthMin = hero.growth.min;
  const rentalMin = hero.rental.min;
  const rentalMax = hero.rental.max;

  // AI advisor market questions
  const advisorQuestions = [
    `What's the best project to buy in ${marketName} under ₹2 Cr?`,
    `Is ${marketName} still a good investment in 2025?`,
    `Compare ${marketName} with nearby corridors`,
  ];

  function openAdvisor(question: string) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("westside:openAdvisor", {
        detail: { marketSlug: viewModel.urlSlug, message: question },
      })
    );
  }

  // Featured projects (use enriched MV projects first, fall back to goaProjects shape)
  const featuredProjects = projects.slice(0, 8);
  const showProjects = featuredProjects.length > 0;

  return (
    <>
      <style>{`
        .mm-proj-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.10); }
        .mm-adv-q:hover { border-color: ${C.gold} !important; color: ${C.gold} !important; }
        .mm-nearby-pill:hover { border-color: ${C.gold} !important; color: ${C.gold} !important; background: ${C.gold}10 !important; }
        .mm-dev-chip:hover { border-color: ${C.gold} !important; color: ${C.text} !important; }
        @media (max-width: 1100px) {
          .mm-proj-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 900px) {
          .mm-hero-grid { flex-direction: column !important; }
          .mm-intel-grid { grid-template-columns: 1fr !important; }
          .mm-proj-grid { grid-template-columns: 1fr 1fr !important; }
          .mm-commute-metrics { flex-wrap: wrap !important; }
        }
        @media (max-width: 600px) {
          .mm-proj-grid { grid-template-columns: 1fr !important; }
          .mm-metrics-row { flex-wrap: wrap !important; gap: 8px !important; }
        }
      `}</style>

      {/* ── Section 1: Market Hero ────────────────────────────────────────── */}
      <section style={{ background: C.bg, paddingTop: 48, paddingBottom: 56 }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
          {/* Breadcrumb */}
          <nav style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>
            <Link href="/" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, textDecoration: "none" }}>Home</Link>
            <span style={{ color: C.textMuted, fontSize: 12 }}>›</span>
            <Link href={buildCityUrl(citySlug)} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, textDecoration: "none" }}>{cityName}</Link>
            <span style={{ color: C.textMuted, fontSize: 12 }}>›</span>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.text }}>{marketName}</span>
          </nav>

          <div className="mm-hero-grid" style={{ display: "flex", gap: 48, alignItems: "flex-start" }}>
            {/* Left — market identity */}
            <div style={{ flex: "1 1 0", minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {hero.keySignals.cycleStage && <Tag>{hero.keySignals.cycleStage}</Tag>}
                {hero.keySignals.entryPhase && <Tag color={C.accent}>{hero.keySignals.entryPhase}</Tag>}
                {marketMetrics?.priceCycleStage && <Tag color="#5B6AF0">{marketMetrics.priceCycleStage}</Tag>}
              </div>

              <h1 style={{
                fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 5vw, 56px)",
                fontWeight: 700, color: C.text, margin: "0 0 16px", lineHeight: 1.1,
              }}>
                {marketName}
                <span style={{ color: C.gold }}> ·</span>
              </h1>

              {hook && (
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, color: C.textMuted, lineHeight: 1.7, margin: "0 0 24px", maxWidth: 520 }}>
                  {hook}
                </p>
              )}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
                {availableBhkTypes.map((bhk) => (
                  <span key={bhk} style={{
                    padding: "4px 12px", borderRadius: 20,
                    border: `1px solid ${C.border}`,
                    background: C.bgCard,
                    fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.text,
                  }}>{bhk}</span>
                ))}
                {projectCount > 0 && (
                  <span style={{
                    padding: "4px 12px", borderRadius: 20,
                    border: `1px solid ${C.gold}44`,
                    background: `${C.gold}10`,
                    fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.gold, fontWeight: 500,
                  }}>{projectCount} Projects</span>
                )}
              </div>

              <button
                onClick={() => openAdvisor(`Tell me about ${marketName} — prices, best projects, investment outlook`)}
                style={{
                  padding: "12px 28px", borderRadius: 8,
                  background: C.bgDark, color: "#fff",
                  fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 500,
                  border: "none", cursor: "pointer", letterSpacing: "0.03em",
                }}
              >
                Ask About {marketName} →
              </button>
            </div>

            {/* Right — metrics card */}
            <div style={{
              flexShrink: 0, width: 300,
              background: C.bgCard, borderRadius: 16,
              border: `1px solid ${C.border}`,
              padding: "28px 24px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 20px" }}>
                Market Snapshot
              </p>

              {(priceMin || priceMax) && (
                <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ margin: "0 0 4px", fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted }}>Current Price</p>
                  <p style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: C.text }}>
                    ₹{priceMin?.toLocaleString()}{priceMax && priceMax !== priceMin ? `–${priceMax.toLocaleString()}` : ""}
                    <span style={{ fontSize: 14, color: C.textMuted }}>/sqft</span>
                  </p>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(growthMin != null) && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted }}>Annual Appreciation</span>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: C.accent }}>
                      {growthMin}{hero.growth.max && hero.growth.max !== growthMin ? `–${hero.growth.max}` : ""}% YoY
                    </span>
                  </div>
                )}
                {(rentalMin != null) && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted }}>Rental Yield</span>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: C.text }}>
                      {rentalMin}{rentalMax && rentalMax !== rentalMin ? `–${rentalMax}` : ""}%
                    </span>
                  </div>
                )}
                {hero.keySignals.institutionalConfidence && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted }}>Inst. Confidence</span>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 500, color: C.gold }}>
                      {hero.keySignals.institutionalConfidence}
                    </span>
                  </div>
                )}
                {aiEnrichment?.entry_timing && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted }}>Entry Timing</span>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 500, color: C.text }}>
                      {aiEnrichment.entry_timing}
                    </span>
                  </div>
                )}
                {aiEnrichment?.best_for && (
                  <div style={{ marginTop: 4, padding: "8px 12px", background: `${C.gold}10`, borderRadius: 8, border: `1px solid ${C.gold}22` }}>
                    <p style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted }}>Best For</p>
                    <p style={{ margin: "2px 0 0", fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.text, fontWeight: 500 }}>{aiEnrichment.best_for}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Price Intelligence ────────────────────────────────── */}
      <section style={{ background: C.bgWarm, padding: "56px 0" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
          <SectionHeading sub="Pricing context, rental trends, and market momentum indicators">
            Price Intelligence
          </SectionHeading>

          <div className="mm-metrics-row" style={{ display: "flex", gap: 12, marginBottom: 32, overflowX: "auto", paddingBottom: 4 }}>
            {priceMin && <MetricPill label="Price Floor" value={`₹${priceMin.toLocaleString()}`} />}
            {priceMax && <MetricPill label="Price Ceiling" value={`₹${priceMax.toLocaleString()}`} color={C.text} />}
            {growthMin != null && <MetricPill label="YoY Growth" value={`${growthMin}%+`} color={C.accent} />}
            {rentalMin != null && <MetricPill label="Rental Yield" value={`${rentalMin}${rentalMax && rentalMax !== rentalMin ? `–${rentalMax}` : ""}%`} color="#5B6AF0" />}
            {aiEnrichment?.appreciation_5yr && <MetricPill label="5-Yr Appreciation" value={aiEnrichment.appreciation_5yr} />}
          </div>

          {/* Rental intelligence rows */}
          {(() => {
            // Only show rental table when at least one row has actual price data
            const validRentalRows = rentalIntelligence?.rentalRows.filter(
              (r) => r.rent_min || r.rent_max || r.rent_median
            ) ?? [];
            if (validRentalRows.length === 0) return null;
            return (
              <div style={{ background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: C.text }}>Rental Market Data</p>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: `${C.bgWarm}` }}>
                        {["Type", "Furnishing", "Rent Range", "Median"].map((h) => (
                          <th key={h} style={{ padding: "10px 16px", fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textAlign: "left", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {validRentalRows.slice(0, 6).map((row, i) => (
                        <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                          <td style={{ padding: "10px 16px", fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.text }}>{row.property_type}</td>
                          <td style={{ padding: "10px 16px", fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted }}>{row.furnishing_type || "—"}</td>
                          <td style={{ padding: "10px 16px", fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.text }}>
                            {row.rent_min && row.rent_max ? `₹${row.rent_min.toLocaleString()}–${row.rent_max.toLocaleString()}` : "—"}
                          </td>
                          <td style={{ padding: "10px 16px", fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.gold, fontWeight: 500 }}>
                            {row.rent_median ? `₹${row.rent_median.toLocaleString()}` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* AI enrichment rental detail */}
          {aiEnrichment?.rental_yield_detail && !rentalIntelligence && (
            <div style={{ background: C.bgCard, borderRadius: 12, border: `1px solid ${C.border}`, padding: "20px 24px", marginTop: 16 }}>
              <p style={{ margin: "0 0 6px", fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Rental Intelligence</p>
              <p style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.text, lineHeight: 1.7 }}>{aiEnrichment.rental_yield_detail}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 3: Location & Connectivity ───────────────────────────── */}
      <section style={{ background: C.bg, padding: "56px 0" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
          <SectionHeading sub="Commute times, social infrastructure, and amenity access">
            Location &amp; Connectivity
          </SectionHeading>

          <div className="mm-commute-metrics" style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* Commute Matrix */}
            {locationData.commuteMatrix.length > 0 && (
              <div style={{ flex: "1 1 280px", background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🗺</span>
                  <p style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: C.text }}>Commute Times</p>
                </div>
                {locationData.commuteMatrix.map((row, i) => (
                  <div key={i} style={{
                    padding: "12px 20px", borderTop: i > 0 ? `1px solid ${C.border}` : undefined,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.text }}>{row.destination}</span>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.textMuted }}>{row.distance}</span>
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.gold, fontWeight: 500 }}>{row.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Amenity Tabs */}
            <div style={{ flex: "1 1 320px", background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              {/* Tab bar */}
              <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
                {(["schools", "healthcare", "shopping"] as const).map((tab) => {
                  const label = tab === "schools" ? "🎓 Schools" : tab === "healthcare" ? "🏥 Healthcare" : "🛒 Amenities";
                  return (
                    <button key={tab} onClick={() => setAmenityTab(tab)} style={{
                      flex: 1, padding: "12px 8px", background: amenityTab === tab ? C.bgWarm : "transparent",
                      border: "none", cursor: "pointer",
                      borderBottom: amenityTab === tab ? `2px solid ${C.gold}` : "2px solid transparent",
                      fontFamily: "'Outfit', sans-serif", fontSize: 12,
                      color: amenityTab === tab ? C.text : C.textMuted,
                      fontWeight: amenityTab === tab ? 600 : 400,
                      transition: "all 0.2s",
                    }}>{label}</button>
                  );
                })}
              </div>
              <div style={{ padding: "16px 20px", minHeight: 120 }}>
                {amenityTab === "schools" && (
                  locationData.topSchools.length > 0 ? (
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                      {locationData.topSchools.map((s, i) => (
                        <li key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: C.gold, fontSize: 10 }}>●</span>
                          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.text }}>{s}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted, margin: 0 }}>School data coming soon.</p>
                )}
                {amenityTab === "healthcare" && (
                  locationData.topHospitals.length > 0 ? (
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                      {locationData.topHospitals.map((h, i) => (
                        <li key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#E55A5A", fontSize: 10 }}>●</span>
                          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.text }}>{h}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted, margin: 0 }}>Hospital data coming soon.</p>
                )}
                {amenityTab === "shopping" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {amenities ? (
                      [
                        { label: "Schools Nearby", active: amenities.schools },
                        { label: "Hospitals Nearby", active: amenities.hospitals },
                        { label: "Daily Conveniences", active: amenities.dailyConveniences },
                        { label: "Pharmacy Access", active: amenities.pharmacy },
                      ].map((item) => (
                        <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.text }}>{item.label}</span>
                          <span style={{ fontSize: 14 }}>{item.active ? "✅" : "⬜"}</span>
                        </div>
                      ))
                    ) : (
                      aiEnrichment?.social_infrastructure
                        ? <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted, margin: 0 }}>{aiEnrichment.social_infrastructure}</p>
                        : <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted, margin: 0 }}>Amenity data coming soon.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MMTS / Metro status */}
          {locationData.nearestMmtsStatus && (
            <div style={{ marginTop: 20, padding: "14px 20px", background: `${C.accent}10`, border: `1px solid ${C.accent}22`, borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>🚇</span>
              <p style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.text }}>{locationData.nearestMmtsStatus}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 3.5: Narrative — Growth Story / Infrastructure / Inventory ─── */}
      {(locationData.growthStory || locationData.infrastructureDetails || locationData.inventoryDescription || locationData.itCorridorInfluence) && (
        <section style={{ background: C.bg, padding: "56px 0" }}>
          <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 24px" }}>
            {locationData.growthStory && (
              <div style={{ marginBottom: 40 }}>
                <SectionHeading sub={`The arc of why ${marketName} matters now`}>
                  {marketName} — The Growth Story
                </SectionHeading>
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 15,
                    color: C.text,
                    lineHeight: 1.75,
                    whiteSpace: "pre-line",
                  }}
                >
                  {locationData.growthStory}
                </div>
              </div>
            )}

            {locationData.itCorridorInfluence && (
              <div style={{ marginBottom: 40 }}>
                <SectionHeading sub="How the IT corridor shapes demand here">
                  IT Corridor Influence
                </SectionHeading>
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 15,
                    color: C.text,
                    lineHeight: 1.75,
                    whiteSpace: "pre-line",
                  }}
                >
                  {locationData.itCorridorInfluence}
                </div>
              </div>
            )}

            {locationData.infrastructureDetails && (
              <div style={{ marginBottom: 40 }}>
                <SectionHeading sub="Roads, water, schools, hospitals — what's delivered vs planned">
                  Infrastructure in {marketName}
                </SectionHeading>
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 15,
                    color: C.text,
                    lineHeight: 1.75,
                    whiteSpace: "pre-line",
                  }}
                >
                  {locationData.infrastructureDetails}
                </div>
              </div>
            )}

            {locationData.inventoryDescription && (
              <div>
                <SectionHeading sub="Property types, price band, configurations">
                  What&apos;s Available in {marketName}
                </SectionHeading>
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 15,
                    color: C.text,
                    lineHeight: 1.75,
                    whiteSpace: "pre-line",
                  }}
                >
                  {locationData.inventoryDescription}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Section 4: Investment Intelligence ───────────────────────────── */}
      <section style={{ background: C.bgWarm, padding: "56px 0" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
          <SectionHeading sub="Balanced view: upside drivers, risk factors, and our analyst stance">
            Investment Intelligence
          </SectionHeading>

          <div className="mm-intel-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            {/* Case For — green */}
            <div style={{ background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, padding: "24px", borderTop: `3px solid ${C.accent}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 18 }}>📈</span>
                <p style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: C.accent }}>The Case For</p>
              </div>
              {bullCase && <p style={{ margin: "0 0 12px", fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.text, lineHeight: 1.7 }}>{bullCase}</p>}
              {employmentDrivers.length > 0 && (
                <ul style={{ margin: "0 0 12px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                  {employmentDrivers.slice(0, 3).map((d, i) => (
                    <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: C.accent, fontWeight: 700, fontSize: 12, flexShrink: 0, marginTop: 1 }}>+</span>
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{d}</span>
                    </li>
                  ))}
                </ul>
              )}
              {infraPipeline.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ margin: "0 0 8px", fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Infrastructure</p>
                  {infraPipeline.slice(0, 2).map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 4 }}>
                      <span style={{ color: C.gold, fontSize: 10, flexShrink: 0, marginTop: 3 }}>◆</span>
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Risks — amber */}
            <div style={{ background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, padding: "24px", borderTop: "3px solid #E07B39" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <p style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: "#C06420" }}>Risks to Watch</p>
              </div>
              {bearCase && <p style={{ margin: "0 0 12px", fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.text, lineHeight: 1.7 }}>{bearCase}</p>}
              {primaryRisk && (
                <div style={{ padding: "10px 14px", background: "#FFF3E8", borderRadius: 8, border: "1px solid #F5C69A", marginBottom: 12 }}>
                  <p style={{ margin: "0 0 3px", fontFamily: "'Outfit', sans-serif", fontSize: 11, color: "#C06420", fontWeight: 600 }}>Primary Risk</p>
                  <p style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.text }}>{primaryRisk}</p>
                </div>
              )}
              {secondaryRisks && secondaryRisks.length > 0 && (
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                  {secondaryRisks.slice(0, 3).map((r, i) => (
                    <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: "#E07B39", fontSize: 12, flexShrink: 0, marginTop: 1 }}>→</span>
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{r}</span>
                    </li>
                  ))}
                </ul>
              )}
              {aiEnrichment?.risk_level && (
                <div style={{ marginTop: 12 }}>
                  <Tag color="#E07B39">Risk Level: {aiEnrichment.risk_level}</Tag>
                </div>
              )}
            </div>

            {/* Verdict — gold */}
            <div style={{ background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, padding: "24px", borderTop: `3px solid ${C.gold}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 18 }}>🏆</span>
                <p style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: C.gold }}>Analyst Verdict</p>
              </div>
              {verdict && <p style={{ margin: "0 0 14px", fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.text, lineHeight: 1.7 }}>{verdict}</p>}
              {/* Appreciation metrics from advisor */}
              {(advisorMarket?.appreciation_1yr_pct != null || advisorMarket?.appreciation_cagr_5yr != null) && (
                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  {advisorMarket.appreciation_1yr_pct != null && (
                    <div style={{ flex: 1, padding: "10px 12px", background: `${C.accent}10`, borderRadius: 8, border: `1px solid ${C.accent}33` }}>
                      <p style={{ margin: "0 0 2px", fontFamily: "'Outfit', sans-serif", fontSize: 10, color: C.accent, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>1yr Appreciation</p>
                      <p style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: C.accent }}>+{advisorMarket.appreciation_1yr_pct}%</p>
                    </div>
                  )}
                  {advisorMarket.appreciation_cagr_5yr != null && (
                    <div style={{ flex: 1, padding: "10px 12px", background: `${C.gold}10`, borderRadius: 8, border: `1px solid ${C.gold}33` }}>
                      <p style={{ margin: "0 0 2px", fontFamily: "'Outfit', sans-serif", fontSize: 10, color: C.gold, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>5yr CAGR</p>
                      <p style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: C.gold }}>{advisorMarket.appreciation_cagr_5yr}%</p>
                    </div>
                  )}
                </div>
              )}
              {entryTiming && (
                <div style={{ padding: "10px 14px", background: `${C.gold}10`, borderRadius: 8, border: `1px solid ${C.gold}33`, marginBottom: 12 }}>
                  <p style={{ margin: "0 0 3px", fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.gold, fontWeight: 600 }}>Entry Timing</p>
                  <p style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.text }}>{entryTiming}</p>
                </div>
              )}
              {entryReasoning && (
                <p style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, lineHeight: 1.6, fontStyle: "italic" }}>
                  {entryReasoning}
                </p>
              )}
              {advisorMarket?.rental_yield_avg_pct != null && (
                <div style={{ marginTop: 12 }}>
                  <Tag color={C.gold}>Avg Rental Yield: {advisorMarket.rental_yield_avg_pct}%</Tag>
                </div>
              )}
              {!verdict && !entryTiming && !advisorMarket?.appreciation_1yr_pct && (
                <p style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted }}>
                  Ask our Advisor for a personalised investment assessment for {marketName}.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5: Developer Landscape ───────────────────────────────── */}
      {topDevelopers.length > 0 && (
        <section style={{ background: C.bg, padding: "48px 0" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <SectionHeading sub="Active builders with projects in this corridor">
              Developer Landscape
            </SectionHeading>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
              {topDevelopers.map((dev, i) => {
                const brandSlug = developerBrandSlugs[dev] ?? developerBrandSlugs[dev.toLowerCase()] ?? null;
                const chipStyle: React.CSSProperties = {
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 18px", borderRadius: 24,
                  border: `1px solid ${C.border}`, background: C.bgCard,
                  fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted,
                  whiteSpace: "nowrap", flexShrink: 0,
                  transition: "border-color 0.2s, color 0.2s",
                  textDecoration: "none",
                };
                const dot = <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, display: "inline-block", flexShrink: 0 }} />;
                return brandSlug ? (
                  <Link key={i} href={buildDeveloperUrl(brandSlug)} className="mm-dev-chip" style={{ ...chipStyle, cursor: "pointer" }}>
                    {dot}{dev}
                  </Link>
                ) : (
                  <span key={i} className="mm-dev-chip" style={chipStyle}>
                    {dot}{dev}
                  </span>
                );
              })}
            </div>
            {developerCapital.capitalConvictionBand && (
              <p style={{ marginTop: 16, fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted }}>
                Capital conviction: <strong style={{ color: C.text }}>{developerCapital.capitalConvictionBand}</strong>
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── Section 6: Featured Projects ─────────────────────────────────── */}
      {showProjects && (
        <section style={{ background: C.bgWarm, padding: "56px 0" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
              <SectionHeading sub={`${projectCount} RERA-verified projects in ${marketName}`}>
                Featured Projects
              </SectionHeading>
              {projectCount > 6 && (
                <Link href={buildProjectsIndexUrl(citySlug)} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.gold, textDecoration: "none", flexShrink: 0, marginLeft: 16 }}>
                  View all {projectCount} →
                </Link>
              )}
            </div>
            <div className="mm-proj-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
              {featuredProjects.map((project) => (
                <ProjectCard key={project.url_slug} project={project} citySlug={citySlug} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Section 7: Nearby Markets ─────────────────────────────────────── */}
      {nearbyMarkets.length > 0 && (
        <section style={{ background: C.bg, padding: "48px 0" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <SectionHeading sub="Explore adjacent corridors in the same city">
              Nearby Markets
            </SectionHeading>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {nearbyMarkets.map((market) => (
                <Link
                  key={market.url_slug}
                  href={`/${citySlug}/${market.url_slug}`}
                  className="mm-nearby-pill"
                  style={{
                    display: "inline-flex", alignItems: "center",
                    padding: "8px 20px", borderRadius: 24,
                    border: `1px solid ${C.border}`, background: C.bgCard,
                    fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted,
                    textDecoration: "none", transition: "all 0.2s",
                  }}
                >
                  {market.micro_market_name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Section 8: FAQ ────────────────────────────────────────────────── */}
      {faqs.length > 0 && (
        <section style={{ background: C.bgWarm, padding: "56px 0" }}>
          <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px" }}>
            <SectionHeading sub={`Common questions about ${marketName}`}>
              Frequently Asked Questions
            </SectionHeading>
            <FaqAccordion faqs={faqs} />
          </div>
        </section>
      )}

      {/* ── Section 9: AI Advisor CTA ─────────────────────────────────────── */}
      <section style={{ background: C.bgDark, padding: "64px 0" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 16px", borderRadius: 20, border: `1px solid ${C.gold}44`, background: `${C.gold}12`, marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, display: "inline-block" }} />
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.gold, letterSpacing: "0.1em", textTransform: "uppercase" }}>Advisor Intelligence</span>
          </div>

          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 600, color: "#FAFAF7", margin: "0 0 12px", lineHeight: 1.2 }}>
            Get answers about <em style={{ color: C.gold }}>{marketName}</em>
          </h2>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, color: "rgba(250,250,247,0.6)", margin: "0 0 40px", maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
            Our Advisor has real data on every project in this corridor — prices, availability, investment signals.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 500, margin: "0 auto 32px" }}>
            {advisorQuestions.map((q, i) => (
              <button key={i} className="mm-adv-q" onClick={() => openAdvisor(q)} style={{
                padding: "13px 20px", borderRadius: 10,
                border: `1px solid rgba(255,255,255,0.12)`,
                background: "rgba(255,255,255,0.04)",
                fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "rgba(250,250,247,0.7)",
                textAlign: "left", cursor: "pointer",
                transition: "border-color 0.2s, color 0.2s",
              }}>
                {q}
              </button>
            ))}
          </div>

          <button
            onClick={() => openAdvisor(`Tell me about investing in ${marketName}`)}
            style={{
              padding: "14px 36px", borderRadius: 8,
              background: C.gold, color: "#fff",
              fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600,
              border: "none", cursor: "pointer", letterSpacing: "0.04em",
            }}
          >
            Ask About {marketName} →
          </button>
        </div>
      </section>

      {/* ── Section 10: Data Sources Footer ──────────────────────────────── */}
      <div style={{ background: C.bgDark, borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 24px", textAlign: "center" }}>
        <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(250,250,247,0.3)", letterSpacing: "0.04em" }}>
          Data Sources: Telangana RERA · AI Market Research · Supabase Enrichment · Updated{" "}
          {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </p>
      </div>
    </>
  );
}
