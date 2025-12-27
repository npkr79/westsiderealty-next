import { createClient } from '@/lib/supabase/server';
import type { UnifiedProperty, CitySlug } from '@/types/unifiedProperty';
import { CITY_CONFIGS } from '@/types/unifiedProperty';

/**
 * Service to fetch and transform properties from different city tables
 * into a unified format
 */
export class UnifiedPropertyService {
  /**
   * Fetch properties for a specific city
   */
  static async getProperties(citySlug: CitySlug): Promise<UnifiedProperty[]> {
    const config = CITY_CONFIGS[citySlug];
    if (!config) {
      throw new Error(`Unknown city: ${citySlug}`);
    }

    const supabase = await createClient();

    // Different cities use different status values
    // Hyderabad uses 'active', Goa uses 'Active', Dubai uses 'published'
    let statusFilter: string;
    switch (citySlug) {
      case 'hyderabad':
        statusFilter = 'active';
        break;
      case 'goa':
        statusFilter = 'Active';
        break;
      case 'dubai':
        statusFilter = 'published';
        break;
      default:
        statusFilter = 'published';
    }

    const { data, error } = await supabase
      .from(config.tableName)
      .select('*')
      .eq('status', statusFilter)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching ${citySlug} properties:`, error);
      console.error(`Status filter used: ${statusFilter}`);
      console.error(`Table name: ${config.tableName}`);
      return [];
    }

    return this.transformProperties(data || [], citySlug);
  }

  /**
   * Transform city-specific property data to unified format
   */
  private static transformProperties(
    data: any[],
    citySlug: CitySlug
  ): UnifiedProperty[] {
    switch (citySlug) {
      case 'hyderabad':
        return this.transformHyderabadProperties(data);
      case 'goa':
        return this.transformGoaProperties(data);
      case 'dubai':
        return this.transformDubaiProperties(data);
      default:
        return [];
    }
  }

  /**
   * Transform Hyderabad properties
   */
  private static transformHyderabadProperties(data: any[]): UnifiedProperty[] {
    return data.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug || item.seo_slug || item.id,
      seo_slug: item.seo_slug,
      description: item.description || '',
      price: parseFloat(item.price) || 0,
      price_display: item.price_display || item.price?.toString(),
      property_type: item.property_type || 'Apartment',
      location: item.location || '',
      area_sqft: item.area_sqft,
      bedrooms: item.bedrooms,
      bathrooms: item.bathrooms,
      main_image_url: item.main_image_url,
      image_gallery: Array.isArray(item.image_gallery) ? item.image_gallery : [],
      is_featured: item.is_featured || false,
      status: item.status || 'published',
      created_at: item.created_at,
      updated_at: item.updated_at,
      // Hyderabad-specific
      micro_market: item.micro_market,
      project_name: item.project_name,
      landowner_share: item.landowner_share || false,
      investor_share: item.investor_share || false,
      is_resale: item.is_resale || false,
      bhk_config: item.bhk_config,
      // Additional fields for filtering
      amenities: Array.isArray(item.amenities) ? item.amenities : [],
      possession_status: item.possession_status,
    } as any));
  }

  /**
   * Transform Goa properties
   */
  private static transformGoaProperties(data: any[]): UnifiedProperty[] {
    return data.map((item) => ({
      id: item.id,
      title: item.title,
      // For Goa properties, ONLY use seo_slug if it exists, otherwise use ID
      // Do NOT generate slugs from title as they won't match the database
      slug: item.seo_slug || item.id,
      seo_slug: item.seo_slug,
      description: item.description || '',
      price: parseFloat(item.price) || 0,
      price_display: item.price_display || item.price?.toString(),
      property_type: item.type || 'Holiday Home',
      location: item.location_area || item.location || '',
      area_sqft: item.area_sqft,
      bedrooms: item.bedrooms,
      bathrooms: item.bathrooms,
      main_image_url: item.hero_image_url || item.main_image_url,
      image_gallery: Array.isArray(item.images) 
        ? item.images 
        : Array.isArray(item.image_gallery) 
        ? item.image_gallery 
        : [],
      is_featured: item.is_featured || false,
      status: item.status || 'Active',
      created_at: item.created_at,
      updated_at: item.updated_at,
      // Goa-specific
      district: item.district,
      location_area: item.location_area,
      listing_type: item.listing_type,
      rental_yield_min: item.rental_yield_min ? parseFloat(item.rental_yield_min) : undefined,
      rental_yield_max: item.rental_yield_max ? parseFloat(item.rental_yield_max) : undefined,
      rental_income_monthly: item.rental_income_monthly ? parseFloat(item.rental_income_monthly) : undefined,
    }));
  }

  /**
   * Transform Dubai properties
   */
  private static transformDubaiProperties(data: any[]): UnifiedProperty[] {
    return data.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug || item.seo_slug || item.id,
      seo_slug: item.seo_slug,
      description: item.description || '',
      price: parseFloat(item.price) || 0,
      price_display: item.price_display || item.price?.toString(),
      property_type: item.property_type || 'Apartment',
      location: item.community || item.emirate || '',
      area_sqft: item.area_sqft,
      bedrooms: item.bedrooms,
      bathrooms: item.bathrooms,
      main_image_url: item.main_image_url,
      image_gallery: Array.isArray(item.image_gallery) ? item.image_gallery : [],
      is_featured: item.is_featured || false,
      status: item.status || 'published',
      created_at: item.created_at,
      updated_at: item.updated_at,
      // Dubai-specific
      emirate: item.emirate,
      community: item.community,
      roi_percentage: item.roi_percentage ? parseFloat(item.roi_percentage) : undefined,
      rental_yield: item.rental_yield ? parseFloat(item.rental_yield) : undefined,
    }));
  }
}

