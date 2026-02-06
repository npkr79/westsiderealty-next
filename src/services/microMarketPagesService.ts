import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';

export interface FAQ {
  question: string;
  answer: string;
}

export interface QuickRefProject {
  name: string;
  configuration: string;
  developer: string;
  url: string;
}

export interface MarketAnalysisTable {
  projects: QuickRefProject[];
}

export interface DeveloperProject {
  name: string;
  url: string;
  label: string;
  status?: 'delivered' | 'under-construction' | 'upcoming';
}

export interface Developer {
  name: string;
  bio: string;
  pillarPageUrl: string;
  projects: DeveloperProject[];
  displayOrder: number;
}

export interface MasterPlanZone {
  zone: string;
  purpose: string;
  description: string;
}

export interface MasterPlanData {
  total_area: string;
  fsi_policy: string;
  zones: MasterPlanZone[];
}

export interface InfrastructureItem {
  year: string;
  project: string;
  status: string;
  impact: string;
}

export interface CommuteMatrixItem {
  destination?: string;
  name?: string;
  time?: string;
  distance?: string;
  type?: string;
}

export interface LivabilityScores {
  overall?: number;
  connectivity?: number;
  infrastructure?: number;
  schools?: number;
  healthcare?: number;
  shopping?: number;
  entertainment?: number;
  safety?: number;
  [key: string]: number | undefined;
}

export interface PriceTrendItem {
  year: string | number;
  price: number;
  [key: string]: any;
}

export interface MicroMarketPage {
  id: string;
  url_slug: string;
  micro_market_name: string;
  city_id: string;
  seo_title: string;
  meta_description: string;
  seo_keywords?: string[];
  canonical_url?: string;
  h1_title: string;
  hero_hook: string;
  hero_image_url?: string;
  growth_story?: string;
  connectivity_details?: string;
  infrastructure_details?: string;
  it_corridor_influence?: string;
  price_per_sqft_min?: number;
  price_per_sqft_max?: number;
  annual_appreciation_min?: number;
  annual_appreciation_max?: number;
  rental_yield_min?: number;
  rental_yield_max?: number;
  // New SEO-optimized fields
  locality_pincode?: string;
  nearest_mmts_status?: string;
  key_adjacent_areas?: string[];
  market_analysis_table?: MarketAnalysisTable;
  inventory_description?: string;
  primary_property_types?: string[];
  top_schools?: string[];
  top_hospitals?: string[];
  entertainment_centers?: string[];
  faqs?: FAQ[];
  faq_schema_json?: string;
  filtered_properties_url?: string;
  developer_pillar_urls?: Record<string, Developer>;
  market_analysis_chart_url?: string;
  connectivity_map_url?: string;
  developer_logo_urls?: Record<string, string>;
  master_plan_json?: MasterPlanData;
  infrastructure_json?: InfrastructureItem[];
  mm_authority_content?: string;
  // New fields
  commute_matrix?: CommuteMatrixItem[] | any;
  livability_scores?: LivabilityScores | any;
  featured_project_ids?: string[];
  price_trends?: PriceTrendItem[] | any;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  word_count?: number;
  created_at: string;
  updated_at: string;
}

export interface FeaturedProject {
  id?: string;
  micro_market_id: string;
  property_id?: string;
  project_name: string;
  project_summary?: string;
  project_url: string;
  display_order: number;
}

export interface PropertyListing {
  id: string;
  title: string;
  slug: string;
  price: string;
  configuration: string;
  area: string;
  imageUrl: string;
  url: string;
}

class MicroMarketPagesService {
  private async resolveCityId(
    supabase: any,
    citySlug?: string
  ): Promise<string | null> {
    if (!citySlug) return null;
    const { data: cityData, error } = await supabase
      .from("cities")
      .select("id")
      .eq("url_slug", citySlug)
      .maybeSingle();
    if (error) {
      throw error;
    }
    return cityData?.id || null;
  }

  private async fetchMicroMarket(
    supabase: any,
    slug: string,
    cityId?: string | null
  ): Promise<MicroMarketPage | null> {
    let query = supabase
      .from("micro_markets")
      .select("*")
      .eq("url_slug", slug);

    if (cityId) {
      query = query.eq("city_id", cityId);
    }

    const { data, error } = await query.limit(1).maybeSingle();

    if (error) {
      throw error;
    }
    return (data ?? null) as unknown as MicroMarketPage | null;
  }

  // Public methods
  async getMicroMarketPageBySlug(slug: string, citySlug?: string): Promise<MicroMarketPage | null> {
    const supabase = await createClient();

    try {
      const cityId = await this.resolveCityId(supabase, citySlug);
      const data = await this.fetchMicroMarket(supabase, slug, cityId);
      if (!data) {
        console.warn(
          `[MicroMarketPagesService] No micro-market found with url_slug: "${slug}"${citySlug ? ` for city: ${citySlug}` : ''}`
        );
        return null;
      }
      const status = (data as any).status;
      if (status !== "published") {
        console.warn(
          `[MicroMarketPagesService] Micro-market "${slug}" found but status is "${status}" (expected "published"). Still returning data.`
        );
      }
      return data;
    } catch (error: any) {
      // Handle PGRST116 (0 rows) gracefully - this is expected if micro market doesn't exist
      if (error?.code === "PGRST116" && error?.details?.includes("0 rows")) {
        console.warn(
          `[MicroMarketPagesService] No micro-market found with url_slug: "${slug}"${citySlug ? ` for city: ${citySlug}` : ''}`
        );
        return null;
      }
      console.error(
        `[MicroMarketPagesService] Error fetching micro-market page for slug "${slug}":`,
        error
      );

      // Fallback to service role (handles RLS in production)
      try {
        const serviceClient = createServiceClient();
        const cityId = await this.resolveCityId(serviceClient, citySlug);
        const data = await this.fetchMicroMarket(serviceClient, slug, cityId);
        if (!data) {
          return null;
        }
        return data;
      } catch (serviceError) {
        console.error(
          `[MicroMarketPagesService] Service-role fallback failed for slug "${slug}":`,
          serviceError
        );
        return null;
      }
    }
  }

  async getFeaturedProjectsForPage(pageId: string): Promise<FeaturedProject[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("micro_market_featured_projects")
      .select("*")
      .eq("micro_market_id", pageId)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching featured projects:", error);
      return [];
    }

    return data as FeaturedProject[];
  }

  async getLiveListingsForMicroMarket(microMarketName: string): Promise<PropertyListing[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("hyderabad_properties")
      .select("id, title, slug, price, price_display, bhk_config, area_sqft, main_image_url")
      .eq("micro_market", microMarketName)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching live listings:", error);
      return [];
    }

    return (data || []).map(property => ({
      id: property.id,
      title: property.title,
      slug: property.slug,
      price: property.price_display,
      configuration: property.bhk_config || 'N/A',
      area: property.area_sqft ? `${property.area_sqft} sq. ft.` : 'N/A',
      imageUrl: property.main_image_url || '/images/placeholder-property.png',
      url: `/hyderabad/buy/${property.slug}`
    }));
  }

  // Admin methods
  async getAllMicroMarketPages(): Promise<MicroMarketPage[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("micro_markets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all micro-market pages:", error);
      return [];
    }

    return data as unknown as MicroMarketPage[];
  }

  async createMicroMarketPage(pageData: Partial<MicroMarketPage>): Promise<MicroMarketPage | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("micro_markets")
      .insert(pageData as any)
      .select()
      .single();

    if (error) {
      console.error("Error creating micro-market page:", error);
      throw error;
    }

    return data as unknown as MicroMarketPage;
  }

  async updateMicroMarketPage(id: string, pageData: Partial<MicroMarketPage>): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("micro_markets")
      .update(pageData as any)
      .eq("id", id);

    if (error) {
      console.error("Error updating micro-market page:", error);
      throw error;
    }
  }

  async deleteMicroMarketPage(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("micro_markets")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting micro-market page:", error);
      throw error;
    }
  }

  async addFeaturedProject(projectData: Omit<FeaturedProject, "id">): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("micro_market_featured_projects")
      .insert(projectData);

    if (error) {
      console.error("Error adding featured project:", error);
      throw error;
    }
  }

  async removeFeaturedProject(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("micro_market_featured_projects")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error removing featured project:", error);
      throw error;
    }
  }

  generateFAQSchema(faqs: FAQ[]): string {
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };

    return JSON.stringify(schema);
  }
}

export const microMarketPagesService = new MicroMarketPagesService();
