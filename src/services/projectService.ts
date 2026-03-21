import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';
import { safeJsonParse, computeProjectStatus, toSqft } from '@/lib/project-utils';
import { parseJsonb, asArray } from '@/lib/parse-jsonb';
import { generateUnifiedSchema } from '@/lib/seo-utils';
import { buildProjectAbsoluteUrl, buildProjectUrl } from '@/lib/routes';
import { unstable_noStore as noStore } from "next/cache";

export interface ProjectInfo {
  id: string;
  project_name: string;
  url_slug?: string;
  city_id?: string;
  micro_market_id?: string | null;
  developer_id?: string | null;
  seo_title?: string;
  description?: string; // Combined and truncated (computed field)
  meta_description: string;
  project_overview_seo: string;
  listing_count?: number;
  is_featured?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
  // New fields from enhancement
  completion_status?: string | null;
  price_range_text?: string | null;
  property_types?: any;
  unit_size_range?: string | null;
  amenities_json?: any;
  faqs_json?: any;
  floor_plan_images?: any; // Array of { url: string; label: string; } objects
  google_maps_embed_url?: string | null;
  total_land_area?: string | null;
  total_towers?: number | null;
  total_floors?: number | null;
  total_units?: number | null;
  enable_intelligence?: boolean | null;
  configuration_display?: string | null;
  display_developer_name?: string | null;
}

export interface ProjectWithRelations extends Omit<ProjectInfo, 'description'> {
  h1_title?: string;
  hero_image_url?: string | null;
  main_image_url?: string | null; // Alternative image field
  description?: string; // Computed field, optional for database queries
  // RERA & project core fields (from enriched MV)
  rera_id?: string | null;
  project_type?: string | null;
  current_status?: string | null;
  min_area?: number | null;
  max_area?: number | null;
  booked_units?: number | null;
  developer_name?: string | null;
  project_snapshot_json?: any;
  location_advantages_json?: any;
  investment_analysis_json?: any;
  why_invest_json?: any;
  special_offers?: any; // JSONB: { headline: string, subtext: string, button_text: string }
  page_status?: string;
  content_generated_at?: string;
  content_updated_at?: string;
  // New SEO fields
  unit_mix_summary?: string | null;
  price_display_string?: string | null;
  rera_link?: string | null;
  possession_date_text?: string | null;
  construction_timeline_json?: any;
  westside_realty_review?: string | null;
  long_description_html?: string | null;
  schema_markup_json?: any;
  // Image gallery fields (may exist in DB via select('*'))
  gallery_images_json?: unknown; // JSONB field for gallery images
  gallery_images?: unknown; // Alternative gallery field
  images?: unknown; // Direct images field (if exists in DB)
  city?: {
    city_name: string;
    url_slug: string;
  };
  micro_market?: {
    micro_market_name: string;
    url_slug: string;
    hero_hook?: string | null;
    growth_story?: string | null;
    price_per_sqft_min?: number | null;
    price_per_sqft_max?: number | null;
    annual_appreciation_min?: number | null;
  };
  developer?: {
    developer_name: string;
    url_slug: string;
    tagline?: string | null;
    meta_description?: string | null;
    hero_description?: string | null;
    long_description_seo?: string | null;
    years_in_business?: number | null;
    total_projects?: number | null;
    logo_url?: string | null;
    notable_projects_json?: any;
  };
  latitude?: number | null;
  longitude?: number | null;
}

export interface ProjectPageContext {
  canonicalUrl: string;
  seoTitle: string;
  seoDescription: string;
  breadcrumbItems: Array<{ name: string; href: string }>;
  unifiedSchema: Record<string, any>;
  technicalSpecs: any;
  amenities: any;
  specifications: any;
  floorPlansRaw: any[];
  locationAdvantages: any;
  investmentAnalysis: any;
  projectHighlights: any;
  faqs: any[];
  galleryImages: string[];
  address: string;
}

const truncateWords = (text: string, maxWords: number): string => {
  if (!text) return '';
  const words = text.split(/\s+/).filter(w => w.length > 0);
  return words.slice(0, maxWords).join(' ') + (words.length > maxWords ? '...' : '');
};

const isPermissionError = (error: any) => {
  if (!error) return false;
  return (
    error.code === '42501' ||
    error.status === 403 ||
    String(error.message || '').toLowerCase().includes('permission denied')
  );
};

const runWithServiceFallback = async <T>(
  queryFn: (client: any) => Promise<{ data: T | null; error: any }>
) => {
  const supabase = await createClient();
  let result = await queryFn(supabase);
  if (result.error && isPermissionError(result.error)) {
    const serviceClient = createServiceClient();
    result = await queryFn(serviceClient);
  }
  return result;
};

const toStringOrNull = (value: unknown): string | null => {
  const text = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  return text.length > 0 ? text : null;
};

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const parseInstitutionalIdentity = (value: unknown): Record<string, unknown> | null => {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return typeof value === "object" ? (value as Record<string, unknown>) : null;
};

const resolveDeveloperDisplayName = (row: Record<string, unknown>): string | null => {
  const identity = parseInstitutionalIdentity((row as any).project_institutional_identity);
  return (
    toStringOrNull(identity?.brand_name) ||
    toStringOrNull(identity?.developer_brand) ||
    toStringOrNull(identity?.unified_brand) ||
    toStringOrNull((row as any).developer_name)
  );
};

const mapEnrichedProjectToProjectWithRelations = (row: Record<string, unknown>): ProjectWithRelations => {
  const citySlug = toStringOrNull(row.city_slug);
  const cityName = toStringOrNull((row as any).city_name) || citySlug;
  const microMarketName =
    toStringOrNull((row as any).micro_market_name) ||
    toStringOrNull((row as any).micro_market);
  const microMarketSlug =
    toStringOrNull((row as any).micro_market_slug) ||
    toStringOrNull((row as any).micro_market_url_slug);
  const developerName = toStringOrNull((row as any).developer_name);
  const displayDeveloperName = resolveDeveloperDisplayName(row);
  const developerSlug = toStringOrNull((row as any).developer_slug);
  const possessionText =
    toStringOrNull((row as any).possession_date_text) ||
    toStringOrNull((row as any).proposed_completion_date);

  const mapped: ProjectWithRelations = {
    ...(row as any),
    id: String(row.id ?? ""),
    project_name: String(row.project_name ?? ""),
    url_slug: toStringOrNull(row.url_slug) ?? undefined,
    configuration_display: toStringOrNull((row as any).configuration_display),
    display_developer_name: displayDeveloperName,
    unit_size_range: toStringOrNull((row as any).unit_size_range),
    total_units: toNumberOrNull((row as any).total_units),
    total_towers: toNumberOrNull((row as any).total_towers),
    latitude: toNumberOrNull((row as any).latitude),
    longitude: toNumberOrNull((row as any).longitude),
    possession_date_text: possessionText,
    city: citySlug
      ? {
          city_name: cityName || citySlug,
          url_slug: citySlug,
        }
      : undefined,
    micro_market: microMarketName
      ? {
          micro_market_name: microMarketName,
          url_slug: microMarketSlug || "",
        }
      : undefined,
    developer: developerName
      ? {
          developer_name: displayDeveloperName || developerName,
          url_slug: developerSlug || "",
          logo_url: toStringOrNull((row as any).developer_logo_url),
        }
      : undefined,
  };

  return mapped;
};

const fetchEnrichedProjectRowsBySlug = async (projectSlug: string): Promise<any[] | null> => {
  const slugColumns = ["url_slug", "slug", "project_slug"] as const;
  for (const column of slugColumns) {
    const { data, error } = await runWithServiceFallback<any[]>((client) =>
      client
        .from("listing_project_detail_enriched_mv")
        .select("*, configuration_display")
        .eq(column, projectSlug)
        .limit(20)
    );
    if (!error && Array.isArray(data)) {
      return data;
    }
  }
  return null;
};

const fetchProjectFromProjectsTable = async (
  citySlug: string,
  projectSlug: string
): Promise<ProjectWithRelations | null> => {
  const { data, error } = await runWithServiceFallback<any>((client) =>
    client
      .from("projects")
      .select(`
        *,
        floor_plan_images,
        city:cities(*),
        developer:developers(*),
        micro_market:micro_markets!projects_micromarket_id_fkey(*)
      `)
      .eq("url_slug", projectSlug)
      .maybeSingle()
  );

  if (error || !data) return null;
  const projectCity = Array.isArray(data.city) ? data.city[0] : data.city;
  if (!projectCity?.url_slug || projectCity.url_slug !== citySlug) return null;
  return data as ProjectWithRelations;
};

const matchesCitySlug = (project: ProjectWithRelations, citySlug: string): boolean => {
  const direct = toStringOrNull((project as any).city_slug);
  const nested = toStringOrNull(project.city?.url_slug);
  return direct === citySlug || nested === citySlug;
};

const matchesMicroMarketSlug = (project: ProjectWithRelations, microMarketSlug: string): boolean => {
  const direct = toStringOrNull((project as any).micro_market_slug) || toStringOrNull((project as any).micro_market_url_slug);
  const nested = toStringOrNull(project.micro_market?.url_slug);
  return direct === microMarketSlug || nested === microMarketSlug;
};

const normalizeSlugToken = (value: string): string =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const splitSlugTokens = (value: string): string[] =>
  normalizeSlugToken(value)
    .split("-")
    .filter((token) => token.length > 1);

const hasPrefixMatch = (source: string, candidate: string): boolean => {
  const left = normalizeSlugToken(source);
  const right = normalizeSlugToken(candidate);
  if (!left || !right) return false;
  return left.startsWith(right) || right.startsWith(left);
};

const levenshteinDistance = (a: string, b: string): number => {
  const left = normalizeSlugToken(a);
  const right = normalizeSlugToken(b);
  const rows = left.length + 1;
  const cols = right.length + 1;
  const dp: number[][] = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[rows - 1][cols - 1];
};

export const projectService = {
  async getProjectByName(projectName: string): Promise<ProjectInfo | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .select('id, project_name, meta_description, project_overview_seo')
      .ilike('project_name', projectName)
      .single();

    if (error || !data) return null;

    // Combine and truncate to 30-40 words
    const combined = `${data.meta_description || ''} ${data.project_overview_seo || ''}`.trim();
    const words = combined.split(/\s+/).filter(w => w.length > 0);
    const truncated = words.slice(0, 40).join(' ') + (words.length > 40 ? '...' : '');

    return {
      ...data,
      description: truncated
    };
  },

  async getProjectDescription(projectName: string): Promise<string | null> {
    if (!projectName) return null;

    console.log('🔍 [ProjectService] Fetching full description for:', projectName);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .select('project_overview_seo, meta_description')
      .ilike('project_name', projectName)
      .maybeSingle();

    if (error || !data) {
      console.log('⚠️ [ProjectService] No project description found for:', projectName);
      return null;
    }

    const combined = `${data.meta_description || ''} ${data.project_overview_seo || ''}`.trim();
    console.log('✅ [ProjectService] Description found, length:', combined.length);
    
    return truncateWords(combined, 600);
  },

  async getMultipleProjects(projectNames: string[]): Promise<Map<string, ProjectInfo>> {
    if (projectNames.length === 0) return new Map();

    console.log('🔍 [ProjectService] Fetching descriptions for projects:', projectNames);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .select('id, project_name, meta_description, project_overview_seo')
      .in('project_name', projectNames);

    if (error) {
      console.error('❌ [ProjectService] Error fetching projects:', error);
      return new Map();
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ [ProjectService] No matching projects found in database');
      console.warn('   Requested:', projectNames);
      return new Map();
    }

    console.log(`✅ [ProjectService] Found ${data.length} projects with descriptions`);

    const projectMap = new Map<string, ProjectInfo>();
    
    data.forEach((project: any) => {
      const combined = `${project.meta_description || ''} ${project.project_overview_seo || ''}`.trim();
      const words = combined.split(/\s+/).filter(w => w.length > 0);
      const truncated = words.slice(0, 40).join(' ') + (words.length > 40 ? '...' : '');

      console.log(`   📝 ${project.project_name}: ${truncated.substring(0, 50)}...`);

      projectMap.set(project.project_name, {
        ...project,
        description: truncated
      });
    });

    // Log which project names didn't match
    const matchedNames = Array.from(projectMap.keys());
    const unmatchedNames = projectNames.filter(name => !matchedNames.includes(name));
    if (unmatchedNames.length > 0) {
      console.warn('⚠️ [ProjectService] Projects without descriptions:', unmatchedNames);
    }

    return projectMap;
  },

  /**
   * Get project by slug with full relations (micro-market scoped)
   */
  async getProjectBySlug(
    citySlug: string,
    microMarketSlug: string,
    projectSlug: string
  ): Promise<ProjectWithRelations | null> {
    const { data, error } = await runWithServiceFallback<any>((client) =>
      client
        .from("listing_project_detail_enriched_mv")
        .select("*, configuration_display")
        .eq("city_slug", citySlug)
        .eq("url_slug", projectSlug)
        .single()
    );

    if (error || !data) {
      return null;
    }

    const project = mapEnrichedProjectToProjectWithRelations(data as Record<string, unknown>);
    if (project.micro_market?.url_slug && project.micro_market.url_slug !== microMarketSlug) {
      return null;
    }
    return project;
  },

  /**
   * Find the canonical city_slug for a project by url_slug.
   * Used when project is not found with the given citySlug (e.g. /rera/projects/x).
   */
  async findProjectCityBySlug(projectSlug: string): Promise<string | null> {
    let { data, error } = await runWithServiceFallback<any>((client) =>
      client
        .from("listing_project_detail_enriched_mv")
        .select("city_slug")
        .eq("url_slug", projectSlug)
        .limit(1)
        .maybeSingle()
    );
    if (!error && data?.city_slug) return String(data.city_slug).trim() || null;

    const { data: projectRow, error: projectError } = await runWithServiceFallback<any>((client) =>
      client
        .from("projects")
        .select("city:cities(url_slug)")
        .eq("url_slug", projectSlug)
        .limit(1)
        .maybeSingle()
    );
    if (!projectError && projectRow) {
      const city = Array.isArray(projectRow.city) ? projectRow.city[0] : projectRow.city;
      const slug = city?.url_slug;
      return slug ? String(slug).trim() : null;
    }
    return null;
  },

  /**
   * Fallback: look up a project in the old `projects` table.
   * Used when the enriched MV doesn't have the slug yet.
   */
  async getOldProjectBySlug(
    citySlug: string,
    projectSlug: string
  ): Promise<ProjectWithRelations | null> {
    return fetchProjectFromProjectsTable(citySlug, projectSlug);
  },

  /**
   * Get city-level project by slug (no micro-market)
   * Query by url_slug only, validate city match in code
   */
  async getCityLevelProjectBySlug(
    citySlug: string,
    projectSlug: string
  ): Promise<ProjectWithRelations | null> {
    console.log(`[getCityLevelProjectBySlug] Fetching project: citySlug=${citySlug}, projectSlug=${projectSlug}`);

    // Select everything from the MV — avoids 42703 errors from guessing column names.
    // The MV is the enriched view used by all project detail paths.
    let { data, error } = await runWithServiceFallback<any>((client) =>
      client
        .from("listing_project_detail_enriched_mv")
        .select("*")
        .eq("city_slug", citySlug)
        .eq("url_slug", projectSlug)
        .single()
    );

    if (error) {
      if (error.code !== "PGRST116") {
        console.warn("[getCityLevelProjectBySlug] Enriched view query failed:", {
          code: error.code,
          message: error.message,
        });
      } else {
        console.log(`[getCityLevelProjectBySlug] Project not found (PGRST116) for slug: ${projectSlug}`);
      }
      return null;
    }

    if (!data) {
      console.log(`[getCityLevelProjectBySlug] No data returned for slug: ${projectSlug}`);
      return null;
    }

    const displayDeveloperName = resolveDeveloperDisplayName(data as Record<string, unknown>);

    let microMarketPositioningText: string | null = null;
    const microMarketName = toStringOrNull(data.micro_market) || toStringOrNull((data as any).micro_market_name);
    if (microMarketName) {
      const { data: locationContext, error: locationContextError } = await runWithServiceFallback<any>((client) =>
        client
          .from("project_location_context_v")
          .select("*")
          .eq("city_slug", citySlug)
          .eq("micro_market", microMarketName)
          .limit(1)
          .maybeSingle()
      );
      if (!locationContextError && locationContext) {
        microMarketPositioningText =
          toStringOrNull((locationContext as any).institutional_positioning_text) ||
          toStringOrNull((locationContext as any).positioning_text) ||
          toStringOrNull((locationContext as any).context_text) ||
          toStringOrNull((locationContext as any).micro_market_positioning) ||
          toStringOrNull((locationContext as any).summary);
      }
    }

    // Fetch extended micro_market data for V2 page (price, appreciation, hero_hook)
    let microMarketExtended: {
      price_per_sqft_min: number | null;
      price_per_sqft_max: number | null;
      annual_appreciation_min: number | null;
      annual_appreciation_max: number | null;
      hero_hook: string | null;
      url_slug: string | null;
    } | null = null;
    if (microMarketName) {
      const { data: mmData } = await runWithServiceFallback<any>((client) =>
        client
          .from("micro_markets")
          .select("price_per_sqft_min, price_per_sqft_max, annual_appreciation_min, annual_appreciation_max, hero_hook, url_slug")
          .ilike("micro_market_name", microMarketName)
          .limit(1)
          .maybeSingle()
      );
      if (mmData) {
        microMarketExtended = {
          price_per_sqft_min: toNumberOrNull((mmData as any).price_per_sqft_min),
          price_per_sqft_max: toNumberOrNull((mmData as any).price_per_sqft_max),
          annual_appreciation_min: toNumberOrNull((mmData as any).annual_appreciation_min),
          annual_appreciation_max: toNumberOrNull((mmData as any).annual_appreciation_max),
          hero_hook: toStringOrNull((mmData as any).hero_hook),
          url_slug: toStringOrNull((mmData as any).url_slug),
        };
      }
    }

    // Fetch extended developer data for V2 page (years, total_projects, descriptions)
    let developerExtended: {
      years_in_business: number | null;
      total_projects: number | null;
      hero_description: string | null;
      long_description_seo: string | null;
      logo_url: string | null;
      notable_projects_json: any;
      url_slug: string | null;
    } | null = null;
    const developerNameForQuery = toStringOrNull((data as any).developer_name);
    if (developerNameForQuery) {
      const { data: devData } = await runWithServiceFallback<any>((client) =>
        client
          .from("developers")
          .select("years_in_business, total_projects, hero_description, long_description_seo, logo_url, notable_projects_json, url_slug")
          .ilike("developer_name", developerNameForQuery)
          .limit(1)
          .maybeSingle()
      );
      if (devData) {
        developerExtended = {
          years_in_business: toNumberOrNull((devData as any).years_in_business),
          total_projects: toNumberOrNull((devData as any).total_projects),
          hero_description: toStringOrNull((devData as any).hero_description),
          long_description_seo: toStringOrNull((devData as any).long_description_seo),
          logo_url: toStringOrNull((devData as any).logo_url),
          notable_projects_json: (devData as any).notable_projects_json ?? null,
          url_slug: toStringOrNull((devData as any).url_slug),
        };
      }
    }

    // Fetch enrichment fields from projects table — not exposed by the enriched MV
    let projectsTableData: {
      project_overview_seo: string | null;
      westside_realty_review: string | null;
      seo_title: string | null;
      meta_description: string | null;
      h1_title: string | null;
      configurations: any[] | null;
      unit_size_range: string | null;
      min_price: number | null;
      max_price: number | null;
      price_display_string: string | null;
      amenities_json: any[] | null;
      project_highlights: any[] | null;
      location_highlights: any[] | null;
      property_types: any[] | null;
    } | null = null;
    {
      const { data: projRow } = await runWithServiceFallback<any>((client) =>
        client
          .from("projects")
          .select([
            "project_overview_seo", "westside_realty_review", "seo_title", "meta_description", "h1_title",
            "configurations", "unit_size_range", "min_price", "max_price", "price_display_string",
            "amenities_json", "project_highlights", "location_highlights", "property_types",
          ].join(", "))
          .eq("url_slug", projectSlug)
          .maybeSingle()
      );
      if (projRow) {
        const toArr = (v: any): any[] | null => {
          if (Array.isArray(v)) return v;
          if (typeof v === 'string') {
            try { const p = JSON.parse(v); return Array.isArray(p) ? p : null; } catch { return null; }
          }
          return null;
        };
        projectsTableData = {
          project_overview_seo: toStringOrNull((projRow as any).project_overview_seo),
          westside_realty_review: toStringOrNull((projRow as any).westside_realty_review),
          seo_title: toStringOrNull((projRow as any).seo_title),
          meta_description: toStringOrNull((projRow as any).meta_description),
          h1_title: toStringOrNull((projRow as any).h1_title),
          configurations: toArr((projRow as any).configurations),
          unit_size_range: toStringOrNull((projRow as any).unit_size_range),
          min_price: toNumberOrNull((projRow as any).min_price),
          max_price: toNumberOrNull((projRow as any).max_price),
          price_display_string: toStringOrNull((projRow as any).price_display_string),
          amenities_json: toArr((projRow as any).amenities_json),
          project_highlights: toArr((projRow as any).project_highlights),
          location_highlights: toArr((projRow as any).location_highlights),
          property_types: toArr((projRow as any).property_types),
        };
      }
    }

    let nearbySupplyCount: number | null = null;
    let supplyRadiusKm: number | null = null;
    let inventoryDominantConfiguration: string | null = null;
    let inventoryTotalPlannedUnits: number | null = null;
    let inventoryDemandStrength: string | null = null;
    let inventoryDemandInterpretation: string | null = null;
    let executionStage: string | null = null;
    let executionTimelineRisk: string | null = null;
    let executionCapitalLockInRisk: string | null = null;
    let executionInterpretation: string | null = null;
    let capitalRentalDemand: string | null = null;
    let capitalYieldEnvironment: string | null = null;
    let capitalExitLiquidity: string | null = null;
    let capitalInterpretation: string | null = null;
    let competingProjectsCount: number | null = null;
    let competitionIntensity: string | null = null;
    let marketSaturation: string | null = null;
    let competitionPricingPowerOutlook: string | null = null;
    let competitionAbsorptionVelocity: string | null = null;
    let competitionDeveloperDifferentiation: string | null = null;
    let relativeValuePositioning: string | null = null;
    let relativeValueStageVsCorridor: string | null = null;
    let relativeValueDensityVsCompetitors: string | null = null;
    let relativeValueConfigurationVsCorridor: string | null = null;
    let relativeValueEntryAttractiveness: string | null = null;
    let relativeValueUpside: string | null = null;
    let pricingCorridorBand: string | null = null;
    let pricingRelativePositioning: string | null = null;
    let pricingEntryTiming: string | null = null;
    let pricingEarlyEntryVsMature: string | null = null;
    let pricingDiscoveryStage: string | null = null;
    let pricingUpsideWindow: string | null = null;
    let futureSupplyTimeline: Array<{ year: number; count: number }> = [];
    let futureUpcomingLaunches: number | null = null;
    let futureDeliveryClusters: string | null = null;
    let futureSupplyWaves: string | null = null;
    let configurationDistribution: Array<{
      configuration: string;
      total_units: number;
      supply_share_pct: number;
    }> = [];
    const projectId = toStringOrNull(data.project_id);
    // Use MV coords; fall back to lat/lng in rera_projects.raw_payload for projects
    // that were recently scraped but haven't been geocoded into the MV yet (e.g. Goa).
    let latitude = toNumberOrNull(data.latitude);
    let longitude = toNumberOrNull(data.longitude);
    if (!latitude || !longitude) {
      const reraIdForCoords = toStringOrNull(data.rera_id);
      if (reraIdForCoords) {
        const { data: reraRaw } = await runWithServiceFallback<any>((client) =>
          client.from("rera_projects").select("raw_payload").eq("rera_id", reraIdForCoords).maybeSingle()
        );
        if (reraRaw?.raw_payload) {
          const rp = reraRaw.raw_payload as Record<string, unknown>;
          latitude = toNumberOrNull(rp.lat) ?? toNumberOrNull(rp.latitude) ?? latitude;
          longitude = toNumberOrNull(rp.lng) ?? toNumberOrNull(rp.longitude) ?? longitude;
        }
      }
    }
    if (projectId) {
      const { data: supplyRadiusData, error: supplyRadiusError } = await runWithServiceFallback<any>((client) =>
        client
          .from("project_supply_radius_v")
          .select("supply_radius_km")
          .eq("project_id", projectId)
          .limit(1)
          .maybeSingle()
      );
      if (!supplyRadiusError && supplyRadiusData) {
        supplyRadiusKm = toNumberOrNull((supplyRadiusData as any).supply_radius_km);
      }
    }
    const calibratedRadiusKm = supplyRadiusKm ?? 2;

    if (projectId && latitude !== null && longitude !== null) {
      const current_project_id = projectId;
      const lat = Number(latitude);
      const lng = Number(longitude);
      const radius_km = Number(calibratedRadiusKm);

      console.log("Nearby supply params", {
        current_project_id,
        lat,
        lng,
        radius_km,
      });

      noStore();
      const { data: nearbyData, error: nearbyError } = await runWithServiceFallback<any>((client) =>
        client.rpc("nearby_projects_count", {
          current_project_id,
          lat,
          lng,
          radius_km,
        })
      );

      if (!nearbyError) {
        if (typeof nearbyData === "number" && Number.isFinite(nearbyData)) {
          nearbySupplyCount = nearbyData;
        } else if (Array.isArray(nearbyData) && nearbyData.length > 0) {
          const candidate = (nearbyData[0] as any)?.count ?? (nearbyData[0] as any)?.nearby_projects_count ?? nearbyData[0];
          const parsed = Number(candidate);
          nearbySupplyCount = Number.isFinite(parsed) ? parsed : null;
        } else if (nearbyData && typeof nearbyData === "object") {
          const candidate = (nearbyData as any).count ?? (nearbyData as any).nearby_projects_count;
          const parsed = Number(candidate);
          nearbySupplyCount = Number.isFinite(parsed) ? parsed : null;
        }
      }
    }

    if (projectId) {
      noStore();
      let { data: inventoryData, error: inventoryError } = await runWithServiceFallback<any>((client) =>
        client
          .from("project_inventory_intelligence_v")
          .select("*")
          .eq("project_id", projectId)
          .limit(1)
          .maybeSingle()
      );

      if ((inventoryError || !inventoryData) && toStringOrNull(data.url_slug) && toStringOrNull(data.city_slug)) {
        const fallbackInventory = await runWithServiceFallback<any>((client) =>
          client
            .from("project_inventory_intelligence_v")
            .select("*")
            .eq("url_slug", toStringOrNull(data.url_slug))
            .eq("city_slug", toStringOrNull(data.city_slug))
            .limit(1)
            .maybeSingle()
        );
        inventoryData = fallbackInventory.data;
        inventoryError = fallbackInventory.error;
      }

      console.log("Inventory data", inventoryData);

      if (!inventoryError && inventoryData) {
        inventoryDominantConfiguration =
          toStringOrNull((inventoryData as any).dominant_configuration) ||
          toStringOrNull((inventoryData as any).dominant_config) ||
          toStringOrNull((inventoryData as any).configuration_dominant) ||
          toStringOrNull((inventoryData as any).top_configuration);
        inventoryTotalPlannedUnits =
          toNumberOrNull((inventoryData as any).total_inventory) ||
          toNumberOrNull((inventoryData as any).total_planned_units) ||
          toNumberOrNull((inventoryData as any).planned_units) ||
          toNumberOrNull((inventoryData as any).total_units);
        inventoryDemandStrength =
          toStringOrNull((inventoryData as any).demand_strength) ||
          toStringOrNull((inventoryData as any).demand_signal) ||
          toStringOrNull((inventoryData as any).demand_band);
        inventoryDemandInterpretation =
          toStringOrNull((inventoryData as any).demand_signal_interpretation) ||
          toStringOrNull((inventoryData as any).demand_interpretation) ||
          toStringOrNull((inventoryData as any).demand_summary);
      }
    }

    if (projectId) {
      const { data: distributionData, error: distributionError } = await runWithServiceFallback<any[]>((client) =>
        client
          .from("project_configuration_distribution_v")
          .select("*")
          .eq("project_id", projectId)
      );
      if (!distributionError && Array.isArray(distributionData)) {
        configurationDistribution = distributionData
          .map((row) => {
            const configuration =
              toStringOrNull((row as any).configuration) ||
              toStringOrNull((row as any).configuration_name) ||
              toStringOrNull((row as any).unit_configuration) ||
              toStringOrNull((row as any).config);
            const totalUnits =
              toNumberOrNull((row as any).total_units) ||
              toNumberOrNull((row as any).units) ||
              toNumberOrNull((row as any).unit_count);
            const supplySharePct =
              toNumberOrNull((row as any).supply_share_pct) ||
              toNumberOrNull((row as any).supply_share_percentage) ||
              toNumberOrNull((row as any).share_pct) ||
              toNumberOrNull((row as any).share_percent);

            if (!configuration || totalUnits === null || supplySharePct === null) return null;
            return {
              configuration,
              total_units: totalUnits,
              supply_share_pct: supplySharePct,
            };
          })
          .filter((item): item is { configuration: string; total_units: number; supply_share_pct: number } => Boolean(item))
          .sort((a, b) => b.supply_share_pct - a.supply_share_pct);
      }
    }

    const reraId = toStringOrNull(data.rera_id);
    if (reraId) {
      const { data: executionData, error: executionError } = await runWithServiceFallback<any>((client) =>
        client
          .from("project_execution_intelligence_v")
          .select("*")
          .eq("rera_id", reraId)
          .limit(1)
          .maybeSingle()
      );
      if (!executionError && executionData) {
        executionStage =
          toStringOrNull((executionData as any).project_stage) ||
          toStringOrNull((executionData as any).execution_stage) ||
          toStringOrNull((executionData as any).stage_label);
        executionTimelineRisk =
          toStringOrNull((executionData as any).timeline_risk) ||
          toStringOrNull((executionData as any).timeline_risk_label);
        executionCapitalLockInRisk =
          toStringOrNull((executionData as any).capital_lock_in_risk) ||
          toStringOrNull((executionData as any).capital_lockin_risk) ||
          toStringOrNull((executionData as any).capital_lockin_risk_label);
        executionInterpretation =
          toStringOrNull((executionData as any).interpretation) ||
          toStringOrNull((executionData as any).execution_interpretation) ||
          toStringOrNull((executionData as any).summary);
      }
    }

    if (projectId) {
      let { data: capitalData, error: capitalError } = await runWithServiceFallback<any>((client) =>
        client
          .from("project_capital_intelligence_v")
          .select("*")
          .eq("project_id", projectId)
          .limit(1)
          .maybeSingle()
      );

      if ((capitalError || !capitalData) && toStringOrNull(data.url_slug) && toStringOrNull(data.city_slug)) {
        const fallbackCapital = await runWithServiceFallback<any>((client) =>
          client
            .from("project_capital_intelligence_v")
            .select("*")
            .eq("url_slug", toStringOrNull(data.url_slug))
            .eq("city_slug", toStringOrNull(data.city_slug))
            .limit(1)
            .maybeSingle()
        );
        capitalData = fallbackCapital.data;
        capitalError = fallbackCapital.error;
      }

      if (!capitalError && capitalData) {
        capitalRentalDemand =
          toStringOrNull((capitalData as any).rental_demand) ||
          toStringOrNull((capitalData as any).rental_demand_context) ||
          toStringOrNull((capitalData as any).rental_signal);
        capitalYieldEnvironment =
          toStringOrNull((capitalData as any).yield_environment) ||
          toStringOrNull((capitalData as any).yield_context) ||
          toStringOrNull((capitalData as any).yield_signal);
        capitalExitLiquidity =
          toStringOrNull((capitalData as any).exit_liquidity) ||
          toStringOrNull((capitalData as any).liquidity_context) ||
          toStringOrNull((capitalData as any).liquidity_signal);
        capitalInterpretation =
          toStringOrNull((capitalData as any).interpretation) ||
          toStringOrNull((capitalData as any).capital_interpretation) ||
          toStringOrNull((capitalData as any).summary);
      }
    }

    if (projectId) {
      let { data: competitionData, error: competitionError } = await runWithServiceFallback<any>((client) =>
        client
          .from("project_competition_context_v")
          .select("*")
          .eq("project_id", projectId)
          .limit(1)
          .maybeSingle()
      );

      if ((competitionError || !competitionData) && toStringOrNull(data.url_slug) && toStringOrNull(data.city_slug)) {
        const fallbackCompetition = await runWithServiceFallback<any>((client) =>
          client
            .from("project_competition_context_v")
            .select("*")
            .eq("url_slug", toStringOrNull(data.url_slug))
            .eq("city_slug", toStringOrNull(data.city_slug))
            .limit(1)
            .maybeSingle()
        );
        competitionData = fallbackCompetition.data;
        competitionError = fallbackCompetition.error;
      }

      if (!competitionError && competitionData) {
        console.log("Competition Data", competitionData);
        const nearbyProjects = toNumberOrNull((competitionData as any).nearby_projects);
        if (nearbyProjects !== null) {
          competingProjectsCount = nearbyProjects;
        } else {
          const fallbackCounts = [
            toNumberOrNull((competitionData as any).nearby_projects_count),
            toNumberOrNull((competitionData as any).competing_projects_count),
            toNumberOrNull((competitionData as any).competition_count),
          ];
          competingProjectsCount = fallbackCounts.find((value) => value !== null) ?? null;
        }
        competitionIntensity =
          toStringOrNull((competitionData as any).competition_intensity) ||
          toStringOrNull((competitionData as any).intensity_label);
        marketSaturation =
          toStringOrNull((competitionData as any).market_saturation) ||
          toStringOrNull((competitionData as any).saturation_label);
        competitionPricingPowerOutlook =
          toStringOrNull((competitionData as any).pricing_power_outlook) ||
          toStringOrNull((competitionData as any).pricing_power);
        competitionAbsorptionVelocity =
          toStringOrNull((competitionData as any).absorption_velocity) ||
          toStringOrNull((competitionData as any).absorption_velocity_outlook);
        competitionDeveloperDifferentiation =
          toStringOrNull((competitionData as any).developer_differentiation) ||
          toStringOrNull((competitionData as any).differentiation_context);
      }
    }

    if (projectId) {
      let { data: comparablesData, error: comparablesError } = await runWithServiceFallback<any>((client) =>
        client
          .from("listing_project_comparables_v")
          .select("*")
          .eq("project_id", projectId)
          .limit(1)
          .maybeSingle()
      );

      if ((comparablesError || !comparablesData) && toStringOrNull(data.url_slug) && toStringOrNull(data.city_slug)) {
        const fallbackComparables = await runWithServiceFallback<any>((client) =>
          client
            .from("listing_project_comparables_v")
            .select("*")
            .eq("url_slug", toStringOrNull(data.url_slug))
            .eq("city_slug", toStringOrNull(data.city_slug))
            .limit(1)
            .maybeSingle()
        );
        comparablesData = fallbackComparables.data;
        comparablesError = fallbackComparables.error;
      }

      if (!comparablesError && comparablesData) {
        relativeValuePositioning =
          toStringOrNull((comparablesData as any).relative_value_positioning) ||
          toStringOrNull((comparablesData as any).positioning_band) ||
          toStringOrNull((comparablesData as any).value_positioning) ||
          toStringOrNull((comparablesData as any).positioning);
        relativeValueStageVsCorridor =
          toStringOrNull((comparablesData as any).stage_vs_corridor) ||
          toStringOrNull((comparablesData as any).stage_positioning) ||
          toStringOrNull((comparablesData as any).stage_relative);
        relativeValueDensityVsCompetitors =
          toStringOrNull((comparablesData as any).density_vs_competitors) ||
          toStringOrNull((comparablesData as any).density_positioning) ||
          toStringOrNull((comparablesData as any).density_relative);
        relativeValueConfigurationVsCorridor =
          toStringOrNull((comparablesData as any).configuration_vs_corridor) ||
          toStringOrNull((comparablesData as any).configuration_positioning) ||
          toStringOrNull((comparablesData as any).configuration_relative);
        relativeValueEntryAttractiveness =
          toStringOrNull((comparablesData as any).entry_attractiveness) ||
          toStringOrNull((comparablesData as any).entry_signal) ||
          toStringOrNull((comparablesData as any).entry_read);
        relativeValueUpside =
          toStringOrNull((comparablesData as any).upside) ||
          toStringOrNull((comparablesData as any).upside_potential) ||
          toStringOrNull((comparablesData as any).upside_outlook);
      }
    }

    if (projectId) {
      let { data: pricingProxyData, error: pricingProxyError } = await runWithServiceFallback<any>((client) =>
        client
          .from("project_pricing_proxy_v")
          .select("*")
          .eq("project_id", projectId)
          .limit(1)
          .maybeSingle()
      );

      if ((pricingProxyError || !pricingProxyData) && toStringOrNull(data.url_slug) && toStringOrNull(data.city_slug)) {
        const fallbackPricingProxy = await runWithServiceFallback<any>((client) =>
          client
            .from("project_pricing_proxy_v")
            .select("*")
            .eq("url_slug", toStringOrNull(data.url_slug))
            .eq("city_slug", toStringOrNull(data.city_slug))
            .limit(1)
            .maybeSingle()
        );
        pricingProxyData = fallbackPricingProxy.data;
        pricingProxyError = fallbackPricingProxy.error;
      }

      if (!pricingProxyError && pricingProxyData) {
        pricingCorridorBand =
          toStringOrNull((pricingProxyData as any).corridor_price_band) ||
          toStringOrNull((pricingProxyData as any).price_band) ||
          toStringOrNull((pricingProxyData as any).corridor_band);
        pricingRelativePositioning =
          toStringOrNull((pricingProxyData as any).relative_positioning) ||
          toStringOrNull((pricingProxyData as any).price_positioning) ||
          toStringOrNull((pricingProxyData as any).positioning);
        pricingEntryTiming =
          toStringOrNull((pricingProxyData as any).entry_timing) ||
          toStringOrNull((pricingProxyData as any).entry_window) ||
          toStringOrNull((pricingProxyData as any).timing_signal);
        pricingEarlyEntryVsMature =
          toStringOrNull((pricingProxyData as any).early_entry_vs_mature_pricing) ||
          toStringOrNull((pricingProxyData as any).early_entry_context) ||
          toStringOrNull((pricingProxyData as any).pricing_maturity_signal);
        pricingDiscoveryStage =
          toStringOrNull((pricingProxyData as any).price_discovery_stage) ||
          toStringOrNull((pricingProxyData as any).discovery_stage) ||
          toStringOrNull((pricingProxyData as any).pricing_stage);
        pricingUpsideWindow =
          toStringOrNull((pricingProxyData as any).upside_window) ||
          toStringOrNull((pricingProxyData as any).upside_timing) ||
          toStringOrNull((pricingProxyData as any).upside_signal);
      }
    }

    if (microMarketName) {
      const { data: supplyTimelineRaw, error: supplyTimelineError } = await runWithServiceFallback<any[]>((client) =>
        client
          .from("micro_market_supply_timeline")
          .select("*")
          .ilike("micro_market", microMarketName)
          .limit(500)
      );

      if (!supplyTimelineError && Array.isArray(supplyTimelineRaw)) {
        const parseYear = (row: Record<string, unknown>): number | null => {
          const candidate =
            row.completion_year ??
            row.year ??
            row.timeline_year ??
            row.expected_completion_year ??
            row.possession_year;
          const parsed = toNumberOrNull(candidate);
          if (parsed !== null && parsed > 1900 && parsed < 2200) return parsed;

          const dateCandidate =
            toStringOrNull(row.proposed_completion_date) ||
            toStringOrNull(row.expected_completion_date) ||
            toStringOrNull(row.completion_date);
          if (!dateCandidate) return null;

          const parsedDate = new Date(dateCandidate);
          if (Number.isNaN(parsedDate.getTime())) return null;
          const year = parsedDate.getFullYear();
          return year > 1900 && year < 2200 ? year : null;
        };

        const parseDeliveryCount = (row: Record<string, unknown>): number => {
          const parsed =
            toNumberOrNull(row.completions) ||
            toNumberOrNull(row.project_count) ||
            toNumberOrNull(row.total_projects) ||
            toNumberOrNull(row.units) ||
            toNumberOrNull(row.total_units) ||
            toNumberOrNull(row.supply_count) ||
            0;
          return Math.max(0, parsed);
        };

        const parseLaunchCount = (row: Record<string, unknown>): number => {
          const parsed =
            toNumberOrNull(row.upcoming_launches) ||
            toNumberOrNull(row.launches) ||
            toNumberOrNull(row.new_launches) ||
            toNumberOrNull(row.launch_count) ||
            0;
          return Math.max(0, parsed);
        };

        const groupedTimeline = new Map<number, number>();
        let launchesAccumulator = 0;
        supplyTimelineRaw.forEach((rawRow) => {
          const row = (rawRow ?? {}) as Record<string, unknown>;
          launchesAccumulator += parseLaunchCount(row);
          const year = parseYear(row);
          if (!year) return;
          const count = parseDeliveryCount(row);
          groupedTimeline.set(year, (groupedTimeline.get(year) ?? 0) + count);
        });

        futureSupplyTimeline = Array.from(groupedTimeline.entries())
          .map(([year, count]) => ({ year, count }))
          .sort((a, b) => a.year - b.year)
          .slice(0, 10);

        futureUpcomingLaunches = launchesAccumulator > 0 ? launchesAccumulator : null;

        const activeWaves = futureSupplyTimeline.filter((item) => item.count > 0).length;
        futureDeliveryClusters =
          activeWaves >= 4
            ? "Multi-year staggered delivery clusters."
            : activeWaves >= 2
              ? "Two-phase delivery clusters."
              : activeWaves === 1
                ? "Single concentrated delivery cluster."
                : "Delivery cluster visibility is currently constrained.";

        const totalPipeline = futureSupplyTimeline.reduce((sum, item) => sum + item.count, 0);
        const peakWaveCount = futureSupplyTimeline.reduce((max, item) => Math.max(max, item.count), 0);
        const peakShare = totalPipeline > 0 ? peakWaveCount / totalPipeline : 0;
        futureSupplyWaves =
          peakShare >= 0.45
            ? "Concentrated supply wave expected."
            : futureSupplyTimeline.length >= 3
              ? "Staggered supply waves expected."
              : "Moderate supply wave visibility.";
      }
    }

    // Fetch clean unit size range, unit count, tower count, and AI status from RERA data
    let cleanMinArea: number | null = toNumberOrNull(data.min_area);
    let cleanMaxArea: number | null = toNumberOrNull(data.max_area);
    let cleanTowerCount: number | null = toNumberOrNull(data.total_towers);
    let cleanMaxFloors: number | null = toNumberOrNull((data as any).total_floors);
    let aiKeyUpdatesText: string | null = null;
    const projectTypeRaw = toStringOrNull((data as any).project_type)?.toLowerCase() ?? "";
    const isCommercialProject = projectTypeRaw.includes("commercial") || projectTypeRaw.includes("mixed");
    const unitSizeReraId = toStringOrNull(data.rera_id);
    if (unitSizeReraId) {
      try {
        const { data: reraRow } = await runWithServiceFallback<any>((client) =>
          client.from("rera_projects").select("id").eq("rera_id", unitSizeReraId).maybeSingle()
        );
        if (reraRow?.id) {
          const [sizeResult, buildingResult, liveIntelResult] = await Promise.all([
            // Unit sizes (saleable_area only, no amenity/floor rows)
            runWithServiceFallback<any>((client) => {
              let q = client
                .from("rera_units")
                .select("saleable_area, builtup_area, total_units, unit_category")
                .eq("project_id", reraRow.id)
                // Always exclude amenity/facility rows
                .not("unit_category", "ilike", "%club%")
                .not("unit_category", "ilike", "%amenity%")
                .not("unit_category", "ilike", "%amenities%")
                .not("unit_category", "ilike", "%gym%")
                .not("unit_category", "ilike", "%common%")
                .not("unit_category", "ilike", "%library%")
                .not("unit_category", "ilike", "%guest%")
                .not("unit_category", "ilike", "%theater%")
                .not("unit_category", "ilike", "%spa%")
                .not("unit_category", "ilike", "%first floor%")
                .not("unit_category", "ilike", "%second floor%")
                .not("unit_category", "ilike", "%third floor%")
                .not("unit_category", "ilike", "%fourth floor%")
                .not("unit_category", "ilike", "%fifth floor%")
                .not("unit_category", "ilike", "%ground floor%")
                .not("unit_category", "ilike", "%basement%")
                .not("unit_category", "ilike", "%stilt%")
                .not("unit_category", "ilike", "%podium%")
                .not("unit_category", "ilike", "%terrace%")
                .gt("saleable_area", 0);
              // Only exclude shop/office/commercial for residential projects
              // (for commercial/mixed, these ARE the valid unit types)
              if (!isCommercialProject) {
                q = q
                  .not("unit_category", "ilike", "%office%")
                  .not("unit_category", "ilike", "%shop%")
                  .not("unit_category", "ilike", "%commercial%");
              }
              return q;
            }),
            // Tower count + max floors (residential buildings only, no clubhouse)
            runWithServiceFallback<any>((client) =>
              client
                .from("rera_buildings")
                .select("id, num_floors")
                .eq("rera_project_id", reraRow.id)
                .not("building_name", "ilike", "%club%")
                .not("building_type", "ilike", "%club%")
                .not("building_name", "ilike", "%amenity%")
            ),
            // AI live intelligence key_updates for status
            runWithServiceFallback<any>((client) =>
              client
                .from("project_live_intelligence")
                .select("key_updates")
                .eq("rera_project_id", reraRow.id)
                .maybeSingle()
            ),
          ]);

          // AI status signals
          const keyUpdates = liveIntelResult.data?.key_updates;
          if (Array.isArray(keyUpdates) && keyUpdates.length > 0) {
            aiKeyUpdatesText = keyUpdates.join(" ");
          }

          // Unit sizes: smart per-unit area, convert, filter 300–15000 sqft
          const sizeRows = (sizeResult.data as any[]) || [];
          const allAreas = sizeRows
            .map((r: any) => {
              const rawArea = r.saleable_area || r.builtup_area || 0;
              if (!rawArea || rawArea <= 0) return null;

              // Skip commercial units in residential projects
              const cat = (r.unit_category || '').toLowerCase();
              if (cat.includes('commercial') ||
                  cat.includes('office') ||
                  cat.includes('shop') ||
                  cat.includes('retail')) return null;

              // Smart logic: if area > 500 and dividing by total_units
              // gives reasonable result, treat as total area
              let perUnitArea = rawArea;
              const numUnits = r.total_units && r.total_units > 0 ? r.total_units : 1;
              if (rawArea > 500 && numUnits > 1) {
                const divided = rawArea / numUnits;
                if (divided >= 60 && divided <= 2000) {
                  perUnitArea = divided;
                }
              }

              return toSqft(perUnitArea);
            })
            .filter((v): v is number => v !== null && v >= 300 && v <= 15000);
          const cleanAreas = allAreas;
          if (cleanAreas.length > 0) {
            cleanMinArea = Math.min(...cleanAreas);
            cleanMaxArea = Math.max(...cleanAreas);
          }

          // Tower count + max floors: residential buildings only
          const buildingRows = (buildingResult.data as any[]) || [];
          if (buildingRows.length > 0) {
            cleanTowerCount = buildingRows.length;
            const maxF = buildingRows
              .map((b: any) => b.num_floors ?? 0)
              .filter((f: number) => f > 0)
              .reduce((m: number, f: number) => Math.max(m, f), 0);
            if (maxF > 0) cleanMaxFloors = maxF;
          }
        }
      } catch { /* fall through to MV values */ }
    }

    const project: ProjectWithRelations = {
      // Spread all MV fields so gallery_images_json, amenities_json, etc. are available
      ...(data as any),
      // Merge enrichment fields from projects table (not in MV)
      project_overview_seo: projectsTableData?.project_overview_seo ?? toStringOrNull((data as any).project_overview_seo) ?? "",
      westside_realty_review: projectsTableData?.westside_realty_review ?? toStringOrNull((data as any).westside_realty_review),
      seo_title: projectsTableData?.seo_title ?? toStringOrNull((data as any).seo_title),
      meta_description: projectsTableData?.meta_description ?? toStringOrNull((data as any).meta_description) ?? "",
      h1_title: projectsTableData?.h1_title ?? toStringOrNull((data as any).h1_title),
      // Enrichment arrays / pricing
      configurations: projectsTableData?.configurations ?? null,
      unit_size_range: projectsTableData?.unit_size_range ?? null,
      min_price: projectsTableData?.min_price ?? null,
      max_price: projectsTableData?.max_price ?? null,
      price_display_string: projectsTableData?.price_display_string ?? null,
      amenities_json: projectsTableData?.amenities_json ?? ((data as any).amenities_json ?? null),
      project_highlights: projectsTableData?.project_highlights ?? null,
      location_highlights: projectsTableData?.location_highlights ?? null,
      property_types: projectsTableData?.property_types ?? null,
      id: String(data.project_id ?? ""),
      project_name: String(data.project_name ?? ""),
      configuration_display: toStringOrNull(data.configuration_display),
      min_area: cleanMinArea,
      max_area: cleanMaxArea,
      total_units: toNumberOrNull(data.total_units),
      booked_units: toNumberOrNull(data.booked_units),
      total_towers: cleanTowerCount,
      total_floors: cleanMaxFloors,
      rera_id: toStringOrNull(data.rera_id),
      project_type: toStringOrNull((data as any).project_type),
      current_status: computeProjectStatus(
        toStringOrNull(data.current_status),
        toStringOrNull(data.proposed_completion_date),
        toStringOrNull((data as any).approved_date),
        aiKeyUpdatesText,
      ),
      status: computeProjectStatus(
        toStringOrNull(data.current_status),
        toStringOrNull(data.proposed_completion_date),
        toStringOrNull((data as any).approved_date),
        aiKeyUpdatesText,
      ),
      developer_name: displayDeveloperName || toStringOrNull(data.developer_name),
      display_developer_name: displayDeveloperName,
      micro_market_name: toStringOrNull(data.micro_market) || toStringOrNull((data as any).micro_market_name),
      micro_market_institutional_positioning: microMarketPositioningText,
      nearby_supply_within_2km: nearbySupplyCount,
      supply_radius_km: calibratedRadiusKm,
      inventory_dominant_configuration: inventoryDominantConfiguration,
      inventory_total_planned_units: inventoryTotalPlannedUnits,
      inventory_demand_strength: inventoryDemandStrength,
      inventory_demand_interpretation: inventoryDemandInterpretation,
      execution_stage: executionStage,
      execution_timeline_risk: executionTimelineRisk,
      execution_capital_lock_in_risk: executionCapitalLockInRisk,
      execution_interpretation: executionInterpretation,
      capital_rental_demand: capitalRentalDemand,
      capital_yield_environment: capitalYieldEnvironment,
      capital_exit_liquidity: capitalExitLiquidity,
      capital_interpretation: capitalInterpretation,
      competing_projects_count: competingProjectsCount,
      nearby_projects: competingProjectsCount,
      competition_intensity: competitionIntensity,
      market_saturation: marketSaturation,
      competition_pricing_power_outlook: competitionPricingPowerOutlook,
      competition_absorption_velocity: competitionAbsorptionVelocity,
      competition_developer_differentiation: competitionDeveloperDifferentiation,
      relative_value_positioning: relativeValuePositioning,
      relative_value_stage_vs_corridor: relativeValueStageVsCorridor,
      relative_value_density_vs_competitors: relativeValueDensityVsCompetitors,
      relative_value_configuration_vs_corridor: relativeValueConfigurationVsCorridor,
      relative_value_entry_attractiveness: relativeValueEntryAttractiveness,
      relative_value_upside: relativeValueUpside,
      pricing_corridor_price_band: pricingCorridorBand,
      pricing_relative_positioning: pricingRelativePositioning,
      pricing_entry_timing: pricingEntryTiming,
      pricing_early_entry_vs_mature: pricingEarlyEntryVsMature,
      pricing_discovery_stage: pricingDiscoveryStage,
      pricing_upside_window: pricingUpsideWindow,
      future_supply_timeline: futureSupplyTimeline,
      future_upcoming_launches: futureUpcomingLaunches,
      future_delivery_clusters: futureDeliveryClusters,
      future_supply_waves: futureSupplyWaves,
      project_institutional_identity: (data as any).project_institutional_identity ?? null,
      configuration_distribution: configurationDistribution,
      latitude,
      longitude,
      possession_date:
        toStringOrNull(data.actual_completion_date) || toStringOrNull(data.proposed_completion_date),
      possession_date_text:
        toStringOrNull((data as any).possession_date_text) ||
        toStringOrNull(data.actual_completion_date) ||
        toStringOrNull(data.proposed_completion_date),
      url_slug: toStringOrNull(data.url_slug) ?? projectSlug,
      city: {
        city_name: toStringOrNull((data as any).city_name) || citySlug,
        url_slug: toStringOrNull(data.city_slug) ?? citySlug,
      },
      micro_market: (toStringOrNull(data.micro_market) || toStringOrNull((data as any).micro_market_name))
        ? {
            micro_market_name: toStringOrNull(data.micro_market) || toStringOrNull((data as any).micro_market_name) || "",
            url_slug: toStringOrNull((data as any).micro_market_slug) || microMarketExtended?.url_slug || "",
            hero_hook: microMarketExtended?.hero_hook ?? null,
            price_per_sqft_min: microMarketExtended?.price_per_sqft_min ?? null,
            price_per_sqft_max: microMarketExtended?.price_per_sqft_max ?? null,
            annual_appreciation_min: microMarketExtended?.annual_appreciation_min ?? null,
          }
        : undefined,
      developer: (displayDeveloperName || toStringOrNull(data.developer_name))
        ? {
            developer_name: displayDeveloperName || String(data.developer_name),
            url_slug: toStringOrNull((data as any).developer_slug) || developerExtended?.url_slug || "",
            logo_url: developerExtended?.logo_url || toStringOrNull((data as any).developer_logo_url),
            years_in_business: developerExtended?.years_in_business ?? null,
            total_projects: developerExtended?.total_projects ?? null,
            hero_description: developerExtended?.hero_description ?? null,
            long_description_seo: developerExtended?.long_description_seo ?? null,
            notable_projects_json: developerExtended?.notable_projects_json ?? null,
          }
        : undefined,
    } as ProjectWithRelations;

    return project;
  },

  /**
   * For typo/backlink-safe routing: find nearest slug in same city.
   */
  async getClosestCityProjectSlug(
    citySlug: string,
    projectSlug: string
  ): Promise<string | null> {
    const { data, error } = await runWithServiceFallback<Array<{ url_slug: string | null } & { city?: any }>>(
      (client) =>
        client
          .from("projects")
          .select("url_slug, city:cities(url_slug)")
          .not("url_slug", "is", null)
          .limit(3000)
    );

    if (error || !data?.length) {
      return null;
    }

    const normalizedTarget = normalizeSlugToken(projectSlug);
    if (!normalizedTarget) return null;

    const targetTokens = splitSlugTokens(normalizedTarget);
    let best: { slug: string; score: number; distance: number } | null = null;
    for (const row of data) {
      const relation = Array.isArray(row.city) ? row.city[0] : row.city;
      if (relation?.url_slug !== citySlug || !row.url_slug) continue;

      const candidateSlug = String(row.url_slug);
      const distance = levenshteinDistance(normalizedTarget, candidateSlug);
      const candidateTokens = splitSlugTokens(candidateSlug);
      const sharedTokens = candidateTokens.filter((token) =>
        targetTokens.some((target) => token === target)
      ).length;
      const prefixBoost = hasPrefixMatch(normalizedTarget, candidateSlug) ? 2 : 0;
      // Lower score is better. Shared terms and prefix alignment reduce score.
      const score = distance - sharedTokens - prefixBoost;

      if (!best || score < best.score || (score === best.score && distance < best.distance)) {
        best = { slug: candidateSlug, score, distance };
      }
    }

    if (!best) return null;
    // Keep fallback conservative to avoid wrong redirects.
    if (best.distance > 6 && best.score > 3) return null;
    return best.slug;
  },

  /**
   * Get all projects for a city
   */
  async getProjectsByCity(cityId: string, featuredOnly: boolean = false): Promise<ProjectWithRelations[]> {
    const { data, error } = await runWithServiceFallback<ProjectWithRelations[]>((client) => {
      let query = client
        .from('projects')
        .select(`
          *,
          micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug),
          developer:developers(developer_name, url_slug)
        `)
        .eq('city_id', cityId)
        .or('status.ilike.published,status.ilike.%under construction%');
      
      if (featuredOnly) {
        query = query.eq('show_on_city_page', true);
      }
      
      return query
        .order('display_order', { ascending: true })
        .order('project_name', { ascending: true });
    });

    if (error) {
      console.error('❌ [ProjectService] Error fetching projects by city:', error);
      return [];
    }

    return data as ProjectWithRelations[];
  },

  /**
   * Get all projects for a micro-market by slug
   * Returns all projects matching the micro-market, regardless of show_in_micro_market_page flag
   */
  async getProjectsByMicroMarket(
    citySlug: string,
    microMarketSlug: string
  ): Promise<ProjectWithRelations[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        city:cities!inner(city_name, url_slug),
        micro_market:micro_markets!projects_micromarket_id_fkey!inner(micro_market_name, url_slug),
        developer:developers(developer_name, url_slug)
      `)
      .eq('city.url_slug', citySlug)
      .eq('micro_market.url_slug', microMarketSlug)
      .or('status.ilike.published,status.ilike.%under construction%')
      .order('display_order', { ascending: true })
      .order('project_name', { ascending: true });

    if (error) {
      console.error('❌ [ProjectService] Error fetching projects by micro-market:', error);
      return [];
    }

    return data as ProjectWithRelations[];
  },

  /**
   * Get related projects for a micro-market by ID (for similar projects section)
   */
  async getRelatedProjectsByMicroMarketId(
    microMarketId: string
  ): Promise<ProjectWithRelations[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        city:cities(city_name, url_slug),
        micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug),
        developer:developers(developer_name, url_slug)
      `)
      .eq('micro_market_id', microMarketId)
      .or('status.ilike.published,status.ilike.%under construction%')
      .order('display_order', { ascending: true })
      .order('project_name', { ascending: true })
      .limit(10);

    if (error) {
      console.error('❌ [ProjectService] Error fetching related projects:', error);
      return [];
    }

    return data as ProjectWithRelations[];
  },

  /**
   * Get featured projects for a city
   */
  async getFeaturedProjects(cityId: string, limit: number = 6): Promise<ProjectWithRelations[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug),
        developer:developers(developer_name, url_slug)
      `)
      .eq('city_id', cityId)
      .eq('show_on_city_page', true)
      .eq('status', 'published')
      .order('display_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('❌ [ProjectService] Error fetching featured projects:', error);
      return [];
    }

    return data as ProjectWithRelations[];
  },

  /**
   * Get projects by developer
   */
  async getProjectsByDeveloper(developerId: string): Promise<ProjectWithRelations[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        city:cities(city_name, url_slug),
        micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug)
      `)
      .eq('developer_id', developerId)
      .eq('status', 'published')
      .order('display_order', { ascending: true })
      .order('project_name', { ascending: true });

    if (error) {
      console.error('❌ [ProjectService] Error fetching projects by developer:', error);
      return [];
    }

    return data as ProjectWithRelations[];
  },

  /**
   * Search projects by name or location
   */
  async searchProjects(
    searchTerm: string,
    cityId?: string
  ): Promise<ProjectWithRelations[]> {
    const supabase = await createClient();
    let query = supabase
      .from('projects')
      .select(`
        *,
        city:cities(city_name, url_slug),
        micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug),
        developer:developers(developer_name, url_slug)
      `)
      .eq('status', 'published')
      .or(`project_name.ilike.%${searchTerm}%,seo_title.ilike.%${searchTerm}%`);

    if (cityId) {
      query = query.eq('city_id', cityId);
    }

    const { data, error } = await query
      .order('display_order', { ascending: true })
      .limit(20);

    if (error) {
      console.error('❌ [ProjectService] Error searching projects:', error);
      return [];
    }

    return data as ProjectWithRelations[];
  },

  buildProjectPageContext(
    project: ProjectWithRelations,
    citySlug: string,
    projectSlug: string
  ): ProjectPageContext {
    const microMarket = project.micro_market ?? null;
    const cityData = project.city ?? null;
    const cityName = cityData?.city_name || citySlug;
    const microMarketSlug = microMarket?.url_slug ?? null;

    const canonicalUrl = buildProjectAbsoluteUrl(citySlug, projectSlug);
    const seoTitle =
      project.seo_title ||
      `${project.project_name} ${cityName}: Price, Floor Plans & Reviews | RE/MAX`;
    const seoDescription =
      project.meta_description ||
      `Explore ${project.project_name} - Premium residential project in ${cityName}`;

    const breadcrumbItems = [
      { name: "Home", href: "/" },
      { name: cityName, href: `/${citySlug}` },
      ...(microMarketSlug && microMarket
        ? [{ name: microMarket.micro_market_name || microMarketSlug, href: `/${citySlug}/${microMarketSlug}` }]
        : []),
      { name: "Projects", href: `/${citySlug}/projects` },
      { name: project.project_name, href: buildProjectUrl(citySlug, projectSlug) },
    ];

    const faqsRaw = safeJsonParse((project as any).faqs_json, []);
    const faqItems: { question: string; answer: string }[] = [];
    if (faqsRaw && Array.isArray(faqsRaw)) {
      faqsRaw.forEach((faq: any) => {
        const question = faq.question || faq.q || faq.title || '';
        const answer = faq.answer || faq.a || faq.description || faq.content || '';
        if (question && answer) {
          faqItems.push({
            question,
            answer: typeof answer === 'string'
              ? answer.replace(/<[^>]*>/g, '')
              : String(answer),
          });
        }
      });
    }

    const primaryEntity: Record<string, any> = {
      "@type": "RealEstateListing",
      name: project.project_name,
      description: seoDescription,
      image: project.hero_image_url || undefined,
      url: canonicalUrl,
      address: {
        "@type": "PostalAddress",
        addressLocality: cityName,
        addressRegion: microMarket?.micro_market_name || "",
        addressCountry: "IN",
      },
      ...(project.price_range_text && {
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "INR",
          priceRange: project.price_range_text,
        },
      }),
    };

    const unifiedSchema = generateUnifiedSchema({
      pageUrl: canonicalUrl,
      title: seoTitle,
      description: seoDescription,
      heroImageUrl: project.hero_image_url || undefined,
      primaryEntityType: "RealEstateListing",
      primaryEntity,
      faqItems,
      breadcrumbs: [
        { name: "Home", item: "https://www.westsiderealty.in" },
        { name: cityName, item: `https://www.westsiderealty.in/${citySlug}` },
        ...(microMarketSlug && microMarket
          ? [{ name: microMarket.micro_market_name || microMarketSlug, item: `https://www.westsiderealty.in/${citySlug}/${microMarketSlug}` }]
          : []),
        { name: "Projects", item: `https://www.westsiderealty.in/${citySlug}/projects` },
        { name: project.project_name, item: canonicalUrl },
      ],
    });

    const technicalSpecs = parseJsonb((project as any).project_snapshot_json, []);
    const amenities = parseJsonb((project as any).amenities_json, []);
    const specifications: any = parseJsonb((project as any).specifications_json, null);
    const floorPlansRaw = asArray<any>(parseJsonb((project as any).floor_plan_images, []));
    const locationAdvantages: any = parseJsonb((project as any).location_advantages_json, null);
    const investmentAnalysis = parseJsonb((project as any).investment_analysis_json, {});
    const projectHighlights: any = parseJsonb((project as any).project_highlights, null);
    const faqs = faqsRaw;

    const galleryImagesJson = asArray<string | { url?: string; image_url?: string; src?: string }>(
      parseJsonb((project as any).gallery_images_json, [])
    );
    const galleryImages: string[] = galleryImagesJson
      .map((item) => {
        if (typeof item === "string") return item;
        return item?.url || item?.image_url || item?.src || "";
      })
      .filter((u) => typeof u === "string" && u.trim() !== "");

    const addressParts = [microMarket?.micro_market_name, cityName].filter(Boolean);
    const address = addressParts.join(", ");

    return {
      canonicalUrl,
      seoTitle,
      seoDescription,
      breadcrumbItems,
      unifiedSchema,
      technicalSpecs,
      amenities,
      specifications,
      floorPlansRaw,
      locationAdvantages,
      investmentAnalysis,
      projectHighlights,
      faqs,
      galleryImages,
      address,
    };
  }
};
