import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { Building2, Award, MapPin, Globe, Calendar, TrendingUp, User, Clock, MessageSquare, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import CityHubBacklink from "@/components/seo/CityHubBacklink";
import DeveloperContactForm from "@/components/developer/DeveloperContactForm";
import NavigationAuditLogger from "@/components/analytics/NavigationAuditLogger";
import ProjectCardLink from "@/components/analytics/ProjectCardLink";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { buildProjectAbsoluteUrl, buildProjectUrl, buildProjectsIndexUrl } from "@/lib/routes";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ sort?: string; compare?: string | string[]; tab?: string }>;
}

interface DeveloperPageRpcProject {
  id?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  url_slug?: string | null;
  project_slug?: string | null;
  slug?: string | null;
  rera_id?: string | null;
  status?: string | null;
  proposed_completion_date?: string | null;
  proposed_completion_date_text?: string | null;
  completion_date?: string | null;
  legal_entity?: string | null;
  approved_micro_market_v2?: unknown;
}

interface DeveloperPageRpcData {
  profile?: {
    brand_id?: string | number | null;
    id?: string | number | null;
    brand_name?: string | null;
    total_projects?: number | null;
    legal_entities?: string[] | null;
    logo_url?: string | null;
    banner_image_url?: string | null;
    tagline?: string | null;
    hero_description?: string | null;
    long_description?: string | null;
    usp?: string | null;
    specialization?: string | null;
    years_in_business?: number | null;
    total_sft_delivered?: string | number | null;
    founder_bio?: string | null;
    awards_summary?: string | null;
    key_awards?: Array<Record<string, unknown>> | null;
    faqs?: Array<Record<string, unknown>> | null;
  } | null;
  projects?: DeveloperPageRpcProject[] | null;
  legal_entities?: string[] | null;
  underwriting?: {
    brand_id?: string | number | null;
    delivery_ratio?: number | string | null;
    corridor_focus?: string | null;
    premium_project_ratio?: number | string | null;
    core_corridor_exposure?: number | string | null;
    top_market_concentration?: number | string | null;
    premium_positioning_final?: string | null;
    institutional_grade_final?: string | null;
    institutional_grade_signal?: boolean | null;
    conviction_score?: number | string | null;
    sponsor_conviction_band?: string | null;
    total_projects?: number | string | null;
    active_projects?: number | string | null;
    delivered_projects_proxy?: number | string | null;
    developer_cycle_stage?: string | null;
    investment_thesis?: string | null;
  } | null;
  sponsor_conviction?: {
    brand_id?: string | number | null;
    conviction_score?: number | string | null;
    sponsor_conviction_band?: string | null;
    institutional_alignment?: string | null;
    premium_positioning?: string | null;
    [key: string]: unknown;
  } | null;
  supply_risk?: {
    brand_id?: string | number | null;
    supply_risk_band?: string | null;
    short_term_supply?: number | string | null;
    mid_term_supply?: number | string | null;
    top_market_concentration?: number | string | null;
    [key: string]: unknown;
  } | null;
  product_mix?: {
    brand_id?: string | number | null;
    luxury_corridor_exposure?: number | string | null;
    product_positioning_category?: string | null;
    institutional_interpretation?: string | null;
    [key: string]: unknown;
  } | null;
  cycle_position?: {
    brand_id?: string | number | null;
    developer_cycle_stage?: string | null;
    cycle_stage?: string | null;
    [key: string]: unknown;
  } | null;
  investment_thesis?: {
    brand_id?: string | number | null;
    investment_thesis?: string | null;
    thesis?: string | null;
    [key: string]: unknown;
  } | null;
  capital_strategy?: {
    brand_id?: string | number | null;
    capital_strategy?: string | null;
    [key: string]: unknown;
  } | null;
  liquidity_cycle?: {
    brand_id?: string | number | null;
    liquidity_cycle?: string | null;
    short_term_supply?: number | string | null;
    mid_term_supply?: number | string | null;
    long_term_supply?: number | string | null;
    [key: string]: unknown;
  } | null;
  entry_corridors?: {
    brand_id?: string | number | null;
    entry_corridors?: Array<Record<string, unknown> | string> | null;
    [key: string]: unknown;
  } | null;
  entry_corridor_strategy?: {
    brand_id?: string | number | null;
    corridors?: Array<Record<string, unknown> | string> | null;
    entry_corridor_strategy?: Array<Record<string, unknown> | string> | null;
    [key: string]: unknown;
  } | Array<Record<string, unknown> | string> | null;
  pipeline_intelligence?: {
    brand_id?: string | number | null;
    short_term_supply?: number | string | null;
    mid_term_supply?: number | string | null;
    long_term_supply?: number | string | null;
    [key: string]: unknown;
  } | null;
  concentration_intelligence?: {
    brand_id?: string | number | null;
    top_market_concentration?: number | string | null;
    [key: string]: unknown;
  } | null;
  execution_proxy?: {
    brand_id?: string | number | null;
    delivery_ratio?: number | string | null;
    [key: string]: unknown;
  } | null;
  premium_institutional_signal?: {
    brand_id?: string | number | null;
    premium_project_ratio?: number | string | null;
    institutional_grade_signal?: boolean | null;
    [key: string]: unknown;
  } | null;
  pricing_power?: {
    brand_id?: string | number | null;
    pricing_power_score?: number | string | null;
    pricing_power_band?: string | null;
    [key: string]: unknown;
  } | null;
  developer_composite_ranking?: {
    brand_id?: string | number | null;
    city?: string | null;
    city_rank?: number | string | null;
    total_developers?: number | string | null;
    percentile_position?: number | string | null;
    composite_score?: number | string | null;
    city_median_composite_score?: number | string | null;
    conviction_score?: number | string | null;
    city_avg_conviction_score?: number | string | null;
    pricing_power_score?: number | string | null;
    city_avg_pricing_power_score?: number | string | null;
    supply_risk_score?: number | string | null;
    city_avg_supply_risk_score?: number | string | null;
    [key: string]: unknown;
  } | null;
  composite_ranking?: {
    brand_id?: string | number | null;
    city?: string | null;
    city_rank?: number | string | null;
    total_developers?: number | string | null;
    percentile_position?: number | string | null;
    composite_score?: number | string | null;
    city_median_composite_score?: number | string | null;
    conviction_score?: number | string | null;
    city_avg_conviction_score?: number | string | null;
    pricing_power_score?: number | string | null;
    city_avg_pricing_power_score?: number | string | null;
    supply_risk_score?: number | string | null;
    city_avg_supply_risk_score?: number | string | null;
    [key: string]: unknown;
  } | null;
}

interface DeveloperCompareOption {
  slug: string;
  name: string;
}

interface DeveloperBrandLite {
  id: string;
  brand_name: string;
  url_slug: string;
}

// Helper functions
const stripHtmlTags = (html?: string | null) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

const truncateText = (text: string, maxLength = 140) => {
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
};

const stripMarkdownArtifacts = (text?: string | null) => {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
};

const resolveProjectSlug = (project: DeveloperPageRpcProject) => {
  const candidate =
    project?.url_slug ??
    project?.project_slug ??
    project?.slug ??
    null;
  if (!candidate) return null;
  const normalized = String(candidate).trim();
  return normalized.length > 0 ? normalized : null;
};

const resolveMicroMarketLabel = (value: unknown): string | null => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidate =
      record.approved_micro_market_v2 ??
      record.resolved_micro_market ??
      record.approved_micro_market ??
      record.suggested_micro_market ??
      record.manual_micro_market ??
      record.district;

    if (typeof candidate === "string") {
      const normalized = candidate.trim();
      return normalized.length > 0 ? normalized : null;
    }
  }

  return null;
};

const toRenderableText = (value: unknown, fallback = "—"): string => {
  if (value == null) return fallback;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : fallback;
  }

  const microMarketLabel = resolveMicroMarketLabel(value);
  if (microMarketLabel) return microMarketLabel;

  return fallback;
};

const normalizeLegalEntity = (value: unknown): string | null => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidate =
      record.legal_entity ??
      record.legalEntity ??
      record.name ??
      null;

    if (typeof candidate === "string") {
      const normalized = candidate.trim();
      return normalized.length > 0 ? normalized : null;
    }
  }

  return null;
};

const normalizeRatio = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getDeliveryStrengthLabel = (ratio: number | null): string => {
  if (ratio == null) return "Not available";
  if (ratio > 0.7) return "Strong execution";
  if (ratio >= 0.4) return "Moderate execution";
  return "Weak";
};

const normalizeCount = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.round(value));
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : null;
  }
  return null;
};

const ratioToPercent = (value: unknown): string => {
  const ratio = normalizeRatio(value);
  if (ratio == null) return "—";
  const percent = ratio <= 1 ? ratio * 100 : ratio;
  return `${Math.max(0, Math.min(100, percent)).toFixed(0)}%`;
};

const normalizeRiskBand = (value: unknown): "HIGH" | "MODERATE" | "LOW" | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  if (normalized === "HIGH" || normalized === "MODERATE" || normalized === "LOW") {
    return normalized;
  }
  return null;
};

const InfoTooltip = ({ label, content }: { label: string; content: string }) => (
  <span className="group relative ml-1 inline-flex align-middle">
    <button
      type="button"
      aria-label={label}
      className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/30 text-[10px] font-semibold text-white/70 transition-colors hover:border-white/50 hover:text-white"
    >
      i
    </button>
    <span
      role="tooltip"
      className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] z-20 w-56 -translate-x-1/2 rounded-md border border-white/10 bg-[#0F172A] px-2.5 py-2 text-[11px] font-normal leading-relaxed text-white/80 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
    >
      {content}
    </span>
  </span>
);

const normalizeConvictionBand = (
  value: unknown
): "LOW RISK" | "ELEVATED" | "HIGH" | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  if (normalized === "LOW RISK" || normalized === "ELEVATED" || normalized === "HIGH") return normalized;
  if (normalized === "HIGH CONVICTION") return "LOW RISK";
  if (normalized === "SELECTIVE") return "ELEVATED";
  if (normalized === "HIGH RISK") return "HIGH";
  return null;
};

const normalizeSponsorConvictionBand = (
  value: unknown
): "HIGH" | "SELECTIVE" | "HIGH RISK" | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  if (normalized === "HIGH") return "HIGH";
  if (normalized === "SELECTIVE") return "SELECTIVE";
  if (normalized === "HIGH RISK") return "HIGH RISK";
  if (normalized === "HIGH CONVICTION" || normalized === "LOW RISK") return "HIGH";
  if (normalized === "ELEVATED") return "SELECTIVE";
  return null;
};

const normalizePricingPowerBand = (value: unknown): "HIGH" | "MODERATE" | "LOW" | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  if (normalized === "HIGH" || normalized === "MODERATE" || normalized === "LOW") return normalized;
  return null;
};

type StrengthLevel = "Weak" | "Moderate" | "Strong";

interface DeveloperNarrativeInputs {
  executionReliability: StrengthLevel;
  activeProjects: number;
  deliveredProjects: number;
  shortTermPipeline: number;
  midTermPipeline: number;
  longTermPipeline: number;
  corridorDominance: StrengthLevel;
  developerCyclePosition: string;
  premiumExposurePercent: string;
  premiumPositioningLevel: StrengthLevel;
  supplyRiskBand: "HIGH" | "MODERATE" | "LOW" | null;
  topMarketConcentration: string;
  sponsorConvictionBand: "LOW RISK" | "ELEVATED" | "HIGH" | "SELECTIVE" | "HIGH RISK" | null;
  convictionScore: number | null;
  institutionalAlignmentLevel: StrengthLevel;
  sourceInvestmentThesis: string;
}

interface EntryCorridorRow {
  corridorName: string;
  projectCount: number | null;
  rank: number;
}

type CorridorBucket = "CORE" | "EXPANSION" | "EXPERIMENTAL";

interface GeographicBucketRow {
  bucket: CorridorBucket;
  corridorName: string;
  projectCount: number | null;
  sharePercent: number | null;
}

const buildDeveloperInterpretations = (inputs: DeveloperNarrativeInputs) => {
  const pipelineMixSignal =
    inputs.longTermPipeline > inputs.shortTermPipeline + inputs.midTermPipeline
      ? "forward-weighted pipeline concentration"
      : inputs.shortTermPipeline >= inputs.midTermPipeline
        ? "front-loaded delivery visibility"
        : "balanced medium-term deployment";

  const supplyShockSignal =
    inputs.supplyRiskBand === "HIGH"
      ? "near-term supply pressure is elevated and may tighten exit optionality."
      : inputs.supplyRiskBand === "MODERATE"
        ? "launch pressure is manageable but requires absorption monitoring."
        : inputs.supplyRiskBand === "LOW"
          ? "near-term launch pressure remains contained relative to demand depth."
          : "supply-pressure visibility is still developing.";

  const convictionSignal =
    inputs.sponsorConvictionBand === "LOW RISK"
      ? "capital protection quality is comparatively strong."
      : inputs.sponsorConvictionBand === "ELEVATED"
        ? "allocation quality is selective and corridor-dependent."
        : inputs.sponsorConvictionBand === "HIGH"
          ? "underwriting requires tighter risk discipline."
          : "conviction visibility is evolving.";

  const execution = `Execution reliability is ${inputs.executionReliability.toLowerCase()} with ${inputs.deliveredProjects} delivered projects against ${inputs.activeProjects} active projects. Current delivery posture suggests disciplined sequencing rather than broad launch expansion. Capital deployment should prioritize execution visibility over headline scale.`;

  const pipeline = `Pipeline structure indicates ${pipelineMixSignal} across short, mid, and long-duration supply. ${supplyShockSignal} Position sizing should be calibrated to absorption resilience and completion visibility.`;

  const corridor = `Corridor positioning is ${inputs.corridorDominance.toLowerCase()} with cycle status at ${inputs.developerCyclePosition}. Concentration at ${inputs.topMarketConcentration} implies corridor-led return dependence. Allocation quality therefore depends on corridor liquidity persistence through the cycle.`;

  const premiumExposure = `Premium exposure currently reads ${inputs.premiumExposurePercent} with ${inputs.premiumPositioningLevel.toLowerCase()} positioning strength. Pricing power is sustainable only if premium demand depth remains stable during new supply phases. This layer should be treated as a margin-quality signal, not a volume signal.`;

  const supplyShock = `Supply shock assessment points to ${inputs.supplyRiskBand?.toLowerCase() ?? "undetermined"} risk conditions. Near-term launch pressure should be monitored against micro-market absorption and corridor concentration. Underwriting stance should remain selective until supply normalization is visible.`;

  const sponsorConviction = `Sponsor conviction scores ${inputs.convictionScore ?? "—"} with an overall ${inputs.sponsorConvictionBand?.toLowerCase() ?? "evolving"} risk profile. Institutional alignment is ${inputs.institutionalAlignmentLevel.toLowerCase()}, indicating the current fit for larger-ticket allocation. In aggregate, ${convictionSignal}`;

  const investmentThesis = `${inputs.sourceInvestmentThesis} Corridor and premium exposure signals indicate ${inputs.corridorDominance.toLowerCase()} concentration with ${inputs.premiumPositioningLevel.toLowerCase()} pricing strength. Portfolio exposure should be phased to protect downside while preserving cycle-aligned entry optionality.`;

  return {
    execution,
    pipeline,
    corridor,
    premiumExposure,
    supplyShock,
    sponsorConviction,
    investmentThesis,
  };
};

const parseEntryCorridors = (value: unknown): EntryCorridorRow[] => {
  if (!Array.isArray(value)) return [];

  const rows = value
    .map((item, index) => {
      if (typeof item === "string") {
        const corridorName = item.trim();
        if (!corridorName) return null;
        return { corridorName, projectCount: null, rank: index + 1 };
      }

      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const corridorName = toRenderableText(
          record.corridor_name ?? record.corridor ?? record.name,
          ""
        );
        if (!corridorName) return null;
        const projectCount = normalizeCount(
          record.project_count ?? record.projects ?? record.count
        );
        const rank = normalizeCount(record.rank ?? record.ranking) ?? index + 1;
        return { corridorName, projectCount, rank };
      }

      return null;
    })
    .filter((row): row is EntryCorridorRow => Boolean(row))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3);

  return rows;
};

const parseGeographicDeploymentRows = (value: unknown): GeographicBucketRow[] => {
  const rowsSource = (() => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      if (Array.isArray(record.entry_corridor_strategy)) return record.entry_corridor_strategy;
      if (Array.isArray(record.corridors)) return record.corridors;
      if (Array.isArray(record.rows)) return record.rows;
    }
    return [];
  })();

  const parsed = rowsSource
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const bucketRaw = toRenderableText(
        record.corridor_bucket ?? record.bucket ?? record.strategy_bucket,
        ""
      ).toUpperCase();
      const bucket: CorridorBucket | null =
        bucketRaw === "CORE"
          ? "CORE"
          : bucketRaw === "EXPANSION"
            ? "EXPANSION"
            : bucketRaw === "EXPERIMENTAL"
              ? "EXPERIMENTAL"
              : null;
      if (!bucket) return null;

      const corridorName = toRenderableText(
        record.micro_market ?? record.corridor_name ?? record.corridor ?? record.name,
        ""
      );
      if (!corridorName) return null;

      const projectCount = normalizeCount(
        record.project_count ?? record.projects ?? record.count
      );
      const shareRaw = normalizeRatio(record.share_pct ?? record.share_percentage ?? record.share);
      const sharePercent = shareRaw == null ? null : Math.max(0, Math.min(100, shareRaw <= 1 ? shareRaw * 100 : shareRaw));

      return { bucket, corridorName, projectCount, sharePercent };
    })
    .filter((row): row is GeographicBucketRow => Boolean(row));

  const countedTotal = parsed.reduce((sum, row) => sum + (row.projectCount ?? 0), 0);
  if (countedTotal > 0) {
    return parsed.map((row) => ({
      ...row,
      sharePercent:
        row.sharePercent != null
          ? row.sharePercent
          : row.projectCount != null
            ? (row.projectCount / countedTotal) * 100
            : null,
    }));
  }

  return parsed;
};

const getCompareDeveloperOptions = unstable_cache(
  async (): Promise<DeveloperCompareOption[]> => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("developer_brands")
      .select("url_slug, brand_name")
      .not("url_slug", "is", null)
      .not("brand_name", "is", null)
      .order("brand_name", { ascending: true })
      .limit(200);

    if (error || !Array.isArray(data)) return [];

    return data
      .map((row) => {
        const slug = typeof row.url_slug === "string" ? row.url_slug.trim() : "";
        const name = typeof row.brand_name === "string" ? row.brand_name.trim() : "";
        if (!slug || !name) return null;
        return { slug, name };
      })
      .filter((row): row is DeveloperCompareOption => Boolean(row));
  },
  ["developer-compare-options"],
  { revalidate: 600 }
);

const lastDeveloperPageDataBySlug = new Map<string, DeveloperPageRpcData>();
const DEVELOPER_RPC_TIMEOUT_MS = 5000;

const withTimeout = async <T,>(promise: PromiseLike<T>, timeoutMs: number, label: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label}: timeout after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
};

const humanizeSlug = (slug: string): string =>
  slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getDeveloperBrandLiteBySlug = unstable_cache(
  async (slug: string): Promise<DeveloperBrandLite | null> => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("developer_brands")
      .select("id, brand_name, url_slug")
      .eq("url_slug", slug)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    if (!data.id || !data.brand_name || !data.url_slug) return null;

    return {
      id: String(data.id),
      brand_name: String(data.brand_name),
      url_slug: String(data.url_slug),
    };
  },
  ["developer-brand-lite"],
  { revalidate: 600 }
);

const getDeveloperPageDataCached = unstable_cache(
  async (slug: string): Promise<DeveloperPageRpcData | null> => {
    const supabase = createServiceClient();
    const rpcResult = await withTimeout<{ data: unknown; error: { message?: string | null } | null }>(
      supabase.rpc("get_developer_page", {
        p_slug: slug,
      }),
      DEVELOPER_RPC_TIMEOUT_MS,
      "get_developer_page(cached)"
    );
    const { data: rpcRawData, error: rpcError } = rpcResult;

    if (rpcError) {
      throw new Error(
        `[DeveloperPage] get_developer_page failed for ${slug}: ${rpcError.message ?? "Unknown RPC error"}`
      );
    }
    if (!rpcRawData) {
      throw new Error(`[DeveloperPage] get_developer_page returned empty payload for ${slug}`);
    }

    const rpcData = (Array.isArray(rpcRawData) ? rpcRawData[0] : rpcRawData) as
      | DeveloperPageRpcData
      | null;
    if (!rpcData) {
      throw new Error(`[DeveloperPage] get_developer_page returned null object for ${slug}`);
    }

    lastDeveloperPageDataBySlug.set(slug, rpcData);
    return rpcData;
  },
  ["developer-page-underwriting"],
  { revalidate: 600 }
);

async function getDeveloperPageData(slug: string): Promise<DeveloperPageRpcData | null> {
  try {
    const cachedData = await getDeveloperPageDataCached(slug);
    if (cachedData) return cachedData;
  } catch (error) {
    console.warn(
      `[DeveloperPage] cached RPC fallback for ${slug}:`,
      error instanceof Error ? error.message : String(error)
    );
  }

  try {
    const supabase = createServiceClient();
    const rpcResult = await withTimeout<{ data: unknown; error: { message?: string | null } | null }>(
      supabase.rpc("get_developer_page", {
        p_slug: slug,
      }),
      DEVELOPER_RPC_TIMEOUT_MS,
      "get_developer_page(direct)"
    );
    const { data: rpcRawData, error: rpcError } = rpcResult;
    if (!rpcError && rpcRawData) {
      const rpcData = (Array.isArray(rpcRawData) ? rpcRawData[0] : rpcRawData) as
        | DeveloperPageRpcData
        | null;
      if (rpcData) {
        lastDeveloperPageDataBySlug.set(slug, rpcData);
        return rpcData;
      }
    } else if (rpcError) {
      console.warn(
        `[DeveloperPage] direct RPC failed for ${slug}: ${rpcError.message ?? "Unknown RPC error"}`
      );
    }
  } catch (error) {
    console.warn(
      `[DeveloperPage] direct RPC exception for ${slug}:`,
      error instanceof Error ? error.message : String(error)
    );
  }

  return lastDeveloperPageDataBySlug.get(slug) ?? null;
}

async function getDeveloperPageDataWithFallback(slug: string): Promise<DeveloperPageRpcData | null> {
  const rpcData = await getDeveloperPageData(slug);
  if (rpcData) return rpcData;

  const liteBrand = await getDeveloperBrandLiteBySlug(slug);
  if (!liteBrand) return null;

  return {
    profile: {
      brand_id: liteBrand.id,
      brand_name: liteBrand.brand_name,
      total_projects: 0,
    },
    projects: [],
    legal_entities: [],
    underwriting: {
      brand_id: liteBrand.id,
    },
  };
}

// Generate dynamic metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const liteBrand = await getDeveloperBrandLiteBySlug(slug);
  const profile = liteBrand
    ? {
        brand_name: liteBrand.brand_name,
        total_projects: 0,
      }
    : null;

  if (!profile?.brand_name) {
    return {
      title: "Developer Not Found",
    };
  }

  const title = `${profile.brand_name} Hyderabad Projects | Reviews, Price & New Launches`;
  const description = `${profile.total_projects ?? 0} RERA registered projects by ${profile.brand_name}.`;
  const ogImage = undefined;
  const canonicalUrl = `https://www.westsiderealty.in/developers/${slug}`;

  return buildMetadata({
    title,
    description,
    canonicalUrl,
    imageUrl: ogImage,
    type: "website",
  });
}

export default async function DeveloperPage({ params, searchParams }: PageProps) {
  try {
    const { slug } = await params;
    const resolvedSearchParams = (await searchParams) ?? {};
    const sortBy = resolvedSearchParams.sort ?? "completion";
    const compareParam = Array.isArray(resolvedSearchParams.compare)
      ? resolvedSearchParams.compare.join(",")
      : typeof resolvedSearchParams.compare === "string"
        ? resolvedSearchParams.compare
        : "";
    const rawTab = typeof resolvedSearchParams.tab === "string"
      ? resolvedSearchParams.tab
      : "capital-intelligence";
    const validTabs = new Set([
      "capital-intelligence",
      "projects",
      "legal-entities",
      "governance",
      "corporate-profile",
    ]);
    const activeTab = validTabs.has(rawTab) ? rawTab : "capital-intelligence";
    
    if (!slug || typeof slug !== 'string') {
      console.error('[DeveloperPage] Invalid slug parameter');
      notFound();
    }

    const data = await getDeveloperPageData(slug);
    const stableData =
      data ??
      await getDeveloperPageDataWithFallback(slug) ??
      {
        profile: {
          brand_id: slug,
          brand_name: humanizeSlug(slug),
          total_projects: 0,
        },
        projects: [],
        legal_entities: [],
        underwriting: { brand_id: slug },
      };

    const profile = stableData?.profile ?? {};
    const underwriting = (stableData?.underwriting ?? {}) as DeveloperPageRpcData["underwriting"];
    const projects = Array.isArray(stableData?.projects) ? stableData.projects : [];
    const legalEntities = (
      Array.isArray(stableData?.legal_entities)
        ? stableData.legal_entities
        : Array.isArray(profile?.legal_entities)
          ? profile.legal_entities
          : []
    )
      .map(normalizeLegalEntity)
      .filter((entity): entity is string => Boolean(entity))
      .filter((entity, index, arr) => arr.indexOf(entity) === index)
      .sort((a, b) => a.localeCompare(b));
    const keyAwards = Array.isArray(profile?.key_awards) ? profile.key_awards : [];
    const faqs = Array.isArray(profile?.faqs) ? profile.faqs : [];
    const totalProjects =
      normalizeCount(underwriting?.total_projects) ??
      projects.length;
    const today = new Date();
    const parseDate = (value: unknown) => {
      if (!value) return null;
      const date = new Date(String(value));
      return Number.isNaN(date.getTime()) ? null : date;
    };
    const completedProjectsByDate = projects.filter((project: any) => {
      const proposedDate = parseDate(project?.proposed_completion_date);
      if (!proposedDate) return false;
      return proposedDate < today;
    }).length;
    const activeProjectsByDate = projects.filter((project: any) => {
      const proposedDate = parseDate(project?.proposed_completion_date);
      return !proposedDate || proposedDate >= today;
    }).length;
    const activeProjects =
      normalizeCount(underwriting?.active_projects) ??
      activeProjectsByDate;
    const deliveredProjects =
      normalizeCount(underwriting?.delivered_projects_proxy) ??
      completedProjectsByDate;
    const microMarketCounts: Record<string, number> = {};

    projects?.forEach((p: any) => {
      const mm = resolveMicroMarketLabel(p?.approved_micro_market_v2);
      if (mm) {
        microMarketCounts[mm] = (microMarketCounts[mm] || 0) + 1;
      }
    });

    // Convert to sorted array
    const microMarketStats = Object.entries(microMarketCounts)
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
    const topMicroMarkets = microMarketStats.slice(0, 5);
    const foundedYear = profile?.years_in_business
      ? new Date().getFullYear() - Number(profile.years_in_business)
      : null;
    const primaryGeography = topMicroMarkets[0]?.name ?? "Not classified";
    const specializationText = stripHtmlTags(
      stripMarkdownArtifacts(profile?.specialization)
    );
    const deliveryRatio = normalizeRatio(underwriting?.delivery_ratio ?? null);
    const deliveryRatioText = deliveryRatio == null ? "—" : deliveryRatio.toFixed(2);
    const deliveryStrengthLabel = getDeliveryStrengthLabel(deliveryRatio);
    const corridorStrategy = toRenderableText(underwriting?.corridor_focus, "Not available");
    const premiumExposure = ratioToPercent(underwriting?.premium_project_ratio);
    const coreWealthExposure = ratioToPercent(underwriting?.core_corridor_exposure);
    const premiumPositioning = toRenderableText(
      data?.sponsor_conviction?.premium_positioning ??
      stableData?.sponsor_conviction?.premium_positioning ??
      underwriting?.premium_positioning_final,
      "Not available"
    );
    const institutionalAlignment = toRenderableText(
      data?.sponsor_conviction?.institutional_alignment ??
      stableData?.sponsor_conviction?.institutional_alignment ??
      underwriting?.institutional_grade_final,
      "Not available"
    );
    const cycleStageFromRpc = toRenderableText(
      stableData?.cycle_position?.developer_cycle_stage ??
      stableData?.cycle_position?.cycle_stage,
      ""
    );
    const developerCyclePosition = cycleStageFromRpc || toRenderableText(
      underwriting?.developer_cycle_stage,
      "Not available"
    );
    const thesisFromRpc = toRenderableText(
      stableData?.investment_thesis?.investment_thesis ??
      stableData?.investment_thesis?.thesis,
      ""
    );
    const investmentThesis = stripHtmlTags(
      stripMarkdownArtifacts(thesisFromRpc || toRenderableText(underwriting?.investment_thesis, "Not available"))
    );
    const executionNarrative =
      deliveryRatio != null && deliveryRatio > 0.7
        ? "High delivery consistency"
        : deliveryRatio != null && deliveryRatio >= 0.4
          ? "Balanced active pipeline"
          : "Aggressive launch cycle";

    const shortTermPipeline = projects.filter((project: any) => {
      const proposedDate = parseDate(project?.proposed_completion_date);
      if (!proposedDate) return false;
      const diffInMonths =
        (proposedDate.getFullYear() - today.getFullYear()) * 12 +
        (proposedDate.getMonth() - today.getMonth());
      return diffInMonths >= 0 && diffInMonths <= 12;
    }).length;
    const midTermPipeline = projects.filter((project: any) => {
      const proposedDate = parseDate(project?.proposed_completion_date);
      if (!proposedDate) return false;
      const diffInMonths =
        (proposedDate.getFullYear() - today.getFullYear()) * 12 +
        (proposedDate.getMonth() - today.getMonth());
      return diffInMonths > 12 && diffInMonths <= 36;
    }).length;
    const longTermPipeline = projects.filter((project: any) => {
      const proposedDate = parseDate(project?.proposed_completion_date);
      if (!proposedDate) return false;
      const diffInMonths =
        (proposedDate.getFullYear() - today.getFullYear()) * 12 +
        (proposedDate.getMonth() - today.getMonth());
      return diffInMonths > 36;
    }).length;
    const oversupplyRiskLabel =
      longTermPipeline >= Math.max(deliveredProjects, 1)
        ? "Elevated future supply risk"
        : midTermPipeline > shortTermPipeline
          ? "Moderate supply expansion risk"
          : "Contained near-term supply risk";
    const supplyRiskBand = normalizeRiskBand(stableData?.supply_risk?.supply_risk_band);
    const shortTermSupplyRisk = normalizeCount(stableData?.supply_risk?.short_term_supply);
    const topMarketConcentration = ratioToPercent(stableData?.supply_risk?.top_market_concentration);
    const supplyRiskBadgeClass =
      supplyRiskBand === "HIGH"
        ? "border border-red-400/40 bg-red-500/20 text-red-300"
        : supplyRiskBand === "MODERATE"
          ? "border border-amber-400/40 bg-amber-500/20 text-amber-300"
          : supplyRiskBand === "LOW"
            ? "border border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
            : "border border-slate-400/40 bg-slate-500/20 text-slate-300";
    const supplyRiskInterpretation =
      "This signal highlights near-term launch pressure and potential pricing risk.";
    const luxuryCorridorExposure = ratioToPercent(stableData?.product_mix?.luxury_corridor_exposure);
    const productPositioningCategory = toRenderableText(
      stableData?.product_mix?.product_positioning_category,
      "Not available"
    );
    const productMixInterpretation = toRenderableText(
      stableData?.product_mix?.institutional_interpretation,
      "Institutional interpretation not available."
    );

    const capitalPositioningNarrative = (() => {
      const alignment = institutionalAlignment.toLowerCase();
      const premium = premiumPositioning.toLowerCase();

      if (alignment.includes("institutional")) return "Institutional-grade platform";
      if (premium.includes("premium") || premium.includes("luxury")) return "Premium corridor expansion";
      if (premium.includes("emerging")) return "Emerging premium developer";
      return "Local execution-focused developer";
    })();
    const convictionScoreRaw = normalizeCount(
      stableData?.sponsor_conviction?.conviction_score ?? underwriting?.conviction_score
    );
    const convictionScore = convictionScoreRaw == null ? null : Math.max(0, Math.min(100, convictionScoreRaw));
    const convictionScoreRounded = convictionScore == null ? null : Math.round(convictionScore);
    const sponsorConvictionBand = normalizeSponsorConvictionBand(
      stableData?.sponsor_conviction?.sponsor_conviction_band ??
      underwriting?.sponsor_conviction_band
    ) ?? (
      convictionScore != null && convictionScore >= 70
        ? "HIGH"
        : convictionScore != null && convictionScore >= 40
          ? "SELECTIVE"
          : convictionScore != null
            ? "HIGH RISK"
            : null
    );
    const sponsorConvictionBandClass =
      sponsorConvictionBand === "HIGH"
        ? "border border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
        : sponsorConvictionBand === "SELECTIVE"
          ? "border border-amber-400/40 bg-amber-500/20 text-amber-300"
          : sponsorConvictionBand === "HIGH RISK"
            ? "border border-red-400/40 bg-red-500/20 text-red-300"
            : "border border-slate-400/40 bg-slate-500/20 text-slate-300";
    const sponsorConvictionBandLabel =
      sponsorConvictionBand === "HIGH"
        ? "High Conviction Sponsor"
        : sponsorConvictionBand === "SELECTIVE"
          ? "Selective Sponsor"
          : sponsorConvictionBand === "HIGH RISK"
            ? "High Risk Sponsor"
            : "Conviction Evolving";

    const executionRatioForDrivers =
      normalizeRatio(stableData?.execution_proxy?.delivery_ratio) ??
      deliveryRatio;
    const premiumRatioForDrivers =
      normalizeRatio(stableData?.premium_institutional_signal?.premium_project_ratio) ??
      normalizeRatio(underwriting?.premium_project_ratio);
    const institutionalSignalForDrivers =
      stableData?.premium_institutional_signal?.institutional_grade_signal ??
      underwriting?.institutional_grade_signal;
    const concentrationRatioForDrivers =
      normalizeRatio(stableData?.concentration_intelligence?.top_market_concentration) ??
      normalizeRatio(stableData?.supply_risk?.top_market_concentration) ??
      normalizeRatio(underwriting?.top_market_concentration) ??
      normalizeRatio(underwriting?.core_corridor_exposure);

    const executionReliabilityLevel =
      executionRatioForDrivers != null && executionRatioForDrivers > 0.7
        ? "Strong"
        : executionRatioForDrivers != null && executionRatioForDrivers >= 0.4
          ? "Moderate"
          : "Weak";
    const premiumRatio = premiumRatioForDrivers;
    const premiumPositioningLevel =
      premiumRatio != null && premiumRatio > 0.5
        ? "Strong"
        : premiumRatio != null && premiumRatio >= 0.25
          ? "Moderate"
          : "Weak";
    const corridorConcentrationRatio = concentrationRatioForDrivers;
    const corridorDominanceLevel =
      corridorConcentrationRatio != null && corridorConcentrationRatio > 0.4
        ? "Strong"
        : corridorConcentrationRatio != null && corridorConcentrationRatio >= 0.2
          ? "Moderate"
          : "Weak";
    const institutionalGradeSignal = institutionalSignalForDrivers;
    const institutionalAlignmentLevel =
      institutionalGradeSignal === true
        ? "Strong"
        : institutionalGradeSignal === false
          ? "Weak"
          : institutionalAlignment.toLowerCase().includes("institutional")
            ? "Strong"
            : "Moderate";
    const interpretationNarratives = buildDeveloperInterpretations({
      executionReliability: executionReliabilityLevel,
      activeProjects,
      deliveredProjects,
      shortTermPipeline,
      midTermPipeline,
      longTermPipeline,
      corridorDominance: corridorDominanceLevel,
      developerCyclePosition,
      premiumExposurePercent: premiumExposure,
      premiumPositioningLevel,
      supplyRiskBand,
      topMarketConcentration,
      sponsorConvictionBand,
      convictionScore,
      institutionalAlignmentLevel,
      sourceInvestmentThesis: investmentThesis === "Not available" ? "Investment thesis is currently limited." : investmentThesis,
    });
    const driverExecutionPercent =
      executionRatioForDrivers == null ? null : Math.max(0, Math.min(100, (executionRatioForDrivers <= 1 ? executionRatioForDrivers * 100 : executionRatioForDrivers)));
    const driverPremiumPercent =
      premiumRatioForDrivers == null ? null : Math.max(0, Math.min(100, (premiumRatioForDrivers <= 1 ? premiumRatioForDrivers * 100 : premiumRatioForDrivers)));
    const driverInstitutionalPercent =
      institutionalSignalForDrivers === true ? 100 : institutionalSignalForDrivers === false ? 30 : 55;
    const driverCorridorPercent =
      concentrationRatioForDrivers == null ? null : Math.max(0, Math.min(100, (concentrationRatioForDrivers <= 1 ? concentrationRatioForDrivers * 100 : concentrationRatioForDrivers)));
    const sponsorInterpretation =
      sponsorConvictionBand === "HIGH"
        ? "Strong execution and disciplined capital allocation across core demand corridors."
        : sponsorConvictionBand === "SELECTIVE"
          ? "Balanced execution with selective premium exposure and corridor expansion."
          : sponsorConvictionBand === "HIGH RISK"
            ? "Limited delivery track record and fragmented geographic strategy."
            : "Conviction signals are still maturing across execution and corridor positioning.";
    const corridorFocusText = toRenderableText(underwriting?.corridor_focus, "corridor focus not yet classified");
    const strategyStability =
      (developerCyclePosition.toLowerCase().includes("accum") || developerCyclePosition.toLowerCase().includes("core")) && corridorDominanceLevel !== "Weak"
        ? "Stable"
        : developerCyclePosition.toLowerCase().includes("expan") || developerCyclePosition.toLowerCase().includes("growth")
          ? "Expanding"
          : "Opportunistic";
    const strategyStabilityCommentary =
      strategyStability === "Stable"
        ? `Developer demonstrates consistent focus in ${corridorFocusText.toLowerCase()} with controlled expansion.`
        : strategyStability === "Expanding"
          ? `Developer is expanding corridor exposure from a ${developerCyclePosition.toLowerCase()} base with selective premium deployment.`
          : `Developer strategy remains opportunistic with corridor focus evolving by cycle opportunity.`;
    const capitalStrategyValue = toRenderableText(
      stableData?.capital_strategy?.capital_strategy,
      "Not available"
    );
    const capitalStrategyContext = (() => {
      const normalized = capitalStrategyValue.toLowerCase();
      if (normalized.includes("income")) return "Stable corridors";
      if (normalized.includes("growth")) return "Expansion corridors";
      if (normalized.includes("preservation")) return "Core wealth corridors";
      if (normalized.includes("opportunistic")) return "Early alpha";
      return "Allocation context evolving";
    })();
    const liquidityCycleValue = toRenderableText(
      stableData?.liquidity_cycle?.liquidity_cycle,
      "Not available"
    );
    const liquidityShortTerm =
      normalizeCount(stableData?.liquidity_cycle?.short_term_supply) ?? shortTermPipeline;
    const liquidityMidTerm =
      normalizeCount(stableData?.liquidity_cycle?.mid_term_supply) ?? midTermPipeline;
    const liquidityLongTerm =
      normalizeCount(stableData?.liquidity_cycle?.long_term_supply) ?? longTermPipeline;
    const entryCorridorRows = parseEntryCorridors(
      stableData?.entry_corridors?.entry_corridors ?? stableData?.entry_corridors
    );
    const capitalAllocationStyle = (() => {
      const coreExposure = normalizeRatio(underwriting?.core_corridor_exposure) ?? 0;
      const premiumRatio = normalizeRatio(underwriting?.premium_project_ratio) ?? 0;
      const deliveryRatio = normalizeRatio(underwriting?.delivery_ratio) ?? 0;
      if (coreExposure > 0.4) return "Wealth Preservation";
      if (premiumRatio > 0.4) return "Growth";
      if (deliveryRatio > 0.6) return "Income";
      return "Opportunistic";
    })();
    const forwardSupplyShort =
      normalizeCount(stableData?.pipeline_intelligence?.short_term_supply) ??
      shortTermSupplyRisk ??
      shortTermPipeline;
    const forwardSupplyMid =
      normalizeCount(stableData?.pipeline_intelligence?.mid_term_supply) ??
      normalizeCount(stableData?.supply_risk?.mid_term_supply) ??
      midTermPipeline;
    const forwardSupplyLong =
      normalizeCount(stableData?.pipeline_intelligence?.long_term_supply) ??
      longTermPipeline;
    const forwardRiskBand = supplyRiskBand ?? "MODERATE";
    const forwardRiskBandClass =
      forwardRiskBand === "LOW"
        ? "bg-emerald-50 text-emerald-700"
        : forwardRiskBand === "MODERATE"
          ? "bg-amber-50 text-amber-700"
          : "bg-red-50 text-red-700";
    const supplyRatioBase = Math.max(forwardSupplyShort + forwardSupplyMid, 1);
    const frontLoadedRatio = forwardSupplyShort / supplyRatioBase;
    const pipelineStructureLabel =
      frontLoadedRatio > 0.62
        ? "Front-loaded"
        : frontLoadedRatio >= 0.38
          ? "Balanced"
          : "Long-duration";
    const pipelineProgress = Math.max(0, Math.min(100, Math.round(frontLoadedRatio * 100)));
    const concentrationRatio =
      normalizeRatio(stableData?.concentration_intelligence?.top_market_concentration) ??
      normalizeRatio(stableData?.supply_risk?.top_market_concentration);
    const concentrationPercent = concentrationRatio == null ? "—" : ratioToPercent(concentrationRatio);
    const concentrationLevel =
      concentrationRatio != null && concentrationRatio > 0.5
        ? "High concentration"
        : concentrationRatio != null && concentrationRatio >= 0.3
          ? "Moderate concentration"
          : "Diversified";
    const concentrationCommentary =
      concentrationRatio != null && concentrationRatio > 0.5
        ? "Upcoming supply is highly concentrated in core corridor."
        : "Pipeline is diversified across multiple growth zones.";
    const forwardInstitutionalCommentary =
      forwardRiskBand === "HIGH"
        ? "Near-term supply concentration may create absorption pressure depending on demand cycles."
        : forwardRiskBand === "MODERATE"
          ? "Supply remains manageable but corridor-level demand strength will be critical."
          : "Supply visibility supports pricing stability and controlled execution.";
    const allocationStance = (() => {
      const score = convictionScore ?? 0;
      if (score > 0 && score < 35) return "Avoid";
      if (sponsorConvictionBand === "HIGH" && forwardRiskBand === "LOW") return "Overweight";
      if (sponsorConvictionBand === "HIGH" && forwardRiskBand === "MODERATE") return "Accumulate";
      if (sponsorConvictionBand === "SELECTIVE") return "Neutral";
      if (sponsorConvictionBand === "HIGH RISK" || forwardRiskBand === "HIGH") return "Underweight";
      return "Neutral";
    })();
    const allocationStanceClass =
      allocationStance === "Overweight"
        ? "bg-emerald-100 text-emerald-800"
        : allocationStance === "Accumulate"
          ? "bg-blue-100 text-blue-800"
          : allocationStance === "Neutral"
            ? "bg-amber-100 text-amber-800"
            : allocationStance === "Underweight"
              ? "bg-orange-100 text-orange-800"
              : "bg-red-100 text-red-800";
    const capitalStrategySummaryLine = `${capitalStrategyValue} + ${liquidityCycleValue}`;
    const capitalStrategySummaryNarrative = (() => {
      const strategy = capitalStrategyValue.toLowerCase();
      const liquidity = liquidityCycleValue.toLowerCase();
      if (strategy.includes("growth") && (liquidity.includes("short") || forwardRiskBand === "HIGH")) {
        return "Growth orientation with short-cycle pressure warrants phased capital release and tighter entry discipline.";
      }
      if (strategy.includes("preservation") || strategy.includes("core")) {
        return "Capital preservation posture supports concentration in corridors with stronger liquidity continuity.";
      }
      if (liquidity.includes("long")) {
        return "Long-cycle liquidity visibility supports staggered deployment for downside protection.";
      }
      return "Current strategy indicates selective deployment aligned to corridor-level absorption stability.";
    })();
    const entryZoneRows = entryCorridorRows.slice(0, 3);
    const avoidZoneNarrative =
      forwardRiskBand === "HIGH" && concentrationRatio != null && concentrationRatio >= 0.5
        ? "Near-term supply pressure in concentrated corridors suggests avoiding oversized allocation in launch-heavy pockets."
        : "Avoid zones remain limited; continue monitoring corridor diversification and near-term launch velocity.";
    const investmentHorizon = (() => {
      if (pipelineStructureLabel === "Long-duration") return "Core";
      if (pipelineStructureLabel === "Balanced") return "Core+";
      return "Opportunistic";
    })();
    const allocationMemo = `The sponsor demonstrates ${executionReliabilityLevel.toLowerCase()} execution with ${premiumPositioningLevel.toLowerCase()} premium positioning across demand corridors. Allocation stance is ${allocationStance.toLowerCase()} given ${forwardRiskBand.toLowerCase()} supply risk and ${corridorDominanceLevel.toLowerCase()} corridor discipline. Recommended deployment should remain ${investmentHorizon.toLowerCase()} with phased entry aligned to liquidity-cycle visibility.`;
    const pricingPowerScore =
      normalizeCount(stableData?.pricing_power?.pricing_power_score) ??
      (() => {
        const premium = premiumRatioForDrivers ?? 0;
        const concentration = concentrationRatioForDrivers ?? 0;
        const institutional = institutionalSignalForDrivers === true ? 1 : institutionalSignalForDrivers === false ? 0.3 : 0.55;
        return Math.round(((premium * 0.4) + (concentration * 0.35) + (institutional * 0.25)) * 100);
      })();
    const pricingPowerBand = normalizePricingPowerBand(stableData?.pricing_power?.pricing_power_band) ??
      (pricingPowerScore >= 70 ? "HIGH" : pricingPowerScore >= 45 ? "MODERATE" : "LOW");
    const pricingPowerBandClass =
      pricingPowerBand === "HIGH"
        ? "bg-emerald-100 text-emerald-800"
        : pricingPowerBand === "MODERATE"
          ? "bg-amber-100 text-amber-800"
          : "bg-red-100 text-red-800";
    const premiumExposureInterpretation =
      (premiumRatioForDrivers ?? 0) > 0.4
        ? "Strong premium positioning supporting margin resilience."
        : "Balanced or mass positioning with moderate pricing leverage.";
    const corridorPricingInterpretation =
      (concentrationRatioForDrivers ?? 0) > 0.5
        ? "Focused corridor exposure enhances pricing discipline."
        : "Diversified markets may dilute pricing power.";
    const cyclicalitySensitivity =
      pricingPowerBand === "HIGH"
        ? "Premium strategy increases cyclical volatility but supports long-term value."
        : pricingPowerBand === "LOW"
          ? "Mass positioning supports demand stability but limits upside."
          : "Balanced premium exposure supports selective upside with moderated cycle risk.";
    const compositeRanking = (stableData?.developer_composite_ranking ?? stableData?.composite_ranking) as
      | Record<string, unknown>
      | null
      | undefined;
    const cityRank = normalizeCount(
      compositeRanking?.city_rank ??
      compositeRanking?.rank
    );
    const totalCityDevelopers = normalizeCount(
      compositeRanking?.total_developers ??
      compositeRanking?.city_developer_count ??
      compositeRanking?.developer_count
    );
    const computedTopPercentile = cityRank != null && totalCityDevelopers != null && totalCityDevelopers > 0
      ? Math.max(1, Math.round((cityRank / totalCityDevelopers) * 100))
      : null;
    const percentilePositionRaw = normalizeCount(
      compositeRanking?.percentile_position ??
      compositeRanking?.percentile_rank ??
      compositeRanking?.top_percentile
    );
    const percentilePosition = percentilePositionRaw ?? computedTopPercentile;
    const cityRankLabel = toRenderableText(
      compositeRanking?.city ??
      compositeRanking?.city_name,
      "City"
    );
    const compositeScoreRaw = normalizeCount(
      compositeRanking?.composite_score ??
      compositeRanking?.score
    );
    const compositeScore = compositeScoreRaw == null ? null : Math.max(0, Math.min(100, compositeScoreRaw));
    const cityMedianCompositeScoreRaw = normalizeCount(
      compositeRanking?.city_median_composite_score ??
      compositeRanking?.city_median_score ??
      compositeRanking?.median_score
    );
    const cityMedianCompositeScore = cityMedianCompositeScoreRaw == null
      ? 50
      : Math.max(0, Math.min(100, cityMedianCompositeScoreRaw));
    const compositeScoreInterpretation =
      percentilePosition != null && percentilePosition <= 20
        ? "Positioned among the strongest institutional-grade developers."
        : percentilePosition != null && percentilePosition <= 60
          ? "Balanced positioning with selective investment appeal."
          : "Higher risk relative to peers.";
    const benchmarkConviction = normalizeCount(
      compositeRanking?.conviction_score ?? convictionScoreRounded
    );
    const benchmarkConvictionAvg = normalizeCount(
      compositeRanking?.city_avg_conviction_score ??
      compositeRanking?.avg_conviction_score
    );
    const benchmarkPricing = normalizeCount(
      compositeRanking?.pricing_power_score ?? pricingPowerScore
    );
    const benchmarkPricingAvg = normalizeCount(
      compositeRanking?.city_avg_pricing_power_score ??
      compositeRanking?.avg_pricing_power_score
    );
    const benchmarkSupply = normalizeCount(
      compositeRanking?.supply_risk_score ??
      (forwardRiskBand === "LOW" ? 25 : forwardRiskBand === "MODERATE" ? 55 : 85)
    );
    const benchmarkSupplyAvg = normalizeCount(
      compositeRanking?.city_avg_supply_risk_score ??
      compositeRanking?.avg_supply_risk_score
    );
    const investorStyleFit =
      percentilePosition != null && percentilePosition <= 20 && forwardRiskBand === "LOW"
        ? "Core"
        : percentilePosition != null && percentilePosition <= 20 && forwardRiskBand === "MODERATE"
          ? "Core+"
          : "Opportunistic";
    const investorStyleCommentary =
      investorStyleFit === "Core"
        ? "High relative rank with controlled risk supports core capital mandates."
        : investorStyleFit === "Core+"
          ? "Strong relative rank with moderate cycle risk fits core-plus deployment."
          : "Relative positioning supports opportunistic exposure with higher dispersion risk.";
    const investorStyleClass =
      investorStyleFit === "Core"
        ? "border border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
        : investorStyleFit === "Core+"
          ? "border border-blue-400/40 bg-blue-500/20 text-blue-200"
          : "border border-amber-400/40 bg-amber-500/20 text-amber-200";
    const geographicRows = parseGeographicDeploymentRows(stableData?.entry_corridor_strategy);
    const byShareDesc = (a: GeographicBucketRow, b: GeographicBucketRow) => {
      const aShare = a.sharePercent ?? -1;
      const bShare = b.sharePercent ?? -1;
      if (bShare !== aShare) return bShare - aShare;
      return (b.projectCount ?? 0) - (a.projectCount ?? 0);
    };
    const coreRowsAll = geographicRows.filter((row) => row.bucket === "CORE").sort(byShareDesc);
    const expansionRowsAll = geographicRows.filter((row) => row.bucket === "EXPANSION").sort(byShareDesc);
    const experimentalRowsAll = geographicRows.filter((row) => row.bucket === "EXPERIMENTAL").sort(byShareDesc);
    const coreRows = coreRowsAll.slice(0, 3);
    const expansionRows = expansionRowsAll.slice(0, 3);
    const experimentalRows = experimentalRowsAll.slice(0, 3);
    const geographicCommentary = (() => {
      const totalRows = geographicRows.length;
      const coreShareTotal = coreRowsAll.reduce((sum, row) => sum + (row.sharePercent ?? 0), 0);
      const expansionCount = expansionRowsAll.length;
      const experimentalCount = experimentalRowsAll.length;

      if (coreRowsAll.length >= 2 && coreShareTotal >= 55) {
        return "Developer demonstrates disciplined geographic focus with concentrated deployment in high-liquidity corridors.";
      }
      if (expansionCount + experimentalCount >= Math.max(3, coreRowsAll.length + 1) && totalRows >= 5) {
        return "Rapid expansion across multiple corridors indicates deployment phase.";
      }
      return "Geographic diversification suggests opportunistic expansion strategy.";
    })();
    const structuredInvestmentThesis = `The sponsor reflects ${sponsorConvictionBandLabel.toLowerCase()} with ${pricingPowerBand.toLowerCase()} pricing power and ${forwardRiskBand.toLowerCase()} supply risk conditions. Capital strategy is positioned as ${capitalStrategyValue.toLowerCase()} through a ${developerCyclePosition.toLowerCase()} cycle posture, with corridor focus anchored in ${corridorFocusText.toLowerCase()}. Allocation suits ${capitalAllocationStyle.toLowerCase()} mandates when deployed in phased tranches against near-term supply visibility.`;
    const parseCompareSlugs = (raw: string) =>
      raw
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0 && value !== slug)
        .filter((value, index, arr) => arr.indexOf(value) === index)
        .slice(0, 3);
    const additionalCompareSlugs = parseCompareSlugs(compareParam);
    const compareSlugs = [slug, ...additionalCompareSlugs].slice(0, 4);

    const compareRowsRaw = await Promise.all(
      compareSlugs.map(async (compareSlug) => {
        const compareData = await getDeveloperPageData(compareSlug);
        if (!compareData?.profile) return null;

        const compareUnderwriting = compareData.underwriting ?? null;
        const compareSupplyRisk = compareData.supply_risk ?? null;
        const compareSponsorConviction = compareData.sponsor_conviction ?? null;
        const compareProductMix = compareData.product_mix ?? null;

        const compareDeliveryRatio = normalizeRatio(compareUnderwriting?.delivery_ratio);
        const executionScore =
          compareDeliveryRatio == null
            ? null
            : Math.max(0, Math.min(100, (compareDeliveryRatio <= 1 ? compareDeliveryRatio * 100 : compareDeliveryRatio)));
        const pipelineScaleScore = normalizeCount(compareUnderwriting?.active_projects);
        const premiumExposureScore = (() => {
          const ratio = normalizeRatio(compareUnderwriting?.premium_project_ratio);
          if (ratio == null) return null;
          return Math.max(0, Math.min(100, ratio <= 1 ? ratio * 100 : ratio));
        })();
        const supplyRiskBandRaw = normalizeRiskBand(compareSupplyRisk?.supply_risk_band);
        const supplyRiskScore = (() => {
          if (supplyRiskBandRaw === "LOW") return 25;
          if (supplyRiskBandRaw === "MODERATE") return 55;
          if (supplyRiskBandRaw === "HIGH") return 85;
          const concentration = normalizeRatio(compareSupplyRisk?.top_market_concentration);
          return concentration == null ? null : Math.max(0, Math.min(100, concentration <= 1 ? concentration * 100 : concentration));
        })();
        const corridorConcentrationScore = (() => {
          const ratio = normalizeRatio(compareSupplyRisk?.top_market_concentration);
          if (ratio == null) return null;
          return Math.max(0, Math.min(100, ratio <= 1 ? ratio * 100 : ratio));
        })();
        const sponsorConvictionScore = normalizeCount(
          compareSponsorConviction?.conviction_score ?? compareUnderwriting?.conviction_score
        );

        const institutionalAlignmentText = toRenderableText(
          compareSponsorConviction?.institutional_alignment ?? compareUnderwriting?.institutional_grade_final,
          "Not available"
        );
        const premiumPositioningText = toRenderableText(
          compareSponsorConviction?.premium_positioning ?? compareUnderwriting?.premium_positioning_final,
          "Not available"
        );
        const sponsorBandText =
          normalizeConvictionBand(compareSponsorConviction?.sponsor_conviction_band ?? compareUnderwriting?.sponsor_conviction_band) ??
          "Not available";

        return {
          slug: compareSlug,
          name: toRenderableText(compareData.profile?.brand_name, compareSlug),
          executionScore,
          pipelineScaleScore,
          premiumExposureScore,
          supplyRiskScore,
          corridorConcentrationScore,
          sponsorConvictionScore,
          institutionalAlignmentText,
          premiumPositioningText,
          supplyRiskBandText: supplyRiskBandRaw ?? "Not available",
          sponsorBandText,
          luxuryExposureText: ratioToPercent(compareProductMix?.luxury_corridor_exposure ?? compareUnderwriting?.premium_project_ratio),
        };
      })
    );
    const compareRows = compareRowsRaw.filter((row): row is NonNullable<typeof row> => Boolean(row));
    const compareOptions = await getCompareDeveloperOptions();
    const compareSelection = additionalCompareSlugs;
    const createTabHref = (tab: string) => {
      const params = new URLSearchParams();
      if (sortBy) params.set("sort", sortBy);
      if (compareSelection.length > 0) params.set("compare", compareSelection.join(","));
      params.set("tab", tab);
      return `/developers/${slug}?${params.toString()}`;
    };

    function getDerivedStatus(project: any) {
      const todayDate = new Date();
      const completion = project?.proposed_completion_date
        ? new Date(project.proposed_completion_date)
        : null;

      if (!completion || Number.isNaN(completion.getTime())) return "Under Review";
      if (completion < todayDate) return "Completed";

      const diffInMonths =
        (completion.getFullYear() - todayDate.getFullYear()) * 12 +
        (completion.getMonth() - todayDate.getMonth());

      if (diffInMonths > 24) return "Early Stage";
      if (diffInMonths > 6) return "Under Construction";

      return "Nearing Completion";
    }

    const statusBadgeClass = (derivedStatus: string) => {
      if (derivedStatus === "Completed") {
        return "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30";
      }
      if (derivedStatus === "Under Construction") {
        return "bg-blue-500/20 text-blue-300 border border-blue-400/30";
      }
      if (derivedStatus === "Early Stage") {
        return "bg-indigo-500/20 text-indigo-300 border border-indigo-400/30";
      }
      if (derivedStatus === "Nearing Completion") {
        return "bg-amber-500/20 text-amber-300 border border-amber-400/30";
      }
      return "bg-slate-500/20 text-slate-300 border border-slate-400/30";
    };

    const portfolioRows = [...projects].sort((a: any, b: any) => {
      if (sortBy === "status") {
        return getDerivedStatus(a).localeCompare(
          getDerivedStatus(b)
        );
      }
      const aTime = parseDate(a?.proposed_completion_date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bTime = parseDate(b?.proposed_completion_date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
    const projectCardRows = portfolioRows
      .map((project: DeveloperPageRpcProject) => {
        const projectSlug = resolveProjectSlug(project);
        if (!projectSlug) return null;
        return {
          project,
          href: buildProjectUrl("hyderabad", projectSlug),
        };
      })
      .filter(
        (item): item is { project: DeveloperPageRpcProject; href: string } =>
          Boolean(item)
      );

    return (
      <div className="bg-[#0B1220] min-h-screen">
        <div className="definitions-root mx-auto flex max-w-7xl flex-col px-6 py-10 text-[#F9FAFB]">
          {/* Hero */}
          <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
              <div className="space-y-3">
                {profile?.logo_url ? (
                  <img
                    src={profile.logo_url}
                    alt={`${profile?.brand_name ?? "Developer"} logo`}
                    className="h-12 max-w-[180px] rounded object-contain"
                  />
                ) : null}
                <h1 className="text-3xl font-bold">{profile?.brand_name}</h1>
                {profile?.tagline ? (
                  <p className="text-sm text-white/70">{profile?.tagline}</p>
                ) : null}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3">
                    <div className="text-[11px] uppercase tracking-wide text-white/60">Total</div>
                    <div className="text-xl font-semibold">{totalProjects}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3">
                    <div className="text-[11px] uppercase tracking-wide text-white/60">Active</div>
                    <div className="text-xl font-semibold">{activeProjects}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3">
                    <div className="text-[11px] uppercase tracking-wide text-white/60">Completed</div>
                    <div className="text-xl font-semibold">{deliveredProjects}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
                  <div className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-white/60">Execution Strength</p>
                    <p className="text-sm font-semibold text-white">{deliveryStrengthLabel}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-white/60">Corridor Focus</p>
                    <p className="text-sm font-semibold text-white">{corridorStrategy}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-white/60">Premium Exposure</p>
                    <p className="text-sm font-semibold text-white">{premiumExposure}</p>
                  </div>
                </div>
              </div>

              {topMicroMarkets.length > 0 ? (
                <div className="border-l border-white/10 pl-6">
                  <div className="text-xs uppercase tracking-wide text-white/60">Micro Markets</div>
                  <div className="mt-2 space-y-1">
                    {topMicroMarkets.map((market) => (
                      <div key={market.name} className="text-sm text-white/90">
                        {market.name}
                      </div>
                    ))}
                    {microMarketStats.length > 5 ? (
                      <div className="text-xs text-white/60">+{microMarketStats.length - 5} more</div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <div className="mt-4 flex justify-end">
            <label
              htmlFor="show-definitions"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-slate-900/70 px-3 py-1.5 text-xs text-white/75 hover:border-white/25 hover:text-white/90"
            >
              <input
                id="show-definitions"
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-white/30 bg-slate-900 accent-[#C9A227]"
              />
              <span>Show Definitions</span>
            </label>
          </div>
          <style>{`
            .definitions-root .definition-inline {
              display: none;
            }
            .definitions-root:has(#show-definitions:checked) .definition-inline {
              display: block;
              animation: definition-fade 150ms ease-out;
            }
            .definitions-root:has(#show-definitions:checked) .metric-highlight {
              box-shadow: inset 0 0 0 1px rgba(201, 162, 39, 0.45);
            }
            @keyframes definition-fade {
              from {
                opacity: 0;
                transform: translateY(-2px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>

          {/* Relative Positioning & Market Rank */}
          <section className="mt-6 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="mb-6 text-2xl font-semibold">Relative Positioning &amp; Market Rank</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="metric-highlight rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 xl:col-span-2">
                <p className="text-xs uppercase tracking-wide text-white/60">
                  Composite Rank
                  <InfoTooltip
                    label="Composite rank definition"
                    content="Relative positioning versus Hyderabad developers using conviction, pricing, and supply metrics."
                  />
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  Rank {cityRank != null ? `#${cityRank}` : "—"}
                  {totalCityDevelopers != null ? ` out of ${totalCityDevelopers}` : ""} {cityRankLabel} Developers
                </p>
                <p className="mt-2 text-lg font-medium text-white/90">
                  Top {percentilePosition != null ? `${percentilePosition}%` : "—"}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-white/70">
                  Composite ranking derived from conviction, pricing power, and supply risk.
                </p>
                <p className="definition-inline mt-2 text-xs leading-relaxed text-white/60">
                  This metric shows relative sponsor positioning inside the city peer set after normalizing conviction, pricing resilience, and supply-cycle pressure.
                </p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                <p className="text-xs uppercase tracking-wide text-white/60">Composite Score</p>
                <p className="mt-2 text-3xl font-semibold text-white">{compositeScore != null ? compositeScore : "—"}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Developer</span>
                    <span>{compositeScore != null ? compositeScore : "—"}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-white/80"
                      style={{ width: `${Math.max(0, Math.min(100, compositeScore ?? 0))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>City median</span>
                    <span>{cityMedianCompositeScore}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-white/40"
                      style={{ width: `${Math.max(0, Math.min(100, cityMedianCompositeScore))}%` }}
                    />
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/80">{compositeScoreInterpretation}</p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                <p className="text-xs uppercase tracking-wide text-white/60">Benchmark Comparison</p>
                <div className="mt-4 space-y-4">
                  {[
                    { label: "Conviction", value: benchmarkConviction, avg: benchmarkConvictionAvg },
                    { label: "Pricing power", value: benchmarkPricing, avg: benchmarkPricingAvg },
                    { label: "Supply risk", value: benchmarkSupply, avg: benchmarkSupplyAvg },
                  ].map((metric) => (
                    <div key={metric.label}>
                      <div className="mb-1 flex items-center justify-between text-xs text-white/60">
                        <span>{metric.label}</span>
                        <span>{metric.value != null ? metric.value : "—"} vs {metric.avg != null ? metric.avg : "—"}</span>
                      </div>
                      <div className="relative h-2 rounded-full bg-white/10">
                        <div
                          className="absolute left-0 top-0 h-2 rounded-full bg-slate-100/90"
                          style={{ width: `${Math.max(0, Math.min(100, metric.value ?? 0))}%` }}
                        />
                        <div
                          className="absolute top-0 h-2 w-[2px] bg-amber-300/90"
                          style={{ left: `${Math.max(0, Math.min(100, metric.avg ?? 0))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                <p className="text-xs uppercase tracking-wide text-white/60">Investor Style Fit</p>
                <div className="mt-3 inline-flex">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${investorStyleClass}`}>
                    {investorStyleFit}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/80">{investorStyleCommentary}</p>
              </article>
            </div>
          </section>

          <nav className="order-1 mt-4 flex flex-wrap gap-2">
            {[
              { id: "capital-intelligence", label: "Capital Intelligence" },
              { id: "projects", label: "Projects" },
              { id: "legal-entities", label: "Legal Entities" },
              { id: "governance", label: "Governance" },
              { id: "corporate-profile", label: "Corporate Profile" },
            ].map((tab) => (
              <Link
                key={tab.id}
                href={createTabHref(tab.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  activeTab === tab.id
                    ? "border-[#C9A227] text-[#C9A227]"
                    : "border-white/20 text-white/70 hover:border-white/30 hover:text-white/85"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          {/* Institutional Snapshot */}
          <section className="order-2 hidden mt-6 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="mb-6 text-2xl font-semibold">Developer Institutional Snapshot</h2>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Execution Strength</p>
                <p className="mt-2 text-xl font-semibold text-white">{deliveryStrengthLabel}</p>
                <p className="mt-1 text-xs text-white/60">Delivery ratio: {deliveryRatioText}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Corridor Strategy</p>
                <p className="mt-2 text-xl font-semibold text-white">{corridorStrategy}</p>
                <p
                  className="mt-1 text-xs text-white/60"
                  title="Indicates concentration of capital across prime corridors."
                >
                  Indicates concentration of capital across prime corridors.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Premium Exposure</p>
                <p className="mt-2 text-xl font-semibold text-white">{premiumExposure}</p>
                <p
                  className="mt-1 text-xs text-white/60"
                  title="Reflects luxury pricing power and UHNI demand."
                >
                  Reflects luxury pricing power and UHNI demand.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Core Wealth Exposure</p>
                <p className="mt-2 text-xl font-semibold text-white">{coreWealthExposure}</p>
                <p
                  className="mt-1 text-xs text-white/60"
                  title="Indicates suitability for institutional and large capital allocation."
                >
                  Indicates suitability for institutional and large capital allocation.
                </p>
              </div>
            </div>
          </section>

          {/* Capital Positioning */}
          <section className="order-2 hidden mt-8 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="mb-4 text-2xl font-semibold">Capital Positioning</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Institutional Alignment</p>
                <p className="mt-2 text-lg font-semibold text-white">{institutionalAlignment}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Premium Positioning</p>
                <p className="mt-2 text-lg font-semibold text-white">{premiumPositioning}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/75">{capitalPositioningNarrative}</p>
          </section>

          {/* Execution Profile */}
          <section className="order-9 mt-12 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="mb-6 text-2xl font-semibold">Execution Profile</h2>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Total Projects</p>
                <p className="mt-2 text-2xl font-semibold">{totalProjects}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Active Projects</p>
                <p className="mt-2 text-2xl font-semibold">{activeProjects}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Delivered Projects</p>
                <p className="mt-2 text-2xl font-semibold">{deliveredProjects}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Execution Narrative</p>
                <p className="mt-2 text-base font-semibold">{executionNarrative}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/75">{interpretationNarratives.execution}</p>
          </section>

          {/* Institutional Capital Strategy */}
          <section className="order-8 mt-8 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="mb-6 text-2xl font-semibold">Institutional Capital Strategy</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-900 p-5">
                <p className="text-xs uppercase tracking-wide text-white/60">Capital Strategy</p>
                <p className="mt-2 text-lg font-semibold text-white">{capitalStrategyValue}</p>
                <p className="mt-2 text-sm text-white/70">{capitalStrategyContext}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900 p-5">
                <p className="text-xs uppercase tracking-wide text-white/60">Liquidity Cycle</p>
                <p className="mt-2 text-lg font-semibold text-white">{liquidityCycleValue}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-white/60">Short</p>
                    <p className="font-semibold text-white">{liquidityShortTerm}</p>
                  </div>
                  <div>
                    <p className="text-white/60">Mid</p>
                    <p className="font-semibold text-white">{liquidityMidTerm}</p>
                  </div>
                  <div>
                    <p className="text-white/60">Long</p>
                    <p className="font-semibold text-white">{liquidityLongTerm}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-900 p-5">
                <p className="text-xs uppercase tracking-wide text-white/60">Entry Corridors</p>
                <div className="mt-3 space-y-2">
                  {entryCorridorRows.length > 0 ? (
                    entryCorridorRows.map((row) => (
                      <div
                        key={`${row.corridorName}-${row.rank}`}
                        className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-white">{row.corridorName}</p>
                          <p className="text-white/70">{row.projectCount ?? "—"} projects</p>
                        </div>
                        <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs text-white/80">
                          Rank {row.rank}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/70">Entry corridor visibility is currently limited.</p>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900 p-5">
                <p className="text-xs uppercase tracking-wide text-white/60">Allocation Lens</p>
                <p className="mt-2 text-lg font-semibold text-white">{capitalAllocationStyle}</p>
                <p className="mt-2 text-sm text-white/70">Capital Allocation Style</p>
              </div>
            </div>
          </section>

          {/* Developer Comparison Framework */}
          <section className="order-11 mt-8 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Developer Comparison Framework</h2>
                <p className="mt-2 text-sm text-white/70">
                  Scorecard comparison across execution, pipeline, premium exposure, supply risk, corridor concentration, and sponsor conviction.
                </p>
              </div>
              <form method="get" className="flex w-full flex-col gap-2 lg:w-auto">
                <input type="hidden" name="sort" value={sortBy} />
                <label htmlFor="compare-developers" className="text-xs uppercase tracking-wide text-white/60">
                  Compare up to 3 additional developers
                </label>
                <div className="flex gap-2">
                  <select
                    id="compare-developers"
                    name="compare"
                    defaultValue={compareSelection}
                    multiple
                    className="min-h-[116px] rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
                  >
                    {compareOptions
                      .filter((option) => option.slug !== slug)
                      .map((option) => (
                        <option key={option.slug} value={option.slug}>
                          {option.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/85 hover:bg-slate-900"
                  >
                    Apply
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900/60 text-white/70">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Developer</th>
                    <th className="px-4 py-3 text-left font-medium">Execution Strength</th>
                    <th className="px-4 py-3 text-left font-medium">Pipeline Scale</th>
                    <th className="px-4 py-3 text-left font-medium">Premium Exposure</th>
                    <th className="px-4 py-3 text-left font-medium">Supply Risk</th>
                    <th className="px-4 py-3 text-left font-medium">Corridor Concentration</th>
                    <th className="px-4 py-3 text-left font-medium">Sponsor Conviction</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row) => (
                    <tr key={row.slug} className="border-t border-white/10">
                      <td className="px-4 py-3 font-semibold text-white">{row.name}</td>
                      <td className="px-4 py-3 text-white/85">{row.executionScore ?? "—"}</td>
                      <td className="px-4 py-3 text-white/85">{row.pipelineScaleScore ?? "—"}</td>
                      <td className="px-4 py-3 text-white/85">
                        {row.premiumExposureScore ?? "—"}
                        <span className="ml-2 text-xs text-white/60">({row.luxuryExposureText})</span>
                      </td>
                      <td className="px-4 py-3 text-white/85">
                        {row.supplyRiskScore ?? "—"}
                        <span className="ml-2 text-xs text-white/60">({row.supplyRiskBandText})</span>
                      </td>
                      <td className="px-4 py-3 text-white/85">{row.corridorConcentrationScore ?? "—"}</td>
                      <td className="px-4 py-3 text-white/85">
                        {row.sponsorConvictionScore ?? "—"}
                        <span className="ml-2 text-xs text-white/60">({row.sponsorBandText})</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Supply Shock Risk */}
          <section className="order-20 hidden mt-8 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="mb-6 text-2xl font-semibold">Supply Shock Risk</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Risk Band</p>
                <div className="mt-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${supplyRiskBadgeClass}`}>
                    {supplyRiskBand ?? "Not available"}
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Short-term Supply</p>
                <p className="mt-2 text-2xl font-semibold">{shortTermSupplyRisk ?? "—"}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Corridor Concentration</p>
                <p className="mt-2 text-2xl font-semibold">{topMarketConcentration}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/75">{supplyRiskInterpretation}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/75">{interpretationNarratives.supplyShock}</p>
          </section>

          {/* Product Positioning */}
          <section className="order-20 hidden mt-8 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="mb-6 text-2xl font-semibold">Product Positioning</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Luxury Corridor Exposure</p>
                <p className="mt-2 text-2xl font-semibold">{luxuryCorridorExposure}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Product Positioning Category</p>
                <p className="mt-2 text-lg font-semibold">{productPositioningCategory}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Institutional Interpretation</p>
                <p className="mt-2 text-sm leading-relaxed text-white/80">{productMixInterpretation}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/75">{interpretationNarratives.premiumExposure}</p>
          </section>

          {/* Pipeline Intelligence */}
          <section className="order-10 mt-8 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="mb-6 text-2xl font-semibold">Pipeline Intelligence</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Short-term Supply</p>
                <p className="mt-2 text-2xl font-semibold">{shortTermPipeline}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Mid-term Supply</p>
                <p className="mt-2 text-2xl font-semibold">{midTermPipeline}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Long-term Supply</p>
                <p className="mt-2 text-2xl font-semibold">{longTermPipeline}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/75">{oversupplyRiskLabel}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/75">{interpretationNarratives.pipeline}</p>
          </section>

          {/* Forward Supply & Absorption Risk */}
          <section className="order-5 mt-8 rounded-2xl bg-white p-6 text-slate-900 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-6 text-2xl font-semibold text-slate-900">Forward Supply &amp; Absorption Risk</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="metric-highlight rounded-2xl bg-slate-900 p-5 text-white shadow-sm xl:col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate-300">
                  Supply Risk (0-36 months)
                  <InfoTooltip
                    label="Supply risk definition"
                    content="Assesses near-term supply pressure and potential pricing or absorption risk across core corridors."
                  />
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${forwardRiskBandClass}`}>
                    {forwardRiskBand}
                  </span>
                  <span className="text-xs text-slate-300">Time horizon: 0-36 months</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Short-term supply</p>
                    <p className="mt-1 text-3xl font-semibold">{forwardSupplyShort}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Mid-term supply</p>
                    <p className="mt-1 text-3xl font-semibold">{forwardSupplyMid}</p>
                  </div>
                </div>
                <p className="definition-inline mt-3 text-xs leading-relaxed text-slate-300/90">
                  Supply risk captures the concentration and timing of launch inventory likely to influence absorption velocity and short-cycle pricing.
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Pipeline Structure</p>
                <p className="mt-2 text-lg font-semibold">{pipelineStructureLabel}</p>
                <div className="mt-3 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-slate-700"
                    style={{ width: `${pipelineProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Short-term share: {pipelineProgress}% | Long-term supply: {forwardSupplyLong}
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Corridor Concentration</p>
                <p className="mt-2 text-lg font-semibold">{concentrationPercent}</p>
                <p className="mt-1 text-xs text-slate-600">{concentrationLevel}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{concentrationCommentary}</p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2 xl:col-span-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Institutional Commentary</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{forwardInstitutionalCommentary}</p>
              </article>
            </div>
          </section>

          {/* Sponsor Conviction */}
          <section className="order-3 mt-8 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="mb-6 text-2xl font-semibold">Sponsor Conviction &amp; Strategic Discipline</h2>
            <div className="grid gap-4">
              <article className="metric-highlight rounded-2xl border border-white/10 bg-slate-900 p-6">
                <p className="text-xs uppercase tracking-wide text-white/60">
                  Sponsor Conviction Score
                  <InfoTooltip
                    label="Sponsor conviction score definition"
                    content="Composite sponsor quality score based on execution history, corridor discipline, premium positioning, and institutional alignment."
                  />
                </p>
                <p className="mt-3 text-4xl font-semibold text-white">
                  {convictionScoreRounded ?? "—"} / 100 — {sponsorConvictionBandLabel}
                </p>
                <div className="mt-4 inline-flex">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sponsorConvictionBandClass}`}>
                    {sponsorConvictionBand ?? "Not available"}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/75">
                  Composite score based on execution, corridor discipline, premium positioning, and institutional alignment.
                </p>
                <p className="definition-inline mt-2 text-xs leading-relaxed text-white/60">
                  A higher score indicates stronger execution consistency and tighter corridor discipline under institutional underwriting filters.
                </p>
              </article>

              <div className="grid gap-4 lg:grid-cols-3">
                <article className="rounded-2xl border border-white/10 bg-slate-900 p-5 lg:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-white/60">Driver Breakdown</p>
                  <div className="mt-4 space-y-4">
                    {[
                      { label: "Execution strength", value: driverExecutionPercent },
                      { label: "Premium positioning", value: driverPremiumPercent },
                      { label: "Institutional alignment", value: driverInstitutionalPercent },
                      { label: "Corridor discipline", value: driverCorridorPercent },
                    ].map((driver) => (
                      <div key={driver.label}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-white/75">{driver.label}</span>
                          <span className="font-semibold text-white">{driver.value == null ? "—" : `${Math.round(driver.value)}%`}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800">
                          <div
                            className="h-2 rounded-full bg-white/80"
                            style={{ width: `${Math.max(0, Math.min(100, driver.value ?? 0))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                  <p className="text-xs uppercase tracking-wide text-white/60">Institutional Interpretation</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/80">{sponsorInterpretation}</p>
                </article>

                <article className="rounded-2xl border border-white/10 bg-slate-900 p-5 lg:col-span-3">
                  <p className="text-xs uppercase tracking-wide text-white/60">Strategy Stability</p>
                  <p className="mt-2 text-lg font-semibold text-white">{strategyStability}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">{strategyStabilityCommentary}</p>
                </article>
              </div>
            </div>
          </section>

          {/* Institutional Allocation Framework */}
          <section className="order-4 mt-8 rounded-2xl bg-white p-6 text-slate-900 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-6 text-2xl font-semibold">Institutional Allocation Framework</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <article className="metric-highlight rounded-2xl bg-slate-900 p-6 text-white xl:col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate-300">
                  Allocation Stance
                  <InfoTooltip
                    label="Allocation stance definition"
                    content="Recommended capital deployment stance based on conviction, supply cycle, and pricing power."
                  />
                </p>
                <p className="mt-3 text-4xl font-semibold">{allocationStance}</p>
                <div className="mt-4 inline-flex">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${allocationStanceClass}`}>
                    {allocationStance}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  Derived from execution strength, supply cycle, corridor discipline, and capital strategy.
                </p>
                <p className="definition-inline mt-2 text-xs leading-relaxed text-slate-300/90">
                  The stance converts multi-factor risk and quality signals into a deploy/hold/avoid capital posture for portfolio construction.
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Capital Strategy Summary</p>
                <p className="mt-2 text-lg font-semibold">{capitalStrategySummaryLine}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{capitalStrategySummaryNarrative}</p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Entry Zones</p>
                <div className="mt-3 space-y-2">
                  {entryZoneRows.length > 0 ? (
                    entryZoneRows.map((zone) => (
                      <div key={`${zone.corridorName}-${zone.rank}`} className="rounded-lg border border-slate-200 px-3 py-2">
                        <p className="text-sm font-semibold">{zone.corridorName}</p>
                        <p className="text-xs text-slate-600">{zone.projectCount ?? "—"} projects</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600">Entry visibility currently evolving.</p>
                  )}
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Avoid Zones</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{avoidZoneNarrative}</p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Investment Horizon</p>
                <p className="mt-2 text-lg font-semibold">{investmentHorizon}</p>
                <p className="mt-3 text-sm text-slate-700">Pipeline structure: {pipelineStructureLabel}</p>
              </article>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Institutional Commentary</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{allocationMemo}</p>
            </div>
          </section>

          {/* Product Strategy & Pricing Power */}
          <section className="order-6 mt-8 rounded-2xl bg-white p-6 text-slate-900 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-6 text-2xl font-semibold">Product Strategy &amp; Pricing Power</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="metric-highlight rounded-2xl bg-slate-900 p-6 text-white shadow-sm xl:col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate-300">
                  Pricing Power
                  <InfoTooltip
                    label="Pricing power definition"
                    content="Measures margin resilience derived from premium exposure, corridor concentration, and institutional demand."
                  />
                </p>
                <p className="mt-3 text-4xl font-semibold">
                  {pricingPowerScore} - {pricingPowerBand === "HIGH" ? "High Pricing Power" : pricingPowerBand === "MODERATE" ? "Moderate Pricing Power" : "Low Pricing Power"}
                </p>
                <div className="mt-4 inline-flex">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pricingPowerBandClass}`}>
                    {pricingPowerBand}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  Derived from premium exposure, corridor concentration, and institutional alignment.
                </p>
                <p className="definition-inline mt-2 text-xs leading-relaxed text-slate-300/90">
                  This score estimates pricing durability through demand quality and corridor-level concentration, not just headline launch velocity.
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Premium Exposure</p>
                <p className="mt-2 text-2xl font-semibold">{premiumExposure}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{premiumExposureInterpretation}</p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Corridor Pricing Strength</p>
                <p className="mt-2 text-2xl font-semibold">{topMarketConcentration}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{corridorPricingInterpretation}</p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2 xl:col-span-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Cyclicality Sensitivity</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{cyclicalitySensitivity}</p>
              </article>
            </div>
          </section>

          {/* Geographic Deployment Strategy */}
          <section className="order-7 mt-8 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="mb-6 text-2xl font-semibold">Geographic Deployment Strategy</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {coreRowsAll.length > 0 ? (
              <article className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                <p className="text-xs uppercase tracking-wide text-emerald-200">Core Corridors</p>
                <div className="mt-3 space-y-2">
                  {coreRows.map((row) => (
                      <div key={`core-${row.corridorName}`} className="rounded-lg border border-emerald-300/20 px-3 py-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-white">{row.corridorName}</p>
                          <p className="text-xs text-emerald-100/90">{row.projectCount ?? "—"} projects</p>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-emerald-900/40">
                          <div
                            className="h-1.5 rounded-full bg-emerald-300"
                            style={{ width: `${Math.max(0, Math.min(100, row.sharePercent ?? 0))}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-emerald-100/90">{row.sharePercent != null ? `${Math.round(row.sharePercent)}% share` : "Share unavailable"}</p>
                      </div>
                  ))}
                </div>
                {coreRowsAll.length > 3 ? (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-emerald-100/90">View all</summary>
                    <div className="mt-2 space-y-2">
                      {coreRowsAll.slice(3).map((row) => (
                        <div key={`core-all-${row.corridorName}`} className="rounded-lg border border-emerald-300/20 px-3 py-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-white">{row.corridorName}</p>
                            <p className="text-xs text-emerald-100/90">{row.projectCount ?? "—"} projects</p>
                          </div>
                          <div className="mt-2 h-1.5 rounded-full bg-emerald-900/40">
                            <div
                              className="h-1.5 rounded-full bg-emerald-300"
                              style={{ width: `${Math.max(0, Math.min(100, row.sharePercent ?? 0))}%` }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-emerald-100/90">{row.sharePercent != null ? `${Math.round(row.sharePercent)}% share` : "Share unavailable"}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
                <p className="mt-3 text-xs text-emerald-100/90">Primary deployment zones with repeat capital allocation and strong market familiarity.</p>
              </article>
              ) : null}

              {expansionRowsAll.length > 0 ? (
              <article className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-4">
                <p className="text-xs uppercase tracking-wide text-blue-200">Expansion Corridors</p>
                <div className="mt-3 space-y-2">
                  {expansionRows.map((row) => (
                      <div key={`expansion-${row.corridorName}`} className="rounded-lg border border-blue-300/20 px-3 py-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-white">{row.corridorName}</p>
                          <p className="text-xs text-blue-100/90">{row.projectCount ?? "—"} projects</p>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-blue-900/40">
                          <div
                            className="h-1.5 rounded-full bg-blue-300"
                            style={{ width: `${Math.max(0, Math.min(100, row.sharePercent ?? 0))}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-blue-100/90">{row.sharePercent != null ? `${Math.round(row.sharePercent)}% share` : "Share unavailable"}</p>
                      </div>
                  ))}
                </div>
                {expansionRowsAll.length > 3 ? (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-blue-100/90">View all</summary>
                    <div className="mt-2 space-y-2">
                      {expansionRowsAll.slice(3).map((row) => (
                        <div key={`expansion-all-${row.corridorName}`} className="rounded-lg border border-blue-300/20 px-3 py-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-white">{row.corridorName}</p>
                            <p className="text-xs text-blue-100/90">{row.projectCount ?? "—"} projects</p>
                          </div>
                          <div className="mt-2 h-1.5 rounded-full bg-blue-900/40">
                            <div
                              className="h-1.5 rounded-full bg-blue-300"
                              style={{ width: `${Math.max(0, Math.min(100, row.sharePercent ?? 0))}%` }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-blue-100/90">{row.sharePercent != null ? `${Math.round(row.sharePercent)}% share` : "Share unavailable"}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
                <p className="mt-3 text-xs text-blue-100/90">Growth corridors with increasing capital deployment and market confidence.</p>
              </article>
              ) : null}

              {experimentalRowsAll.length > 0 ? (
              <article className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
                <p className="text-xs uppercase tracking-wide text-amber-200">Experimental Corridors</p>
                <div className="mt-3 space-y-2">
                  {experimentalRows.map((row) => (
                      <div key={`experimental-${row.corridorName}`} className="rounded-lg border border-amber-300/20 px-3 py-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-white">{row.corridorName}</p>
                          <p className="text-xs text-amber-100/90">{row.projectCount ?? "—"} projects</p>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-amber-900/40">
                          <div
                            className="h-1.5 rounded-full bg-amber-300"
                            style={{ width: `${Math.max(0, Math.min(100, row.sharePercent ?? 0))}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-amber-100/90">{row.sharePercent != null ? `${Math.round(row.sharePercent)}% share` : "Share unavailable"}</p>
                      </div>
                  ))}
                </div>
                {experimentalRowsAll.length > 3 ? (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-amber-100/90">View all</summary>
                    <div className="mt-2 space-y-2">
                      {experimentalRowsAll.slice(3).map((row) => (
                        <div key={`experimental-all-${row.corridorName}`} className="rounded-lg border border-amber-300/20 px-3 py-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-white">{row.corridorName}</p>
                            <p className="text-xs text-amber-100/90">{row.projectCount ?? "—"} projects</p>
                          </div>
                          <div className="mt-2 h-1.5 rounded-full bg-amber-900/40">
                            <div
                              className="h-1.5 rounded-full bg-amber-300"
                              style={{ width: `${Math.max(0, Math.min(100, row.sharePercent ?? 0))}%` }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-amber-100/90">{row.sharePercent != null ? `${Math.round(row.sharePercent)}% share` : "Share unavailable"}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
                <p className="mt-3 text-xs text-amber-100/90">Selective or opportunistic entries to capture emerging demand.</p>
              </article>
              ) : null}
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-wide text-white/60">Institutional Commentary</p>
              <p className="mt-2 text-sm leading-relaxed text-white/80">{geographicCommentary}</p>
            </div>
          </section>

          {/* Investment Thesis */}
          <section className="order-20 hidden mt-8 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="mb-3 text-2xl font-semibold">Investment Thesis</h2>
            <p className="text-sm leading-relaxed text-white/80">{structuredInvestmentThesis}</p>
          </section>

          {/* About / Brand Intelligence */}
          {activeTab === "corporate-profile" ? (
          <section className="order-21 mt-12 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <h2 className="mb-2 text-2xl font-semibold">Corporate &amp; Legal Profile</h2>
            <p className="mb-6 text-sm text-white/70">Corporate and promoter context for deep-diligence workflows.</p>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs uppercase tracking-wide text-white/60">Founded</span>
                  <span className="text-sm">{foundedYear ?? "Not disclosed"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs uppercase tracking-wide text-white/60">Total SFT Delivered</span>
                  <span className="text-sm">{profile?.total_sft_delivered ?? "Not disclosed"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs uppercase tracking-wide text-white/60">Legal Entity Count</span>
                  <span className="text-sm">{legalEntities.length}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs uppercase tracking-wide text-white/60">Specialization</span>
                  <span className="text-sm text-right max-w-[60%]">
                    {specializationText || "Not disclosed"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-white/60">Primary Geography</span>
                  <span className="text-sm">{primaryGeography}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
                {profile?.hero_description ? (
                  <div
                    className="text-sm leading-relaxed text-white/85 prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: stripMarkdownArtifacts(profile.hero_description) }}
                  />
                ) : null}
                {profile?.long_description ? (
                  <details className="mt-5">
                    <summary className="cursor-pointer text-sm text-white/70">Read full developer narrative</summary>
                    <div
                      className="mt-4 text-sm leading-relaxed text-white/85 prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: stripMarkdownArtifacts(profile.long_description) }}
                    />
                  </details>
                ) : null}
              </div>
            </div>
          </section>
          ) : null}

          {/* Geographic Footprint */}
          {microMarketStats.length > 0 ? (
            <section className="order-12 mt-12">
              <h2 className="mb-6 text-2xl font-semibold">Geographic Footprint</h2>
              <div className="rounded-2xl border border-white/10 bg-[#111827] p-6 space-y-4">
                {microMarketStats.map((market) => (
                  <div key={market.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{market.name}</span>
                      <span>{market.count} projects</span>
                    </div>

                    <div className="h-2 bg-slate-800 rounded-full">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        style={{
                          width: `${(market.count / microMarketStats[0].count) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Project Portfolio */}
          <section className="order-13 mt-12">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold">Project Portfolio</h2>
              <div className="flex gap-2 text-xs">
                <Link
                  href={`/developers/${slug}?sort=status`}
                  className={`rounded-full border px-3 py-1 ${sortBy === "status" ? "border-[#C9A227] text-[#C9A227]" : "border-white/20 text-white/70"}`}
                >
                  Sort: Status
                </Link>
                <Link
                  href={`/developers/${slug}?sort=completion`}
                  className={`rounded-full border px-3 py-1 ${sortBy === "completion" ? "border-[#C9A227] text-[#C9A227]" : "border-white/20 text-white/70"}`}
                >
                  Sort: Completion
                </Link>
              </div>
            </div>
            {projectCardRows.length > 0 ? (
              <div className="mb-6 grid gap-4 md:grid-cols-2">
                {projectCardRows.map(({ project, href }, index) => (
                  <ProjectCardLink key={`${project?.id ?? "project-card"}-${index}`} href={href} className="block">
                    <div
                      data-testid="project-card"
                      className="rounded-xl border border-white/10 bg-slate-900/60 p-4 transition hover:border-[#C9A227]/50 hover:bg-slate-900"
                    >
                      <h3 className="text-base font-semibold text-white">
                        {toRenderableText(project?.project_name, "Project")}
                      </h3>
                      <p className="mt-2 text-xs text-white/70">
                        {resolveMicroMarketLabel(project?.approved_micro_market_v2) ?? "Micro-market not disclosed"}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`rounded-full px-2 py-1 text-xs ${statusBadgeClass(getDerivedStatus(project))}`}>
                          {getDerivedStatus(project)}
                        </span>
                        <span className="text-xs text-[#C9A227]">View project</span>
                      </div>
                    </div>
                  </ProjectCardLink>
                ))}
              </div>
            ) : (
              <div className="mb-6 rounded-xl border border-white/10 bg-slate-900/60 p-4 text-sm text-white/70">
                Individual project cards are not available for this developer yet.
              </div>
            )}
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#111827]">
              <table className="min-w-full text-sm">
                <thead className="border-b border-white/10 bg-slate-900/60 text-white/70">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Project Name</th>
                    <th className="px-4 py-3 text-left font-medium">Micro Market</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Proposed Completion</th>
                    <th className="px-4 py-3 text-left font-medium">Legal Entity</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioRows.length > 0 ? (
                    portfolioRows.map((project: DeveloperPageRpcProject, index: number) => (
                    <tr
                      key={`${project?.id ?? "project"}-${index}`}
                      className="border-b border-white/5 last:border-b-0 hover:bg-slate-900/40"
                    >
                      <td className="px-4 py-3">
                        {(() => {
                          const projectSlug = resolveProjectSlug(project);
                          const href = projectSlug ? buildProjectUrl("hyderabad", projectSlug) : null;

                          if (!href) {
                            return <span className="text-white/70">{project?.project_name}</span>;
                          }

                          return (
                            <Link href={href} className="block w-full text-white hover:text-[#C9A227]">
                              {toRenderableText(project?.project_name, "Project")}
                            </Link>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-white/80">
                        {resolveMicroMarketLabel(project?.approved_micro_market_v2) ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const derivedStatus = getDerivedStatus(project);
                          const statusClassToken = derivedStatus
                            .toLowerCase()
                            .replace(/\s+/g, "-");
                          return (
                            <span
                              className={`status-badge ${statusClassToken} rounded-full px-2 py-1 text-xs ${statusBadgeClass(derivedStatus)}`}
                            >
                              {derivedStatus}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-white/80">
                        {toRenderableText(project?.proposed_completion_date, "Not disclosed")}
                      </td>
                      <td className="px-4 py-3 text-white/70">
                        {toRenderableText(project?.legal_entity, "Not disclosed")}
                      </td>
                    </tr>
                  ))
                  ) : (
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-3">
                        <Link href={buildProjectsIndexUrl("hyderabad")} className="text-white hover:text-[#C9A227]">
                          Explore all Hyderabad projects
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-white/70">—</td>
                      <td className="px-4 py-3 text-white/70">Data refresh in progress</td>
                      <td className="px-4 py-3 text-white/70">—</td>
                      <td className="px-4 py-3 text-white/70">—</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Leadership */}
          {profile?.founder_bio ? (
            <section className="mt-16">
              <h2 className="mb-6 text-2xl font-semibold">Leadership & Vision</h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
                  <div className="text-xs uppercase tracking-wide text-white/60">Founder</div>
                  <h3 className="mt-2 text-xl font-semibold text-white">{profile?.brand_name} Leadership</h3>
                  <p className="mt-3 line-clamp-4 text-sm text-white/85 leading-relaxed">
                    {stripHtmlTags(profile?.founder_bio)}
                  </p>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-[#C9A227]">Expand profile</summary>
                    <p className="mt-3 text-sm leading-relaxed text-white/85">
                      {stripHtmlTags(profile?.founder_bio)}
                    </p>
                  </details>
                </div>
                <div className="rounded-2xl border border-[#C9A227]/40 bg-[#111827] p-6">
                  <div className="text-xs uppercase tracking-wide text-white/60">Vision Narrative</div>
                  <p className="mt-3 text-sm leading-relaxed text-white/85">
                    {stripMarkdownArtifacts(profile?.hero_description || profile?.long_description || "")}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {/* Awards */}
          {keyAwards.length > 0 ? (
            <section className="mt-16">
              <h2 className="mb-6 text-2xl font-semibold">Awards & Recognition</h2>
              <p className="mb-4 text-sm text-white/70">Independent recognitions of execution quality and governance standards.</p>
              <div className="grid gap-4 md:grid-cols-2">
                {keyAwards.map((award: any, index: number) => (
                  <div key={`${award?.award_name ?? award?.title ?? "award"}-${index}`} className="rounded-2xl border border-white/10 bg-[#111827] p-4 transition hover:-translate-y-0.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-[#C9A227]">★</div>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/70">
                        {award?.year ?? "—"}
                      </span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-white">{award?.award_name || award?.title || award?.name}</h3>
                    <p className="mt-1 text-xs text-white/70">{award?.organization || award?.awarding_body || "Recognized body"}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Legal Entities */}
          <section className="mt-16">
            <h2 className="mb-4 text-2xl font-semibold">
              Registered Legal Entities ({legalEntities.length})
            </h2>
            {legalEntities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {legalEntities.map((entity) => (
                  <span key={entity} className="rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-xs text-white/75">
                    {entity}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/70">No registered legal entities available.</p>
            )}
          </section>

          {/* FAQs */}
          {faqs.length > 0 ? (
            <section className="mt-16">
              <h2 className="mb-6 text-2xl font-semibold">FAQs</h2>
              <div className="space-y-2">
                {faqs.map((faq: any, i: number) => (
                  <details key={i} className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3">
                    <summary className="cursor-pointer text-sm font-medium text-white/90">
                      {faq?.question || faq?.q}
                    </summary>
                    <p className="mt-2 text-sm text-white/75">{faq?.answer || faq?.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    );

    {
    const rpcData = data as DeveloperPageRpcData;
    const profile = (rpcData?.profile ?? {}) as NonNullable<DeveloperPageRpcData["profile"]>;
    const rpcProjects: DeveloperPageRpcProject[] = Array.isArray(rpcData?.projects)
      ? ((rpcData.projects ?? []) as DeveloperPageRpcProject[])
      : [];
    const legalEntitiesRaw = Array.isArray(rpcData?.legal_entities)
      ? rpcData.legal_entities
      : Array.isArray(profile?.legal_entities)
        ? profile?.legal_entities ?? []
        : [];
    const legalEntities = (legalEntitiesRaw ?? []).filter(Boolean) as string[];

    const profileSafe = profile ?? {};
    const developer: any = {
      id: slug,
      developer_name: profileSafe.brand_name,
      url_slug: slug,
      total_projects: profileSafe.total_projects ?? 0,
      logo_url: profileSafe.logo_url ?? null,
      banner_image_url: profileSafe.banner_image_url ?? null,
      primary_city_focus: "Hyderabad",
      specialization: profileSafe.specialization ?? null,
      tagline: profileSafe.tagline ?? null,
      hero_description: null,
      years_in_business: profileSafe.years_in_business ?? null,
      total_sft_delivered: profileSafe.total_sft_delivered ?? null,
      long_description_seo: profileSafe.long_description ?? null,
      founder_bio_summary: profileSafe.founder_bio ?? null,
      awards_summary_text: profileSafe.awards_summary ?? null,
      location_focus: [],
      website_url: null,
      usp: profileSafe.usp ?? null,
      history_timeline_json: [],
      notable_projects_json: [],
      key_awards_json: Array.isArray(profileSafe.key_awards) ? profileSafe.key_awards : [],
      testimonial_json: [],
      faqs_json: Array.isArray(profileSafe.faqs) ? profileSafe.faqs : [],
    };

    const projects = rpcProjects.map((project, index) => ({
      id: `${project.id ?? project.project_id ?? `project-${index}`}`,
      project_id: String(project.id ?? project.project_id ?? ""),
      project_name: project.project_name ?? "Project",
      status: project.status ?? "Available",
      proposed_completion_date:
        project.proposed_completion_date_text ??
        project.proposed_completion_date ??
        project.completion_date ??
        null,
      legal_entity: project.legal_entity ?? "Not specified",
    }));

  const specializationText = stripHtmlTags(developer.specialization);
  const specializationSummary = truncateText(specializationText, 120);
  const operatingLocations = Array.isArray(developer.location_focus)
    ? developer.location_focus.filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  // Safe array normalization after data fetch
  const keyAwards = Array.isArray(developer.key_awards_json) ? developer.key_awards_json : [];
  const faqs = Array.isArray(developer.faqs_json) ? developer.faqs_json : [];

  const canonicalUrl = `https://www.westsiderealty.in/developers/${developer.url_slug}`;

  // RealEstateAgent Schema with makesOffer
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: developer.developer_name,
    url: canonicalUrl,
    logo: developer.logo_url || undefined,
    description: developer.long_description_seo || developer.meta_description || developer.tagline || undefined,
    ...(developer.years_in_business && {
      foundingDate: new Date().getFullYear() - developer.years_in_business,
    }),
    address: {
      "@type": "PostalAddress",
      addressLocality: developer.primary_city_focus || "Hyderabad",
      addressCountry: "IN",
    },
    ...(Array.isArray(projects) && projects.length > 0 && {
      makesOffer: projects.slice(0, 10)
        .filter((project: any) => project && project.project_name && resolveProjectSlug(project))
        .map((project: any) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Product",
            name: project.project_name || "",
            description: `Premium residential project by ${developer.developer_name}`,
          },
          url: buildProjectAbsoluteUrl("hyderabad", resolveProjectSlug(project) as string),
        })),
    }),
  };

  // FAQ Schema
  const faqSchema = faqs && faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs
      .map((faq: any) => {
        const question = faq.question || faq.q || '';
        const answer = faq.answer || faq.a || '';
        if (!question || !answer) return null;
        return {
          "@type": "Question",
          name: question,
          acceptedAnswer: {
            "@type": "Answer",
            text: typeof answer === 'string' ? answer.replace(/<[^>]*>/g, '') : String(answer),
          },
        };
      })
      .filter(Boolean),
  } : undefined;

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.westsiderealty.in" },
      { "@type": "ListItem", position: 2, name: "Developers", item: "https://www.westsiderealty.in/developers" },
      { "@type": "ListItem", position: 3, name: developer.developer_name, item: canonicalUrl },
    ],
  };

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Developers", href: "/developers" },
    { name: developer.developer_name, href: `/developers/${developer.url_slug}` },
  ];

  const ogImage = developer.banner_image_url || developer.logo_url || undefined;

  return (
    <>
      {/* JSON-LD Structured Data */}
      <JsonLd jsonLd={organizationSchema} />
      {faqSchema && <JsonLd jsonLd={faqSchema} />}
      <NavigationAuditLogger />
      <JsonLd jsonLd={breadcrumbSchema} />

      <div className="min-h-screen bg-background">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Hero Section */}
        <div className="relative h-[400px] bg-gradient-to-br from-heading-blue to-heading-blue-dark">
          <ImageWithFallback
            src={developer.banner_image_url}
            alt={developer.developer_name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          
          <div className="relative container mx-auto px-4 h-full flex items-center">
            <div className="max-w-4xl">
              {developer.logo_url && (
                <Image
                  src={developer.logo_url}
                  alt={`${developer.developer_name} logo`}
                  width={80}
                  height={80}
                  className="h-20 w-auto mb-6 bg-white p-3 rounded-lg shadow-lg"
                />
              )}
              <h1 className="text-5xl font-bold text-white mb-4" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)' }}>
                {profile.brand_name}
              </h1>
              {developer.tagline && (
                <p className="text-xl text-white mb-3" style={{ textShadow: '1px 1px 6px rgba(0,0,0,0.8), 0 0 15px rgba(0,0,0,0.5)' }}>
                  {developer.tagline}
                </p>
              )}
              <p className="text-xl text-white mb-6" style={{ textShadow: '1px 1px 6px rgba(0,0,0,0.8), 0 0 15px rgba(0,0,0,0.5)' }}>
                {profile.total_projects ?? 0} RERA Registered Projects
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* 2) About Developer */}
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-3xl font-bold text-heading-blue mb-6">
                    About {developer.developer_name}
                  </h2>
                  {developer.long_description_seo ? (
                    <div 
                      className="prose prose-lg max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: developer.long_description_seo }}
                    />
                  ) : (
                    <p className="text-muted-foreground">No description available.</p>
                  )}
                </CardContent>
              </Card>

              {/* 3) Key Strengths */}
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-3xl font-bold text-heading-blue mb-6">
                    Key Strengths
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-lg border border-border p-4">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">USP</h3>
                      {developer.usp ? (
                        <div
                          className="prose max-w-none text-foreground"
                          dangerouslySetInnerHTML={{ __html: developer.usp }}
                        />
                      ) : (
                        <p className="text-muted-foreground">Not available</p>
                      )}
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Specialization</h3>
                      <p className="text-foreground">{specializationSummary || "Not available"}</p>
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Years in business</h3>
                      <p className="text-foreground">
                        {developer.years_in_business ? `${developer.years_in_business}+` : "Not available"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Total sft delivered</h3>
                      <p className="text-foreground">{developer.total_sft_delivered || "Not available"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 4) Founder Section */}
              {developer.founder_bio_summary ? (
                <Card>
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-heading-blue mb-6">
                      Founder
                    </h2>
                    <div
                      className="prose prose-lg max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: developer.founder_bio_summary }}
                    />
                  </CardContent>
                </Card>
              ) : null}

              {/* 5) Awards Section */}
              {(developer.awards_summary_text || (keyAwards && keyAwards.length > 0)) ? (
                <Card>
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-heading-blue mb-6">Awards & Recognition</h2>
                    {developer.awards_summary_text && (
                      <p className="text-muted-foreground mb-6">{developer.awards_summary_text}</p>
                    )}
                    {keyAwards && keyAwards.length > 0 ? (
                      <div className="space-y-4">
                        {keyAwards.map((award: any, index: number) => (
                          <div key={index} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                            <Award className="w-6 h-6 text-luxury-gold mt-1 flex-shrink-0" />
                            <div>
                              <h4 className="font-semibold text-heading-blue mb-1">
                                {award.award_name || award.title || award.name}
                              </h4>
                              {award.year && (
                                <p className="text-sm text-muted-foreground mb-2">{award.year}</p>
                              )}
                              {(award.awarding_body || award.category) && (
                                <p className="text-sm text-foreground">
                                  {award.awarding_body || award.category}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}

              {/* 6) Legal Entities Section */}
              <Card>
                <CardContent className="p-8">
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">
                      Legal Entities Registered Under RERA
                    </h3>

                    <ul className="list-disc pl-5 text-sm text-slate-600">
                      {legalEntities.length > 0 ? (
                        legalEntities.map((entity: string) => (
                          <li key={entity}>{entity}</li>
                        ))
                      ) : (
                        <li>Not specified</li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* 7) Projects Grid */}
              {Array.isArray(projects) && projects.length > 0 ? (
                <Card>
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-heading-blue mb-6">
                      Projects by {developer.developer_name}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {projects
                        .filter((p: any) => p && p.id && p.project_name)
                        .map((project: any) => (
                          (() => {
                            const resolvedSlug = resolveProjectSlug(project);
                            if (!resolvedSlug) return null;
                            return (
                              <ProjectCardLink
                                key={project.id}
                                href={buildProjectUrl("hyderabad", resolvedSlug)}
                                className="block"
                              >
                                <div
                                  data-testid="project-card"
                                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
                                >
                                  <h3 className="text-xl font-semibold text-heading-blue mb-2 hover:underline">
                                    {project.project_name || "Project"}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    Status: {project.status || "Available"}
                                  </p>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    Proposed Completion Date: {project.proposed_completion_date || "Not disclosed"}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Filed Under: {project.legal_entity || "Not specified"}
                                  </p>
                                </div>
                              </ProjectCardLink>
                            );
                          })()
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-heading-blue mb-6">
                      Projects by {developer.developer_name}
                    </h2>
                    <div className="border rounded-lg p-4 bg-slate-50/70">
                      <h3 className="text-xl font-semibold text-heading-blue mb-2">
                        <Link href={buildProjectsIndexUrl("hyderabad")} className="hover:underline">
                          Explore all Hyderabad projects
                        </Link>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Individual project filings are currently being refreshed for this developer.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 8) FAQ Section */}
              {faqs && faqs.length > 0 ? (
                <Card>
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-heading-blue mb-6">Frequently Asked Questions</h2>
                    <Accordion type="single" collapsible className="space-y-4">
                      {faqs.map((faq: any, index: number) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-lg px-4">
                          <AccordionTrigger className="text-left hover:no-underline py-4">
                            <h3 className="font-semibold text-heading-blue pr-4">{faq.question || faq.q}</h3>
                          </AccordionTrigger>
                          <AccordionContent className="text-foreground pb-4">
                            {faq.answer || faq.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-heading-blue mb-4">Quick Info</h3>
                  
                  {developer.primary_city_focus && (
                    <div className="mb-4 pb-4 border-b border-border">
                      <div className="inline-flex items-center gap-2 bg-luxury-gold/10 text-luxury-gold px-3 py-1.5 rounded-full text-sm font-semibold">
                        <MapPin className="w-4 h-4" />
                        Primary Market: {developer.primary_city_focus}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {developer.years_in_business && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Years in Business</span>
                        <span className="font-semibold text-heading-blue">{developer.years_in_business}+</span>
                      </div>
                    )}
                    
                    {developer.total_projects && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Projects Delivered</span>
                        <span className="font-semibold text-heading-blue">{developer.total_projects}+</span>
                      </div>
                    )}
                    
                    {specializationSummary && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Specialization</span>
                        <span className="font-semibold text-heading-blue text-right text-sm">
                          {specializationSummary}
                        </span>
                      </div>
                    )}
                    {operatingLocations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          Operating Locations
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {operatingLocations.map((location: string, index: number) => (
                            <Badge key={index} variant="secondary">
                              {location}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {developer.website_url && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          Website
                        </h4>
                        <a
                          href={developer.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-heading-blue hover:underline"
                        >
                          <Globe className="w-4 h-4 mr-2" />
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* USP */}
              {developer.usp && (
                <Card className="bg-gradient-to-br from-heading-blue to-heading-blue-dark text-white">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-3">What Sets Us Apart</h3>
                    {developer.usp ? (
                      <div
                        className="text-white/90 prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: developer.usp }}
                      />
                    ) : (
                      <p className="text-white/90">No unique selling points available.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Sticky Contact Form */}
              <DeveloperContactForm 
                developerId={developer.id}
                developerName={developer.developer_name}
                primaryCity={developer.primary_city_focus}
              />

              {/* CTA */}
              <Card className="bg-muted/50">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold text-heading-blue mb-3">
                    Interested in Our Projects?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Explore properties developed by {developer.developer_name}
                  </p>
                  <Button className="w-full bg-heading-blue hover:bg-heading-blue-dark" asChild>
                    <Link href={`/hyderabad/projects?developer=${developer.url_slug}`}>
                      View All Projects
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Contact Section Above Footer */}
        <div className="bg-gradient-to-br from-heading-blue/5 to-luxury-gold/5 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold text-heading-blue mb-4">
                Ready to Invest with {developer.developer_name}?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Get in touch with our expert team to explore exclusive investment opportunities
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-heading-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-6 h-6 text-heading-blue" />
                    </div>
                    <h3 className="font-semibold text-heading-blue mb-2">Contact Us</h3>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      asChild
                    >
                      <Link href="/contact">Get In Touch</Link>
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-heading-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-6 h-6 text-heading-blue" />
                    </div>
                    <h3 className="font-semibold text-heading-blue mb-2">Visit Office</h3>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/contact">Get Directions</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CityHubBacklink />
    </>
  );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_HTTP_ERROR_FALLBACK")) {
      throw error;
    }
    console.error('[DeveloperPage] Unexpected error rendering developer page:', error);
    notFound();
  }
}

// Revalidate every 10 minutes (ISR)
export const revalidate = 600;
