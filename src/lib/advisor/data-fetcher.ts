import OpenAI from "openai";
import { createServiceClient } from "@/lib/supabase/serviceClient";

const RAG_SIMILARITY_THRESHOLD = 0.20; // raise as corpus grows: 0.25 at 200 chunks, 0.30 at 500 chunks

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
  budgetMaxCr: number,
  microMarketSlug?: string
): Promise<AdvisorQueryResult> {
  const supabase = createServiceClient();

  // Get configs in budget range
  let configQuery = supabase
    .from("advisor_project_configurations")
    .select(CONFIG_SELECT_WITH_NAME)
    .lte("price_min_cr", budgetMaxCr)
    .gte("price_max_cr", budgetMinCr)
    .order("price_min_cr");

  const { data: configRows } = await configQuery;
  const configs = (configRows ?? []) as unknown as ConfigSummary[];

  // Get matching project slugs
  const slugs = [...new Set(configs.map((c) => c.project_slug))];
  if (!slugs.length) return { projects: [], configs: [], markets: [] };

  let projectQuery = supabase
    .from("advisor_project_intelligence")
    .select(PROJECT_SELECT)
    .in("project_slug", slugs);
  if (microMarketSlug) projectQuery = projectQuery.eq("micro_market_slug", microMarketSlug);

  const { data: projectRows } = await projectQuery;
  const projects = (projectRows ?? []) as unknown as ProjectSummary[];

  const marketSlugs = [...new Set(projects.map((p) => p.micro_market_slug))];
  const { data: marketRows } = await supabase
    .from("advisor_market_intelligence")
    .select(MARKET_SELECT)
    .in("market_slug", marketSlugs);

  return {
    projects,
    configs,
    markets: (marketRows ?? []) as unknown as MarketSummary[],
  };
}

export async function fetchByBHK(
  bhk: string,
  microMarketSlug?: string
): Promise<AdvisorQueryResult> {
  const supabase = createServiceClient();

  // Match config_type like "3 BHK" or "3BHK"
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

  const { data: projectRows } = await projectQuery;
  const projects = (projectRows ?? []) as unknown as ProjectSummary[];

  const marketSlugs = [...new Set(projects.map((p) => p.micro_market_slug))];
  const { data: marketRows } = await supabase
    .from("advisor_market_intelligence")
    .select(MARKET_SELECT)
    .in("market_slug", marketSlugs);

  return { projects, configs, markets: (marketRows ?? []) as unknown as MarketSummary[] };
}

export async function fetchByBHKAndBudget(
  bhk: string,
  budgetMinCr: number,
  budgetMaxCr: number,
  microMarketSlug?: string
): Promise<AdvisorQueryResult> {
  const supabase = createServiceClient();

  const normalised = bhk.replace(/\s+/g, " ").toUpperCase();

  let configQuery = supabase
    .from("advisor_project_configurations")
    .select(CONFIG_SELECT_WITH_NAME)
    .ilike("config_type", `%${normalised}%`)
    .lte("price_min_cr", budgetMaxCr)
    .gte("price_max_cr", budgetMinCr)
    .order("price_min_cr");

  const { data: configRows } = await configQuery;
  const configs = (configRows ?? []) as unknown as ConfigSummary[];

  const slugs = [...new Set(configs.map((c) => c.project_slug))];
  if (!slugs.length) return { projects: [], configs: [], markets: [] };

  let projectQuery = supabase
    .from("advisor_project_intelligence")
    .select(PROJECT_SELECT)
    .in("project_slug", slugs);
  if (microMarketSlug) projectQuery = projectQuery.eq("micro_market_slug", microMarketSlug);

  const { data: projectRows } = await projectQuery;
  const projects = (projectRows ?? []) as unknown as ProjectSummary[];

  const marketSlugs = [...new Set(projects.map((p) => p.micro_market_slug))];
  const { data: marketRows } = await supabase
    .from("advisor_market_intelligence")
    .select(MARKET_SELECT)
    .in("market_slug", marketSlugs);

  return { projects, configs, markets: (marketRows ?? []) as unknown as MarketSummary[] };
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
  // Significant words only (≥3 chars) — catches "My Home Grava" etc.
  const words = projectNameOrSlug
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length >= 3);
  const lastWord = words[words.length - 1]; // most distinctive (e.g. "Grande", "Skyra")

  console.log(`[advisor:search] name="${projectNameOrSlug}" slug="${slug}" words=${JSON.stringify(words)}`);

  // ── Strategy 1: full slug / full name match (highest precision)
  const [slugRes, nameRes] = await Promise.all([
    supabase.from("advisor_project_intelligence").select(PROJECT_SELECT).ilike("project_slug", `%${slug}%`),
    supabase.from("advisor_project_intelligence").select(PROJECT_SELECT).ilike("project_name", `%${projectNameOrSlug}%`),
  ]);
  console.log(`[advisor:search] slug match: ${slugRes.data?.length ?? 0}, name match: ${nameRes.data?.length ?? 0}`);

  // ── Strategy 2: AND across all words (chained .ilike = AND in Supabase)
  let andRes: { data: unknown[] | null } = { data: [] };
  if (words.length >= 2) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase.from("advisor_project_intelligence").select(PROJECT_SELECT);
    for (const word of words) {
      q = q.ilike("project_name", `%${word}%`);
    }
    andRes = await q;
    console.log(`[advisor:search] AND-all-words match: ${andRes.data?.length ?? 0}`);
  }

  // ── Strategy 3: last word only (e.g. "grande", "skyra", "lakeridge")
  let lastWordRes: { data: unknown[] | null } = { data: [] };
  if (lastWord && lastWord !== words[0]) {
    lastWordRes = await supabase
      .from("advisor_project_intelligence")
      .select(PROJECT_SELECT)
      .ilike("project_name", `%${lastWord}%`);
    console.log(`[advisor:search] last-word "${lastWord}" match: ${lastWordRes.data?.length ?? 0}`);
  }

  // ── Strategy 4: each word individually (fallback, may return broad results)
  const wordResults = await Promise.all(
    words.map((word) =>
      supabase
        .from("advisor_project_intelligence")
        .select(PROJECT_SELECT)
        .ilike("project_slug", `%${word}%`)
    )
  );
  wordResults.forEach((r, i) =>
    console.log(`[advisor:search] word["${words[i]}"] slug match: ${r.data?.length ?? 0}`)
  );

  // ── Merge: precision-first ordering so exact matches appear first
  const seen = new Set<string>();
  const projects: ProjectSummary[] = [];
  const allRows = [
    ...(slugRes.data ?? []),
    ...(nameRes.data ?? []),
    ...(andRes.data ?? []),
    ...(lastWordRes.data ?? []),
    ...wordResults.flatMap((r) => r.data ?? []),
  ] as unknown as ProjectSummary[];

  for (const row of allRows) {
    if (!seen.has(row.project_slug)) {
      seen.add(row.project_slug);
      projects.push(row);
    }
  }

  console.log(`[advisor:search] final deduplicated projects: ${JSON.stringify(projects.map((p) => p.project_name))}`);

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

export async function fetchBySuperlative(
  column: string,
  direction: "asc" | "desc",
  microMarketSlug?: string
): Promise<AdvisorQueryResult> {
  const supabase = createServiceClient();

  let query = supabase
    .from("advisor_project_intelligence")
    .select(PROJECT_SELECT)
    .not(column, "is", null)
    .order(column, { ascending: direction === "asc" })
    .limit(10);

  if (microMarketSlug) query = query.eq("micro_market_slug", microMarketSlug);

  const { data: projectRows } = await query;
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

// ─── RAG Vector Search ────────────────────────────────────────────────────────

export interface RAGChunk {
  chunk_id: string;
  content: string;
  city: string;
  asset_class: string;
  market_slugs: string[] | null;
  content_type: string;
  source_name: string;
  source_type: string;
  credibility_tier: number;
  published_date: string | null;
  metadata: Record<string, unknown>;
  similarity: number;
}

export async function fetchRAGChunks(
  query: string,
  options?: {
    city?: string;        // e.g. 'hyderabad', 'goa'
    asset_class?: string; // e.g. 'residential', 'office'
    limit?: number;       // defaults to 5
  }
): Promise<RAGChunk[]> {
  try {
    // Step 1: Generate embedding via OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      dimensions: 1536,
    });
    const queryEmbedding = embeddingRes.data[0].embedding;

    // Step 2: Call Supabase RPC for similarity search
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("match_rag_chunks", {
      query_embedding: queryEmbedding,
      match_threshold: RAG_SIMILARITY_THRESHOLD,
      match_count: options?.limit ?? 5,
      filter_cities: options?.city ? [options.city] : null,
      filter_asset_class: options?.asset_class ?? null,
      min_credibility: null,
      published_after: null,
    });

    if (error) {
      console.error("[advisor:rag] RPC error:", error);
      return [];
    }

    return (data ?? []) as RAGChunk[];
  } catch (err) {
    console.error("[advisor:rag] fetchRAGChunks failed:", err);
    return [];
  }
}
