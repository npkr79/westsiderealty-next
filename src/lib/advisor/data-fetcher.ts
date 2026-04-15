import { createServiceClient } from "@/lib/supabase/serviceClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProjectSummary {
  project_name: string;
  project_slug: string;
  developer_brand: string;
  project_segment: string;
  project_type: string;
  current_status: string;
  possession_date: string | null;
  micro_market: string;
  micro_market_slug: string;
  sub_zone: string | null;
  total_units: number | null;
  total_towers: number | null;
  total_floors_max: number | null;
  land_area_acres: number | null;
  open_space_pct: number | null;
  current_price_per_sqft_min: number | null;
  current_price_per_sqft_max: number | null;
  density_units_per_acre: number | null;
  primary_differentiator: string | null;
  target_buyer_segment: string | null;
  investment_verdict: string | null;
  clubhouse_sqft: number | null;
  rera_id: string | null;
  rera_verified: boolean;
}

export interface ConfigSummary {
  project_slug: string;
  project_name: string;
  config_type: string;
  sba_sqft_min: number | null;
  sba_sqft_max: number | null;
  price_min_cr: number | null;
  price_max_cr: number | null;
  price_per_sqft: number | null;
  has_servant_quarters: boolean;
}

export interface MarketSummary {
  market_name: string;
  market_slug: string;
  market_type: string;
  description: string;
  price_per_sqft_min: number | null;
  price_per_sqft_max: number | null;
  price_per_sqft_avg: number | null;
  appreciation_1yr_pct: number | null;
  appreciation_cagr_5yr: number | null;
  total_active_projects: number | null;
  total_units_pipeline: number | null;
  investment_verdict: string | null;
  outlook_base_case: string | null;
  rental_yield_avg_pct: number | null;
  most_popular_configs: string[] | null;
  growth_catalysts: unknown;
  risk_factors: unknown;
  metro_status: string | null;
  market_velocity_score: number | null;
}

export interface AdvisorQueryResult {
  projects: ProjectSummary[];
  configs: ConfigSummary[];
  markets: MarketSummary[];
}

// ─── Adjacent market map (for fallback when a specific market has few results) ──

const ADJACENT_MARKETS: Record<string, string[]> = {
  // Goa North
  siolim:    ["candolim", "calangute", "porvorim", "morjim"],
  candolim:  ["calangute", "siolim", "porvorim"],
  calangute: ["candolim", "siolim", "anjuna"],
  vagator:   ["anjuna", "assagao", "calangute"],
  anjuna:    ["vagator", "assagao", "calangute"],
  assagao:   ["anjuna", "vagator"],
  morjim:    ["siolim", "candolim"],
  porvorim:  ["candolim", "calangute"],
  "dona-paula": ["porvorim", "calangute"],
  // Goa South
  benaulim:  ["cavelossim", "colva"],
  // Hyderabad
  kokapet:   ["neopolis", "financial-district", "gachibowli"],
  neopolis:  ["kokapet", "financial-district", "tellapur"],
  "financial-district": ["kokapet", "neopolis", "gachibowli"],
  gachibowli: ["financial-district", "kondapur", "madhapur"],
  tellapur:  ["neopolis", "kokapet", "narsingi"],
  narsingi:  ["tellapur", "financial-district", "manikonda"],
  manikonda: ["narsingi", "financial-district", "gachibowli"],
  "rajendra-nagar": ["narsingi", "manikonda"],
};

// ─── Intent-based fetchers ─────────────────────────────────────────────────────

const PROJECT_SELECT = `
  project_name, project_slug, developer_brand, project_segment, project_type,
  current_status, possession_date, micro_market, micro_market_slug, sub_zone,
  total_units, total_towers, total_floors_max, land_area_acres, open_space_pct,
  current_price_per_sqft_min, current_price_per_sqft_max,
  density_units_per_acre, primary_differentiator, target_buyer_segment,
  investment_verdict, clubhouse_sqft, rera_id, rera_verified
`.trim();

const CONFIG_SELECT = `
  project_slug, config_type, sba_sqft_min, sba_sqft_max,
  price_min_cr, price_max_cr, price_per_sqft, has_servant_quarters
`.trim();

// Add project_name by joining through project_slug
const CONFIG_SELECT_WITH_NAME = `
  project_slug, config_type, sba_sqft_min, sba_sqft_max,
  price_min_cr, price_max_cr, price_per_sqft, has_servant_quarters
`.trim();

const MARKET_SELECT = `
  market_name, market_slug, market_type, description,
  price_per_sqft_min, price_per_sqft_max, price_per_sqft_avg,
  appreciation_1yr_pct, appreciation_cagr_5yr,
  total_active_projects, total_units_pipeline,
  investment_verdict, outlook_base_case, rental_yield_avg_pct,
  most_popular_configs, growth_catalysts, risk_factors,
  metro_status, market_velocity_score
`.trim();

export async function fetchByBudget(
  budgetMinCr: number,
  budgetMaxCr: number | null,
  microMarketSlug?: string,
  citySlug?: string,
  propertyType?: string
): Promise<AdvisorQueryResult> {
  const supabase = createServiceClient();

  // Get configs in budget range
  let configQuery = supabase
    .from("advisor_project_configurations")
    .select(CONFIG_SELECT_WITH_NAME)
    .order("price_min_cr");

  // Budget filtering: min budget means price_max_cr >= budgetMinCr
  if (budgetMinCr > 0) configQuery = configQuery.gte("price_max_cr", budgetMinCr);
  if (budgetMaxCr != null) configQuery = configQuery.lte("price_min_cr", budgetMaxCr);

  const { data: configRows } = await configQuery;
  const configs = (configRows ?? []) as unknown as ConfigSummary[];

  let slugs = [...new Set(configs.map((c) => c.project_slug))];
  if (!slugs.length) return { projects: [], configs: [], markets: [] };

  // Build project query with all available filters
  const buildProjectQuery = (marketSlug?: string) => {
    let q = supabase
      .from("advisor_project_intelligence")
      .select(PROJECT_SELECT)
      .in("project_slug", slugs);
    if (marketSlug) q = q.eq("micro_market_slug", marketSlug);
    if (citySlug)   q = q.eq("city_slug", citySlug);
    if (propertyType) q = q.eq("project_type", propertyType);
    return q;
  };

  let { data: projectRows } = await buildProjectQuery(microMarketSlug);
  let projects = (projectRows ?? []) as unknown as ProjectSummary[];

  // If specific market requested but too few results, expand to adjacent markets
  if (microMarketSlug && projects.length < 3) {
    const adjacent = ADJACENT_MARKETS[microMarketSlug] ?? [];
    const expandedMarkets = [microMarketSlug, ...adjacent];
    let eq = supabase
      .from("advisor_project_intelligence")
      .select(PROJECT_SELECT)
      .in("project_slug", slugs)
      .in("micro_market_slug", expandedMarkets);
    if (citySlug) eq = eq.eq("city_slug", citySlug);
    if (propertyType) eq = eq.eq("project_type", propertyType);
    const { data: expanded } = await eq;
    if ((expanded ?? []).length > projects.length) {
      projects = (expanded ?? []) as unknown as ProjectSummary[];
    }
  }

  // If still no results and property type was set, relax property type but keep city/market
  if (projects.length === 0 && propertyType) {
    let relaxed = supabase
      .from("advisor_project_intelligence")
      .select(PROJECT_SELECT)
      .in("project_slug", slugs);
    if (microMarketSlug) relaxed = relaxed.eq("micro_market_slug", microMarketSlug);
    if (citySlug) relaxed = relaxed.eq("city_slug", citySlug);
    const { data: relaxedRows } = await relaxed;
    projects = (relaxedRows ?? []) as unknown as ProjectSummary[];
  }

  const marketSlugs = [...new Set(projects.map((p) => p.micro_market_slug))];
  const { data: marketRows } = await supabase
    .from("advisor_market_intelligence")
    .select(MARKET_SELECT)
    .in("market_slug", marketSlugs);

  // Filter configs to only those matching returned projects
  const returnedSlugs = new Set(projects.map((p) => p.project_slug));
  const filteredConfigs = configs.filter((c) => returnedSlugs.has(c.project_slug));

  return {
    projects,
    configs: filteredConfigs,
    markets: (marketRows ?? []) as unknown as MarketSummary[],
  };
}

export async function fetchByBHK(
  bhk: string,
  microMarketSlug?: string,
  citySlug?: string,
  propertyType?: string
): Promise<AdvisorQueryResult> {
  const supabase = createServiceClient();

  const normalised = bhk.replace(/\s+/g, " ").toUpperCase();

  const { data: configRows } = await supabase
    .from("advisor_project_configurations")
    .select(CONFIG_SELECT_WITH_NAME)
    .ilike("config_type", `%${normalised}%`)
    .order("price_min_cr");

  const configs = (configRows ?? []) as unknown as ConfigSummary[];
  const slugs = [...new Set(configs.map((c) => c.project_slug))];
  if (!slugs.length) return { projects: [], configs: [], markets: [] };

  let projectQuery = supabase
    .from("advisor_project_intelligence")
    .select(PROJECT_SELECT)
    .in("project_slug", slugs);
  if (microMarketSlug) projectQuery = projectQuery.eq("micro_market_slug", microMarketSlug);
  if (citySlug)        projectQuery = projectQuery.eq("city_slug", citySlug);
  if (propertyType)    projectQuery = projectQuery.eq("project_type", propertyType);

  let { data: projectRows } = await projectQuery;
  let projects = (projectRows ?? []) as unknown as ProjectSummary[];

  // Adjacent market fallback
  if (microMarketSlug && projects.length < 3) {
    const adjacent = ADJACENT_MARKETS[microMarketSlug] ?? [];
    const expandedMarkets = [microMarketSlug, ...adjacent];
    let eq = supabase
      .from("advisor_project_intelligence")
      .select(PROJECT_SELECT)
      .in("project_slug", slugs)
      .in("micro_market_slug", expandedMarkets);
    if (citySlug) eq = eq.eq("city_slug", citySlug);
    if (propertyType) eq = eq.eq("project_type", propertyType);
    const { data: expanded } = await eq;
    if ((expanded ?? []).length > projects.length) {
      projects = (expanded ?? []) as unknown as ProjectSummary[];
    }
  }

  const marketSlugs = [...new Set(projects.map((p) => p.micro_market_slug))];
  const { data: marketRows } = await supabase
    .from("advisor_market_intelligence")
    .select(MARKET_SELECT)
    .in("market_slug", marketSlugs);

  const returnedSlugs = new Set(projects.map((p) => p.project_slug));
  return {
    projects,
    configs: configs.filter((c) => returnedSlugs.has(c.project_slug)),
    markets: (marketRows ?? []) as unknown as MarketSummary[],
  };
}

export async function fetchByMarket(
  marketSlug: "kokapet" | "neopolis" | string
): Promise<AdvisorQueryResult> {
  const supabase = createServiceClient();

  const [projectRes, marketRes] = await Promise.all([
    supabase
      .from("advisor_project_intelligence")
      .select(PROJECT_SELECT)
      .eq("micro_market_slug", marketSlug)
      .order("current_price_per_sqft_min", { ascending: false }),
    supabase
      .from("advisor_market_intelligence")
      .select(MARKET_SELECT)
      .eq("market_slug", marketSlug),
  ]);

  const projects = (projectRes.data ?? []) as unknown as ProjectSummary[];
  const slugs = projects.map((p) => p.project_slug);

  const { data: configRows } = slugs.length
    ? await supabase
        .from("advisor_project_configurations")
        .select(CONFIG_SELECT_WITH_NAME)
        .in("project_slug", slugs)
    : { data: [] };

  return {
    projects,
    configs: (configRows ?? []) as unknown as ConfigSummary[],
    markets: (marketRes.data ?? []) as unknown as MarketSummary[],
  };
}

export async function fetchByProjectName(
  projectNameOrSlug: string
): Promise<AdvisorQueryResult> {
  const supabase = createServiceClient();

  const slug = projectNameOrSlug.toLowerCase().replace(/\s+/g, "-");
  // Significant words only (≥4 chars) to avoid noise from "My", "The", etc.
  const words = projectNameOrSlug
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length >= 4);

  // Run all three searches in parallel
  const [slugRes, nameRes, ...wordResults] = await Promise.all([
    supabase
      .from("advisor_project_intelligence")
      .select(PROJECT_SELECT)
      .ilike("project_slug", `%${slug}%`),
    supabase
      .from("advisor_project_intelligence")
      .select(PROJECT_SELECT)
      .ilike("project_name", `%${projectNameOrSlug}%`),
    ...words.map((word) =>
      supabase
        .from("advisor_project_intelligence")
        .select(PROJECT_SELECT)
        .or(`project_slug.ilike.%${word}%,project_name.ilike.%${word}%`)
    ),
  ]);

  // Combine and deduplicate by project_slug (slug match takes priority)
  const seen = new Set<string>();
  const projects: ProjectSummary[] = [];
  for (const row of [
    ...(slugRes.data ?? []),
    ...(nameRes.data ?? []),
    ...wordResults.flatMap((r) => r.data ?? []),
  ] as unknown as ProjectSummary[]) {
    if (!seen.has(row.project_slug)) {
      seen.add(row.project_slug);
      projects.push(row);
    }
  }

  if (!projects.length) return { projects: [], configs: [], markets: [] };

  const slugs = projects.map((p) => p.project_slug);
  const marketSlugs = [...new Set(projects.map((p) => p.micro_market_slug))];

  const [configRes, marketRes] = await Promise.all([
    supabase
      .from("advisor_project_configurations")
      .select(CONFIG_SELECT_WITH_NAME)
      .in("project_slug", slugs),
    supabase
      .from("advisor_market_intelligence")
      .select(MARKET_SELECT)
      .in("market_slug", marketSlugs),
  ]);

  return {
    projects,
    configs: (configRes.data ?? []) as unknown as ConfigSummary[],
    markets: (marketRes.data ?? []) as unknown as MarketSummary[],
  };
}

export async function fetchByDeveloper(
  developerName: string
): Promise<AdvisorQueryResult> {
  const supabase = createServiceClient();

  const { data: projectRows } = await supabase
    .from("advisor_project_intelligence")
    .select(PROJECT_SELECT)
    .ilike("developer_brand", `%${developerName}%`)
    .order("current_price_per_sqft_min", { ascending: false });

  const projects = (projectRows ?? []) as unknown as ProjectSummary[];
  if (!projects.length) return { projects: [], configs: [], markets: [] };

  const slugs = projects.map((p) => p.project_slug);
  const marketSlugs = [...new Set(projects.map((p) => p.micro_market_slug))];

  const [configRes, marketRes] = await Promise.all([
    supabase
      .from("advisor_project_configurations")
      .select(CONFIG_SELECT_WITH_NAME)
      .in("project_slug", slugs),
    supabase
      .from("advisor_market_intelligence")
      .select(MARKET_SELECT)
      .in("market_slug", marketSlugs),
  ]);

  return {
    projects,
    configs: (configRes.data ?? []) as unknown as ConfigSummary[],
    markets: (marketRes.data ?? []) as unknown as MarketSummary[],
  };
}

export async function fetchForPossessionTimeline(
  readyToMove: boolean,
  microMarketSlug?: string
): Promise<AdvisorQueryResult> {
  const supabase = createServiceClient();

  let query = supabase.from("advisor_project_intelligence").select(PROJECT_SELECT);

  if (readyToMove) {
    query = query.in("current_status", ["ready_to_move", "completed", "oc_received"]);
  } else {
    // Under construction, ordered by nearest possession
    query = query
      .in("current_status", ["under_construction", "new_launch"])
      .order("possession_date", { ascending: true, nullsFirst: false });
  }

  if (microMarketSlug) query = query.eq("micro_market_slug", microMarketSlug);

  const { data: projectRows } = await query.limit(20);
  const projects = (projectRows ?? []) as unknown as ProjectSummary[];
  if (!projects.length) return { projects: [], configs: [], markets: [] };

  const slugs = projects.map((p) => p.project_slug);
  const marketSlugs = [...new Set(projects.map((p) => p.micro_market_slug))];

  const [configRes, marketRes] = await Promise.all([
    supabase
      .from("advisor_project_configurations")
      .select(CONFIG_SELECT_WITH_NAME)
      .in("project_slug", slugs),
    supabase
      .from("advisor_market_intelligence")
      .select(MARKET_SELECT)
      .in("market_slug", marketSlugs),
  ]);

  return {
    projects,
    configs: (configRes.data ?? []) as unknown as ConfigSummary[],
    markets: (marketRes.data ?? []) as unknown as MarketSummary[],
  };
}

export async function fetchAllForGeneral(): Promise<AdvisorQueryResult> {
  const supabase = createServiceClient();

  // Top 15 projects by quality score + both markets
  const [projectRes, marketRes] = await Promise.all([
    supabase
      .from("advisor_project_intelligence")
      .select(PROJECT_SELECT)
      .order("current_price_per_sqft_min", { ascending: false })
      .limit(15),
    supabase.from("advisor_market_intelligence").select(MARKET_SELECT),
  ]);

  const projects = (projectRes.data ?? []) as unknown as ProjectSummary[];
  const slugs = projects.map((p) => p.project_slug);

  const { data: configRows } = slugs.length
    ? await supabase
        .from("advisor_project_configurations")
        .select(CONFIG_SELECT_WITH_NAME)
        .in("project_slug", slugs)
        .order("price_min_cr")
    : { data: [] };

  return {
    projects,
    configs: (configRows ?? []) as unknown as ConfigSummary[],
    markets: (marketRes.data ?? []) as unknown as MarketSummary[],
  };
}
