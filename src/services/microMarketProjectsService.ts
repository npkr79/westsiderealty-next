/**
 * microMarketProjectsService: Project listing service for micro-market pages.
 * Queries the projects table directly — DB views have schema mismatches with legacy TypeScript code.
 * Stage, near_completion, strong_developer, and completion_proximity are derived in code.
 */

import { createServiceClient } from "@/lib/supabase/serviceClient";

const PROJECT_LIMIT = 24;

export interface MicroMarketProjectRow {
  id: string;
  project_name: string;
  url_slug: string;
  price_range_text: string | null;
  status: string | null;
  completion_status: string | null;
  total_units: number | null;
  min_price: number | null;
  max_price: number | null;
  hero_image_url: string | null;
  main_image_url: string | null;
  gallery_images_json: unknown;
  property_types: unknown;
  configurations: unknown;
  unit_size_range: string | null;
  city_slug: string;
  micro_market: string;
  micro_market_name: string | null;
  developer_name: string | null;
  developer_url_slug: string | null;
  completion_proximity: number;
  developer_project_count: number;
}

export interface MicroMarketProject {
  id: string;
  project_name: string;
  url_slug: string;
  price_range_text: string | null;
  status: string | null;
  developer_name: string | null;
}

export interface MicroMarketProjectSummary {
  total: number;
  active: number;
  completed: number;
}

export interface MicroMarketProjectSummaryV2 {
  total: number;
  active: number;
  under_construction: number;
  early_stage: number;
  delayed: number;
}

export interface MicroMarketProjectRowV2 extends MicroMarketProjectRow {
  /** DB view may return project_id instead of id */
  project_id?: string;
  stage?: string;
  near_completion?: boolean;
  strong_developer?: boolean;
}

// --- Internal helpers ---

type SupabaseClient = ReturnType<typeof createServiceClient>;

function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

async function lookupMicroMarketId(
  supabase: SupabaseClient,
  microMarketSlug: string,
  marketName?: string
): Promise<string | null> {
  const slugs = Array.from(
    new Set([microMarketSlug, decodeSlug(microMarketSlug)].filter(Boolean))
  );

  for (const slug of slugs) {
    const { data } = await supabase
      .from("micro_markets")
      .select("id")
      .eq("url_slug", slug)
      .maybeSingle();
    if (data?.id) return String(data.id);
  }

  if (marketName) {
    const { data } = await supabase
      .from("micro_markets")
      .select("id")
      .ilike("micro_market_name", marketName)
      .maybeSingle();
    if (data?.id) return String(data.id);
  }

  return null;
}

async function lookupCityId(
  supabase: SupabaseClient,
  citySlug: string
): Promise<string | null> {
  const { data } = await supabase
    .from("cities")
    .select("id")
    .eq("url_slug", citySlug)
    .maybeSingle();
  return data?.id ? String(data.id) : null;
}

function computeCompletionProximity(cs: string | null): number {
  switch (cs) {
    case "ready_to_move": return 1.0;
    case "completed": return 0.95;
    case "possession": return 0.9;
    case "possession_started": return 0.85;
    case "near_completion": return 0.8;
    case "under_construction": return 0.5;
    case "new_launch": return 0.3;
    case "pre_launch": return 0.2;
    default: return 0.35;
  }
}

function computeStage(cs: string | null): string {
  switch (cs) {
    case "ready_to_move":
    case "completed":
    case "possession":
    case "possession_started":
    case "near_completion":
      return "completion";
    case "under_construction":
      return "under_construction";
    case "new_launch":
    case "pre_launch":
      return "early";
    default:
      return "under_construction";
  }
}

function computeNearCompletion(cs: string | null): boolean {
  return ["ready_to_move", "completed", "possession", "possession_started", "near_completion"].includes(
    cs ?? ""
  );
}

function computeStrongDeveloper(count: number | null): boolean {
  return (count ?? 0) >= 5;
}

const PROJECTS_SELECT =
  "id,url_slug,project_name,price_range_text,status,completion_status,total_units,min_price,max_price,hero_image_url,gallery_images_json,property_types,configurations,unit_size_range,developers!developer_id(developer_name,url_slug,total_projects)";

function extractDev(
  devRaw: unknown
): Record<string, unknown> | null {
  if (Array.isArray(devRaw)) return (devRaw[0] as Record<string, unknown>) ?? null;
  return devRaw as Record<string, unknown> | null;
}

function mapToRowV2(
  p: Record<string, unknown>,
  citySlug: string,
  microMarketSlug: string,
  marketName: string | undefined
): MicroMarketProjectRowV2 {
  const dev = extractDev(p.developers);
  const cs = p.completion_status as string | null;
  const totalProjects = dev?.total_projects as number | null;

  return {
    id: String(p.id ?? ""),
    project_id: String(p.id ?? ""),
    project_name: String(p.project_name ?? "Project"),
    url_slug: String(p.url_slug ?? ""),
    price_range_text: p.price_range_text ? String(p.price_range_text) : null,
    status: p.status ? String(p.status) : null,
    completion_status: cs,
    total_units: p.total_units != null ? Number(p.total_units) : null,
    min_price: p.min_price != null ? Number(p.min_price) : null,
    max_price: p.max_price != null ? Number(p.max_price) : null,
    hero_image_url: p.hero_image_url ? String(p.hero_image_url) : null,
    main_image_url: null,
    gallery_images_json: p.gallery_images_json,
    property_types: p.property_types,
    configurations: p.configurations,
    unit_size_range: p.unit_size_range ? String(p.unit_size_range) : null,
    city_slug: citySlug,
    micro_market: microMarketSlug,
    micro_market_name: marketName ?? null,
    developer_name: dev?.developer_name ? String(dev.developer_name) : null,
    developer_url_slug: dev?.url_slug ? String(dev.url_slug) : null,
    completion_proximity: computeCompletionProximity(cs),
    developer_project_count: totalProjects ?? 0,
    stage: computeStage(cs),
    near_completion: computeNearCompletion(cs),
    strong_developer: computeStrongDeveloper(totalProjects),
  };
}

async function fetchProjectsForMarket(
  supabase: SupabaseClient,
  mmId: string,
  cityId: string | null,
  limit: number
): Promise<Record<string, unknown>[]> {
  let query = supabase
    .from("projects")
    .select(PROJECTS_SELECT)
    .eq("micro_market_id", mmId)
    .eq("page_status", "published")
    .neq("status", "cancelled");

  if (cityId) query = query.eq("city_id", cityId);

  const { data, error } = await query.limit(limit);
  if (error || !data) return [];
  return data as Record<string, unknown>[];
}

// --- Public API ---

/**
 * Fetch projects for a micro-market (basic fields for listing pages).
 */
export async function getProjectsFromView(
  citySlug: string,
  microMarketSlug: string,
  limit = PROJECT_LIMIT
): Promise<MicroMarketProject[]> {
  const supabase = createServiceClient();
  const [mmId, cityId] = await Promise.all([
    lookupMicroMarketId(supabase, microMarketSlug),
    lookupCityId(supabase, citySlug),
  ]);
  if (!mmId) return [];

  const rows = await fetchProjectsForMarket(supabase, mmId, cityId, limit);
  return rows.map((p) => {
    const dev = extractDev(p.developers);
    return {
      id: String(p.id ?? ""),
      project_name: String(p.project_name ?? ""),
      url_slug: String(p.url_slug ?? ""),
      price_range_text: p.price_range_text ? String(p.price_range_text) : null,
      status: p.status ? String(p.status) : null,
      developer_name: dev?.developer_name ? String(dev.developer_name) : null,
    };
  });
}

/**
 * Fetch full project rows for category pages (all display fields, in-memory filterable).
 */
export async function getProjectsFromViewForCategory(
  citySlug: string,
  microMarketSlug: string,
  limit = PROJECT_LIMIT
): Promise<MicroMarketProjectRow[]> {
  const supabase = createServiceClient();
  const [mmId, cityId] = await Promise.all([
    lookupMicroMarketId(supabase, microMarketSlug),
    lookupCityId(supabase, citySlug),
  ]);
  if (!mmId) return [];

  const rows = await fetchProjectsForMarket(supabase, mmId, cityId, limit);
  return rows.map((p) => mapToRowV2(p, citySlug, microMarketSlug, undefined));
}

// --- Projects in Market (Snapshot, Picks, Explorer) ---

const SUMMARY_FIELDS = "total,active,completed";
const SUMMARY_V2_FIELDS = "total,active,under_construction,early_stage,delayed";

/**
 * Fetch project summary (total/active/completed) for a micro-market.
 */
export async function getProjectSummary(
  citySlug: string,
  microMarketSlug: string
): Promise<MicroMarketProjectSummary | null> {
  const supabase = createServiceClient();
  const slugs = Array.from(
    new Set([microMarketSlug, decodeSlug(microMarketSlug)].filter(Boolean))
  );

  for (const slug of slugs) {
    const { data: row, error } = await supabase
      .from("v_micro_market_project_summary")
      .select(SUMMARY_FIELDS)
      .eq("city_slug", citySlug)
      .eq("micro_market", slug)
      .maybeSingle();
    if (!error && row) {
      return {
        total: Number(row.total ?? 0),
        active: Number(row.active ?? 0),
        completed: Number(row.completed ?? 0),
      };
    }
  }
  return null;
}

/**
 * Fetch project summary V2 (with stage breakdown) for a micro-market.
 */
export async function getProjectSummaryV2(
  citySlug: string,
  microMarketSlug: string
): Promise<MicroMarketProjectSummaryV2 | null> {
  const supabase = createServiceClient();
  const slugs = Array.from(
    new Set([microMarketSlug, decodeSlug(microMarketSlug)].filter(Boolean))
  );

  for (const slug of slugs) {
    const { data: row, error } = await supabase
      .from("v_micro_market_project_summary_v2")
      .select(SUMMARY_V2_FIELDS)
      .eq("city_slug", citySlug)
      .eq("micro_market", slug)
      .maybeSingle();
    if (!error && row) {
      return {
        total: Number(row.total ?? 0),
        active: Number(row.active ?? 0),
        under_construction: Number(row.under_construction ?? 0),
        early_stage: Number(row.early_stage ?? 0),
        delayed: Number(row.delayed ?? 0),
      };
    }
  }
  return null;
}

/**
 * Fetch project summary V3 for a micro-market.
 */
export async function getProjectSummaryV3(
  citySlug: string,
  microMarketSlug: string
): Promise<MicroMarketProjectSummaryV2 | null> {
  const supabase = createServiceClient();
  const slugs = Array.from(
    new Set([microMarketSlug, decodeSlug(microMarketSlug)].filter(Boolean))
  );

  for (const slug of slugs) {
    const { data: row, error } = await supabase
      .from("v_micro_market_project_summary_v3")
      .select(SUMMARY_V2_FIELDS)
      .eq("city_slug", citySlug)
      .eq("micro_market", slug)
      .maybeSingle();
    if (!error && row) {
      return {
        total: Number(row.total ?? 0),
        active: Number(row.active ?? 0),
        under_construction: Number(row.under_construction ?? 0),
        early_stage: Number(row.early_stage ?? 0),
        delayed: Number(row.delayed ?? 0),
      };
    }
  }
  return null;
}

const TOP_PICKS_LIMIT = 8;

/**
 * Fetch top institutional picks for a micro-market.
 * Queries the projects table directly. Sorts by: strong_developer → near_completion →
 * completion_proximity → developer_project_count.
 */
export async function getTopPicks(
  citySlug: string,
  microMarketSlug: string,
  limit = TOP_PICKS_LIMIT,
  marketName?: string
): Promise<MicroMarketProjectRowV2[]> {
  const supabase = createServiceClient();
  const [mmId, cityId] = await Promise.all([
    lookupMicroMarketId(supabase, microMarketSlug, marketName),
    lookupCityId(supabase, citySlug),
  ]);
  if (!mmId) return [];

  const raw = await fetchProjectsForMarket(supabase, mmId, cityId, limit * 5);
  const rows = raw.map((p) => mapToRowV2(p, citySlug, microMarketSlug, marketName));

  rows.sort((a, b) => {
    const aStrong = a.strong_developer ? 1 : 0;
    const bStrong = b.strong_developer ? 1 : 0;
    if (bStrong !== aStrong) return bStrong - aStrong;
    const aNear = a.near_completion ? 1 : 0;
    const bNear = b.near_completion ? 1 : 0;
    if (bNear !== aNear) return bNear - aNear;
    if (b.completion_proximity !== a.completion_proximity)
      return b.completion_proximity - a.completion_proximity;
    return b.developer_project_count - a.developer_project_count;
  });

  return rows.slice(0, limit);
}

/**
 * Fetch top projects (completion-proximity sorted) — alias for category pages.
 */
export async function getTopProjects(
  citySlug: string,
  microMarketSlug: string,
  limit = TOP_PICKS_LIMIT
): Promise<MicroMarketProjectRow[]> {
  return getProjectsFromViewForCategory(citySlug, microMarketSlug, limit);
}

/**
 * Fetch top projects V2.
 */
export async function getTopProjectsV2(
  citySlug: string,
  microMarketSlug: string,
  limit = TOP_PICKS_LIMIT
): Promise<MicroMarketProjectRowV2[]> {
  return getTopPicks(citySlug, microMarketSlug, limit);
}

/**
 * Fetch top projects V3.
 */
export async function getTopProjectsV3(
  citySlug: string,
  microMarketSlug: string,
  limit = TOP_PICKS_LIMIT
): Promise<MicroMarketProjectRowV2[]> {
  return getTopPicks(citySlug, microMarketSlug, limit);
}

const EXPLORER_DEFAULT_LIMIT = 6;

/**
 * Fetch explorer projects (paginated, completion-proximity sorted).
 */
export async function getExplorerProjects(
  citySlug: string,
  microMarketSlug: string,
  limit = EXPLORER_DEFAULT_LIMIT,
  offset = 0
): Promise<MicroMarketProjectRow[]> {
  const supabase = createServiceClient();
  const [mmId, cityId] = await Promise.all([
    lookupMicroMarketId(supabase, microMarketSlug),
    lookupCityId(supabase, citySlug),
  ]);
  if (!mmId) return [];

  const raw = await fetchProjectsForMarket(supabase, mmId, cityId, 100);
  const rows = raw.map((p) => mapToRowV2(p, citySlug, microMarketSlug, undefined));
  rows.sort((a, b) => {
    if (b.completion_proximity !== a.completion_proximity)
      return b.completion_proximity - a.completion_proximity;
    return b.developer_project_count - a.developer_project_count;
  });
  return rows.slice(offset, offset + limit);
}

/**
 * Fetch explorer projects V2.
 */
export async function getExplorerProjectsV2(
  citySlug: string,
  microMarketSlug: string,
  limit = EXPLORER_DEFAULT_LIMIT,
  offset = 0
): Promise<MicroMarketProjectRowV2[]> {
  return getExplorerProjectsFromTable(citySlug, microMarketSlug, limit, offset);
}

/**
 * Fetch explorer projects V3.
 */
export async function getExplorerProjectsV3(
  citySlug: string,
  microMarketSlug: string,
  limit = EXPLORER_DEFAULT_LIMIT,
  offset = 0,
  marketName?: string
): Promise<MicroMarketProjectRowV2[]> {
  return getExplorerProjectsFromTable(citySlug, microMarketSlug, limit, offset, marketName);
}

async function getExplorerProjectsFromTable(
  citySlug: string,
  microMarketSlug: string,
  limit: number,
  offset: number,
  marketName?: string
): Promise<MicroMarketProjectRowV2[]> {
  const supabase = createServiceClient();
  const [mmId, cityId] = await Promise.all([
    lookupMicroMarketId(supabase, microMarketSlug, marketName),
    lookupCityId(supabase, citySlug),
  ]);
  if (!mmId) return [];

  const raw = await fetchProjectsForMarket(supabase, mmId, cityId, 100);
  const rows = raw.map((p) => mapToRowV2(p, citySlug, microMarketSlug, marketName));
  rows.sort((a, b) => {
    if (b.completion_proximity !== a.completion_proximity)
      return b.completion_proximity - a.completion_proximity;
    return b.developer_project_count - a.developer_project_count;
  });
  return rows.slice(offset, offset + limit);
}
