/**
 * Smart Link Generator Utility
 * 
 * Provides functions to query and analyze properties/projects for developers and cities,
 * enabling data-driven generation of smartlink grids for various page contexts.
 */

import { createClient } from "@/lib/supabase/server";
import { parseJsonb, asArray } from "@/lib/parse-jsonb";

export interface SmartLinkStats {
  propertyTypes: string[]; // e.g., ["Apartment", "Villa", "Penthouse"]
  bhkConfigs: string[]; // e.g., ["1BHK", "2BHK", "3BHK", "4BHK", "4+ BHK"]
  priceRanges: string[]; // e.g., ["Under 50 Lakh", "50 Lakh to 1 Cr", "1 Cr to 2 Cr", "2 Cr to 5 Cr", "Above 5 Cr"]
  budgetCategories: string[]; // e.g., ["Affordable", "Luxury", "Premium", "Ultra Luxury"]
  statuses: string[]; // e.g., ["New Projects", "Ready To Move"]
  viewTypes: string[]; // e.g., ["Open View"]
  totalProperties: number;
  totalProjects: number;
}

// Extended price buckets for smartlinks (matching sample grid)
const SMARTLINK_PRICE_BUCKETS = [
  { label: "Under 50 Lakh", max: 5000000 },
  { label: "50 Lakh to 1 Cr", min: 5000000, max: 10000000 },
  { label: "1 Cr to 2 Cr", min: 10000000, max: 20000000 },
  { label: "2 Cr to 5 Cr", min: 20000000, max: 50000000 },
  { label: "Above 5 Cr", min: 50000000 },
];

// Budget categories based on price
const BUDGET_CATEGORIES = [
  { label: "Affordable", max: 10000000 },
  { label: "Luxury", min: 30000000, max: 50000000 },
  { label: "Premium", min: 10000000, max: 30000000 },
  { label: "Ultra Luxury", min: 50000000 },
];

/**
 * Get price bucket for smartlinks (extended buckets)
 */
function getSmartLinkPriceBucket(price: number): string | null {
  for (const bucket of SMARTLINK_PRICE_BUCKETS) {
    if (bucket.min !== undefined && bucket.max !== undefined) {
      if (price >= bucket.min && price < bucket.max) return bucket.label;
    } else if (bucket.min !== undefined) {
      if (price >= bucket.min) return bucket.label;
    } else if (bucket.max !== undefined) {
      if (price < bucket.max) return bucket.label;
    }
  }
  return null;
}

/**
 * Get budget category based on price
 */
function getBudgetCategory(price: number): string | null {
  for (const category of BUDGET_CATEGORIES) {
    if (category.min !== undefined && category.max !== undefined) {
      if (price >= category.min && price < category.max) return category.label;
    } else if (category.min !== undefined) {
      if (price >= category.min) return category.label;
    } else if (category.max !== undefined) {
      if (price < category.max) return category.label;
    }
  }
  return null;
}

/**
 * Extract BHK configuration from property
 */
function extractBHKConfig(property: any): string | null {
  // Check bhk_config field first
  if (property.bhk_config) {
    const config = String(property.bhk_config).trim().toUpperCase();
    if (config.includes('4+') || config.includes('4PLUS') || config.includes('5')) {
      return "4+ BHK";
    }
    if (config.includes('4')) return "4BHK";
    if (config.includes('3')) return "3BHK";
    if (config.includes('2')) return "2BHK";
    if (config.includes('1')) return "1BHK";
  }
  
  // Check bedrooms field
  if (property.bedrooms) {
    const beds = Number(property.bedrooms);
    if (beds >= 5) return "4+ BHK";
    if (beds === 4) return "4BHK";
    if (beds === 3) return "3BHK";
    if (beds === 2) return "2BHK";
    if (beds === 1) return "1BHK";
  }
  
  return null;
}

/**
 * Get property type from property data
 */
function getPropertyType(property: any): string | null {
  if (property.property_type) {
    return String(property.property_type).trim();
  }
  if (property.property_types) {
    const types = parseJsonb(property.property_types, []);
    const typeArray = asArray<string>(types);
    if (typeArray.length > 0) {
      return typeArray[0];
    }
  }
  return null;
}

/**
 * Get developer stats - query properties and projects by developer
 */
export async function getDeveloperStats(
  developerId: string,
  developerName: string,
  cityId: string,
  citySlug: string
): Promise<SmartLinkStats> {
  if (!developerId || !cityId) {
    return {
      propertyTypes: [],
      bhkConfigs: [],
      priceRanges: [],
      budgetCategories: [],
      statuses: [],
      viewTypes: [],
      totalProperties: 0,
      totalProjects: 0,
    };
  }

  const supabase = await createClient();
  const propertyTypesSet = new Set<string>();
  const bhkConfigsSet = new Set<string>();
  const priceRangesSet = new Set<string>();
  const budgetCategoriesSet = new Set<string>();
  const statusesSet = new Set<string>();
  const viewTypesSet = new Set<string>();

  // Query projects by developer
  const { data: projects } = await supabase
    .from("projects")
    .select(`
      id,
      property_types,
      min_price,
      max_price,
      price_range_text,
      completion_status,
      status
    `)
    .eq("developer_id", developerId)
    .eq("city_id", cityId)
    .or("status.ilike.published,status.ilike.%under construction%");

  const validProjects = (projects || []).filter((p: any) => p.id);

  validProjects.forEach((project: any) => {
    // Property types
    const types = parseJsonb(project.property_types, []);
    const typeArray = asArray<string>(types);
    typeArray.forEach((type: string) => {
      if (type && typeof type === "string") {
        const normalized = type.trim();
        if (normalized.toLowerCase().includes("apartment")) propertyTypesSet.add("Apartment");
        if (normalized.toLowerCase().includes("villa")) propertyTypesSet.add("Villa");
        if (normalized.toLowerCase().includes("penthouse")) propertyTypesSet.add("Penthouse");
      }
    });

    // Price ranges
    if (project.min_price) {
      const priceBucket = getSmartLinkPriceBucket(project.min_price);
      if (priceBucket) priceRangesSet.add(priceBucket);
      
      const budget = getBudgetCategory(project.min_price);
      if (budget) budgetCategoriesSet.add(budget);
    }

    // Status
    const status = project.completion_status || project.status || "";
    if (status) {
      const normalized = String(status).trim().toLowerCase();
      if (normalized.includes("ready") || normalized.includes("move")) {
        statusesSet.add("Ready To Move");
      }
      if (normalized.includes("new") || normalized.includes("launch")) {
        statusesSet.add("New Projects");
      }
    }
  });

  // Query properties by developer name (for Hyderabad)
  if (citySlug === "hyderabad") {
    const { data: properties } = await supabase
      .from("hyderabad_properties")
      .select(`
        id,
        property_type,
        bhk_config,
        bedrooms,
        price,
        status
      `)
      .eq("developer_name", developerName)
      .eq("status", "active");

    const validProperties = (properties || []).filter((p: any) => p.id);

    validProperties.forEach((property: any) => {
      // Property types
      const propType = getPropertyType(property);
      if (propType) {
        const normalized = propType.toLowerCase();
        if (normalized.includes("apartment")) propertyTypesSet.add("Apartment");
        if (normalized.includes("villa")) propertyTypesSet.add("Villa");
        if (normalized.includes("penthouse")) propertyTypesSet.add("Penthouse");
      }

      // BHK configs
      const bhk = extractBHKConfig(property);
      if (bhk) bhkConfigsSet.add(bhk);

      // Price ranges
      if (property.price) {
        const priceBucket = getSmartLinkPriceBucket(property.price);
        if (priceBucket) priceRangesSet.add(priceBucket);
        
        const budget = getBudgetCategory(property.price);
        if (budget) budgetCategoriesSet.add(budget);
      }
    });

    return {
      propertyTypes: Array.from(propertyTypesSet).sort(),
      bhkConfigs: Array.from(bhkConfigsSet).sort(),
      priceRanges: Array.from(priceRangesSet).sort(),
      budgetCategories: Array.from(budgetCategoriesSet).sort(),
      statuses: Array.from(statusesSet).sort(),
      viewTypes: Array.from(viewTypesSet).sort(),
      totalProperties: validProperties.length,
      totalProjects: validProjects.length,
    };
  }

  return {
    propertyTypes: Array.from(propertyTypesSet).sort(),
    bhkConfigs: Array.from(bhkConfigsSet).sort(),
    priceRanges: Array.from(priceRangesSet).sort(),
    budgetCategories: Array.from(budgetCategoriesSet).sort(),
    statuses: Array.from(statusesSet).sort(),
    viewTypes: Array.from(viewTypesSet).sort(),
    totalProperties: 0,
    totalProjects: validProjects.length,
  };
}

/**
 * Get city stats - query all properties and projects in a city
 */
export async function getCityStats(cityId: string, citySlug: string): Promise<SmartLinkStats> {
  if (!cityId) {
    return {
      propertyTypes: [],
      bhkConfigs: [],
      priceRanges: [],
      budgetCategories: [],
      statuses: [],
      viewTypes: [],
      totalProperties: 0,
      totalProjects: 0,
    };
  }

  const supabase = await createClient();
  const propertyTypesSet = new Set<string>();
  const bhkConfigsSet = new Set<string>();
  const priceRangesSet = new Set<string>();
  const budgetCategoriesSet = new Set<string>();
  const statusesSet = new Set<string>();
  const viewTypesSet = new Set<string>();

  // Query projects in city
  const { data: projects } = await supabase
    .from("projects")
    .select(`
      id,
      property_types,
      min_price,
      max_price,
      price_range_text,
      completion_status,
      status
    `)
    .eq("city_id", cityId)
    .or("status.ilike.published,status.ilike.%under construction%");

  const validProjects = (projects || []).filter((p: any) => p.id);

  validProjects.forEach((project: any) => {
    const types = parseJsonb(project.property_types, []);
    const typeArray = asArray<string>(types);
    typeArray.forEach((type: string) => {
      if (type && typeof type === "string") {
        const normalized = type.trim().toLowerCase();
        if (normalized.includes("apartment")) propertyTypesSet.add("Apartment");
        if (normalized.includes("villa")) propertyTypesSet.add("Villa");
        if (normalized.includes("penthouse")) propertyTypesSet.add("Penthouse");
      }
    });

    if (project.min_price) {
      const priceBucket = getSmartLinkPriceBucket(project.min_price);
      if (priceBucket) priceRangesSet.add(priceBucket);
      
      const budget = getBudgetCategory(project.min_price);
      if (budget) budgetCategoriesSet.add(budget);
    }

    const status = project.completion_status || project.status || "";
    if (status) {
      const normalized = String(status).trim().toLowerCase();
      if (normalized.includes("ready") || normalized.includes("move")) {
        statusesSet.add("Ready To Move");
      }
      if (normalized.includes("new") || normalized.includes("launch")) {
        statusesSet.add("New Projects");
      }
    }
  });

  // Query properties in city (for Hyderabad)
  if (citySlug === "hyderabad") {
    const { data: properties } = await supabase
      .from("hyderabad_properties")
      .select(`
        id,
        property_type,
        bhk_config,
        bedrooms,
        price
      `)
      .eq("status", "active")
      .limit(1000); // Limit to avoid performance issues

    const validProperties = (properties || []).filter((p: any) => p.id);

    validProperties.forEach((property: any) => {
      const propType = getPropertyType(property);
      if (propType) {
        const normalized = propType.toLowerCase();
        if (normalized.includes("apartment")) propertyTypesSet.add("Apartment");
        if (normalized.includes("villa")) propertyTypesSet.add("Villa");
        if (normalized.includes("penthouse")) propertyTypesSet.add("Penthouse");
      }

      const bhk = extractBHKConfig(property);
      if (bhk) bhkConfigsSet.add(bhk);

      if (property.price) {
        const priceBucket = getSmartLinkPriceBucket(property.price);
        if (priceBucket) priceRangesSet.add(priceBucket);
        
        const budget = getBudgetCategory(property.price);
        if (budget) budgetCategoriesSet.add(budget);
      }
    });

    return {
      propertyTypes: Array.from(propertyTypesSet).sort(),
      bhkConfigs: Array.from(bhkConfigsSet).sort(),
      priceRanges: Array.from(priceRangesSet).sort(),
      budgetCategories: Array.from(budgetCategoriesSet).sort(),
      statuses: Array.from(statusesSet).sort(),
      viewTypes: Array.from(viewTypesSet).sort(),
      totalProperties: validProperties.length,
      totalProjects: validProjects.length,
    };
  }

  return {
    propertyTypes: Array.from(propertyTypesSet).sort(),
    bhkConfigs: Array.from(bhkConfigsSet).sort(),
    priceRanges: Array.from(priceRangesSet).sort(),
    budgetCategories: Array.from(budgetCategoriesSet).sort(),
    statuses: Array.from(statusesSet).sort(),
    viewTypes: Array.from(viewTypesSet).sort(),
    totalProperties: 0,
    totalProjects: validProjects.length,
  };
}

/**
 * Get micro market + developer stats (for property/project detail pages)
 */
export async function getMicroMarketDeveloperStats(
  microMarketId: string,
  microMarketName: string,
  developerId: string | null,
  developerName: string | null,
  cityId: string,
  citySlug: string
): Promise<{ microMarket: SmartLinkStats; developer: SmartLinkStats | null }> {
  const supabase = await createClient();
  
  // Get micro market stats (reuse existing getLocalityStats logic)
  const { getLocalityStats } = await import("./localityStats");
  const microMarketStats = await getLocalityStats(microMarketId, cityId);
  
  // Convert to SmartLinkStats format
  const microMarket: SmartLinkStats = {
    propertyTypes: [...microMarketStats.residentialTypes, ...microMarketStats.commercialTypes],
    bhkConfigs: [],
    priceRanges: microMarketStats.priceRanges,
    budgetCategories: [],
    statuses: microMarketStats.statuses,
    viewTypes: [],
    totalProperties: 0,
    totalProjects: microMarketStats.totalProjects,
  };

  // Get developer stats if developer info is available
  let developer: SmartLinkStats | null = null;
  if (developerId && developerName) {
    developer = await getDeveloperStats(developerId, developerName, cityId, citySlug);
  }

  return { microMarket, developer };
}

/**
 * Generate smartlink URL based on context
 */
export function generateSmartLinkUrl(
  citySlug: string,
  linkType: "propertyType" | "bhk" | "priceRange" | "budget" | "status" | "view",
  value: string,
  context?: {
    microMarketSlug?: string;
    developerSlug?: string;
  }
): string {
  const baseUrl = `/${citySlug}/buy`;
  const params = new URLSearchParams();

  // Add context filters
  if (context?.microMarketSlug) {
    params.append("microMarkets", context.microMarketSlug);
  }
  if (context?.developerSlug) {
    // Check if developer filter is supported - use search query for now
    params.append("search", context.developerSlug);
  }

  // Add specific filter
  switch (linkType) {
    case "propertyType":
      // Map property types to query format
      const propTypeMap: Record<string, string> = {
        "Apartment": "apartment",
        "Villa": "villa",
        "Penthouse": "penthouse",
      };
      const mappedType = propTypeMap[value] || value.toLowerCase();
      params.append("propertyType", mappedType);
      break;
    case "bhk":
      // Extract number from BHK config (e.g., "3BHK" -> "3", "4+ BHK" -> "4")
      const bhkNum = value.replace(/[^0-9]/g, "");
      if (bhkNum) {
        params.append("bedrooms", bhkNum);
      }
      break;
    case "priceRange":
      // Parse price range and set min/max
      if (value.includes("Under 50 Lakh")) {
        params.append("priceMax", "5000000");
      } else if (value.includes("50 Lakh to 1 Cr")) {
        params.append("priceMin", "5000000");
        params.append("priceMax", "10000000");
      } else if (value.includes("1 Cr to 2 Cr")) {
        params.append("priceMin", "10000000");
        params.append("priceMax", "20000000");
      } else if (value.includes("2 Cr to 5 Cr")) {
        params.append("priceMin", "20000000");
        params.append("priceMax", "50000000");
      } else if (value.includes("Above 5 Cr")) {
        params.append("priceMin", "50000000");
      }
      break;
    case "budget":
      // Map budget categories to price ranges
      if (value === "Affordable") {
        params.append("priceMax", "10000000");
      } else if (value === "Premium") {
        params.append("priceMin", "10000000");
        params.append("priceMax", "30000000");
      } else if (value === "Luxury") {
        params.append("priceMin", "30000000");
        params.append("priceMax", "50000000");
      } else if (value === "Ultra Luxury") {
        params.append("priceMin", "50000000");
      }
      break;
    case "status":
      if (value === "Ready To Move") {
        params.append("possessionStatus", "ready-to-move");
      } else if (value === "New Projects") {
        params.append("possessionStatus", "new-launch");
      }
      break;
    case "view":
      // View types - add as search query for now
      params.append("search", value.toLowerCase());
      break;
  }

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
