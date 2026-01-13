/**
 * Locality Stats Utility
 * 
 * Provides functions to query and analyze project inventory for a given micro-market,
 * enabling data-driven generation of filter links for Programmatic SEO.
 */

import { createClient } from "@/lib/supabase/server";
import { parseJsonb, asArray } from "@/lib/parse-jsonb";

export interface LocalityStats {
  residentialTypes: string[]; // e.g., ["Apartment", "Villa", "Gated Community", "Plot"]
  commercialTypes: string[]; // e.g., ["Office Space", "Shop", "Showroom"]
  priceRanges: string[]; // e.g., ["Under 1 Cr", "1-2 Cr", "2-3 Cr", "3-5 Cr", "5+ Cr"]
  statuses: string[]; // e.g., ["Under Construction", "Ready to Move", "New Launch"]
  totalProjects: number;
}

// Residential property types (case-insensitive matching)
const RESIDENTIAL_KEYWORDS = ["apartment", "villa", "gated community", "plot", "residential"];

// Commercial property types (case-insensitive matching)
const COMMERCIAL_KEYWORDS = ["office", "shop", "showroom", "retail", "commercial"];

// Price range buckets (in crores)
const PRICE_BUCKETS = [
  { label: "Under 1 Cr", max: 10000000 },
  { label: "1-2 Cr", min: 10000000, max: 20000000 },
  { label: "2-3 Cr", min: 20000000, max: 30000000 },
  { label: "3-5 Cr", min: 30000000, max: 50000000 },
  { label: "5+ Cr", min: 50000000 },
];

/**
 * Normalize property type by stripping "Luxury" prefix and matching to known types
 * Returns the original type value and category
 */
function normalizePropertyType(type: string): { category: "residential" | "commercial" | null; normalizedType: string } {
  const normalized = type.trim().toLowerCase();
  
  // Strip "Luxury" prefix
  const withoutLuxury = normalized.replace(/^luxury\s+/, "").trim();
  
  // Check if it matches residential keywords
  for (const keyword of RESIDENTIAL_KEYWORDS) {
    if (withoutLuxury.includes(keyword) || normalized.includes(keyword)) {
      // Return capitalized version of the original type (without "Luxury")
      const displayType = withoutLuxury
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      return { category: "residential", normalizedType: displayType || type };
    }
  }
  
  // Check if it matches commercial keywords
  for (const keyword of COMMERCIAL_KEYWORDS) {
    if (withoutLuxury.includes(keyword) || normalized.includes(keyword)) {
      // Map to standard names
      if (keyword === "office") return { category: "commercial", normalizedType: "Office Space" };
      if (keyword === "shop" || keyword === "retail") return { category: "commercial", normalizedType: "Shop" };
      if (keyword === "showroom") return { category: "commercial", normalizedType: "Showroom" };
      const displayType = withoutLuxury
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      return { category: "commercial", normalizedType: displayType || type };
    }
  }
  
  // Default: assume residential if no match (most projects are residential)
  return { category: "residential", normalizedType: type };
}

/**
 * Get price range bucket for a project based on min_price or price_range_text
 */
function getPriceBucket(project: any): string | null {
  // Try min_price first (correct column name)
  if (project.min_price && typeof project.min_price === 'number') {
    const price = project.min_price;
    for (const bucket of PRICE_BUCKETS) {
      if (bucket.min !== undefined && bucket.max !== undefined) {
        if (price >= bucket.min && price < bucket.max) return bucket.label;
      } else if (bucket.min !== undefined) {
        if (price >= bucket.min) return bucket.label;
      } else if (bucket.max !== undefined) {
        if (price < bucket.max) return bucket.label;
      }
    }
  }
  
  // Fallback to parsing price_range_text
  if (project.price_range_text) {
    const text = String(project.price_range_text).toLowerCase();
    // Extract numbers in crores
    const croreMatch = text.match(/(\d+\.?\d*)\s*cr/i);
    if (croreMatch) {
      const crores = parseFloat(croreMatch[1]);
      if (crores < 1) return "Under 1 Cr";
      if (crores >= 1 && crores < 2) return "1-2 Cr";
      if (crores >= 2 && crores < 3) return "2-3 Cr";
      if (crores >= 3 && crores < 5) return "3-5 Cr";
      if (crores >= 5) return "5+ Cr";
    }
  }
  
  return null;
}

/**
 * Get locality statistics for a micro-market
 * Queries the database to determine what filters are available based on actual inventory
 */
export async function getLocalityStats(
  microMarketId: string,
  cityId: string
): Promise<LocalityStats> {
  // Validate inputs
  if (!microMarketId || !cityId) {
    console.error("[getLocalityStats] Missing required IDs:", { microMarketId, cityId });
    return {
      residentialTypes: [],
      commercialTypes: [],
      priceRanges: [],
      statuses: [],
      totalProjects: 0,
    };
  }

  const supabase = await createClient();

  console.log(`[getLocalityStats] Querying with microMarketId=${microMarketId}, cityId=${cityId}`);

  // Fetch all projects for this micro-market (need price data too)
  // Use same status filter pattern as projectService.getProjectsByMicroMarket
  // FIXED: Use correct column names min_price and max_price
  const { data: projects, error } = await supabase
    .from("projects")
    .select(`
      id,
      property_types,
      min_price,
      max_price,
      price_range_text,
      completion_status,
      status,
      page_status
    `)
    .eq("micro_market_id", microMarketId)
    .eq("city_id", cityId)
    .or("status.ilike.published,status.ilike.%under construction%");

  if (error) {
    console.error("[getLocalityStats] Error fetching projects:", error, {
      microMarketId,
      cityId,
      errorCode: error.code,
      errorMessage: error.message,
    });
    return {
      residentialTypes: [],
      commercialTypes: [],
      priceRanges: [],
      statuses: [],
      totalProjects: 0,
    };
  }

  console.log(`[getLocalityStats] Found ${projects?.length || 0} projects for microMarketId=${microMarketId}, cityId=${cityId}`);

  // The query already filters by status, so we can be less strict here
  // Just ensure we have valid projects with some data
  const validProjects = (projects || []).filter((p: any) => {
    // Include all projects returned by the query (they already match status filter)
    // But exclude if both status fields are completely empty
    const hasStatus = (p.status || "").trim() || (p.completion_status || "").trim();
    return hasStatus || p.property_types; // Include if has status or property types
  });

  console.log(`[getLocalityStats] After filtering: ${validProjects.length} valid projects`);

  // Extract unique types, price ranges, and statuses
  const residentialSet = new Set<string>();
  const commercialSet = new Set<string>();
  const priceRangeSet = new Set<string>();
  const statusSet = new Set<string>();

  let projectsWithTypes = 0;
  let projectsWithPrice = 0;

  validProjects.forEach((project: any) => {
    // Parse property types
    const types = parseJsonb(project.property_types, []);
    const typeArray = asArray<string>(types);
    
    if (typeArray.length > 0) {
      projectsWithTypes++;
    }
    
    typeArray.forEach((type: string) => {
      if (type && typeof type === "string") {
        const { category, normalizedType } = normalizePropertyType(type);
        if (category === "residential") {
          residentialSet.add(normalizedType);
        } else if (category === "commercial") {
          commercialSet.add(normalizedType);
        }
      }
    });

    // Extract price range bucket
    const priceBucket = getPriceBucket(project);
    if (priceBucket) {
      projectsWithPrice++;
      priceRangeSet.add(priceBucket);
    }

    // Extract status
    const status = project.completion_status || project.status || "";
    if (status) {
      const normalizedStatus = String(status).trim();
      if (normalizedStatus) {
        statusSet.add(normalizedStatus);
      }
    }
  });

  const result = {
    residentialTypes: Array.from(residentialSet).sort(),
    commercialTypes: Array.from(commercialSet).sort(),
    priceRanges: Array.from(priceRangeSet).sort(),
    statuses: Array.from(statusSet).sort(),
    totalProjects: validProjects.length,
  };

  console.log(`[getLocalityStats] Final stats:`, {
    totalProjects: result.totalProjects,
    projectsWithTypes,
    projectsWithPrice,
    residentialTypes: result.residentialTypes.length,
    commercialTypes: result.commercialTypes.length,
    priceRanges: result.priceRanges.length,
    statuses: result.statuses.length,
  });

  return result;
}

/**
 * Generate a filter slug from filter type, value, and micro-market name
 * Updated to support new categorization
 */
export function generateFilterSlug(
  filterType: "residential" | "commercial" | "price" | "status",
  filterValue: string,
  microMarketName: string
): string {
  const marketSlug = microMarketName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  if (filterType === "residential") {
    // Format: "{type}-in-{market}" (e.g., "apartments-in-kokapet")
    const typeSlug = filterValue
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    // Simple pluralization
    const pluralType = typeSlug.endsWith("y") 
      ? `${typeSlug.slice(0, -1)}ies` 
      : typeSlug.endsWith("s") 
      ? typeSlug 
      : `${typeSlug}s`;
    return `${pluralType}-in-${marketSlug}`;
  } else if (filterType === "commercial") {
    // Format: "{type}s-in-{market}" (e.g., "office-spaces-in-kokapet")
    const typeSlug = filterValue
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    const pluralType = typeSlug.includes("space") 
      ? typeSlug.replace("space", "spaces")
      : typeSlug.endsWith("s") 
      ? typeSlug 
      : `${typeSlug}s`;
    return `${pluralType}-in-${marketSlug}`;
  } else if (filterType === "price") {
    // Format: "properties-under-1-cr-in-kokapet"
    const priceSlug = filterValue
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    return `properties-${priceSlug}-in-${marketSlug}`;
  } else {
    // Status filters
    const statusSlug = filterValue
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    return `${statusSlug}-projects-in-${marketSlug}`;
  }
}

/**
 * Parse a filter slug back into its components
 * Returns { filterType, filterValue, microMarketSlug } or null if invalid
 */
export function parseFilterSlug(slug: string): {
  filterType: "residential" | "commercial" | "price" | "status";
  filterValue: string;
  microMarketSlug: string;
} | null {
  // Pattern: {filter-part}-in-{micro-market-slug}
  const parts = slug.split("-in-");
  if (parts.length !== 2) {
    return null;
  }

  const [filterPart, microMarketSlug] = parts;

  // Check for price pattern: properties-{price-range}-in-{market}
  const priceMatch = filterPart.match(/^properties-(.+)$/);
  if (priceMatch) {
    const priceValue = priceMatch[1].replace(/-/g, " ");
    const capitalizedPrice = priceValue
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return {
      filterType: "price",
      filterValue: capitalizedPrice,
      microMarketSlug,
    };
  }

  // Check for status pattern: {status}-projects
  const statusMatch = filterPart.match(/^(.+)-projects$/);
  if (statusMatch) {
    const statusValue = statusMatch[1].replace(/-/g, " ");
    const capitalizedStatus = statusValue
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return {
      filterType: "status",
      filterValue: capitalizedStatus,
      microMarketSlug,
    };
  }

  // Check for residential/commercial pattern: {type}-in-{market}
  // Try to match against known keywords
  const normalizedFilter = filterPart.replace(/-/g, " ").toLowerCase();
  
  // Check residential keywords
  for (const keyword of RESIDENTIAL_KEYWORDS) {
    if (normalizedFilter.includes(keyword)) {
      // Return capitalized version
      const capitalizedType = keyword
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      return {
        filterType: "residential",
        filterValue: capitalizedType,
        microMarketSlug,
      };
    }
  }
  
  // Check commercial keywords
  for (const keyword of COMMERCIAL_KEYWORDS) {
    if (normalizedFilter.includes(keyword)) {
      // Map to standard names
      if (keyword === "office") {
        return {
          filterType: "commercial",
          filterValue: "Office Space",
          microMarketSlug,
        };
      }
      if (keyword === "shop" || keyword === "retail") {
        return {
          filterType: "commercial",
          filterValue: "Shop",
          microMarketSlug,
        };
      }
      if (keyword === "showroom") {
        return {
          filterType: "commercial",
          filterValue: "Showroom",
          microMarketSlug,
        };
      }
      const capitalizedType = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      return {
        filterType: "commercial",
        filterValue: capitalizedType,
        microMarketSlug,
      };
    }
  }

  return null;
}
