// Landing Page Types
// These types are shared between server and client components
// Import from here instead of the service file to avoid server-side code execution

export type LandingPage = {
  id: string;
  uri: string;
  title: string;
  headline: string;
  subheadline: string;
  rich_description: string;
  location_info: string;
  whatsapp_number: string;
  whatsapp_message: string;
  youtube_video_url?: string;
  show_google_map: boolean;
  google_map_url?: string;
  map_latitude?: number;
  map_longitude?: number;
  map_zoom?: number;
  map_type?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  hero_image_url?: string;
  hero_image_supabase_path?: string;
  status: string;
  seo_title?: string;
  seo_description?: string;
  seo_h1_override?: string;
  section_headings?: Record<string, string>;
  show_faq?: boolean;
  template_type?: string;
  cta_primary_text?: string;
  cta_secondary_text?: string;
  popup_form_title?: string;
  popup_form_description?: string;
  project_land_area?: string;
  project_total_towers?: string;
  project_total_floors?: string;
  project_total_flats?: string;
  project_flats_per_floor?: string;
  project_elevation_image_url?: string;
  project_elevation_supabase_path?: string;
  rera_number?: string;
  rera_link?: string;
  brochure_url?: string;
  created_at: string;
  updated_at: string;
}

export type LandingPageImage = {
  id: string;
  landing_page_id: string;
  image_url: string;
  alt_text?: string;
  display_order: number;
  supabase_storage_path?: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
  updated_at: string;
}

export type LandingPageHighlight = {
  id: string;
  landing_page_id: string;
  icon_name: string;
  title: string;
  subtitle?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type LandingPageFloorPlan = {
  id: string;
  landing_page_id: string;
  plan_name: string;
  image_url: string;
  supabase_storage_path?: string;
  display_order: number;
  is_master_plan: boolean;
  created_at: string;
  updated_at: string;
}

export type LandingPageConfiguration = {
  id: string;
  landing_page_id: string;
  unit_type: string;
  size_min?: number;
  size_max?: number;
  starting_price?: number;
  price_display?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type LandingPageSpecification = {
  id: string;
  landing_page_id: string;
  category: string;
  specification_key: string;
  specification_value: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type LandingPageLocationPoint = {
  id: string;
  landing_page_id: string;
  landmark_name: string;
  landmark_type?: string;
  distance: string;
  description?: string;
  icon_name?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type LandingPageFAQ = {
  id: string;
  landing_page_id: string;
  category?: string;
  question: string;
  answer: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

