/**
 * Unified property interface that works across all cities
 * Maps different city-specific property structures to a common format
 */
export interface UnifiedProperty {
  id: string;
  title: string;
  slug: string;
  seo_slug?: string;
  description: string;
  price: number;
  price_display?: string;
  property_type: string;
  location: string; // Main location field
  area_sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  main_image_url?: string;
  image_gallery: string[];
  is_featured: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  
  // City-specific fields (optional)
  // Hyderabad
  micro_market?: string;
  project_name?: string;
  landowner_share?: boolean;
  investor_share?: boolean;
  is_resale?: boolean;
  bhk_config?: string;
  
  // Goa
  district?: string; // North Goa / South Goa
  location_area?: string; // Specific area
  listing_type?: string; // Sale, Rent, Both
  rental_yield_min?: number;
  rental_yield_max?: number;
  rental_income_monthly?: number;
  
  // Dubai
  emirate?: string;
  community?: string;
  roi_percentage?: number;
  rental_yield?: number;
}

/**
 * Unified filter interface
 */
export interface UnifiedPropertyFilters {
  searchQuery?: string;
  propertyType?: string | string[]; // Can be single or array for checkboxes
  priceRange?: string;
  priceMin?: number; // For slider
  priceMax?: number; // For slider
  bedrooms?: number | number[]; // Can be single or array for buttons
  location?: string;
  sortBy?: string;
  
  // Hyderabad-specific
  microMarkets?: string[];
  communities?: string[];
  landownerShare?: boolean;
  investorShare?: boolean;
  isResale?: boolean;
  possessionStatus?: string; // Ready to Move, Under Construction
  amenities?: string[]; // Array of amenity names
  
  // Goa-specific
  district?: string;
  location_area?: string;
  listing_type?: string;
  
  // Dubai-specific
  emirate?: string;
  community?: string;
}

/**
 * City configuration
 */
export type CitySlug = 'hyderabad' | 'goa' | 'dubai';

export interface CityConfig {
  slug: CitySlug;
  name: string;
  displayName: string;
  tableName: string;
  heroGradient: string;
  icon: string;
}

export const CITY_CONFIGS: Record<CitySlug, CityConfig> = {
  hyderabad: {
    slug: 'hyderabad',
    name: 'Hyderabad',
    displayName: 'Hyderabad',
    tableName: 'hyderabad_properties',
    heroGradient: 'from-remax-red to-red-600',
    icon: 'MapPin',
  },
  goa: {
    slug: 'goa',
    name: 'Goa',
    displayName: 'Goa',
    tableName: 'goa_holiday_properties',
    heroGradient: 'from-blue-600 to-blue-800',
    icon: 'Waves',
  },
  dubai: {
    slug: 'dubai',
    name: 'Dubai',
    displayName: 'Dubai, UAE',
    tableName: 'dubai_properties',
    heroGradient: 'from-amber-600 to-orange-600',
    icon: 'Building',
  },
};

