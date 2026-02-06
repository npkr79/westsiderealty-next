import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';

export interface CityInfo {
  id: string;
  city_name: string;
  url_slug: string;
  country: string;
  seo_title: string;
  meta_description: string;
  canonical_url?: string;
  h1_title: string;
  hero_hook: string;
  hero_image_url?: string;
  city_overview_seo: string;
  average_price_sqft?: number;
  annual_appreciation_pct?: number;
  rental_yield_pct?: number;
  market_snapshot_json?: any;
  market_trends_json?: any;
  featured_micromarkets_json?: any;
  top_property_types_json?: any;
  city_faqs_json?: any;
  testimonials_json?: any;
  city_overview_sections_json?: any;
  lifestyle_infrastructure_json?: any;
  buyer_personas_json?: any;
  investment_zones_json?: any;
  investment_reasons_json?: any;
  investment_reasons_stats_json?: any;
}

export const cityService = {
  async getCityBySlug(slug: string): Promise<CityInfo | null> {
    console.log('🏙️ [CityService] Fetching city data for:', slug);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('url_slug', slug)
      .eq('page_status', 'published')
      .limit(1)
      .maybeSingle();

    if (error) {
      // Handle PGRST116 (0 rows) gracefully
      if (error.code === 'PGRST116' && error.details?.includes('0 rows')) {
        console.warn('⚠️ [CityService] No city found for slug:', slug);
        return null;
      }
      console.error('❌ [CityService] Error:', error);
      try {
        const serviceClient = createServiceClient();
        const { data: fallbackData, error: fallbackError } = await serviceClient
          .from('cities')
          .select('*')
          .eq('url_slug', slug)
          .eq('page_status', 'published')
          .limit(1)
          .maybeSingle();
        if (fallbackError) {
          console.error('❌ [CityService] Service fallback error:', fallbackError);
          return null;
        }
        return (fallbackData as CityInfo) ?? null;
      } catch (fallbackError) {
        console.error('❌ [CityService] Service client failure:', fallbackError);
        return null;
      }
    }

    if (!data) {
      console.warn('⚠️ [CityService] No city found for slug:', slug);
      return null;
    }

    console.log('✅ [CityService] City data found:', data.city_name);
    return data;
  },

  async getPublishedPropertyCount(citySlug: string): Promise<number> {
    console.log('🏙️ [CityService] Fetching property count for:', citySlug);
    
    // Currently only implemented for Hyderabad
    if (citySlug !== 'hyderabad') return 0;
    
    const supabase = await createClient();
    const { count, error } = await supabase
      .from('hyderabad_properties')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    if (error) {
      console.error('❌ [CityService] Error fetching property count:', error);
      try {
        const serviceClient = createServiceClient();
        const { count: fallbackCount, error: fallbackError } = await serviceClient
          .from('hyderabad_properties')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');
        if (fallbackError) {
          console.error('❌ [CityService] Service fallback error:', fallbackError);
          return 0;
        }
        return fallbackCount || 0;
      } catch (fallbackError) {
        console.error('❌ [CityService] Service client failure:', fallbackError);
        return 0;
      }
    }
    
    console.log('✅ [CityService] Property count:', count);
    return count || 0;
  }
};
