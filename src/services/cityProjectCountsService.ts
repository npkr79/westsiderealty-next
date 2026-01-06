// Use shared singleton Supabase client to avoid multiple GoTrueClient instances
import { supabase } from "@/integrations/supabase/client";

/**
 * Service to fetch project/property counts for cities
 */

// Hyderabad city ID
const HYDERABAD_CITY_ID = "9ee99453-9dff-41a2-b5a0-a6b18f03483e";

export interface CityCounts {
  projects: number;
  listings: number;
}

/**
 * Format number with commas and add "+" suffix for display
 */
export function formatCount(count: number | null | undefined): string {
  if (!count && count !== 0) return "0";
  
  const formatted = count.toLocaleString("en-IN");
  return `${formatted}+`;
}

/**
 * Get project count for Hyderabad from projects table
 */
export async function getHyderabadProjectCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("city_id", HYDERABAD_CITY_ID)
      .eq("page_status", "published");

    if (error) {
      console.error("[CityCount] Hyderabad count error:", error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error("[CityCount] Hyderabad unexpected error:", error);
    return 0;
  }
}

/**
 * Get property count for Goa from goa_holiday_properties table
 * Note: Goa uses 'Active' (capital A) for status, and status can be null in schema
 * So we include both 'Active' and null values to get all active properties
 */
export async function getGoaPropertyCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("goa_holiday_properties")
      .select("id", { count: "exact", head: true })
      .or("status.eq.Active,status.is.null");

    console.log("[CityCount] Goa count result:", { count, error, slug: "goa" });

    if (error) {
      console.error("[CityCount] Goa count error:", error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error("[CityCount] Goa unexpected error:", error);
    return 0;
  }
}

/**
 * Get counts for a specific city by slug
 */
export async function getCityCounts(citySlug: string): Promise<CityCounts> {
  const slug = citySlug.toLowerCase().trim();
  
  console.log("[CityCount] Fetching counts for city slug:", slug);
  
  if (slug === "hyderabad") {
    const projects = await getHyderabadProjectCount();
    // For listings, you may want to fetch from hyderabad_properties or use existing service
    return { projects, listings: 0 }; // listings can be added later if needed
  }
  
  if (slug === "goa") {
    const properties = await getGoaPropertyCount();
    console.log("[CityCount] Goa final count:", { slug, properties });
    // For Goa, properties count serves as both projects and listings
    return { projects: properties, listings: properties };
  }
  
  // Default: return 0 for other cities
  console.log("[CityCount] Unknown city slug, returning 0:", slug);
  return { projects: 0, listings: 0 };
}

/**
 * Get counts for multiple cities at once
 */
export async function getMultipleCityCounts(
  citySlugs: string[]
): Promise<Record<string, CityCounts>> {
  const counts: Record<string, CityCounts> = {};
  
  // Fetch all counts in parallel
  const promises = citySlugs.map(async (slug) => {
    const cityCounts = await getCityCounts(slug);
    return { slug, counts: cityCounts };
  });
  
  const results = await Promise.all(promises);
  
  results.forEach(({ slug, counts: cityCounts }) => {
    counts[slug] = cityCounts;
  });
  
  return counts;
}
