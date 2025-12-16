export interface GoaHolidayProperty {
  id: string;
  title: string;
  type: string;
  listing_type: string;
  price: number;
  price_display?: string | null;
  area_sqft?: number | null;
  plot_area_sqm?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  location_area?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  micromarket_title?: string | null;
  micromarket_description?: string | null;
  micromarket_hero_image?: string | null;
  nearby_places?: string[] | null;
  description?: string | null;
  rich_description?: string | null;
  amenities?: string[] | null;
  unique_features?: string[] | null;
  rental_yield_min?: number | null;
  rental_yield_max?: number | null;
  rental_income_monthly?: number | null;
  investment_highlights?: string[] | null;
  images?: string[] | null;
  hero_image_url?: string | null;
  video_link?: string | null;
  virtual_tour_url?: string | null;
  google_maps_url?: string | null;
  is_featured?: boolean | null;
  status?: string | null;
  seo_slug?: string | null;
  seo_title?: string | null;
  meta_description?: string | null;
  seo_keywords?: string[] | null;
  brochure_url?: string | null;
  brochure_supabase_path?: string | null;
  floor_plans?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_id?: string | null;
  agent_id?: string | null;
}

export interface GoaHolidayPropertyFilter {
  status?: string;
  district?: string;
  location_area?: string;
  type?: string;
  listing_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  is_featured?: boolean;
  priceRange?: string;
  searchQuery?: string;
}

