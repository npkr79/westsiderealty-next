import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();


export interface DeveloperListItem {
  id: string;
  developer_name: string;
  url_slug: string;
  logo_url: string | null;
  tagline: string | null;
  specialization: string | null;
  years_in_business: number | null;
  total_projects: number | null;
  total_sft_delivered: string | null;
  primary_city_focus: string | null;
}

export interface DeveloperFilters {
  search?: string;
  cityFocus?: string;
  specialization?: string;
}

export const developersHubService = {
  async getDevelopers(filters: DeveloperFilters = {}): Promise<DeveloperListItem[]> {
    let query = supabase
      .from("developers")
      .select(`
        id,
        developer_name,
        url_slug,
        logo_url,
        tagline,
        specialization,
        years_in_business,
        total_projects,
        total_sft_delivered,
        primary_city_focus
      `)
      .eq("is_published", true)
      .order("display_order", { ascending: true });

    if (filters.search) {
      query = query.ilike("developer_name", `%${filters.search}%`);
    }

    if (filters.cityFocus) {
      query = query.eq("primary_city_focus", filters.cityFocus);
    }

    if (filters.specialization) {
      query = query.ilike("specialization", `%${filters.specialization}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching developers:", error);
      return [];
    }

    return data || [];
  },

  async getCityFocusOptions(): Promise<string[]> {
    const { data, error } = await supabase
      .from("developers")
      .select("primary_city_focus")
      .eq("is_published", true)
      .not("primary_city_focus", "is", null);

    if (error) {
      console.error("Error fetching city focus options:", error);
      return [];
    }

    const uniqueCities = [...new Set(data?.map(d => d.primary_city_focus).filter(Boolean) as string[])];
    return uniqueCities.sort();
  }
};
