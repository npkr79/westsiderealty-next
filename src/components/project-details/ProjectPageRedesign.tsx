"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { submitLead } from "@/app/actions/submit-lead";
import type {
  AdvisorProjectEnrichment,
  AdvisorConfig,
} from "@/services/projectService";
import type { ProjectWithRelations, ProjectPageContext } from "@/services/projectService";
import type { ProjectInsights } from "@/services/projectInsightsService";
import { buildProjectUrl } from "@/lib/routes";
import { getHeroImageUrl } from "@/utils/imageOptimization";

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

interface LiveIntelligence {
  actual_status?: string | null;
  handover_started?: boolean | null;
  handover_notes?: string | null;
  towers_completed?: number | null;
  towers_total?: number | null;
  developer_price_min?: number | null;
  developer_price_max?: number | null;
  resale_price_min?: number | null;
  resale_price_max?: number | null;
  price_trend?: "rising" | "stable" | "falling" | "declining" | null;
  forum_sentiment?: "positive" | "neutral" | "mixed" | "negative" | null;
  key_updates?: string[] | null;
  buyer_concerns?: string[] | null;
  sources?: string[] | null;
  confidence?: "high" | "medium" | "low" | null;
  scraped_at?: string | null;
  enriched_at?: string | null;
}

export interface LeadContext {
  city: string;
  projectName: string;
  projectSlug: string;
  propertyType: string;
  sourceType: string;
  microMarket: string;
  landingPage: string;
}

interface ProjectPageRedesignProps {
  project: ProjectWithRelations;
  insights: ProjectInsights;
  context: ProjectPageContext;
  citySlug: string;
  projectSlug: string;
  developerProjects: Array<{
    project_name: string;
    rera_id?: string | null;
    current_status?: string | null;
    proposed_completion_date?: string | null;
    url_slug?: string | null;
    city_slug?: string | null;
  }>;
  liveIntelligence?: LiveIntelligence | null;
  microMarketDetail?: { top_schools?: unknown[] | null; top_hospitals?: unknown[] | null } | null;
  relatedProjects?: Array<{
    project_name: string;
    url_slug?: string | null;
    city?: { url_slug?: string | null } | Array<{ url_slug?: string | null }> | null;
    configuration_display?: string | null;
    total_units?: number | null;
    current_status?: string | null;
    price_range_text?: string | null;
  }>;
  nearbyMarkets?: Array<{ micro_market_name: string; url_slug: string }>;
  configDistribution?: Array<{
    unit_category?: string | null;
    total_units?: number | null;
    config_percent?: number | null;
  }>;
  otherProjectsInMarket?: Array<{
    project_name: string;
    url_slug?: string | null;
    developer_name?: string | null;
    total_units?: number | null;
    proposed_completion_date?: string | null;
    city_slug?: string | null;
  }>;
  developerBrandSlug?: string | null;
  developerBrandName?: string | null;
  leadContext?: LeadContext;
  advisorData?: AdvisorProjectEnrichment;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function formatPsf(min: number | null, max: number | null): string {
  if (!min && !max) return "";
  if (min && max && min !== max) return `₹${min.toLocaleString("en-IN")}–${max.toLocaleString("en-IN")}`;
  if (min) return `₹${min.toLocaleString("en-IN")}`;
  if (max) return `₹${max.toLocaleString("en-IN")}`;
  return "";
}

function formatCr(val: number): string {
  return `₹${val.toFixed(2)} Cr`;
}

function stripHtmlAndTruncate(raw: string | null | undefined, maxLen = 300): string {
  if (!raw) return '';
  const stripped = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped.length > maxLen ? stripped.slice(0, maxLen) + '...' : stripped;
}

function parseAmenities(raw: unknown): string[] {
  if (!raw) return [];
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(arr)) return [];
    return arr.map((item: unknown) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null && 'name' in item) return (item as {name: string}).name;
      return String(item);
    }).filter(Boolean);
  } catch { return []; }
}

function parseAmenityArray(raw: unknown): string[] {
  if (!raw) return [];
  try {
    let arr: unknown[] = [];
    if (typeof raw === "string") {
      arr = JSON.parse(raw) as unknown[];
    } else if (Array.isArray(raw)) {
      arr = raw;
    }
    return arr.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "name" in (item as Record<string, unknown>)) {
        return String((item as Record<string, unknown>).name);
      }
      return String(item);
    }).filter(Boolean);
  } catch {
    return [];
  }
}

function parseJsonArray(raw: unknown): unknown[] {
  if (!raw) return [];
  try {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") return JSON.parse(raw) as unknown[];
  } catch {
    // ignore
  }
  return [];
}

// ─── Distance helpers (same as V2) ───────────────────────────────────────────

const toRad = (d: number) => (d * Math.PI) / 180;
function distanceInKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const HYD_LANDMARKS = [
  { label: "Financial District", lat: 17.4186, lng: 78.3426 },
  { label: "Gachibowli", lat: 17.4401, lng: 78.3489 },
  { label: "RGIA Airport", lat: 17.2403, lng: 78.4294 },
];

const ORR_EXITS = [
  { label: "ORR Exit — Patancheru", lat: 17.5365, lng: 78.2158 },
  { label: "ORR Exit — Gandimaisamma", lat: 17.5574, lng: 78.2862 },
  { label: "ORR Exit — Miyapur", lat: 17.4978, lng: 78.3267 },
  { label: "ORR Exit — KPHB", lat: 17.4717, lng: 78.3709 },
  { label: "ORR Exit — Gachibowli", lat: 17.4342, lng: 78.3568 },
  { label: "ORR Exit — Narsingi", lat: 17.3922, lng: 78.3702 },
  { label: "ORR Exit — Rajendranagar", lat: 17.3254, lng: 78.3912 },
  { label: "ORR Exit — Shamshabad", lat: 17.2507, lng: 78.4082 },
];

function nearestOrrExit(lat: number, lng: number): { label: string; dist: number } {
  let best = ORR_EXITS[0];
  let bestDist = distanceInKm(lat, lng, best.lat, best.lng);
  for (const exit of ORR_EXITS.slice(1)) {
    const d = distanceInKm(lat, lng, exit.lat, exit.lng);
    if (d < bestDist) { best = exit; bestDist = d; }
  }
  return { label: best.label, dist: bestDist };
}

function fmtArea(sqft: number): string {
  return Math.round(sqft).toLocaleString("en-IN");
}

// Convert raw DB snake_case segment / status values to display strings
function fmtSegment(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const map: Record<string, string> = {
    mid_premium: "Mid-Premium",
    premium: "Premium",
    ultra_luxury: "Ultra Luxury",
    luxury: "Luxury",
    affordable: "Affordable",
    mid_segment: "Mid Segment",
    under_construction: "Under Construction",
    partial_handover: "Partial Handover",
    substantially_complete: "Substantially Complete",
    fully_handed_over: "Fully Handed Over",
    ready_to_move: "Ready to Move",
  };
  return map[raw] ?? raw.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function fmtLakhCrore(lakhs: number): string {
  if (lakhs >= 100) return `₹${(lakhs / 100).toFixed(lakhs >= 200 ? 1 : 2).replace(/\.?0+$/, "")} Cr`;
  return `₹${Math.round(lakhs)} L`;
}

function cleanArray(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return (raw as unknown[])
      .map(s => String(s).replace(/^["'\\]+|["'\\]+$/g, "").trim())
      .filter(Boolean);
  }
  return [];
}

// ─── Shared Sub-components ───────────────────────────────────────────────────

function SectionHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 600, color: C.text, margin: 0, lineHeight: 1.15 }}>
        {title}
      </h2>
      {sub && (
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.textMuted, marginTop: 6, marginBottom: 0 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectPageRedesign({
  project,
  insights,
  context,
  citySlug,
  advisorData,
  leadContext,
  developerProjects = [],
  developerBrandSlug,
  developerBrandName,
  otherProjectsInMarket = [],
  nearbyMarkets = [],
  liveIntelligence,
  microMarketDetail,
  configDistribution = [],
}: ProjectPageRedesignProps) {
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number>(0);
  const [showAllUpdates, setShowAllUpdates] = useState(false);

  const ap = advisorData?.project ?? null;
  const configs = advisorData?.configurations ?? [];
  const market = advisorData?.market ?? null;

  const developer = project.developer ?? null;
  const microMarket = project.micro_market ?? null;

  const projectName = project.project_name ?? "";
  const developerName = developer?.developer_name ?? project.developer_name ?? (project as unknown as Record<string, unknown>).display_developer_name as string | null ?? "";

  // Resolve prices — project-specific PSF takes priority over wide corridor range
  // ap.current_price_per_sqft is project-specific (e.g. ₹10,000–10,500 all-in for this project)
  // microMarket.price_per_sqft is corridor-wide (e.g. ₹8,800–13,500 across all projects in Tellapur)
  const psfMin = ap?.current_price_per_sqft_min ?? microMarket?.price_per_sqft_min ?? null;
  const psfMax = ap?.current_price_per_sqft_max ?? microMarket?.price_per_sqft_max ?? null;
  const psfDisplay = formatPsf(psfMin, psfMax);
  // Corridor PSF for context display (always the microMarket range)
  const corridorPsfDisplay = formatPsf(microMarket?.price_per_sqft_min ?? null, microMarket?.price_per_sqft_max ?? null);

  // Metric bar — Price (V2: project.price_display_string || project.price_range_text)
  const configPriceMin = configs.length > 0 ? Math.min(...configs.filter(c => c.price_min_cr != null).map(c => c.price_min_cr!)) : null;
  const configPriceMax = configs.length > 0 ? Math.max(...configs.filter(c => c.price_max_cr != null).map(c => c.price_max_cr!)) : null;
  const metricPrice =
    ((project as unknown as Record<string, unknown>).price_display_string as string | null)
    || project.price_range_text
    || (configPriceMin != null && configPriceMax != null && isFinite(configPriceMin) && isFinite(configPriceMax)
      ? `₹${configPriceMin.toFixed(1)}–${configPriceMax.toFixed(1)} Cr`
      : psfMin != null
        ? `₹${psfMin.toLocaleString("en-IN")}–${(psfMax ?? psfMin).toLocaleString("en-IN")}/sqft`
        : "Contact for details");

  // Metric bar — Possession: advisor first, then RERA table (project.possession_date_text)
  const rawPossessionDate = ap?.possession_date ?? project.possession_date_text ?? null;
  let metricPossession = "TBC";
  if (rawPossessionDate) {
    const posDate = new Date(rawPossessionDate);
    if (!isNaN(posDate.getTime())) {
      metricPossession = posDate < new Date() ? "Ready to Move" : posDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    } else {
      metricPossession = rawPossessionDate;
    }
  }

  // Possession for FAQs (reuse rawPossessionDate)
  const possessionDate = rawPossessionDate;
  const possessionDisplay = formatDate(possessionDate);

  // Units — computed later after reraUnitsAll is available (see below)
  // Land area — computed later with scope-consistency check

  // Metric bar — Configs summary (V2: project.configuration_display first)
  const configTypes = project.configuration_display
    || (configs.length > 0 ? [...new Set(configs.map((c) => c.config_type).filter(Boolean))].join(", ") : "");

  // Hero image
  const rawHeroUrl = project.hero_image_url ?? project.main_image_url ?? null;
  const bucketHeroUrl = (() => {
    const name = project.project_name;
    if (!name) return null;
    const fileName = name
      .trim()
      .split(/\s+/)
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join("_") + "_Hero_Image.jpg";
    return `https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/project-hero-images/${fileName}`;
  })();
  const heroImageUrl = rawHeroUrl
    ? (getHeroImageUrl(rawHeroUrl) ?? rawHeroUrl)
    : bucketHeroUrl;

  // Appreciation from market
  const appreciationPct = market?.appreciation_1yr_pct ?? microMarket?.annual_appreciation_min ?? null;

  // Launch price
  const launchPsf = ap?.launch_price_per_sqft ?? null;

  // Description (V2: project.project_overview_seo is primary)
  const descriptionText: string =
    ((project as unknown as Record<string, unknown>).project_overview_seo as string | null)
    ?? project.description
    ?? (ap?.primary_differentiator ? `This project stands out for ${ap.primary_differentiator}.` : null)
    ?? "";

  // Westside review (V2: project.westside_realty_review)
  const westsideReview = (project as unknown as Record<string, unknown>).westside_realty_review as string | null;

  // Unit size display — project.unit_size_range → RERA carpet areas → min/max_area
  const reraUnitsAll = advisorData?.reraUnits ?? [];
  const reraAreasSqft = reraUnitsAll
    .filter(u => u.carpet_area_sqm > 0)
    .map(u => {
      // carpet_area_sqm stores total area for all units on the floor — divide by total_units for per-unit size
      const perUnitSqm = u.total_units > 1 ? u.carpet_area_sqm / u.total_units : u.carpet_area_sqm;
      return Math.round(perUnitSqm * 10.764);
    })
    // Filter out unreasonable outliers: RERA rows where total_units=1 but carpet_area_sqm
    // is accidentally the floor aggregate produce impossibly large per-unit values.
    // Residential units in India are virtually never above 3,000 sqft carpet.
    .filter(sqft => sqft >= 150 && sqft <= 3000);
  const reraAreaMin = reraAreasSqft.length > 0 ? Math.min(...reraAreasSqft) : null;
  const reraAreaMax = reraAreasSqft.length > 0 ? Math.max(...reraAreasSqft) : null;

  // Config sqft range (SBA from advisor data — manually verified, use for cost estimates)
  const configsWithSqft = configs.filter(c => c.sba_sqft_min != null || c.sba_sqft_max != null);
  const configSqftAll = configsWithSqft.flatMap(c =>
    [c.sba_sqft_min, c.sba_sqft_max].filter((v): v is number => v != null)
  );
  const configSqftMin = configSqftAll.length > 0 ? Math.min(...configSqftAll) : null;
  const configSqftMax = configSqftAll.length > 0 ? Math.max(...configSqftAll) : null;

  // Unit size display — RERA carpet areas take priority (project.min_area/max_area come from a DB view
  // that doesn't always divide correctly by total_units, so RERA-computed values are more reliable)
  const unitSizeDisplay: string =
    ((project as unknown as Record<string, unknown>).unit_size_range as string | null)
    || (reraAreaMin && reraAreaMax
      ? (reraAreaMin === reraAreaMax
        ? `${reraAreaMin.toLocaleString("en-IN")} sqft`
        : `${reraAreaMin.toLocaleString("en-IN")}–${reraAreaMax.toLocaleString("en-IN")} sqft`)
      : project.min_area && project.max_area
        ? (project.min_area === project.max_area
          ? `${fmtArea(project.min_area)} sqft`
          : `${fmtArea(project.min_area)}–${fmtArea(project.max_area)} sqft`)
        : "Contact for details");

  // Total units — sum from rera_units (authoritative per-type counts), fallback to project.total_units
  const reraTotalFromUnits = reraUnitsAll.reduce((s, u) => s + (u.total_units ?? 0), 0);
  const totalUnits = reraTotalFromUnits > 0 ? reraTotalFromUnits : project.total_units ?? null;

  // Land area — only show when advisor scope matches this RERA phase (within 30% tolerance)
  const advisorScopeConsistent = !totalUnits || !ap?.total_units ||
    Math.abs(ap.total_units - totalUnits) / totalUnits <= 0.30;
  const landArea = advisorScopeConsistent ? (ap?.land_area_acres ?? null) : null;

  // Amenities
  const specialAmenities = parseAmenityArray(ap?.special_amenities);
  const sportsAmenities = parseAmenityArray(ap?.sports_amenities);
  const hasAmenities = (ap?.clubhouse_sqft ?? 0) > 0 || specialAmenities.length > 0 || sportsAmenities.length > 0;

  // Status tags
  const statusTags: string[] = [];
  if (ap?.rera_verified || project.rera_id) statusTags.push("RERA Verified");
  const rawStatus = ap?.current_status ?? project.current_status;
  if (rawStatus) statusTags.push(fmtSegment(String(rawStatus)) ?? String(rawStatus));
  if (ap?.project_segment) statusTags.push(fmtSegment(ap.project_segment) ?? ap.project_segment);

  // All-in cost estimate — prefer stored config prices, fall back to PSF × config sqft, then RERA
  const configsWithPrice = configs.filter((c) => c.price_min_cr != null);
  const allInMin = configsWithPrice.length > 0
    ? Math.min(...configsWithPrice.map((c) => c.price_min_cr!))
    : (psfMin != null && configSqftMin != null)
      ? (psfMin * configSqftMin) / 10000000
      : (psfMin != null && reraAreaMin != null)
        ? (psfMin * reraAreaMin) / 10000000
        : null;
  const allInMax = configsWithPrice.length > 0
    ? Math.max(...configsWithPrice.map((c) => c.price_max_cr ?? c.price_min_cr!))
    : (psfMin != null && configSqftMax != null)
      ? ((psfMax ?? psfMin) * configSqftMax) / 10000000
      : (psfMin != null && reraAreaMax != null)
        ? ((psfMax ?? psfMin) * reraAreaMax) / 10000000
        : null;
  const allInMinTotal = allInMin ? allInMin * 1.20 : null;
  const allInMaxTotal = allInMax ? allInMax * 1.22 : null;

  // Location distances
  const distFd = market?.dist_financial_district_km ?? null;
  const distHitec = market?.dist_hitec_city_km ?? null;
  const distAirport = market?.dist_airport_km ?? null;
  const metroStatus = market?.metro_status ?? null;
  // key_roads / orr_exits may be stored as JSON arrays of {name, status, width_meters} objects — serialize to string
  function serializeRoadField(val: unknown): string | null {
    if (!val) return null;
    if (typeof val === "string") return val;
    if (Array.isArray(val)) {
      const parts = val.map((item: unknown) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          return String(obj.name ?? obj.label ?? "");
        }
        return String(item);
      }).filter(Boolean);
      return parts.length > 0 ? parts.join(", ") : null;
    }
    if (typeof val === "object") {
      const obj = val as Record<string, unknown>;
      return String(obj.name ?? obj.label ?? "");
    }
    return String(val);
  }
  const keyRoads = serializeRoadField(market?.key_roads ?? null);
  const orrExits = serializeRoadField(market?.orr_exits ?? null);

  // Handover status — used across multiple sections
  const actualStatus = liveIntelligence?.actual_status ?? null;
  const isHandedOver = actualStatus === "fully_handed_over" || actualStatus === "substantially_complete";

  // Risk / Catalyst lists
  const riskFactors = parseJsonArray(market?.risk_factors ?? null);
  const growthCatalysts = parseJsonArray(market?.growth_catalysts ?? null);

  // Micro market name (used for chips and FAQs)
  const microMarketName = microMarket?.micro_market_name ?? ap?.micro_market ?? "";

  // Advisor CTA chips
  const advisorChips = [
    `What's the price trend in ${microMarketName || "this area"}?`,
    `How does ${projectName} compare to alternatives?`,
    `Is ${projectName} a good investment right now?`,
  ];

  // Build dynamic FAQs from available data
  const faqs: Array<{ question: string; answer: string }> = [];
  {
    const faqDeveloperName = developerName ?? "";

    // FAQ 1 — Price
    const priceMin = configs?.[0]?.price_min_cr;
    const priceMax = configs?.slice(-1)[0]?.price_max_cr;
    const hasPriceData = priceMin != null || psfMin != null;
    if (hasPriceData) {
      let priceAnswer = '';
      if (priceMin != null && priceMax != null) {
        priceAnswer = `${projectName} is priced between ₹${priceMin.toFixed(2)} Cr and ₹${priceMax.toFixed(2)} Cr depending on the configuration. `;
      } else if (psfMin != null) {
        priceAnswer = `${projectName} is priced at ₹${psfMin.toLocaleString('en-IN')}/sqft. `;
      }
      priceAnswer += 'All-in costs including PLC, EDC, IDC, GST, and registration typically add 18–22% to the base price.';
      faqs.push({ question: `What is the price of ${projectName}?`, answer: priceAnswer });
    }

    // FAQ 2 — Possession
    if (possessionDate) {
      const posDate = new Date(possessionDate);
      if (!isNaN(posDate.getTime())) {
        const isPast = posDate < new Date();
        const posAnswer = isPast
          ? `${projectName} is ready to move in. Possession was scheduled for ${posDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}.`
          : `${projectName} is scheduled for possession by ${posDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}. ${project?.rera_id ? 'This date is RERA-registered.' : ''}`;
        faqs.push({ question: `When will ${projectName} be ready for possession?`, answer: posAnswer });
      }
    }

    // FAQ 3 — Units
    if (totalUnits) {
      const reraUnitsForFaq = advisorData?.reraUnits ?? [];
      const totalBooked = reraUnitsForFaq.reduce((s, u) => s + (u.booked_units ?? 0), 0);
      const totalAll = reraUnitsForFaq.reduce((s, u) => s + (u.total_units ?? 0), 0);
      let unitAnswer = `${projectName} has a total of ${totalUnits.toLocaleString('en-IN')} units. `;
      if (totalAll > 0 && totalBooked > 0) {
        const pct = Math.round((totalBooked / totalAll) * 100);
        unitAnswer += `Approximately ${pct}% of units are already booked based on RERA data.`;
      }
      faqs.push({ question: `How many units are available in ${projectName}?`, answer: unitAnswer });
    }

    // FAQ 4 — Configurations
    if (configs.length > 0) {
      const configLines = configs.map(c => {
        let line = c.config_type;
        if (c.sba_sqft_min && c.sba_sqft_max) line += ` (${c.sba_sqft_min.toLocaleString()}–${c.sba_sqft_max.toLocaleString()} sqft)`;
        if (c.price_min_cr && c.price_max_cr) line += ` at ₹${c.price_min_cr.toFixed(2)}–${c.price_max_cr.toFixed(2)} Cr`;
        return line;
      }).join('; ');
      faqs.push({ question: `What configurations are available in ${projectName}?`, answer: `${projectName} offers: ${configLines}.` });
    }

    // FAQ 5 — Developer
    if (faqDeveloperName) {
      const devDesc = stripHtmlAndTruncate(developer?.hero_description, 200);
      let devAnswer = `${projectName} is developed by ${faqDeveloperName}.`;
      if (developer?.years_in_business) devAnswer += ` They have ${developer.years_in_business} years of experience`;
      if (developer?.total_projects) devAnswer += ` and have delivered ${developer.total_projects} projects`;
      devAnswer += '.';
      if (devDesc) devAnswer += ` ${devDesc}`;
      faqs.push({ question: `Who is the developer of ${projectName}?`, answer: devAnswer });
    }

    // FAQ 6 — Location
    if (microMarketName) {
      let locAnswer = `${projectName} is located in ${microMarketName}`;
      if (market?.dist_financial_district_km) locAnswer += `, ${market.dist_financial_district_km} km from Financial District`;
      if (market?.dist_hitec_city_km) locAnswer += `, ${market.dist_hitec_city_km} km from HITEC City`;
      if (market?.dist_airport_km) locAnswer += `, and ${market.dist_airport_km} km from the airport`;
      locAnswer += '.';
      faqs.push({ question: `Where is ${projectName} located?`, answer: locAnswer });
    }

    // FAQ 7 — Amenities
    const hasAmenityDataFaq = ap?.clubhouse_sqft != null || ap?.sports_amenities != null || ap?.special_amenities != null;
    if (hasAmenityDataFaq) {
      let amenAnswer = '';
      if (ap?.clubhouse_sqft) amenAnswer += `${projectName} features a ${ap.clubhouse_sqft.toLocaleString('en-IN')} sq ft clubhouse. `;
      const sports = parseAmenities(ap?.sports_amenities);
      const special = parseAmenities(ap?.special_amenities);
      if (sports.length) amenAnswer += `Sports amenities include ${sports.slice(0, 5).join(', ')}. `;
      if (special.length) amenAnswer += `Signature amenities include ${special.slice(0, 5).join(', ')}.`;
      if (amenAnswer) faqs.push({ question: `What amenities does ${projectName} offer?`, answer: amenAnswer.trim() });
    }

    // FAQ 8 — RERA
    const reraIdFaq = project?.rera_id ?? ap?.rera_id;
    const reraAnswer = reraIdFaq
      ? `Yes, ${projectName} is RERA registered. RERA ID: ${reraIdFaq}.`
      : `RERA registration details for ${projectName} are being verified. Please contact us for the latest status.`;
    faqs.push({ question: `Is ${projectName} RERA registered?`, answer: reraAnswer });

    // FAQ 9 — Investment
    if (ap?.investment_verdict || market?.appreciation_cagr_5yr) {
      let invAnswer = '';
      if (ap?.investment_verdict) invAnswer += ap.investment_verdict + ' ';
      if (market?.appreciation_cagr_5yr) invAnswer += `The ${microMarketName} micro-market has delivered ${market.appreciation_cagr_5yr}% CAGR appreciation over 5 years.`;
      faqs.push({ question: `What is the investment potential of ${projectName}?`, answer: invAnswer.trim() });
    }

    // FAQ 10 — Comparables
    if (otherProjectsInMarket.length > 0) {
      const names = otherProjectsInMarket.slice(0, 3).map((p: any) => p.project_name).filter(Boolean).join(', ');
      faqs.push({
        question: `How does ${projectName} compare to similar projects in ${microMarketName}?`,
        answer: `${projectName} can be compared to other projects in ${microMarketName} such as ${names}. Use our AI Advisor for a detailed comparison based on price, amenities, and investment potential.`
      });
    }
  }

  // Handle lead form submit
  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;
    setSubmitting(true);
    try {
      await submitLead({
        name: formName,
        phone: formPhone,
        type: "PROJECT_INTEREST",
        source_page: typeof window !== "undefined" ? window.location.href : "project_redesign",
        property_type: leadContext?.propertyType ?? null,
        attribution_metadata: leadContext ? {
          project_name: leadContext.projectName,
          source_type: leadContext.sourceType,
          micro_market: leadContext.microMarket,
          city: leadContext.city,
        } : null,
        details: {
          project_name: projectName,
          project_id: project.id,
          notes: `Enquiry for ${projectName}${project.rera_id ? ` (RERA: ${project.rera_id})` : ""}`,
          location_preference: microMarketName || citySlug,
        },
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Outfit:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        .pp-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .pp-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.10); }
        .pp-adv-chip:hover { border-color: rgba(176,141,87,0.6) !important; color: #B08D57 !important; }
        .pp-lead-btn:hover { opacity: 0.88; }
        @media (max-width: 900px) {
          .pp-hero-grid { grid-template-columns: 1fr !important; }
          .pp-price-grid { grid-template-columns: 1fr !important; }
          .pp-story-grid { grid-template-columns: 1fr !important; }
          .pp-location-grid { grid-template-columns: 1fr !important; }
          .pp-market-cards { flex-direction: column !important; }
          .pp-dev-row { flex-direction: column !important; }
        }
        @media (max-width: 600px) {
          .pp-metrics-bar { flex-direction: column !important; }
          .pp-config-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── SECTION 1: HERO ──────────────────────────────────────────────────── */}
      <section style={{ background: C.bg, padding: "60px 24px 40px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          {/* Breadcrumb */}
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, marginBottom: 20, display: "flex", gap: 6, alignItems: "center" }}>
            <Link href="/" style={{ color: C.textMuted, textDecoration: "none" }}>Home</Link>
            <span>/</span>
            <Link href={`/${citySlug}`} style={{ color: C.textMuted, textDecoration: "none", textTransform: "capitalize" }}>{citySlug}</Link>
            {microMarketName && (
              <>
                <span>/</span>
                <span>{microMarketName}</span>
              </>
            )}
            <span>/</span>
            <span style={{ color: C.text }}>{projectName}</span>
          </div>

          <div className="pp-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 40, alignItems: "start" }}>
            {/* Left: project info + image */}
            <div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 600, color: C.text, margin: "0 0 8px" }}>
                {projectName}
              </h1>
              {developerName && (
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0" }}>
                  {developerName}
                </p>
              )}
              {(project.total_towers != null || (project.total_floors != null && project.total_floors > 0)) ? (
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted, margin: "4px 0 16px" }}>
                  {project.total_towers ? `${project.total_towers} Tower${project.total_towers !== 1 ? "s" : ""}` : ""}
                  {project.total_towers && project.total_floors && project.total_floors > 0 ? " · " : ""}
                  {project.total_floors && project.total_floors > 1 ? `G + ${project.total_floors - 1} Floors` : project.total_floors === 1 ? "Ground Only" : ""}
                </p>
              ) : (
                <div style={{ marginBottom: 16 }} />
              )}

              {/* Status tags */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
                {statusTags.filter(Boolean).map((tag, i) => (
                  <span key={i} style={{
                    fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 500,
                    padding: "4px 12px", borderRadius: 20,
                    background: i === 0 ? "rgba(45,106,79,0.1)" : "rgba(176,141,87,0.1)",
                    color: i === 0 ? C.accent : C.gold,
                    border: `1px solid ${i === 0 ? "rgba(45,106,79,0.3)" : "rgba(176,141,87,0.3)"}`,
                  }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Hero image */}
              <div style={{ position: "relative", aspectRatio: "16/9", borderRadius: 12, overflow: "hidden", background: "#E8E4DC" }}>
                {heroImageUrl ? (
                  <Image
                    src={heroImageUrl}
                    alt={projectName}
                    fill
                    style={{ objectFit: "cover" }}
                    priority
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #E8E4DC 0%, #D4CFC5 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: C.textMuted }}>{projectName.charAt(0)}</span>
                  </div>
                )}
                {/* Overlay gradient at bottom */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(to top, rgba(0,0,0,0.35), transparent)", pointerEvents: "none" }} />
              </div>
            </div>

            {/* Right: sticky lead form */}
            <div style={{ position: "sticky", top: 24 }}>
              <div className="pp-lead-form" style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
                {/* Developer */}
                {developerName && (
                  <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>Developer</p>
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 500, color: C.text, margin: 0 }}>{developerBrandName || developerName}</p>
                  </div>
                )}
                {/* RERA ID */}
                {project.rera_id && (
                  <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>RERA ID</p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: C.gold, margin: 0 }}>{project.rera_id}</p>
                  </div>
                )}
                {/* Starting Price */}
                {!!(project.price_range_text || (project as unknown as Record<string, unknown>).price_display_string) && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>Starting Price</p>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: C.text, margin: 0 }}>
                      {((project as unknown as Record<string, unknown>).price_display_string as string | null) || project.price_range_text}
                    </p>
                  </div>
                )}
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: C.text, margin: "0 0 20px" }}>
                  Get Expert Guidance
                </h3>
                {submitted ? (
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.accent, lineHeight: 1.6 }}>
                    Thank you! Our advisor will reach out shortly.
                  </p>
                ) : (
                  <form onSubmit={handleLeadSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Your name"
                      required
                      style={{
                        fontFamily: "'Outfit', sans-serif", fontSize: 14,
                        border: `1px solid ${C.border}`, borderRadius: 8,
                        padding: "12px 16px", width: "100%", boxSizing: "border-box",
                        outline: "none", color: C.text, background: C.bg,
                      }}
                    />
                    <input
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="Phone number"
                      required
                      type="tel"
                      style={{
                        fontFamily: "'Outfit', sans-serif", fontSize: 14,
                        border: `1px solid ${C.border}`, borderRadius: 8,
                        padding: "12px 16px", width: "100%", boxSizing: "border-box",
                        outline: "none", color: C.text, background: C.bg,
                      }}
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="pp-lead-btn"
                      style={{
                        width: "100%", background: C.bgDark, color: "#ffffff",
                        fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 500,
                        borderRadius: 8, padding: 14, border: "none", cursor: "pointer",
                        transition: "opacity 0.2s",
                      }}
                    >
                      {submitting ? "Submitting..." : "Request Callback"}
                    </button>
                  </form>
                )}
                <div style={{ marginTop: 16, textAlign: "center" }}>
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("westside:openAdvisor"));
                      }
                    }}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.gold,
                      textDecoration: "underline", padding: 0,
                    }}
                  >
                    Chat with AI Advisor instead
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: RERA-REGISTERED PROJECT DATA ──────────────────────────── */}
      <section style={{ background: C.bgDark, padding: "40px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
              RERA-Registered Project Data
            </h2>
            {project.rera_id && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 20, padding: "4px 12px", fontSize: 10, fontWeight: 700, fontFamily: "'Outfit', sans-serif", textTransform: "uppercase", letterSpacing: "0.1em", background: "rgba(59,130,246,0.15)", color: "#93c5fd", border: "1px solid rgba(147,197,253,0.25)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#93c5fd", display: "inline-block" }} />
                RERA Verified
              </span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {[
              totalUnits != null ? { label: "Total Units", value: totalUnits.toLocaleString("en-IN") } : null,
              project.total_towers != null ? { label: "Total Towers", value: String(project.total_towers) } : null,
              project.total_floors != null && project.total_floors > 0
                ? { label: "Floors", value: project.total_floors > 1 ? `G + ${project.total_floors - 1}` : "G" }
                : null,
              { label: "Unit Sizes", value: unitSizeDisplay },
              {
                label: "Price",
                value: ((project as unknown as Record<string, unknown>).price_display_string as string | null)
                  || project.price_range_text
                  || "Contact for details",
              },
              project.configuration_display ? { label: "Configurations", value: project.configuration_display } : null,
              { label: "Possession", value: metricPossession },
              { label: "RERA Status", value: project.current_status ?? "Registered" },
            ].filter((c): c is { label: string; value: string } => c != null).map(({ label, value }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>{label}</p>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 15, color: "#ffffff", margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: PRICE INTELLIGENCE ───────────────────────────────────── */}
      <section style={{ background: C.bgWarm, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <SectionHeading title="Price Intelligence" sub={microMarket?.micro_market_name ? `Based on ${microMarket.micro_market_name} corridor data` : "What you actually pay"} />
          <div className="pp-price-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 40 }}>
            {/* Left: psf display */}
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 600, color: C.gold, lineHeight: 1.1, marginBottom: 8 }}>
                {psfDisplay ? `${psfDisplay}/sqft` : "Price on request"}
              </div>
              {microMarket?.micro_market_name && (
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, marginBottom: corridorPsfDisplay && corridorPsfDisplay !== psfDisplay ? 4 : 12 }}>
                  {microMarket.micro_market_name} corridor
                </div>
              )}
              {/* Show corridor range as context when project PSF differs from corridor PSF */}
              {corridorPsfDisplay && corridorPsfDisplay !== psfDisplay && (
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, marginBottom: 12, opacity: 0.7 }}>
                  Corridor range: {corridorPsfDisplay}/sqft
                </div>
              )}
              {appreciationPct != null && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "4px 12px", borderRadius: 20,
                  background: "rgba(45,106,79,0.1)", color: C.accent,
                  fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 500,
                  marginBottom: 12,
                }}>
                  +{appreciationPct}%+ p.a. appreciation
                </div>
              )}
              {/* Estimated unit cost — uses config SBA sqft (advisor-verified) > RERA carpet > project areas */}
              {psfMin != null && (configSqftMin != null || reraAreaMin != null || (project.min_area && project.max_area)) && (() => {
                // Config SBA sqft is the most reliable source (manually entered by advisor team)
                // RERA carpet areas have outlier rows; project areas come from a buggy DB view
                const aMin = configSqftMin ?? reraAreaMin ?? project.min_area!;
                const aMax = configSqftMax ?? reraAreaMax ?? project.max_area!;
                const avgSqft = (aMin + aMax) / 2;
                const psfMaxVal = psfMax ?? psfMin;
                const sqftLabel = configSqftMin != null ? "sqft (SBA)" : "sqft (carpet)";
                return (
                  <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", marginTop: 8 }}>
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Estimated Unit Cost</p>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: C.text, margin: 0 }}>
                      {fmtLakhCrore(psfMin * avgSqft / 100000)} – {fmtLakhCrore(psfMaxVal * avgSqft / 100000)}
                    </p>
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                      avg unit {Math.round(avgSqft).toLocaleString("en-IN")} {sqftLabel}
                    </p>
                  </div>
                );
              })()}
              {launchPsf && (
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted, marginTop: 8 }}>
                  Launch price: ₹{launchPsf.toLocaleString("en-IN")}/sqft
                </div>
              )}
            </div>

            {/* Center: by configuration */}
            <div>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>By Configuration</p>
              {configs.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {configs.map((cfg: AdvisorConfig, i: number) => {
                    // Compute estimated price from corridor PSF × avg config sqft when stored price is absent
                    const hasPriceData = cfg.price_min_cr != null || cfg.price_per_sqft != null;
                    const avgSqft = cfg.sba_sqft_min != null && cfg.sba_sqft_max != null
                      ? (cfg.sba_sqft_min + cfg.sba_sqft_max) / 2
                      : cfg.sba_sqft_min ?? cfg.sba_sqft_max ?? null;
                    const computedPriceDisplay: string | null = (!hasPriceData && avgSqft != null && psfMin != null)
                      ? (() => {
                          const minCr = (psfMin * avgSqft) / 10000000;
                          const maxCr = ((psfMax ?? psfMin) * avgSqft) / 10000000;
                          return `~₹${minCr.toFixed(2)}${maxCr !== minCr ? `–${maxCr.toFixed(2)}` : ""} Cr`;
                        })()
                      : null;
                    const priceLabel = cfg.price_min_cr != null
                      ? `₹${cfg.price_min_cr.toFixed(2)}${cfg.price_max_cr && cfg.price_max_cr !== cfg.price_min_cr ? `–${cfg.price_max_cr.toFixed(2)}` : ""} Cr`
                      : cfg.price_per_sqft != null
                      ? `₹${cfg.price_per_sqft.toLocaleString("en-IN")}/sqft`
                      : computedPriceDisplay ?? "On request";
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted }}>
                          {cfg.config_type}{cfg.config_subtype ? ` (${cfg.config_subtype})` : ""}
                          {cfg.sba_sqft_min != null && (
                            <span style={{ display: "block", fontSize: 11, color: C.textMuted, opacity: 0.7 }}>
                              {cfg.sba_sqft_min.toLocaleString("en-IN")}{cfg.sba_sqft_max && cfg.sba_sqft_max !== cfg.sba_sqft_min ? `–${cfg.sba_sqft_max.toLocaleString("en-IN")}` : ""} sqft
                            </span>
                          )}
                        </span>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: C.gold, fontWeight: 600, textAlign: "right" }}>
                          {priceLabel}
                          {computedPriceDisplay && !hasPriceData && (
                            <span style={{ display: "block", fontFamily: "'Outfit', sans-serif", fontSize: 10, color: C.textMuted, fontWeight: 400 }}>corridor est.</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (configDistribution?.length ?? 0) > 0 ? (
                <div>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.text, margin: "0 0 8px" }}>
                    {configDistribution!.map(c => c.unit_category).filter(Boolean).join(", ")} available
                  </p>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted, margin: "0 0 16px" }}>
                    {configDistribution!.length} configuration type{configDistribution!.length !== 1 ? "s" : ""} · Contact for current pricing
                  </p>
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("westside:openAdvisor", {
                          detail: { message: `What is the current pricing for ${project?.project_name ?? "this project"}?`, projectSlug: project?.url_slug },
                        }));
                      }
                    }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.gold, padding: 0 }}
                  >
                    Request detailed pricing →
                  </button>
                </div>
              ) : (
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted, fontStyle: "italic" }}>Pricing available on request</p>
              )}
            </div>

            {/* Right: all-in cost estimate */}
            <div>
              <div style={{ background: C.bgCard, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24 }}>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>All-in Cost Estimate</p>
                {allInMinTotal && allInMaxTotal ? (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted }}>
                        Base: ₹{allInMin!.toFixed(2)}–{allInMax!.toFixed(2)} Cr (by config)
                      </div>
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted }}>
                        + 20–22% (stamp duty, GST, corpus, PLC)
                      </div>
                      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 4 }}>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: C.gold, fontWeight: 600 }}>
                          ₹{allInMinTotal.toFixed(2)} – ₹{allInMaxTotal.toFixed(2)} Cr all-in
                        </div>
                      </div>
                    </div>
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, marginTop: 12, lineHeight: 1.6 }}>
                      ≈ ₹{psfMin?.toLocaleString("en-IN")}–{psfMax?.toLocaleString("en-IN")}/sqft all-inclusive. Consult advisor for floor-wise pricing.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.textMuted, lineHeight: 1.6, margin: "0 0 16px" }}>
                      Our advisors can get you the current price sheet, payment plan, and all-inclusive cost breakdown.
                    </p>
                    <button
                      onClick={() => {
                        document.querySelector(".pp-lead-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      style={{
                        width: "100%", padding: "12px", borderRadius: 8,
                        background: C.bgDark, color: "#fff",
                        fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 500,
                        border: "none", cursor: "pointer",
                      }}
                    >
                      Get Price Details
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3b: LIVE MARKET INTELLIGENCE ────────────────────────────── */}
      {liveIntelligence != null && (
        <section style={{ background: C.bg, padding: "64px 0" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            {/* Heading row with freshness badge */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 32 }}>
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 600, color: C.text, margin: 0, lineHeight: 1.15 }}>
                  Live Market Intelligence
                </h2>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.textMuted, marginTop: 6, marginBottom: 0 }}>
                  Real-time data from the market
                </p>
              </div>
              {/* Freshness badge */}
              {(liveIntelligence.scraped_at || liveIntelligence.enriched_at) && (() => {
                const dateStr = liveIntelligence.enriched_at ?? liveIntelligence.scraped_at;
                const days = dateStr ? Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000) : null;
                return days != null ? (
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 12px", whiteSpace: "nowrap" }}>
                    Updated {days === 0 ? "today" : `${days}d ago`}
                  </span>
                ) : null;
              })()}
            </div>

            {/* Top stat cards row */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
              {/* Card 1 — Developer Price */}
              {(liveIntelligence.developer_price_min != null || liveIntelligence.developer_price_max != null) && (
                <div style={{ flex: "1 1 200px", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Developer Asking Price</p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: C.gold, margin: "0 0 4px" }}>
                    ₹{liveIntelligence.developer_price_min?.toLocaleString("en-IN") ?? "—"}
                    {liveIntelligence.developer_price_max && liveIntelligence.developer_price_max !== liveIntelligence.developer_price_min
                      ? `–${liveIntelligence.developer_price_max.toLocaleString("en-IN")}`
                      : ""}/sqft
                  </p>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, margin: 0 }}>Direct from developer</p>
                </div>
              )}

              {/* Card 2 — Resale Price */}
              {(liveIntelligence.resale_price_min != null || liveIntelligence.resale_price_max != null) && (
                <div style={{ flex: "1 1 200px", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Resale Market</p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: C.text, margin: "0 0 4px" }}>
                    ₹{liveIntelligence.resale_price_min?.toLocaleString("en-IN") ?? "—"}
                    {liveIntelligence.resale_price_max && liveIntelligence.resale_price_max !== liveIntelligence.resale_price_min
                      ? `–${liveIntelligence.resale_price_max.toLocaleString("en-IN")}`
                      : ""}/sqft
                  </p>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, margin: 0 }}>Secondary market transactions</p>
                </div>
              )}

              {/* Card 3 — Price Trend */}
              {liveIntelligence.price_trend != null && (
                <div style={{ flex: "1 1 200px", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Price Trend</p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, margin: "0 0 4px",
                    color: liveIntelligence.price_trend === "rising" ? C.accent : liveIntelligence.price_trend === "falling" || liveIntelligence.price_trend === "declining" ? "#E74C3C" : C.gold }}>
                    {liveIntelligence.price_trend === "rising" ? "↑ Rising" : liveIntelligence.price_trend === "falling" || liveIntelligence.price_trend === "declining" ? "↓ Softening" : "→ Stable"}
                  </p>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, margin: 0 }}>Based on recent transactions</p>
                </div>
              )}
            </div>

            {/* Construction progress */}
            {liveIntelligence.towers_completed != null && liveIntelligence.towers_total != null && liveIntelligence.towers_total > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Construction Progress</p>
                <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden", maxWidth: 480 }}>
                  <div style={{ height: "100%", width: `${Math.round((liveIntelligence.towers_completed / liveIntelligence.towers_total) * 100)}%`, background: C.accent, borderRadius: 3 }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted, margin: 0 }}>
                    {liveIntelligence.towers_completed} of {liveIntelligence.towers_total} towers at advanced stage
                  </p>
                  {/* Sentiment badge inline with construction */}
                  {liveIntelligence.forum_sentiment && (
                    <span style={{
                      fontFamily: "'Outfit', sans-serif", fontSize: 12, borderRadius: 20, padding: "3px 12px",
                      background: liveIntelligence.forum_sentiment === "positive" ? `${C.accent}18`
                        : liveIntelligence.forum_sentiment === "negative" ? "#E74C3C18"
                        : `${C.gold}18`,
                      color: liveIntelligence.forum_sentiment === "positive" ? C.accent
                        : liveIntelligence.forum_sentiment === "negative" ? "#E74C3C"
                        : C.gold,
                      border: `1px solid ${liveIntelligence.forum_sentiment === "positive" ? C.accent : liveIntelligence.forum_sentiment === "negative" ? "#E74C3C" : C.gold}33`,
                    }}>
                      Buyer Sentiment: {liveIntelligence.forum_sentiment.charAt(0).toUpperCase() + liveIntelligence.forum_sentiment.slice(1)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Sentiment badge standalone (if no construction progress) */}
            {liveIntelligence.forum_sentiment != null && (liveIntelligence.towers_completed == null || liveIntelligence.towers_total == null) && (
              <div style={{ marginBottom: 24 }}>
                <span style={{
                  fontFamily: "'Outfit', sans-serif", fontSize: 12, borderRadius: 20, padding: "4px 14px", display: "inline-flex",
                  background: liveIntelligence.forum_sentiment === "positive" ? `${C.accent}18` : liveIntelligence.forum_sentiment === "negative" ? "#E74C3C18" : `${C.gold}18`,
                  color: liveIntelligence.forum_sentiment === "positive" ? C.accent : liveIntelligence.forum_sentiment === "negative" ? "#E74C3C" : C.gold,
                  border: `1px solid ${liveIntelligence.forum_sentiment === "positive" ? C.accent : liveIntelligence.forum_sentiment === "negative" ? "#E74C3C" : C.gold}33`,
                }}>
                  Buyer Sentiment: {liveIntelligence.forum_sentiment.charAt(0).toUpperCase() + liveIntelligence.forum_sentiment.slice(1)}
                </span>
              </div>
            )}

            {/* Key Updates */}
            {(liveIntelligence.key_updates?.length ?? 0) > 0 && (
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Key Updates</p>
                <div style={{ borderLeft: `2px solid ${C.border}`, paddingLeft: 16 }}>
                  {(showAllUpdates ? liveIntelligence.key_updates! : liveIntelligence.key_updates!.slice(0, 4)).map((update, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                      <span style={{ color: C.gold, flexShrink: 0, fontSize: 12, marginTop: 2 }}>◆</span>
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.text, lineHeight: 1.6, margin: 0 }}>{update}</p>
                    </div>
                  ))}
                  {(liveIntelligence.key_updates?.length ?? 0) > 4 && (
                    <button
                      onClick={() => setShowAllUpdates(v => !v)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.gold, padding: "4px 0" }}
                    >
                      {showAllUpdates ? "Show less ↑" : `Show ${liveIntelligence.key_updates!.length - 4} more ↓`}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Buyer Concerns */}
            {(liveIntelligence.buyer_concerns?.length ?? 0) > 0 && (
              <div>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Common Buyer Questions</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {liveIntelligence.buyer_concerns!.slice(0, 6).map((concern, i) => (
                    <button
                      key={i}
                      className="pp-adv-chip"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(new CustomEvent("westside:openAdvisor", {
                            detail: { message: concern, projectSlug: project?.url_slug },
                          }));
                        }
                      }}
                      style={{
                        fontFamily: "'Outfit', sans-serif", fontSize: 13, padding: "8px 16px",
                        borderRadius: 20, border: `1px solid ${C.border}`, background: C.bgWarm,
                        cursor: "pointer", color: C.text,
                      }}
                    >
                      {concern}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── SECTION 4: CONFIGURATIONS ────────────────────────────────────────── */}
      {(() => {
        // configDistribution is the baseline (same as V2), advisor configs are enhancement
        const validDist = (configDistribution ?? []).filter(
          r => r.unit_category !== "Other" && (r.total_units ?? 0) > 0
        );
        const hasDistData = validDist.length > 0;
        const hasAdvisorConfigs = configs.length > 0;
        if (!hasDistData && !hasAdvisorConfigs) return null;

        return (
          <section style={{ background: C.bg, padding: "80px 24px" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
              <SectionHeading title="Configurations & Unit Mix" />

              {hasDistData ? (
                /* V2-style: configDistribution rows with horizontal bars + advisor price if available */
                (() => {
                  // Sanity check: if configDistribution total_units sum >> project.total_units,
                  // the view is aggregating multiple RERA registrations — show % only, hide raw counts
                  const distTotalUnits = validDist.reduce((s, r) => s + (r.total_units ?? 0), 0);
                  const showUnitCounts = !totalUnits || distTotalUnits <= totalUnits * 1.15;
                  return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }} className="pp-story-grid">
                  {/* Left: bar chart rows */}
                  <div>
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 20px" }}>Unit Mix (RERA data)</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {validDist.map((row, i) => {
                        const label = row.unit_category || "—";
                        const pct = row.config_percent != null ? Math.round(row.config_percent) : 0;
                        const count = row.total_units ?? 0;
                        // Find advisor price for this config type
                        const advisorMatch = configs.find(c =>
                          (c.config_type || "").toLowerCase().includes((label || "").toLowerCase().replace(" bhk", "").trim()) ||
                          (label || "").toLowerCase().includes((c.config_type || "").toLowerCase().replace(" bhk", "").trim())
                        );
                        return (
                          <div key={i}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 500, color: C.text, width: 72, flexShrink: 0 }}>{label}</span>
                              <div style={{ flex: 1, height: 10, borderRadius: 5, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: C.accent, borderRadius: 5 }} />
                              </div>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: C.textMuted, width: 36, textAlign: "right", flexShrink: 0 }}>{pct}%</span>
                              {showUnitCounts && count > 0 && (
                                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, width: 80, textAlign: "right", flexShrink: 0 }}>{count.toLocaleString()} units</span>
                              )}
                            </div>
                            {advisorMatch && (advisorMatch.price_min_cr != null || advisorMatch.sba_sqft_min != null) && (
                              <div style={{ marginLeft: 84, fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.gold }}>
                                {advisorMatch.price_min_cr != null
                                  ? `₹${advisorMatch.price_min_cr.toFixed(2)}${advisorMatch.price_max_cr && advisorMatch.price_max_cr !== advisorMatch.price_min_cr ? `–${advisorMatch.price_max_cr.toFixed(2)}` : ""} Cr`
                                  : ""}
                                {advisorMatch.sba_sqft_min != null
                                  ? ` · ${advisorMatch.sba_sqft_min.toLocaleString()}${advisorMatch.sba_sqft_max && advisorMatch.sba_sqft_max !== advisorMatch.sba_sqft_min ? `–${advisorMatch.sba_sqft_max.toLocaleString()}` : ""} sqft`
                                  : ""}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {validDist[0] && (
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, marginTop: 16, fontStyle: "italic" }}>
                        Dominant: {validDist[0].unit_category} — {(validDist[0].unit_category || "").includes("3") ? "family end-users" : "young professionals"}
                      </p>
                    )}
                  </div>
                  {/* Right: advisor config cards (if available) */}
                  {hasAdvisorConfigs ? (
                    <div>
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 20px" }}>Advisor Pricing Details</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {configs.map((cfg: AdvisorConfig, i: number) => (
                          <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 500, color: C.text }}>
                                {cfg.config_type}{cfg.config_subtype ? ` (${cfg.config_subtype})` : ""}
                              </span>
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: C.gold, fontWeight: 600 }}>
                                {cfg.price_min_cr != null
                                  ? `₹${cfg.price_min_cr.toFixed(2)}${cfg.price_max_cr && cfg.price_max_cr !== cfg.price_min_cr ? `–${cfg.price_max_cr.toFixed(2)}` : ""} Cr`
                                  : cfg.price_per_sqft != null
                                  ? `₹${cfg.price_per_sqft.toLocaleString("en-IN")}/sqft`
                                  : "On request"}
                              </span>
                            </div>
                            {(cfg.sba_sqft_min != null || cfg.sba_sqft_max != null) && (
                              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                                {[cfg.sba_sqft_min, cfg.sba_sqft_max].filter(Boolean).map(v => v!.toLocaleString("en-IN")).join("–")} sqft
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.textMuted, lineHeight: 1.6, margin: "0 0 16px" }}>
                        Get detailed pricing, floor plans and availability from our project advisors.
                      </p>
                      <button
                        onClick={() => document.querySelector(".pp-lead-form")?.scrollIntoView({ behavior: "smooth", block: "center" })}
                        style={{ background: C.bgDark, color: "#fff", fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 500, borderRadius: 8, padding: "12px 20px", border: "none", cursor: "pointer", width: "fit-content" }}
                      >
                        Request Price Sheet →
                      </button>
                    </div>
                  )}
                </div>
                  );
                })()
              ) : (
                /* Advisor-only configs (fallback when no configDistribution) */
                <div className="pp-config-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                  {configs.map((cfg: AdvisorConfig, i: number) => {
                    const hasSizes = cfg.sba_sqft_min != null || cfg.sba_sqft_max != null;
                    const sizeDisplay = hasSizes
                      ? [cfg.sba_sqft_min, cfg.sba_sqft_max].filter(Boolean).map((v) => v!.toLocaleString("en-IN")).join("–") + " sqft"
                      : null;
                    const priceDisplay =
                      cfg.price_min_cr != null && cfg.price_max_cr != null
                        ? `${formatCr(cfg.price_min_cr)} – ${formatCr(cfg.price_max_cr)}`
                        : cfg.price_min_cr != null ? `From ${formatCr(cfg.price_min_cr)}` : null;
                    return (
                      <div key={i} className="pp-card" style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 4 }}>{cfg.config_type}</div>
                        {cfg.config_subtype && <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, marginBottom: 8 }}>{cfg.config_subtype}</div>}
                        {sizeDisplay && <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.textMuted, marginBottom: 8 }}>{sizeDisplay}</div>}
                        {priceDisplay && <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: C.gold, fontWeight: 600, marginBottom: 8 }}>{priceDisplay}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* ── SECTION 5: PROJECT STORY ─────────────────────────────────────────── */}
      <section style={{ background: C.bgWarm, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <SectionHeading title="About This Project" />
          <div className="pp-story-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 48 }}>
            {/* Left: description + Westside View */}
            <div>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, lineHeight: 1.8, color: C.textMuted, margin: 0 }}>
                {descriptionText || `${projectName} is a residential project${microMarketName ? ` located in ${microMarketName}` : ""}${developerName ? ` by ${developerName}` : ""}.`}
              </p>
              {/* Westside View — project.westside_realty_review (same as V2) */}
              {westsideReview && (
                <div style={{ background: "#FFFFFF", borderLeft: `4px solid ${C.gold}`, borderRadius: "0 8px 8px 0", padding: "16px 20px", marginTop: 24 }}>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: C.gold, margin: "0 0 8px" }}>WESTSIDE VIEW</p>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, color: C.text, lineHeight: 1.7, margin: 0 }}>{westsideReview}</p>
                </div>
              )}
            </div>

            {/* Right: insight cards — Primary Differentiator is in Expert Analysis; avoid duplication */}
            <div>
              {[
                { label: "Ideal For", value: ap?.target_buyer_segment },
                { label: "Investment Verdict", value: ap?.investment_verdict },
                { label: "Project Segment", value: fmtSegment(ap?.project_segment) },
                { label: "RERA Status", value: project.rera_id ? "RERA Registered" : null },
              ]
                .filter((card) => card.value)
                .map((card, i) => (
                  <div
                    key={i}
                    style={{
                      background: C.bgCard,
                      borderLeft: `4px solid ${C.gold}`,
                      borderRadius: "0 8px 8px 0",
                      padding: "16px 20px",
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMuted, marginBottom: 6 }}>
                      {card.label}
                    </div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, color: C.text, lineHeight: 1.5 }}>
                      {card.value}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5b: WESTSIDE EXPERT ANALYSIS ────────────────────────────── */}
      {(() => {
        const apEx = advisorData?.project;
        const amEx = advisorData?.market;
        const hasProjectAdvisor = apEx && (apEx.primary_differentiator || apEx.target_buyer_segment || apEx.investment_verdict || apEx.project_segment);
        const hasMarketAdvisor = amEx && (amEx.outlook_bull_case || amEx.outlook_base_case || amEx.outlook_bear_case);

        // Fallback signals from insights + liveIntelligence when advisor row is a null-shell
        const statusLabels: Record<string, string> = {
          under_construction: "Under Construction",
          partial_handover: "Partial Handover",
          substantially_complete: "Substantially Complete",
          fully_handed_over: "Fully Handed Over",
        };
        // Replace developer brand name with project name in AI-generated text (prevents "Prestige Group has X towers")
        const devBrandToReplace = developerBrandName || developer?.developer_name || project.developer_name || "";
        function contextualizeInsightText(text: string): string {
          if (!devBrandToReplace || !text) return text;
          return text.replace(new RegExp(devBrandToReplace.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), projectName);
        }

        const insightsCards = [
          insights?.stageOfDevelopment
            ? { label: "Project Stage", value: (insights.stageOfDevelopment as string).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) }
            : null,
          insights?.idealBuyers?.length
            ? { label: "Ideal For", value: (insights.idealBuyers as string[]).slice(0, 2).join(" · ") }
            : null,
          actualStatus
            ? { label: "Current Status", value: statusLabels[actualStatus] ?? actualStatus }
            : null,
          insights?.riskUpside?.upside?.[0]
            ? { label: "Key Upside", value: contextualizeInsightText(insights.riskUpside.upside[0] as string) }
            : null,
        ].filter((c): c is { label: string; value: string } => c !== null);

        const hasInsightsFallback = insightsCards.length > 0 || (insights?.riskUpside?.risks?.length ?? 0) > 0 || microMarket?.hero_hook;

        return (
          <section style={{ background: C.bg, padding: "64px 0" }}>
            <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
              <SectionHeading title="Westside Expert Analysis" sub="Our advisors' assessment of this project" />

              {(hasProjectAdvisor || hasMarketAdvisor) ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }} className="pp-story-grid">
                  {/* Left — Advisor Project Assessment */}
                  {hasProjectAdvisor && (
                    <div style={{ background: C.bgCard, borderLeft: `4px solid ${C.gold}`, borderRadius: "0 8px 8px 0", overflow: "hidden" }}>
                      {[
                        { label: "Primary Differentiator", value: apEx?.primary_differentiator },
                        { label: "Best Suited For", value: apEx?.target_buyer_segment },
                        { label: "Investment Verdict", value: apEx?.investment_verdict },
                        { label: "Project Segment", value: fmtSegment(apEx?.project_segment) },
                      ].filter(item => item.value).map((item, i, arr) => (
                        <div key={i} style={{ padding: "16px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : undefined }}>
                          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>{item.label}</p>
                          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, color: C.text, lineHeight: 1.5, margin: 0 }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Right — Advisor CTA */}
                  <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28 }}>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: C.text, margin: "0 0 8px" }}>
                      Have questions about {projectName}?
                    </p>
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted, lineHeight: 1.6, margin: "0 0 16px" }}>
                      Our advisors have walked this corridor. Get an honest, no-obligation assessment.
                    </p>
                    <button
                      onClick={() => {
                        if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("westside:openAdvisor", { detail: { message: `Tell me about ${projectName}`, projectSlug: project.url_slug } }));
                      }}
                      style={{ background: C.accent, border: "none", cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "#ffffff", padding: "10px 20px", borderRadius: 8, fontWeight: 600 }}
                    >
                      Ask our advisor →
                    </button>
                  </div>
                </div>
              ) : hasInsightsFallback ? (
                /* Fallback: synthesise from insights + liveIntelligence when advisor row is a null shell */
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }} className="pp-story-grid">
                  {/* Left — project signals */}
                  {insightsCards.length > 0 && (
                    <div style={{ background: C.bgCard, borderLeft: `4px solid ${C.gold}`, borderRadius: "0 8px 8px 0", overflow: "hidden" }}>
                      {insightsCards.map((item, i, arr) => (
                        <div key={i} style={{ padding: "16px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : undefined }}>
                          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>{item.label}</p>
                          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, color: C.text, lineHeight: 1.5, margin: 0 }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Right — risks + corridor context */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* Status note when analysis may be stale relative to current project stage */}
                    {isHandedOver && (insights?.riskUpside?.risks?.length ?? 0) > 0 && (
                      <div style={{ background: "rgba(45,106,79,0.06)", border: `1px solid rgba(45,106,79,0.2)`, borderRadius: 8, padding: "10px 14px" }}>
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.accent, margin: 0, lineHeight: 1.5 }}>
                          ✓ Project is {statusLabels[actualStatus!] ?? actualStatus} — pre-handover risks below may no longer apply.
                        </p>
                      </div>
                    )}
                    {(insights?.riskUpside?.risks as string[] | undefined)?.slice(0, 2).map((risk, i) => (
                      <div key={i} style={{ background: C.bgCard, borderLeft: "4px solid #E74C3C", borderRadius: "0 8px 8px 0", padding: "14px 18px" }}>
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: "#E74C3C", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>
                          {isHandedOver ? "Pre-Handover Risk (Historic)" : "Risk Factor"}
                        </p>
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: isHandedOver ? C.textMuted : C.text, lineHeight: 1.6, margin: 0 }}>
                          {contextualizeInsightText(risk)}
                        </p>
                      </div>
                    ))}
                    {microMarket?.hero_hook && (
                      <div style={{ background: C.bgCard, borderLeft: `4px solid ${C.accent}`, borderRadius: "0 8px 8px 0", padding: "14px 18px" }}>
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: C.accent, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Corridor Context</p>
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.text, lineHeight: 1.6, margin: 0 }}>
                          {stripHtmlAndTruncate(microMarket.hero_hook, 200)}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("westside:openAdvisor", { detail: { message: `Is ${projectName} a good investment? What are the risks?`, projectSlug: project.url_slug } }));
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.gold, padding: "4px 0", textAlign: "left" }}
                    >
                      Ask our advisor for a deeper analysis →
                    </button>
                  </div>
                </div>
              ) : (
                /* Truly no data — minimal CTA */
                <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: "32px 28px", maxWidth: 480 }}>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.textMuted, lineHeight: 1.7, margin: "0 0 16px" }}>
                    Our research team is enriching this project. Ask our AI advisor for instant insights.
                  </p>
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("westside:openAdvisor", { detail: { message: `Tell me about ${projectName} — is it a good investment?`, projectSlug: project.url_slug } }));
                    }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.gold, padding: 0 }}
                  >
                    Get expert guidance now →
                  </button>
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* ── SECTION 5c: 5-YEAR OUTLOOK ──────────────────────────────────────── */}
      {microMarket?.annual_appreciation_min != null && (
        <section style={{ background: C.bgDark, padding: "64px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 600, color: "#ffffff", margin: 0 }}>
                5-Year Outlook
              </h2>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 20, padding: "4px 12px", fontSize: 10, fontWeight: 700, fontFamily: "'Outfit', sans-serif", textTransform: "uppercase", letterSpacing: "0.1em", background: "rgba(139,92,246,0.15)", color: "#c4b5fd", border: "1px solid rgba(196,181,253,0.25)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#c4b5fd", display: "inline-block" }} />
                AI Projection
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }} className="pp-config-grid">
              {[
                {
                  label: "5-Year Appreciation",
                  value: `${Math.min(Math.round(microMarket.annual_appreciation_min! * 5), 35)}%–${Math.min(Math.round(microMarket.annual_appreciation_min! * 1.3 * 5), 40)}%`,
                  sub: "Estimated range",
                },
                {
                  label: "Annual CAGR",
                  value: `${microMarket.annual_appreciation_min}%–${Math.round(microMarket.annual_appreciation_min! * 1.3)}%`,
                  sub: "Corridor average",
                },
                {
                  label: "Rental Yield",
                  value: "3.5–4.5%",
                  sub: "AI estimate · verify locally",
                },
              ].map(({ label, value, sub }) => (
                <div key={label} style={{ borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>{label}</p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: "#ffffff", margin: "0 0 4px" }}>{value}</p>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>{sub}</p>
                </div>
              ))}
            </div>
            {/* Bull / Bear cases — prefer market outlook data, fall back to insights only if not handed over */}
            {(() => {
              const bullText = market?.outlook_bull_case || (!isHandedOver ? insights?.riskUpside?.upside?.[0] : null);
              const bearText = market?.outlook_bear_case || (!isHandedOver ? insights?.riskUpside?.risks?.[0] : null);
              if (!bullText && !bearText) return null;
              return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="pp-story-grid">
                  {bullText && (
                    <div style={{ borderRadius: 14, padding: 20, border: "1px solid rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.07)" }}>
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, margin: "0 0 6px" }}>Bull Case</p>
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>{bullText as string}</p>
                    </div>
                  )}
                  {bearText && (
                    <div style={{ borderRadius: 14, padding: 20, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.07)" }}>
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, margin: "0 0 6px" }}>Bear Case</p>
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>{bearText as string}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ── SECTION 6: AMENITIES ─────────────────────────────────────────────── */}
      {hasAmenities && (
        <section style={{ background: C.bg, padding: "80px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <SectionHeading title="Amenities & Lifestyle" />

            {ap?.clubhouse_sqft != null && ap.clubhouse_sqft > 0 && (
              <div style={{ marginBottom: 40 }}>
                <MetricPill
                  label="sq ft Clubhouse"
                  value={ap.clubhouse_sqft.toLocaleString("en-IN")}
                  color={C.gold}
                />
              </div>
            )}

            {sportsAmenities.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMuted, marginBottom: 12 }}>
                  Sports & Recreation
                </div>
                <div>
                  {sportsAmenities.map((amenity, i) => (
                    <span
                      key={i}
                      style={{
                        fontFamily: "'Outfit', sans-serif", fontSize: 13,
                        background: C.bgWarm, border: `1px solid ${C.border}`,
                        borderRadius: 20, padding: "8px 16px",
                        display: "inline-block", marginRight: 8, marginBottom: 8,
                      }}
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {specialAmenities.length > 0 && (
              <div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMuted, marginBottom: 12 }}>
                  Signature Amenities
                </div>
                <div>
                  {specialAmenities.map((amenity, i) => (
                    <span
                      key={i}
                      style={{
                        fontFamily: "'Outfit', sans-serif", fontSize: 13,
                        background: C.bgWarm, border: `1px solid ${C.border}`,
                        borderRadius: 20, padding: "8px 16px",
                        display: "inline-block", marginRight: 8, marginBottom: 8,
                      }}
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── SECTION 7: LOCATION ──────────────────────────────────────────────── */}
      {(microMarketName || advisorData?.market) && (
        <section style={{ background: C.bgWarm, padding: "80px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <SectionHeading title="Location & Connectivity" sub="Distances, connectivity, and neighbourhood context" />

            {/* Google Map */}
            {project?.latitude != null && project?.longitude != null && (
              <div style={{ marginBottom: 32 }}>
                <iframe
                  src={(() => {
                    const gmKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
                    const gmUrl = (project as unknown as Record<string, unknown>).google_maps_embed_url as string | null | undefined;
                    const lat = project.latitude!;
                    const lng = project.longitude!;
                    return gmKey
                      ? `https://www.google.com/maps/embed/v1/place?key=${gmKey}&q=${lat},${lng}&zoom=17&maptype=satellite`
                      : gmUrl
                        ? gmUrl
                        : `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.012},${lat - 0.012},${lng + 0.012},${lat + 0.012}&layer=mapnik&marker=${lat},${lng}`;
                  })()}
                  width="100%"
                  height="320"
                  style={{ borderRadius: 12, border: "none", display: "block" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map for ${project.project_name ?? "Project"}`}
                />
                <a
                  href={`https://maps.google.com/maps?q=${project.latitude},${project.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.gold, textDecoration: "none", display: "inline-block", marginTop: 8 }}
                >
                  View on Google Maps →
                </a>
              </div>
            )}

            {(distFd || distHitec || distAirport || metroStatus || keyRoads || orrExits || market) ? (
              <div className="pp-location-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
                {/* Left: distance table */}
                <div>
                  {/* Computed distances for Hyderabad when no advisor data */}
                  {citySlug === "hyderabad" && project.latitude && project.longitude && !distFd && !distHitec && !distAirport ? (
                    <div>
                      {HYD_LANDMARKS.map((lm, i) => {
                        const dist = distanceInKm(project.latitude!, project.longitude!, lm.lat, lm.lng);
                        return (
                          <div key={lm.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", background: i % 2 === 1 ? "rgba(0,0,0,0.02)" : "transparent", borderBottom: `1px solid ${C.border}` }}>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.text }}>{lm.label}</span>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: C.gold }}>{dist.toFixed(1)} km</span>
                          </div>
                        );
                      })}
                      {(() => {
                        const orr = nearestOrrExit(project.latitude!, project.longitude!);
                        return (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", background: "rgba(45,106,79,0.04)", borderBottom: `1px solid ${C.border}` }}>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.accent }}>{orr.label}</span>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: C.accent }}>{orr.dist.toFixed(1)} km</span>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    [
                      { label: "Financial District", value: distFd != null ? `${distFd} km` : null },
                      { label: "HITEC City", value: distHitec != null ? `${distHitec} km` : null },
                      { label: "Airport", value: distAirport != null ? `${distAirport} km` : null },
                      { label: "Metro", value: metroStatus },
                      { label: "Key Roads", value: keyRoads },
                      { label: "ORR Exits", value: orrExits },
                    ]
                      .filter((row) => row.value)
                      .map((row, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "10px 0",
                            background: i % 2 === 1 ? "rgba(0,0,0,0.02)" : "transparent",
                            borderBottom: `1px solid ${C.border}`,
                          }}
                        >
                          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.text }}>
                            {row.label}
                          </span>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: C.gold }}>
                            {row.value}
                          </span>
                        </div>
                      ))
                  )}
                  {/* Schools from microMarketDetail */}
                  {(() => {
                    const schools = cleanArray(microMarketDetail?.top_schools);
                    if (schools.length === 0) return null;
                    return (
                      <div style={{ marginTop: 20 }}>
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>🏫 Nearby Schools</p>
                        {schools.slice(0, 4).map((name, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                            <span style={{ color: C.textMuted, fontSize: 12 }}>•</span>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.text }}>{name}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  {/* Hospitals from microMarketDetail */}
                  {(() => {
                    const hospitals = cleanArray(microMarketDetail?.top_hospitals);
                    if (hospitals.length === 0) return null;
                    return (
                      <div style={{ marginTop: 20 }}>
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>🏥 Healthcare</p>
                        {hospitals.slice(0, 4).map((name, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                            <span style={{ color: C.textMuted, fontSize: 12 }}>•</span>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.text }}>{name}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  {/* Location highlights from context.locationAdvantages (V2 fallback for non-Goa) */}
                  {(() => {
                    const items = (context?.locationAdvantages && Array.isArray(context.locationAdvantages))
                      ? (context.locationAdvantages as unknown[])
                      : [];
                    if (items.length === 0) return null;
                    return (
                      <div style={{ marginTop: 20 }}>
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>📍 Location Highlights</p>
                        {items.slice(0, 6).map((item: unknown, i: number) => {
                          const text = typeof item === "string" ? item : (item as Record<string, string>)?.label || (item as Record<string, string>)?.name || "";
                          if (!text) return null;
                          return (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                              <span style={{ color: C.accent, fontSize: 12, flexShrink: 0, marginTop: 2 }}>→</span>
                              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.text }}>{text}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Right: market card */}
                {market && (
                  <div style={{ background: C.bgCard, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: C.text, marginBottom: 8 }}>
                      {market.market_name}
                    </div>
                    {market.hero_hook && (
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontStyle: "italic", color: C.textMuted, marginBottom: 16, lineHeight: 1.6 }}>
                        {stripHtmlAndTruncate(market.hero_hook, 220)}
                      </p>
                    )}
                    {(market.price_per_sqft_min || market.price_per_sqft_max) && (
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: C.gold, fontWeight: 600, marginBottom: 8 }}>
                        {formatPsf(market.price_per_sqft_min, market.price_per_sqft_max)}/sqft
                      </div>
                    )}
                    {market.appreciation_1yr_pct != null && (
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.accent, marginBottom: 16 }}>
                        +{market.appreciation_1yr_pct}% YoY appreciation
                      </div>
                    )}
                    {/* Location highlights */}
                    {Array.isArray((project as unknown as Record<string, unknown>).location_highlights) && ((project as unknown as Record<string, unknown>).location_highlights as string[]).length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Location Highlights</p>
                        {((project as unknown as Record<string, unknown>).location_highlights as string[]).map((highlight: string, i: number) => (
                          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                            <span style={{ color: C.accent, flexShrink: 0 }}>✓</span>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.text }}>{highlight}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {microMarket?.url_slug && (
                      <Link
                        href={`/${citySlug}/${microMarket.url_slug}`}
                        style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.gold, textDecoration: "none" }}
                      >
                        View {market.market_name} market report →
                      </Link>
                    )}
                  </div>
                )}

                {/* Right fallback: micro_market from project */}
                {!market && microMarket && (
                  <div style={{ background: C.bgCard, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: C.text, marginBottom: 8 }}>
                      {microMarket.micro_market_name}
                    </div>
                    {microMarket.hero_hook && (
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontStyle: "italic", color: C.textMuted, marginBottom: 16, lineHeight: 1.6 }}>
                        {stripHtmlAndTruncate(microMarket.hero_hook, 220)}
                      </p>
                    )}
                    {(microMarket.price_per_sqft_min || microMarket.price_per_sqft_max) && (
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: C.gold, fontWeight: 600, marginBottom: 8 }}>
                        {formatPsf(microMarket.price_per_sqft_min ?? null, microMarket.price_per_sqft_max ?? null)}/sqft
                      </div>
                    )}
                    {microMarket.annual_appreciation_min != null && (
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.accent, marginBottom: 16 }}>
                        +{microMarket.annual_appreciation_min}%+ annual appreciation
                      </div>
                    )}
                    {/* Location highlights */}
                    {Array.isArray((project as unknown as Record<string, unknown>).location_highlights) && ((project as unknown as Record<string, unknown>).location_highlights as string[]).length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Location Highlights</p>
                        {((project as unknown as Record<string, unknown>).location_highlights as string[]).map((highlight: string, i: number) => (
                          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                            <span style={{ color: C.accent, flexShrink: 0 }}>✓</span>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.text }}>{highlight}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {microMarket.url_slug && (
                      <Link
                        href={`/${citySlug}/${microMarket.url_slug}`}
                        style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.gold, textDecoration: "none" }}
                      >
                        View {microMarket.micro_market_name} market report →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Fallback — no market intelligence data
              <div style={{ background: C.bgCard, borderRadius: 12, border: `1px solid ${C.border}`, padding: "28px 32px", maxWidth: 520 }}>
                <p style={{ margin: "0 0 8px", fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: C.text }}>
                  {microMarketName}
                </p>
                <p style={{ margin: "0 0 16px", fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.textMuted }}>
                  Location data available for enriched projects. Contact us for full connectivity details.
                </p>
                {(ap?.micro_market_slug || microMarket?.url_slug) && (
                  <Link
                    href={`/${project?.city?.url_slug ?? citySlug}/${ap?.micro_market_slug ?? microMarket?.url_slug ?? ''}`}
                    style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.gold, textDecoration: "none" }}
                  >
                    View {microMarketName} market intelligence →
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── SECTION 8: DEVELOPER ─────────────────────────────────────────────── */}
      {developer && (
        <section style={{ background: C.bg, padding: "80px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <SectionHeading title="About the Developer" />
            <div className="pp-dev-row" style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
              {/* Logo */}
              <div style={{ flexShrink: 0 }}>
                {developer.logo_url ? (
                  <div style={{ width: 60, height: 60, borderRadius: 8, overflow: "hidden", background: C.bgWarm, position: "relative" }}>
                    <Image
                      src={developer.logo_url}
                      alt={developer.developer_name}
                      fill
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: 60, height: 60, borderRadius: 8, background: C.bgWarm,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: C.gold }}>
                      {developer.developer_name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: C.text, marginBottom: 12 }}>
                  {developer.developer_name}
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                  {developer.years_in_business != null && (
                    <MetricPill label="Years Active" value={String(developer.years_in_business)} />
                  )}
                  {developer.total_projects != null && (
                    <MetricPill label="Total Projects" value={String(developer.total_projects)} />
                  )}
                  {developer.total_projects != null && (
                    <MetricPill label="Est. Delivered" value={String(Math.round(developer.total_projects * 0.6))} />
                  )}
                </div>
                {((developer as unknown as Record<string, unknown>).long_description_seo || developer.hero_description) && (
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, lineHeight: 1.7, color: C.textMuted, marginBottom: 16 }}>
                    {stripHtmlAndTruncate(((developer as unknown as Record<string, unknown>).long_description_seo as string | null) || developer.hero_description, 250)}
                  </p>
                )}
                {/* Developer RERA project list */}
                {developerProjects.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>RERA-Registered Projects</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {developerProjects.slice(0, 5).map((dp, i) => {
                        const isComplete = (dp.current_status ?? "").toLowerCase().includes("complet");
                        const card = (
                          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bgWarm, borderRadius: 8, padding: "10px 14px", border: `1px solid ${C.border}` }}>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.text }}>{dp.project_name}</span>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20, background: isComplete ? "rgba(22,163,74,0.1)" : "rgba(245,158,11,0.1)", color: isComplete ? "#166534" : "#92400e" }}>
                              {dp.current_status ?? "Active"}
                            </span>
                          </div>
                        );
                        return dp.url_slug && dp.city_slug ? (
                          <Link key={i} href={`/${dp.city_slug}/projects/${dp.url_slug}`} style={{ textDecoration: "none" }}>{card}</Link>
                        ) : card;
                      })}
                    </div>
                  </div>
                )}
                {developer.url_slug && (
                  <Link
                    href={`/developers/${developer.url_slug}`}
                    style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.gold, textDecoration: "none" }}
                  >
                    View all {developer.developer_name} projects →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 9: MARKET INTELLIGENCE ──────────────────────────────────── */}
      {market && (
        <section style={{ background: C.bgWarm, padding: "80px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <SectionHeading title="Market Intelligence" />

            {/* Outlook cards */}
            {(market.outlook_bull_case || market.outlook_base_case || market.outlook_bear_case) && (
              <div className="pp-market-cards" style={{ display: "flex", gap: 16, marginBottom: 48 }}>
                {[
                  { label: "Bull Case", content: market.outlook_bull_case, borderColor: C.accent },
                  { label: "Base Case", content: market.outlook_base_case, borderColor: C.gold },
                  { label: "Bear Case", content: market.outlook_bear_case, borderColor: "#E74C3C" },
                ]
                  .filter((card) => card.content)
                  .map((card, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        background: C.bgCard,
                        borderLeft: `4px solid ${card.borderColor}`,
                        borderRadius: "0 8px 8px 0",
                        padding: "20px 24px",
                      }}
                    >
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMuted, marginBottom: 8 }}>
                        {card.label}
                      </div>
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, lineHeight: 1.6, color: C.text }}>
                        {card.content}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Risk / Catalysts */}
            {(riskFactors.length > 0 || growthCatalysts.length > 0) && (
              <div style={{ display: "flex", gap: 32 }}>
                {riskFactors.length > 0 && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMuted, marginBottom: 16 }}>
                      Risk Factors
                    </div>
                    {riskFactors.map((risk, i) => {
                      const r = typeof risk === "object" && risk !== null ? risk as Record<string, unknown> : null;
                      const text = r ? String(r.detail ?? r.factor ?? r.description ?? JSON.stringify(risk)) : String(risk);
                      return (
                        <div key={i} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.textMuted, marginBottom: 8, lineHeight: 1.5 }}>
                          ⚠ {text}
                        </div>
                      );
                    })}
                  </div>
                )}
                {growthCatalysts.length > 0 && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMuted, marginBottom: 16 }}>
                      Growth Catalysts
                    </div>
                    {growthCatalysts.map((catalyst, i) => {
                      const c = typeof catalyst === "object" && catalyst !== null ? catalyst as Record<string, unknown> : null;
                      const text = c ? String(c.catalyst ?? c.detail ?? c.description ?? JSON.stringify(catalyst)) : String(catalyst);
                      return (
                        <div key={i} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.text, marginBottom: 8, lineHeight: 1.5 }}>
                          <span style={{ color: C.gold }}>✦ </span>{text}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── SECTION 10: AI ADVISOR CTA ───────────────────────────────────────── */}
      <section style={{ background: C.bgDark, padding: "80px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            Ask about {projectName}
          </h2>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, color: "rgba(255,255,255,0.6)", marginBottom: 40 }}>
            Get instant answers to your property questions from our AI Advisor, trained on real market data.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {advisorChips.map((chip, i) => (
              <button
                key={i}
                className="pp-adv-chip"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(
                      new CustomEvent("westside:openAdvisor", {
                        detail: { message: chip, projectSlug: project.url_slug ?? "" },
                      })
                    );
                  }
                }}
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 20,
                  padding: "10px 20px",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  color: "#ffffff",
                  background: "transparent",
                  cursor: "pointer",
                  transition: "border-color 0.2s, color 0.2s",
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 11: COMPARABLE PROJECTS ─────────────────────────────────── */}
      {otherProjectsInMarket.length > 0 && (
        <section style={{ background: C.bg, padding: "80px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <SectionHeading title="Similar Projects" sub={`Other projects in ${microMarketName || citySlug}`} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {otherProjectsInMarket.slice(0, 6).map((comparableProject, i) => {
                const href = comparableProject.url_slug && comparableProject.city_slug ? buildProjectUrl(comparableProject.city_slug, comparableProject.url_slug) : null;
                const card = (
                  <div
                    className="pp-card"
                    style={{ background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}
                  >
                    {/* Image placeholder */}
                    <div style={{ height: 160, overflow: "hidden", position: "relative" }}>
                      <div style={{
                        width: "100%", height: "100%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: `linear-gradient(135deg, ${C.bgWarm} 0%, #E0DAD0 100%)`,
                      }}>
                        <span style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: 72,
                          fontWeight: 600,
                          color: C.textMuted,
                          opacity: 0.25,
                          lineHeight: 1,
                          userSelect: "none",
                        }}>
                          {(comparableProject.project_name ?? 'P').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: 16 }}>
                      {comparableProject.developer_name && (
                        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMuted, marginBottom: 4 }}>
                          {comparableProject.developer_name}
                        </div>
                      )}
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                        {comparableProject.project_name}
                      </div>
                      {comparableProject.total_units && (
                        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted }}>
                          {comparableProject.total_units.toLocaleString("en-IN")} units
                        </div>
                      )}
                    </div>
                  </div>
                );
                return href ? (
                  <Link key={i} href={href} style={{ textDecoration: "none" }}>
                    {card}
                  </Link>
                ) : (
                  <div key={i}>{card}</div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 12: SMART LINKS ─────────────────────────────────────────── */}
      {microMarket && (microMarket as unknown as Record<string, unknown>).url_slug && (() => {
        const mmSlug = (microMarket as unknown as Record<string, unknown>).url_slug as string;
        const mmName = microMarket.micro_market_name;
        const devName = developerBrandName || developer?.developer_name || project.developer_name || "";
        const devSlugVal = developerBrandSlug || (developer as unknown as Record<string, unknown>)?.url_slug as string | null || null;

        // Extract BHK configs from configDistribution
        const bhkNums = [...new Set(
          (configDistribution ?? [])
            .map(r => { const m = (r.unit_category || "").match(/^(\d+)\s*BHK/i); return m ? parseInt(m[1]) : null; })
            .filter((n): n is number => n !== null)
        )].sort((a, b) => a - b);

        const links: Array<{ label: string; href: string }> = [
          ...bhkNums.map(n => ({ label: `${n} BHK in ${mmName}`, href: `/${citySlug}/${mmSlug}?bhk=${n}` })),
          { label: `Ready to move in ${mmName}`, href: `/${citySlug}/${mmSlug}?status=ready` },
          { label: `Under ₹1.5 Cr in ${mmName}`, href: `/${citySlug}/${mmSlug}?budget=under-1cr` },
          { label: `Under ₹2.5 Cr in ${mmName}`, href: `/${citySlug}/${mmSlug}?budget=under-2cr` },
          ...(devSlugVal && devName ? [{ label: `All projects by ${devName}`, href: `/developers/${devSlugVal}` }] : []),
          { label: `${mmName} market intelligence`, href: `/${citySlug}/${mmSlug}` },
          ...(nearbyMarkets?.slice(0, 2).map(nm => ({ label: `${nm.micro_market_name} projects`, href: `/${citySlug}/${nm.url_slug}` })) ?? []),
        ];

        return (
          <section style={{ background: C.bgWarm, padding: "48px 24px" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px" }}>
                Related Searches
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {links.map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    style={{
                      fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.text,
                      textDecoration: "none", padding: "8px 16px", borderRadius: 20,
                      border: `1px solid ${C.border}`, background: C.bgCard,
                      transition: "border-color 0.2s, color 0.2s",
                      display: "inline-block",
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ── SECTION 13: FAQ ── */}
      {faqs.length > 0 && (
        <section style={{ background: C.bgWarm, padding: "64px 0" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <SectionHeading title="Frequently Asked Questions" sub="Common questions about this project" />
            <div style={{ maxWidth: 800 }}>
              {faqs.map((faq, i) => (
                <div key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <button
                    onClick={() => setFaqOpenIndex(faqOpenIndex === i ? -1 : i)}
                    style={{
                      width: "100%", textAlign: "left", padding: "20px 0",
                      background: "transparent", border: "none", cursor: "pointer",
                      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
                    }}
                  >
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 500, color: C.text, lineHeight: 1.4 }}>
                      {faq.question}
                    </span>
                    <span style={{
                      color: C.gold, fontSize: 18, flexShrink: 0,
                      transition: "transform 0.2s",
                      transform: faqOpenIndex === i ? "rotate(45deg)" : "none",
                      display: "inline-block",
                    }}>+</span>
                  </button>
                  {faqOpenIndex === i && (
                    <div style={{ padding: "0 0 20px", fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.textMuted, lineHeight: 1.75 }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
