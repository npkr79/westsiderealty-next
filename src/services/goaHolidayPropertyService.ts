import { createClient } from "@/lib/supabase/server";
import type { GoaHolidayProperty, GoaHolidayPropertyFilter } from "@/types/goaHolidayProperty";

const supabasePromise = createClient();

class GoaHolidayPropertyService {
  async getProperties(filters: GoaHolidayPropertyFilter = {}): Promise<GoaHolidayProperty[]> {
    const supabase = await supabasePromise;
    let query = supabase
      .from('goa_holiday_properties')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.district) {
      query = query.eq('district', filters.district);
    }

    if (filters.location_area) {
      query = query.eq('location_area', filters.location_area);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.listing_type) {
      query = query.eq('listing_type', filters.listing_type);
    }

    if (filters.bedrooms) {
      query = query.eq('bedrooms', filters.bedrooms);
    }

    if (filters.bathrooms) {
      query = query.eq('bathrooms', filters.bathrooms);
    }

    if (filters.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured);
    }

    if (filters.priceRange) {
      const [min, max] = this.parsePriceRange(filters.priceRange);
      query = query.gte('price', min);
      if (max) {
        query = query.lte('price', max);
      }
    }

    if (filters.searchQuery) {
      query = query.or(
        `title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,location_area.ilike.%${filters.searchQuery}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching Goa holiday properties:', error);
      throw error;
    }

    return this.transformToGoaHolidayProperty(data || []);
  }

  async getPropertyById(id: string): Promise<GoaHolidayProperty | null> {
    const supabase = await supabasePromise;
    const { data, error } = await supabase
      .from('goa_holiday_properties')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching property by ID:', error);
      throw error;
    }

    if (!data) return null;

    return this.transformToGoaHolidayProperty([data])[0];
  }

  async getPropertyBySlug(slug: string): Promise<GoaHolidayProperty | null> {
    const supabase = await supabasePromise;
    const { data, error } = await supabase
      .from('goa_holiday_properties')
      .select('*')
      .eq('seo_slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Error fetching property by slug:', error);
      throw error;
    }

    if (!data) return null;

    return this.transformToGoaHolidayProperty([data])[0];
  }

  async createProperty(propertyData: Partial<GoaHolidayProperty>): Promise<GoaHolidayProperty | null> {
    const supabase = await supabasePromise;
    const { data, error } = await supabase
      .from('goa_holiday_properties')
      .insert([this.transformPropertyDataToSupabase(propertyData)])
      .select()
      .single();

    if (error) {
      console.error('Error creating property:', error);
      throw error;
    }

    return this.transformToGoaHolidayProperty([data])[0];
  }

  async updateProperty(id: string, updates: Partial<GoaHolidayProperty>): Promise<GoaHolidayProperty | null> {
    const supabase = await supabasePromise;
    const { data, error } = await supabase
      .from('goa_holiday_properties')
      .update(this.transformPropertyDataToSupabase(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating property:', error);
      throw error;
    }

    return this.transformToGoaHolidayProperty([data])[0];
  }

  async deleteProperty(id: string): Promise<boolean> {
    const supabase = await supabasePromise;
    const { error } = await supabase
      .from('goa_holiday_properties')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting property:', error);
      throw error;
    }

    return true;
  }

  generateSeoSlug(title: string, propertyId?: string): string {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    if (propertyId) {
      const shortId = propertyId.slice(-8);
      return `${slug}-${shortId}`;
    }
    
    return slug;
  }

  private transformToGoaHolidayProperty(data: any[]): GoaHolidayProperty[] {
    return data.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      listing_type: item.listing_type,
      price: parseFloat(item.price) || 0,
      price_display: item.price_display,
      area_sqft: item.area_sqft ? parseFloat(item.area_sqft) : undefined,
      plot_area_sqm: item.plot_area_sqm ? parseFloat(item.plot_area_sqm) : undefined,
      bedrooms: item.bedrooms,
      bathrooms: item.bathrooms,
      location_area: item.location_area,
      district: item.district,
      latitude: item.latitude ? parseFloat(item.latitude) : undefined,
      longitude: item.longitude ? parseFloat(item.longitude) : undefined,
      micromarket_title: item.micromarket_title,
      micromarket_description: item.micromarket_description,
      micromarket_hero_image: item.micromarket_hero_image,
      nearby_places: Array.isArray(item.nearby_places) ? item.nearby_places : [],
      description: item.description,
      rich_description: item.rich_description,
      amenities: Array.isArray(item.amenities) ? item.amenities : [],
      unique_features: Array.isArray(item.unique_features) ? item.unique_features : [],
      rental_yield_min: item.rental_yield_min ? parseFloat(item.rental_yield_min) : undefined,
      rental_yield_max: item.rental_yield_max ? parseFloat(item.rental_yield_max) : undefined,
      rental_income_monthly: item.rental_income_monthly ? parseFloat(item.rental_income_monthly) : undefined,
      investment_highlights: Array.isArray(item.investment_highlights) ? item.investment_highlights : [],
      images: Array.isArray(item.images) ? item.images : [],
      hero_image_url: item.hero_image_url,
      video_link: item.video_link,
      virtual_tour_url: item.virtual_tour_url,
      google_maps_url: item.google_maps_url,
      is_featured: item.is_featured || false,
      status: item.status,
      seo_slug: item.seo_slug,
      seo_title: item.seo_title,
      meta_description: item.meta_description,
      seo_keywords: Array.isArray(item.seo_keywords) ? item.seo_keywords : [],
      brochure_url: item.brochure_url,
      brochure_supabase_path: item.brochure_supabase_path,
      floor_plans: Array.isArray(item.floor_plans) ? item.floor_plans : [],
      created_at: item.created_at,
      updated_at: item.updated_at,
      user_id: item.user_id,
      agent_id: item.agent_id,
    }));
  }

  private transformPropertyDataToSupabase(propertyData: Partial<GoaHolidayProperty>): any {
    return {
      title: propertyData.title,
      type: propertyData.type,
      listing_type: propertyData.listing_type,
      price: propertyData.price,
      price_display: propertyData.price_display,
      area_sqft: propertyData.area_sqft,
      plot_area_sqm: propertyData.plot_area_sqm,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      location_area: propertyData.location_area,
      district: propertyData.district,
      latitude: propertyData.latitude,
      longitude: propertyData.longitude,
      micromarket_title: propertyData.micromarket_title,
      micromarket_description: propertyData.micromarket_description,
      micromarket_hero_image: propertyData.micromarket_hero_image,
      nearby_places: propertyData.nearby_places,
      description: propertyData.description,
      rich_description: propertyData.rich_description,
      amenities: propertyData.amenities,
      unique_features: propertyData.unique_features,
      rental_yield_min: propertyData.rental_yield_min,
      rental_yield_max: propertyData.rental_yield_max,
      rental_income_monthly: propertyData.rental_income_monthly,
      investment_highlights: propertyData.investment_highlights,
      images: propertyData.images,
      hero_image_url: propertyData.hero_image_url,
      video_link: propertyData.video_link,
      virtual_tour_url: propertyData.virtual_tour_url,
      google_maps_url: propertyData.google_maps_url,
      is_featured: propertyData.is_featured,
      status: propertyData.status,
      seo_slug: propertyData.seo_slug,
      seo_title: propertyData.seo_title,
      meta_description: propertyData.meta_description,
      seo_keywords: propertyData.seo_keywords,
      brochure_url: propertyData.brochure_url,
      brochure_supabase_path: propertyData.brochure_supabase_path,
      floor_plans: propertyData.floor_plans,
      agent_id: propertyData.agent_id,
    };
  }

  private parsePriceRange(priceRange: string): [number, number | null] {
    const ranges: { [key: string]: [number, number | null] } = {
      '0-50': [0, 5000000],
      '50-100': [5000000, 10000000],
      '100-200': [10000000, 20000000],
      '200-500': [20000000, 50000000],
      '500+': [50000000, null],
    };
    return ranges[priceRange] || [0, null];
  }
}

export const goaHolidayPropertyService = new GoaHolidayPropertyService();
