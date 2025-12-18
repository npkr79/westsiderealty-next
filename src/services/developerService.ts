import { createClient } from "@/lib/supabase/client";

export interface Developer {
  id: string;
  developer_name: string;
  url_slug: string;
  logo_url: string | null;
  banner_image_url: string | null;
  tagline: string | null;
  hero_description: string | null;
  long_description_seo: string;
  specialization: string | null;
  years_in_business: number | null;
  total_projects: number | null;
  total_sft_delivered: string | null;
  website_url: string | null;
  location_focus: string[] | null;
  usp: string | null;
  notable_projects_json: any;
  key_awards_json: any;
  testimonial_json: any;
  seo_title: string;
  meta_description: string;
  primary_city_focus: string | null;
  founder_bio_summary: string | null;
  history_timeline_json: any;
  schema_markup_json: any;
  awards_summary_text: string | null;
  faqs_json: any;
}

export const developerService = {
  async getDeveloperBySlug(slug: string): Promise<Developer | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('developers')
      .select('*')
      .eq('url_slug', slug)
      .single();

    if (error) {
      console.error('Error fetching developer:', error);
      return null;
    }

    return data;
  },

  async getDeveloperByName(name: string): Promise<Developer | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('developers')
      .select('*')
      .ilike('developer_name', `%${name}%`)
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching developer by name:', error);
      return null;
    }

    return data;
  }
};
