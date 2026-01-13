/**
 * Locality Stats Utility
 * 
 * Provides functions to query and analyze project inventory for a given micro-market,
 * enabling data-driven generation of filter links for Programmatic SEO.
 */

import { createClient } from "@/lib/supabase/server";
import { parseJsonb, asArray } from "@/lib/parse-jsonb";

export interface LocalityStats {
  availableConfigs: string[]; // e.g., ["2BHK", "3BHK", "4BHK"]
  availableTypes: string[]; // e.g., ["Apartment", "Villa"]
  availableStatuses: string[]; // e.g., ["Under Construction", "Ready to Move"]
  configTypeCombinations: Array<{ config: string; type: string; count: number }>; // e.g., [{ config: "3BHK", type: "Apartment", count: 5 }]
  totalProjects: number;
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

  // Fetch all projects for this micro-market
  const { data: projects, error } = await supabase
    .from("projects")
    .select(`
      id,
      property_types,
      configurations,
      unit_size_range,
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
      availableConfigs: [],
      availableTypes: [],
      availableStatuses: [],
      configTypeCombinations: [],
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

  // Extract unique configurations
  const configSet = new Set<string>();
  const typeSet = new Set<string>();
  const statusSet = new Set<string>();
  const configTypeMap = new Map<string, number>(); // Key: "config-type", Value: count

  validProjects.forEach((project: any) => {
    // Parse configurations
    const configs = parseJsonb(project.configurations, []);
    const configArray = asArray<string>(configs);
    
    // Also check unit_size_range as fallback
    if (configArray.length === 0 && project.unit_size_range) {
      const rangeStr = String(project.unit_size_range).toUpperCase();
      // Extract BHK patterns like "2BHK", "3 BHK", "4 BHK"
      const bhkMatch = rangeStr.match(/(\d+)\s*BHK/i);
      if (bhkMatch) {
        configArray.push(`${bhkMatch[1]}BHK`);
      }
    }

    configArray.forEach((config: string) => {
      if (config && typeof config === "string") {
        const normalizedConfig = config.toUpperCase().trim();
        if (normalizedConfig) {
          configSet.add(normalizedConfig);
        }
      }
    });

    // Parse property types
    const types = parseJsonb(project.property_types, []);
    const typeArray = asArray<string>(types);
    
    typeArray.forEach((type: string) => {
      if (type && typeof type === "string") {
        const normalizedType = type.trim();
        if (normalizedType) {
          typeSet.add(normalizedType);
        }
      }
    });

    // Extract status
    const status = project.completion_status || project.status || "";
    if (status) {
      const normalizedStatus = String(status).trim();
      if (normalizedStatus) {
        statusSet.add(normalizedStatus);
      }
    }

    // Track config-type combinations for more specific filtering
    configArray.forEach((config: string) => {
      typeArray.forEach((type: string) => {
        if (config && type) {
          const normalizedConfig = String(config).toUpperCase().trim();
          const normalizedType = String(type).trim();
          const key = `${normalizedConfig}-${normalizedType}`;
          configTypeMap.set(key, (configTypeMap.get(key) || 0) + 1);
        }
      });
    });
  });

  // Convert config-type map to array
  const configTypeCombinations = Array.from(configTypeMap.entries()).map(([key, count]) => {
    const [config, type] = key.split("-");
    return { config, type, count };
  });

  return {
    availableConfigs: Array.from(configSet).sort(),
    availableTypes: Array.from(typeSet).sort(),
    availableStatuses: Array.from(statusSet).sort(),
    configTypeCombinations,
    totalProjects: validProjects.length,
  };
}

/**
 * Generate a filter slug from filter type, value, and micro-market name
 * Examples:
 * - generateFilterSlug("config", "3BHK", "Kokapet") → "3-bhk-apartments-in-kokapet"
 * - generateFilterSlug("type", "Villa", "Kokapet") → "luxury-villas-in-kokapet"
 * - generateFilterSlug("status", "Ready to Move", "Kokapet") → "ready-to-move-projects-in-kokapet"
 */
export function generateFilterSlug(
  filterType: "config" | "type" | "status",
  filterValue: string,
  microMarketName: string
): string {
  const marketSlug = microMarketName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  if (filterType === "config") {
    // Extract number from config (e.g., "3BHK" → "3")
    const numMatch = filterValue.match(/(\d+)/);
    const number = numMatch ? numMatch[1] : "";
    // Default to "apartments" for config-based filters
    return `${number}-bhk-apartments-in-${marketSlug}`;
  } else if (filterType === "type") {
    // For types, use "luxury-{type}" format
    const typeSlug = filterValue
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    const pluralType = typeSlug.endsWith("a") ? `${typeSlug}s` : `${typeSlug}s`; // Simple pluralization
    return `luxury-${pluralType}-in-${marketSlug}`;
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
  filterType: "config" | "type" | "status";
  filterValue: string;
  microMarketSlug: string;
} | null {
  // Pattern: {filter-part}-in-{micro-market-slug}
  const parts = slug.split("-in-");
  if (parts.length !== 2) {
    return null;
  }

  const [filterPart, microMarketSlug] = parts;

  // Check for config pattern: {number}-bhk-apartments
  const configMatch = filterPart.match(/^(\d+)-bhk-apartments$/);
  if (configMatch) {
    return {
      filterType: "config",
      filterValue: `${configMatch[1]}BHK`,
      microMarketSlug,
    };
  }

  // Check for type pattern: luxury-{type}s
  const typeMatch = filterPart.match(/^luxury-(.+?)s?$/);
  if (typeMatch) {
    const typeValue = typeMatch[1].replace(/-/g, " ");
    // Capitalize first letter of each word
    const capitalizedType = typeValue
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return {
      filterType: "type",
      filterValue: capitalizedType,
      microMarketSlug,
    };
  }

  // Check for status pattern: {status}-projects
  const statusMatch = filterPart.match(/^(.+)-projects$/);
  if (statusMatch) {
    const statusValue = statusMatch[1].replace(/-/g, " ");
    // Capitalize first letter of each word
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

  return null;
}
