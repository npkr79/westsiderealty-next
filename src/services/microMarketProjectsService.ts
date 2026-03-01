/**
 * v_micro_market_projects: RERA-driven project listing service.
 * Single source of truth for project listings across micro-markets.
 * Filter by city_slug and micro_market. Ranking: completion_proximity, status, developer presence, scale.
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

const SELECT_FIELDS =
  "id,project_name,url_slug,price_range_text,status,completion_status,total_units,min_price,max_price,hero_image_url,main_image_url,gallery_images_json,property_types,configurations,unit_size_range,city_slug,micro_market,micro_market_name,developer_name,developer_url_slug,completion_proximity,developer_project_count";

/**
 * Fetch projects from v_micro_market_projects for a micro-market.
 * Filter: city_slug, micro_market (url_slug).
 * Ranking: 1) completion_proximity 2) status 3) developer_project_count 4) total_units.
 * Limit: 24.
 */
export async function getProjectsFromView(
  citySlug: string,
  microMarketSlug: string,
  limit = PROJECT_LIMIT
): Promise<MicroMarketProject[]> {
  const supabase = createServiceClient();

  const decodedSlug = (() => {
    try {
      return decodeURIComponent(microMarketSlug);
    } catch {
      return microMarketSlug;
    }
  })();

  const slugs = Array.from(new Set([microMarketSlug, decodedSlug].filter(Boolean)));

  for (const slug of slugs) {
    const { data: rows, error } = await supabase
      .from("v_micro_market_projects")
      .select(SELECT_FIELDS)
      .eq("city_slug", citySlug)
      .eq("micro_market", slug)
      .order("completion_proximity", { ascending: false, nullsFirst: false })
      .order("status", { ascending: true, nullsFirst: false })
      .order("developer_project_count", { ascending: false, nullsFirst: false })
      .order("total_units", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (!error && rows && rows.length > 0) {
      return rows.map((r: Record<string, unknown>) => ({
        id: String(r.id ?? ""),
        project_name: String(r.project_name ?? "Project"),
        url_slug: String(r.url_slug ?? ""),
        price_range_text: r.price_range_text ? String(r.price_range_text) : null,
        status: r.status ? String(r.status) : null,
        developer_name: r.developer_name ? String(r.developer_name) : null,
      }));
    }
  }

  return [];
}

/**
 * Fetch full project rows from v_micro_market_projects for category pages.
 * Returns all columns needed for ProjectCard and in-memory filtering.
 */
export async function getProjectsFromViewForCategory(
  citySlug: string,
  microMarketSlug: string,
  limit = PROJECT_LIMIT
): Promise<MicroMarketProjectRow[]> {
  const supabase = createServiceClient();

  const decodedSlug = (() => {
    try {
      return decodeURIComponent(microMarketSlug);
    } catch {
      return microMarketSlug;
    }
  })();

  const slugs = Array.from(new Set([microMarketSlug, decodedSlug].filter(Boolean)));

  for (const slug of slugs) {
    const { data: rows, error } = await supabase
      .from("v_micro_market_projects")
      .select(SELECT_FIELDS)
      .eq("city_slug", citySlug)
      .eq("micro_market", slug)
      .order("completion_proximity", { ascending: false, nullsFirst: false })
      .order("status", { ascending: true, nullsFirst: false })
      .order("developer_project_count", { ascending: false, nullsFirst: false })
      .order("total_units", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (!error && rows) {
      return rows as MicroMarketProjectRow[];
    }
  }

  return [];
}

// --- Projects in Market (Snapshot, Picks, Explorer) ---

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

const SUMMARY_FIELDS = "total,active,completed";
const SUMMARY_V2_FIELDS = "total,active,under_construction,early_stage,delayed";
const SELECT_V2_FIELDS =
  "id,project_name,url_slug,price_range_text,status,completion_status,total_units,min_price,max_price,hero_image_url,main_image_url,gallery_images_json,property_types,configurations,unit_size_range,city_slug,micro_market,micro_market_name,developer_name,developer_url_slug,completion_proximity,developer_project_count,stage,near_completion,strong_developer";

/**
 * Fetch project summary from v_micro_market_project_summary.
 */
export async function getProjectSummary(
  citySlug: string,
  microMarketSlug: string
): Promise<MicroMarketProjectSummary | null> {
  const supabase = createServiceClient();
  const decodedSlug = (() => {
    try {
      return decodeURIComponent(microMarketSlug);
    } catch {
      return microMarketSlug;
    }
  })();
  const slugs = Array.from(new Set([microMarketSlug, decodedSlug].filter(Boolean)));

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
 * Fetch project summary from v_micro_market_project_summary_v2.
 */
export async function getProjectSummaryV2(
  citySlug: string,
  microMarketSlug: string
): Promise<MicroMarketProjectSummaryV2 | null> {
  const supabase = createServiceClient();
  const decodedSlug = (() => {
    try {
      return decodeURIComponent(microMarketSlug);
    } catch {
      return microMarketSlug;
    }
  })();
  const slugs = Array.from(new Set([microMarketSlug, decodedSlug].filter(Boolean)));

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
 * Fetch project summary from v_micro_market_project_summary_v3.
 */
export async function getProjectSummaryV3(
  citySlug: string,
  microMarketSlug: string
): Promise<MicroMarketProjectSummaryV2 | null> {
  const supabase = createServiceClient();
  const decodedSlug = (() => {
    try {
      return decodeURIComponent(microMarketSlug);
    } catch {
      return microMarketSlug;
    }
  })();
  const slugs = Array.from(new Set([microMarketSlug, decodedSlug].filter(Boolean)));

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
 * Fetch top 6–8 picks from v_micro_market_top_picks_v3.
 * Filter: city_slug, micro_market_slug.
 */
const TOP_PICKS_SELECT =
  "id,project_name,url_slug,price_range_text,status,completion_status,total_units,min_price,max_price,hero_image_url,main_image_url,gallery_images_json,property_types,configurations,unit_size_range,city_slug,micro_market,micro_market_name,developer_name,developer_url_slug,completion_proximity,developer_project_count,stage,near_completion,strong_developer";

export async function getTopPicks(
  citySlug: string,
  microMarketSlug: string,
  limit = TOP_PICKS_LIMIT
): Promise<MicroMarketProjectRowV2[]> {
  const supabase = createServiceClient();
  const decodedSlug = (() => {
    try {
      return decodeURIComponent(microMarketSlug);
    } catch {
      return microMarketSlug;
    }
  })();
  const slugs = Array.from(new Set([microMarketSlug, decodedSlug].filter(Boolean)));

  for (const slug of slugs) {
    const { data, error } = await supabase
      .from("v_micro_market_top_picks_v3")
      .select(TOP_PICKS_SELECT)
      .eq("city_slug", citySlug)
      .eq("micro_market", slug)
      .neq("stage", "delayed")
      .order("strong_developer", { ascending: false, nullsFirst: false })
      .order("near_completion", { ascending: false, nullsFirst: false })
      .order("completion_proximity", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.log("[getTopPicks] SSR query error:", { citySlug, microMarketSlug: slug, error: error.message });
      continue;
    }

    if (data && data.length > 0) {
      return data as MicroMarketProjectRowV2[];
    }
  }
  return [];
}

/**
 * Fetch top 6–8 institutional picks from v_micro_market_projects.
 * Sorted by completion_proximity (default).
 */
export async function getTopProjects(
  citySlug: string,
  microMarketSlug: string,
  limit = TOP_PICKS_LIMIT
): Promise<MicroMarketProjectRow[]> {
  return getProjectsFromViewForCategory(citySlug, microMarketSlug, limit);
}

/**
 * Fetch top 6–8 institutional picks from v_micro_market_projects_v2.
 */
export async function getTopProjectsV2(
  citySlug: string,
  microMarketSlug: string,
  limit = TOP_PICKS_LIMIT
): Promise<MicroMarketProjectRowV2[]> {
  return getTopProjectsFromView(citySlug, microMarketSlug, "v_micro_market_projects_v2", limit);
}

/**
 * Fetch top 6–8 institutional picks from v_micro_market_projects_v3.
 */
export async function getTopProjectsV3(
  citySlug: string,
  microMarketSlug: string,
  limit = TOP_PICKS_LIMIT
): Promise<MicroMarketProjectRowV2[]> {
  return getTopProjectsFromView(citySlug, microMarketSlug, "v_micro_market_projects_v3", limit);
}

async function getTopProjectsFromView(
  citySlug: string,
  microMarketSlug: string,
  viewName: "v_micro_market_projects_v2" | "v_micro_market_projects_v3",
  limit: number
): Promise<MicroMarketProjectRowV2[]> {
  const supabase = createServiceClient();
  const decodedSlug = (() => {
    try {
      return decodeURIComponent(microMarketSlug);
    } catch {
      return microMarketSlug;
    }
  })();
  const slugs = Array.from(new Set([microMarketSlug, decodedSlug].filter(Boolean)));

  for (const slug of slugs) {
    const { data: rows, error } = await supabase
      .from(viewName)
      .select(SELECT_V2_FIELDS)
      .eq("city_slug", citySlug)
      .eq("micro_market", slug)
      .order("completion_proximity", { ascending: false, nullsFirst: false })
      .order("status", { ascending: true, nullsFirst: false })
      .order("developer_project_count", { ascending: false, nullsFirst: false })
      .order("total_units", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (!error && rows) {
      return rows as MicroMarketProjectRowV2[];
    }
  }
  return [];
}

const EXPLORER_DEFAULT_LIMIT = 6;

/**
 * Fetch explorer projects (paginated) from v_micro_market_projects.
 * Default 6, supports offset for lazy load.
 */
export async function getExplorerProjects(
  citySlug: string,
  microMarketSlug: string,
  limit = EXPLORER_DEFAULT_LIMIT,
  offset = 0
): Promise<MicroMarketProjectRow[]> {
  const supabase = createServiceClient();
  const decodedSlug = (() => {
    try {
      return decodeURIComponent(microMarketSlug);
    } catch {
      return microMarketSlug;
    }
  })();
  const slugs = Array.from(new Set([microMarketSlug, decodedSlug].filter(Boolean)));

  for (const slug of slugs) {
    const { data: rows, error } = await supabase
      .from("v_micro_market_projects")
      .select(SELECT_FIELDS)
      .eq("city_slug", citySlug)
      .eq("micro_market", slug)
      .order("completion_proximity", { ascending: false, nullsFirst: false })
      .order("status", { ascending: true, nullsFirst: false })
      .order("developer_project_count", { ascending: false, nullsFirst: false })
      .order("total_units", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (!error && rows) {
      return rows as MicroMarketProjectRow[];
    }
  }
  return [];
}

/**
 * Fetch explorer projects from v_micro_market_projects_v2.
 */
export async function getExplorerProjectsV2(
  citySlug: string,
  microMarketSlug: string,
  limit = EXPLORER_DEFAULT_LIMIT,
  offset = 0
): Promise<MicroMarketProjectRowV2[]> {
  return getExplorerProjectsFromView(
    citySlug,
    microMarketSlug,
    "v_micro_market_projects_v2",
    limit,
    offset
  );
}

/**
 * Fetch explorer projects from v_micro_market_projects_v3.
 */
export async function getExplorerProjectsV3(
  citySlug: string,
  microMarketSlug: string,
  limit = EXPLORER_DEFAULT_LIMIT,
  offset = 0
): Promise<MicroMarketProjectRowV2[]> {
  return getExplorerProjectsFromView(
    citySlug,
    microMarketSlug,
    "v_micro_market_projects_v3",
    limit,
    offset
  );
}

async function getExplorerProjectsFromView(
  citySlug: string,
  microMarketSlug: string,
  viewName: "v_micro_market_projects_v2" | "v_micro_market_projects_v3",
  limit: number,
  offset: number
): Promise<MicroMarketProjectRowV2[]> {
  const supabase = createServiceClient();
  const decodedSlug = (() => {
    try {
      return decodeURIComponent(microMarketSlug);
    } catch {
      return microMarketSlug;
    }
  })();
  const slugs = Array.from(new Set([microMarketSlug, decodedSlug].filter(Boolean)));

  for (const slug of slugs) {
    const { data: rows, error } = await supabase
      .from(viewName)
      .select(SELECT_V2_FIELDS)
      .eq("city_slug", citySlug)
      .eq("micro_market", slug)
      .order("completion_proximity", { ascending: false, nullsFirst: false })
      .order("status", { ascending: true, nullsFirst: false })
      .order("developer_project_count", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.log("[getExplorerProjectsFromView] SSR query error:", { citySlug, microMarketSlug: slug, viewName, offset, limit, error: error.message });
      continue;
    }

    const result = (rows ?? []) as MicroMarketProjectRowV2[];
    console.log("[getExplorerProjectsFromView] SSR query response:", { citySlug, microMarketSlug: slug, viewName, offset, limit, rowCount: result.length });
    return result;
  }
  return [];
}
