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

// Residential property types
const RESIDENTIAL_TYPES = ["Apartment", "Villa", "Gated Community", "Plot"];

// Commercial property types
const COMMERCIAL_TYPES = ["Office Space", "Shop", "Showroom", "Office", "Retail"];

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
 */
function normalizePropertyType(type: string): { category: "residential" | "commercial" | null; normalizedType: string } {
  const normalized = type.trim();
  
  // Strip "Luxury" prefix
  const withoutLuxury = normalized.replace(/^luxury\s+/i, "").trim();
  
  // Check if it matches residential types
  for (const residentialType of RESIDENTIAL_TYPES) {
    if (withoutLuxury.toLowerCase().includes(residentialType.toLowerCase()) || 
        normalized.toLowerCase().includes(residentialType.toLowerCase())) {
      return { category: "residential", normalizedType: residentialType };
    }
  }
  
  // Check if it matches commercial types
  for (const commercialType of COMMERCIAL_TYPES) {
    const normalizedCommercial = commercialType.toLowerCase();
    if (withoutLuxury.toLowerCase().includes(normalizedCommercial) ||
        normalized.toLowerCase().includes(normalizedCommercial)) {
      // Map variations to standard names
      if (normalizedCommercial.includes("office")) return { category: "commercial", normalizedType: "Office Space" };
      if (normalizedCommercial.includes("shop") || normalizedCommercial.includes("retail")) return { category: "commercial", normalizedType: "Shop" };
      if (normalizedCommercial.includes("showroom")) return { category: "commercial", normalizedType: "Showroom" };
      return { category: "commercial", normalizedType: commercialType };
    }
  }
  
  return { category: null, normalizedType: normalized };
}

/**
 * Get price range bucket for a project based on price_min or price_range_text
 */
function getPriceBucket(project: any): string | null {
  // Try price_min first
  if (project.price_min && typeof project.price_min === 'number') {
    const price = project.price_min;
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
  const supabase = await createClient();

  // Fetch all projects for this micro-market (need price data too)
  const { data: projects, error } = await supabase
    .from("projects")
    .select(`
      id,
      property_types,
      price_min,
      price_max,
      price_range_text,
      completion_status,
      status,
      page_status
    `)
    .eq("micro_market_id", microMarketId)
    .eq("city_id", cityId)
    .eq("page_status", "published");

  if (error) {
    console.error("[getLocalityStats] Error fetching projects:", error);
    return {
      residentialTypes: [],
      commercialTypes: [],
      priceRanges: [],
      statuses: [],
      totalProjects: 0,
    };
  }

  const validProjects = (projects || []).filter((p: any) => {
    const status = (p.status || "").toLowerCase();
    const completionStatus = (p.completion_status || "").toLowerCase();
    return (
      status.includes("published") ||
      status.includes("construction") ||
      completionStatus.includes("construction") ||
      completionStatus.includes("ready")
    );
  });

  // Extract unique types, price ranges, and statuses
  const residentialSet = new Set<string>();
  const commercialSet = new Set<string>();
  const priceRangeSet = new Set<string>();
  const statusSet = new Set<string>();

  validProjects.forEach((project: any) => {
    // Parse property types
    const types = parseJsonb(project.property_types, []);
    const typeArray = asArray<string>(types);
    
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

  return {
    residentialTypes: Array.from(residentialSet).sort(),
    commercialTypes: Array.from(commercialSet).sort(),
    priceRanges: Array.from(priceRangeSet).sort(),
    statuses: Array.from(statusSet).sort(),
    totalProjects: validProjects.length,
  };
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
  // Try to match against known types
  const normalizedFilter = filterPart.replace(/-/g, " ").toLowerCase();
  
  // Check residential types
  for (const resType of RESIDENTIAL_TYPES) {
    if (normalizedFilter.includes(resType.toLowerCase())) {
      return {
        filterType: "residential",
        filterValue: resType,
        microMarketSlug,
      };
    }
  }
  
  // Check commercial types
  for (const commType of COMMERCIAL_TYPES) {
    if (normalizedFilter.includes(commType.toLowerCase().replace(" ", ""))) {
      return {
        filterType: "commercial",
        filterValue: commType === "Office" ? "Office Space" : commType,
        microMarketSlug,
      };
    }
  }

  return null;
}
