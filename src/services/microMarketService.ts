import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();


export interface MicroMarketInfo {
  micro_market_name: string;
  growth_story: string;
  connectivity_details: string;
  infrastructure_details: string;
  it_corridor_influence?: string;
  h1_title?: string;
  url_slug?: string;
  price_per_sqft_min?: number;
  price_per_sqft_max?: number;
  annual_appreciation_min?: number;
  rental_yield_min?: number;
}

const truncateWords = (text: string, maxWords: number): string => {
  if (!text) return '';
  const words = text.split(/\s+/).filter(w => w.length > 0);
  return words.slice(0, maxWords).join(' ') + (words.length > maxWords ? '...' : '');
};

export interface MicroMarketGridItem {
  micro_market_name: string;
  url_slug: string;
  price_per_sqft_min?: number;
  price_per_sqft_max?: number;
  annual_appreciation_min?: number;
  rental_yield_min?: number;
  hero_hook?: string;
}

export const microMarketService = {
  async getMicroMarketByName(microMarketName: string): Promise<MicroMarketInfo | null> {
    if (!microMarketName) return null;

    console.log('🔍 [MicroMarketService] Fetching data for:', microMarketName);

    let result = await supabase
      .from('micro_markets')
      .select('micro_market_name, growth_story, connectivity_details, infrastructure_details, it_corridor_influence, h1_title, url_slug, price_per_sqft_min, price_per_sqft_max, annual_appreciation_min, rental_yield_min')
      .ilike('micro_market_name', microMarketName)
      .limit(1)
      .maybeSingle();

    // Handle PGRST116 errors gracefully
    if (result.error) {
      // PGRST116 with "0 rows" means no match found - this is expected
      if (result.error.code === 'PGRST116' && result.error.details?.includes('0 rows')) {
        console.warn('⚠️ [MicroMarketService] No data found for:', microMarketName);
        return null;
      }
      // PGRST116 without "0 rows" means multiple rows - shouldn't happen with limit(1) but handle it
      if (result.error.code === 'PGRST116' && !result.error.details?.includes('0 rows')) {
        console.warn('⚠️ [MicroMarketService] Multiple rows found for:', microMarketName, '- using first match');
        // Retry to get first row explicitly
        result = await supabase
          .from('micro_markets')
          .select('micro_market_name, growth_story, connectivity_details, infrastructure_details, it_corridor_influence, h1_title, url_slug, price_per_sqft_min, price_per_sqft_max, annual_appreciation_min, rental_yield_min')
          .ilike('micro_market_name', microMarketName)
          .limit(1)
          .maybeSingle();
        if (result.error && result.error.code === 'PGRST116') {
          console.warn('⚠️ [MicroMarketService] Still error after retry:', result.error);
          return null;
        }
      } else {
        console.error('❌ [MicroMarketService] Error:', result.error);
        return null;
      }
    }

    const data = result.data;
    if (!data) {
      console.warn('⚠️ [MicroMarketService] No data found for:', microMarketName);
      return null;
    }

    console.log('✅ [MicroMarketService] Data found for:', microMarketName);

    return {
      micro_market_name: data.micro_market_name,
      growth_story: truncateWords(data.growth_story || '', 200),
      connectivity_details: truncateWords(data.connectivity_details || '', 200),
      infrastructure_details: truncateWords(data.infrastructure_details || '', 200),
      it_corridor_influence: data.it_corridor_influence || '',
      h1_title: data.h1_title || '',
      url_slug: data.url_slug || '',
      price_per_sqft_min: data.price_per_sqft_min,
      price_per_sqft_max: data.price_per_sqft_max,
      annual_appreciation_min: data.annual_appreciation_min,
      rental_yield_min: data.rental_yield_min
    };
  },

  async getMicroMarketsByCity(citySlug: string): Promise<MicroMarketGridItem[]> {
    if (!citySlug) return [];

    console.log('🔍 [MicroMarketService] Fetching micro-markets for city:', citySlug);

    // First, get the city ID
    const { data: cityData, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('url_slug', citySlug)
      .limit(1)
      .maybeSingle();

    if (cityError) {
      // Handle PGRST116 (0 rows) gracefully
      if (cityError.code === 'PGRST116' && cityError.details?.includes('0 rows')) {
        console.warn('⚠️ [MicroMarketService] City not found:', citySlug);
        return [];
      }
      console.error('❌ [MicroMarketService] Error fetching city:', cityError);
      return [];
    }

    if (!cityData) {
      console.warn('⚠️ [MicroMarketService] City not found:', citySlug);
      return [];
    }

    // Fetch micro-markets for this city - top 9 by growth
    const { data, error } = await supabase
      .from('micro_markets')
      .select('micro_market_name, url_slug, price_per_sqft_min, price_per_sqft_max, annual_appreciation_min, rental_yield_min, hero_hook')
      .eq('city_id', cityData.id)
      .eq('status', 'published')
      .order('annual_appreciation_min', { ascending: false })
      .limit(9);

    if (error) {
      console.error('❌ [MicroMarketService] Error fetching micro-markets:', error);
      return [];
    }

    console.log(`✅ [MicroMarketService] Found ${data?.length || 0} micro-markets for ${citySlug}`);

    return data || [];
  }
};
