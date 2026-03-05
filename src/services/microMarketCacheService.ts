import { createServiceClient } from "@/lib/supabase/serviceClient";
import type { MicroMarketCacheRow } from "@/services/microMarketViewModel";

const CACHE_SELECT =
  "id,micro_market_name,url_slug,micro_market_key,city_id,hero_hook,price_per_sqft_min,price_per_sqft_max,annual_appreciation_min,annual_appreciation_max,rental_yield_min,rental_yield_max,completion_ratio,recent_launches,velocity_score,premium_projects,new_developer_entries,rotation_score,institutional_share,institutional_multiple,delay_multiple,delay_ratio,wealth_score,capital_momentum_score,developer_strength,premium_density,refreshed_at";

export async function getMicroMarketFromCache(
  citySlug: string,
  microMarketSlug: string
): Promise<MicroMarketCacheRow | null> {
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
    const { data: city } = await supabase
      .from("cities")
      .select("id")
      .eq("url_slug", citySlug)
      .maybeSingle();

    if (!city?.id) continue;

    const { data: row, error } = await supabase
      .from("micro_market_page_cache_v2")
      .select(CACHE_SELECT)
      .eq("city_id", city.id)
      .eq("url_slug", slug)
      .limit(1)
      .maybeSingle();

    if (!error && row) {
      return row as MicroMarketCacheRow;
    }
  }

  return null;
}

export async function getMicroMarketsForHub(citySlug: string): Promise<MicroMarketCacheRow[]> {
  const supabase = createServiceClient();

  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("url_slug", citySlug)
    .maybeSingle();

  if (!city?.id) return [];

  const { data: publishedIds } = await supabase
    .from("micro_markets")
    .select("id")
    .eq("city_id", city.id)
    .eq("status", "published");

  const ids = (publishedIds ?? []).map((r: { id: string }) => r.id);
  if (ids.length === 0) return [];

  const { data: rows, error } = await supabase
    .from("micro_market_page_cache_v2")
    .select(CACHE_SELECT)
    .in("id", ids)
    .order("capital_momentum_score", { ascending: false, nullsFirst: false })
    .order("rotation_score", { ascending: false, nullsFirst: false })
    .order("annual_appreciation_min", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[microMarketCacheService] Hub fetch error:", error);
    return [];
  }

  return (rows ?? []) as MicroMarketCacheRow[];
}

export interface MicroMarketProject {
  id: string;
  project_name: string;
  url_slug: string;
  price_range_text: string | null;
  status: string | null;
  developer_name: string | null;
}

export async function getMicroMarketMapCenter(
  microMarketId: string
): Promise<{ lat: number; lng: number } | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("micro_markets")
    .select("latitude,longitude")
    .eq("id", microMarketId)
    .maybeSingle();

  if (!data) return null;
  const lat = Number(data.latitude);
  const lng = Number(data.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) return null;
  return { lat, lng };
}

/** @deprecated Use getProjectsFromView from microMarketProjectsService (v_micro_market_projects) */
export async function getProjectsForMicroMarket(
  microMarketId: string,
  citySlug: string,
  limit = 24
): Promise<MicroMarketProject[]> {
  const supabase = createServiceClient();

  const { data: rows, error } = await supabase
    .from("projects")
    .select("id,project_name,url_slug,price_range_text,status,developer:developers(developer_name)")
    .eq("micro_market_id", microMarketId)
    .limit(limit);

  if (error) {
    console.warn("[microMarketCacheService] Projects fetch error:", error);
    return [];
  }

  return (rows ?? []).map((r: Record<string, unknown>) => {
    const dev = r.developer as Record<string, unknown> | null;
    return {
      id: String(r.id ?? ""),
      project_name: String(r.project_name ?? "Project"),
      url_slug: String(r.url_slug ?? ""),
      price_range_text: r.price_range_text ? String(r.price_range_text) : null,
      status: r.status ? String(r.status) : null,
      developer_name: dev?.developer_name ? String(dev.developer_name) : null,
    };
  });
}
