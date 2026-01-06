import { createClient } from "@/lib/supabase/client";

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
    const supabase = createClient();
    const { count, error } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("city_id", HYDERABAD_CITY_ID)
      .eq("page_status", "published");

    if (error) {
      console.error("Error fetching Hyderabad project count:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Error in getHyderabadProjectCount:", error);
    return 0;
  }
}

/**
 * Get property count for Goa from goa_holiday_properties table
 */
export async function getGoaPropertyCount(): Promise<number> {
  try {
    const supabase = createClient();
    const { count, error } = await supabase
      .from("goa_holiday_properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    if (error) {
      console.error("Error fetching Goa property count:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Error in getGoaPropertyCount:", error);
    return 0;
  }
}

/**
 * Get counts for a specific city by slug
 */
export async function getCityCounts(citySlug: string): Promise<CityCounts> {
  const slug = citySlug.toLowerCase().trim();
  
  if (slug === "hyderabad") {
    const projects = await getHyderabadProjectCount();
    // For listings, you may want to fetch from hyderabad_properties or use existing service
    return { projects, listings: 0 }; // listings can be added later if needed
  }
  
  if (slug === "goa") {
    const properties = await getGoaPropertyCount();
    // For Goa, properties count serves as both projects and listings
    return { projects: properties, listings: properties };
  }
  
  // Default: return 0 for other cities
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
