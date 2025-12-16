export interface ContentBlock {
  id?: string;
  landing_page_id?: string;
  block_type?: string;
  content?: string | null;
  display_order?: number;
  metadata?: Record<string, any> | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Amenity {
  id?: string;
  landing_page_id?: string;
  title?: string;
  name?: string; // Alias for title for backward compatibility
  description?: string | null;
  icon?: string | null;
  image_url?: string | null;
  supabase_storage_path?: string | null;
  display_order?: number;
  created_at?: string | null;
  updated_at?: string | null;
}

