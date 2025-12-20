import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();


// Type definitions for each location's properties
export interface HyderabadProperty {
  id: string;
  title: string;
  slug: string;
  seo_slug?: string;
  description: string;
  price: number;
  price_display: string;
  property_type: string;
  ownership_type: string;
  bhk_config?: string;
  area_sqft?: number;
  plot_area?: string;
  bedrooms?: number;
  bathrooms?: number;
  floor_number?: string;
  total_floors?: string;
  location: string;
  micro_market?: string;
  project_name?: string;
  nearby_landmarks?: any; // LocationDetails object
  possession_status?: string;
  furnished_status?: string;
  facing?: string;
  age_of_property?: string;
  parking_spaces?: number;
  amenities: string[];
  unique_features: string[];
  main_image_url?: string;
  image_gallery: string[];
  floor_plan_images?: any[]; // Floor plan images array
  google_maps_url?: string;
  virtual_tour_url?: string;
  is_featured: boolean;
  status: string;
  agent_id?: string;
  created_at: string;
  updated_at: string;
  landowner_share: boolean;
  investor_share: boolean;
  is_resale: boolean;
}

export interface GoaProperty {
  id: string;
  title: string;
  slug?: string;
  seo_slug?: string;
  description: string;
  price: number;
  price_display?: string;
  property_type: string;  // Maps to 'type' in DB
  district: string;  // North Goa / South Goa (was 'region')
  location_area: string;  // Specific area (was 'location')
  bhk_config?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqft?: number;
  plot_area_sqm?: number;
  rental_yield_min?: number;
  rental_yield_max?: number;
  rental_income_monthly?: number;
  nearby_places?: any[];
  floor_plans?: any[];
  floor_plan_images?: any[]; // Floor plan images array
  investment_highlights?: any[];
  amenities: string[];
  unique_features: string[];
  hero_image_url?: string;  // Maps to 'main_image_url' for compatibility
  images: string[];  // Maps to 'image_gallery' for compatibility
  google_maps_url?: string;
  virtual_tour_url?: string;
  video_link?: string;
  is_featured: boolean;
  status: string;
  listing_type: string; // Sale, Rent, or Both
  project_name?: string;
  developer_name?: string;
  legal_status?: string;
  possession_status?: string;
  property_age?: string;
  description_main?: string;
  description_developer?: string;
  description_micromarket?: string;
  description_investment?: string;
  rich_description?: string;
  seo_title?: string;
  meta_description?: string;
  seo_keywords?: string[];
  agent_id?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  // Legacy compatibility fields
  main_image_url?: string;
  image_gallery?: string[];
  region?: string;
  location?: string;
}

export interface DubaiProperty {
  id: string;
  title: string;
  slug: string;
  seo_slug?: string;
  description: string;
  price: number;
  price_display: string;
  property_type: string;
  emirate: string;
  community: string;
  developer?: string;
  area_sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  completion_year?: number;
  handover_date?: string;
  payment_plans: any[];
  roi_percentage?: number;
  rental_yield?: number;
  service_charges_aed?: number;
  maintenance_sqft_aed?: number;
  dld_fees_included: boolean;
  building_name?: string;
  floor_number?: number;
  total_floors?: number;
  view_type?: string;
  amenities: string[];
  unique_features: string[];
  main_image_url?: string;
  image_gallery: string[];
  floor_plan_images?: any[]; // Floor plan images array
  google_maps_url?: string;
  virtual_tour_url?: string;
  is_featured: boolean;
  status: string;
  agent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyFilters {
  searchQuery?: string;
  propertyType?: string;
  landownerShare?: boolean;
  investorShare?: boolean;
  isResale?: boolean;
  priceRange?: string;
  bedrooms?: number;
  location?: string;
  sortBy?: string;
  isFeature?: boolean;
  communities?: string[];
  propertyTypes?: string[];
  bhkConfig?: number[];
  microMarkets?: string[];
  possessionStatus?: string;
  amenities?: string[];
}

class LocationPropertyService {
  // Hyderabad Properties
  async getHyderabadProperties(filters: PropertyFilters = {}): Promise<HyderabadProperty[]> {
    try {
      let query = supabase
        .from('hyderabad_properties')
        .select('*');

      // Apply filters
      if (filters.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,location.ilike.%${filters.searchQuery}%`);
      }

      if (filters.propertyType && filters.propertyType !== 'all') {
        query = query.eq('property_type', filters.propertyType);
      }

      if (filters.bedrooms && filters.bedrooms > 0) {
        query = query.eq('bedrooms', filters.bedrooms);
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters.priceRange) {
        const [min, max] = this.parsePriceRange(filters.priceRange);
        if (max) {
          query = query.gte('price', min).lte('price', max);
        } else {
          query = query.gte('price', min);
        }
      }

      if (filters.isFeature) {
        query = query.eq('is_featured', true);
      }

      if (filters.landownerShare) {
        query = query.eq('landowner_share', true);
      }

      if (filters.investorShare) {
        query = query.eq('investor_share', true);
      }

      if (filters.isResale) {
        query = query.eq('is_resale', true);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching Hyderabad properties:', error);
        return [];
      }

      return this.transformHyderabadProperties(data || []);
    } catch (error) {
      console.error('Error in getHyderabadProperties:', error);
      return [];
    }
  }

  async getHyderabadPropertyById(idOrSlug: string): Promise<HyderabadProperty | null> {
    try {
      // Check if it's a UUID format
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      
      let data = null;
      let error = null;

      if (isUUID) {
        // Search by ID
        const result = await supabase
          .from('hyderabad_properties')
          .select('*')
          .eq('id', idOrSlug)
          .maybeSingle();
        data = result.data;
        error = result.error;
      } else {
        // Try both seo_slug and slug in a single query for better performance
        const result = await supabase
          .from('hyderabad_properties')
          .select('*')
          .or(`seo_slug.eq.${idOrSlug},slug.eq.${idOrSlug}`)
          .eq('status', 'active')
          .maybeSingle();

        if (result.data) {
          data = result.data;
        } else {
          error = result.error;
          
          // If still not found, check redirects table
          if (!data && !error) {
            console.log('[getHyderabadPropertyById] Property not found by slug, checking redirects table...');
            const redirectResult = await supabase
              .from('property_slug_redirects')
              .select('new_slug')
              .eq('old_slug', idOrSlug)
              .eq('location', 'hyderabad')
              .maybeSingle();
            
            if (redirectResult.data?.new_slug) {
              console.log('[getHyderabadPropertyById] Redirect found, fetching property by new slug:', redirectResult.data.new_slug);
              // Fetch using the new slug
              const newSlugResult = await supabase
                .from('hyderabad_properties')
                .select('*')
                .or(`seo_slug.eq.${redirectResult.data.new_slug},slug.eq.${redirectResult.data.new_slug}`)
                .eq('status', 'active')
                .maybeSingle();
              
              if (newSlugResult.data) {
                data = newSlugResult.data;
              } else {
                error = newSlugResult.error;
              }
            }
          }
        }
      }

      if (error) {
        console.error('Error fetching Hyderabad property by ID:', error);
        return null;
      }

      if (!data) return null;

      const transformed = this.transformHyderabadProperties([data]);
      return transformed[0] || null;
    } catch (error) {
      console.error('Error in getHyderabadPropertyById:', error);
      return null;
    }
  }

  // Goa Properties
  async getGoaProperties(filters: PropertyFilters = {}): Promise<GoaProperty[]> {
    try {
      let query = supabase
        .from('goa_holiday_properties')
        .select('*')
        .eq('status', 'Active');

      // Apply filters similar to Hyderabad but with Goa-specific fields
      if (filters.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,location_area.ilike.%${filters.searchQuery}%`);
      }

      if (filters.propertyType && filters.propertyType !== 'all') {
        query = query.eq('type', filters.propertyType);
      }

      if (filters.bedrooms && filters.bedrooms > 0) {
        query = query.eq('bedrooms', filters.bedrooms);
      }

      if (filters.location) {
        query = query.eq('district', filters.location);
      }

      if (filters.priceRange) {
        const [min, max] = this.parsePriceRange(filters.priceRange);
        if (max) {
          query = query.gte('price', min).lte('price', max);
        } else {
          query = query.gte('price', min);
        }
      }

      if (filters.isFeature) {
        query = query.eq('is_featured', true);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching Goa properties:', error);
        return [];
      }

      return this.transformGoaProperties(data || []);
    } catch (error) {
      console.error('Error in getGoaProperties:', error);
      return [];
    }
  }

  async getGoaPropertyById(idOrSlug: string): Promise<GoaProperty | null> {
    try {
      // Check if it's a UUID format
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      
      let data = null;
      let error = null;

      if (isUUID) {
        // Search by ID
        const result = await supabase
          .from('goa_holiday_properties')
          .select('*')
          .eq('id', idOrSlug)
          .maybeSingle();
        data = result.data;
        error = result.error;
      } else {
        // Try seo_slug
        const seoResult = await supabase
          .from('goa_holiday_properties')
          .select('*')
          .eq('seo_slug', idOrSlug)
          .maybeSingle();

        data = seoResult.data;
        error = seoResult.error;
        
        // If not found, check redirects table
        if (!data) {
          console.log('Goa property not found by slug, checking redirects table...');
          const redirectResult = await supabase
            .from('property_slug_redirects')
            .select('new_slug')
            .eq('old_slug', idOrSlug)
            .eq('location', 'goa')
            .maybeSingle();
          
          if (redirectResult.data?.new_slug) {
            console.log('Redirect found, fetching property by new slug:', redirectResult.data.new_slug);
            const newSlugResult = await supabase
              .from('goa_holiday_properties')
              .select('*')
              .eq('seo_slug', redirectResult.data.new_slug)
              .maybeSingle();
            
            if (newSlugResult.data) {
              data = newSlugResult.data;
            }
          }
        }
      }

      if (error) {
        console.error('Error fetching Goa property by ID:', error);
        return null;
      }

      if (!data) return null;

      const transformed = this.transformGoaProperties([data]);
      return transformed[0] || null;
    } catch (error) {
      console.error('Error in getGoaPropertyById:', error);
      return null;
    }
  }

  // Dubai Properties
  async getDubaiProperties(filters: PropertyFilters = {}): Promise<DubaiProperty[]> {
    try {
      let query = supabase
        .from('dubai_properties')
        .select('*')
        .eq('status', 'active');

      // Apply filters with Dubai-specific fields
      if (filters.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,community.ilike.%${filters.searchQuery}%`);
      }

      if (filters.propertyType && filters.propertyType !== 'all') {
        query = query.eq('property_type', filters.propertyType);
      }

      if (filters.bedrooms && filters.bedrooms > 0) {
        query = query.eq('bedrooms', filters.bedrooms);
      }

      if (filters.location) {
        query = query.eq('emirate', filters.location);
      }

      if (filters.priceRange) {
        const [min, max] = this.parsePriceRange(filters.priceRange);
        if (max) {
          query = query.gte('price', min).lte('price', max);
        } else {
          query = query.gte('price', min);
        }
      }

      if (filters.isFeature) {
        query = query.eq('is_featured', true);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching Dubai properties:', error);
        return [];
      }

      return this.transformDubaiProperties(data || []);
    } catch (error) {
      console.error('Error in getDubaiProperties:', error);
      return [];
    }
  }

  async getDubaiPropertyById(idOrSlug: string): Promise<DubaiProperty | null> {
    try {
      // Check if it's a UUID format
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      
      let data = null;
      let error = null;

      if (isUUID) {
        // Search by ID
        const result = await supabase
          .from('dubai_properties')
          .select('*')
          .eq('id', idOrSlug)
          .maybeSingle();
        data = result.data;
        error = result.error;
      } else {
        // Try seo_slug first, then fallback to old slug
        const seoResult = await supabase
          .from('dubai_properties')
          .select('*')
          .eq('seo_slug', idOrSlug)
          .maybeSingle();

        if (seoResult.data) {
          data = seoResult.data;
        } else {
          // Fallback to old slug
          const slugResult = await supabase
            .from('dubai_properties')
            .select('*')
            .eq('slug', idOrSlug)
            .maybeSingle();
          data = slugResult.data;
          error = slugResult.error;
          
          // If still not found, check redirects table
          if (!data) {
            console.log('Dubai property not found by slug, checking redirects table...');
            const redirectResult = await supabase
              .from('property_slug_redirects')
              .select('new_slug')
              .eq('old_slug', idOrSlug)
              .eq('location', 'dubai')
              .maybeSingle();
            
            if (redirectResult.data?.new_slug) {
              console.log('Redirect found, fetching property by new slug:', redirectResult.data.new_slug);
              const newSlugResult = await supabase
                .from('dubai_properties')
                .select('*')
                .eq('seo_slug', redirectResult.data.new_slug)
                .maybeSingle();
              
              if (newSlugResult.data) {
                data = newSlugResult.data;
              }
            }
          }
        }
      }

      if (error) {
        console.error('Error fetching Dubai property by ID:', error);
        return null;
      }

      if (!data) return null;

      const transformed = this.transformDubaiProperties([data]);
      return transformed[0] || null;
    } catch (error) {
      console.error('Error in getDubaiPropertyById:', error);
      return null;
    }
  }

  // Lead submission
  async submitPropertyLead(leadData: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
    property_id?: string;
    property_location: string;
    property_type?: string;
    budget_range?: string;
    location_preference?: string;
    source_page?: string;
  }) {
    try {
      // Validate required fields
      if (!leadData.name || !leadData.email || !leadData.property_location) {
        console.error('❌ Validation failed: Missing required fields', {
          hasName: !!leadData.name,
          hasEmail: !!leadData.email,
          hasLocation: !!leadData.property_location
        });
        throw new Error('Missing required fields: name, email, or property_location');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(leadData.email)) {
        console.error('❌ Validation failed: Invalid email format', leadData.email);
        throw new Error('Invalid email format');
      }

      // Validate property_location is one of the allowed values
      const validLocations = ['hyderabad', 'goa', 'dubai'];
      const normalizedLocation = leadData.property_location.toLowerCase().trim();
      if (!validLocations.includes(normalizedLocation)) {
        console.error('❌ Validation failed: Invalid property_location', {
          provided: leadData.property_location,
          normalized: normalizedLocation,
          allowed: validLocations
        });
        throw new Error(`Invalid property_location: ${leadData.property_location}. Must be one of: ${validLocations.join(', ')}`);
      }

      // Prepare sanitized data for insertion
      const sanitizedData = {
        name: leadData.name.trim(),
        email: leadData.email.trim().toLowerCase(),
        phone: leadData.phone?.trim() || null,
        message: leadData.message?.trim() || null,
        property_id: leadData.property_id || null,
        property_location: normalizedLocation,
        property_type: leadData.property_type || null,
        budget_range: leadData.budget_range || null,
        location_preference: leadData.location_preference || null,
        source_page: leadData.source_page || 'unknown'
      };

      console.log('🔄 Submitting to Supabase property_leads table:', {
        ...sanitizedData,
        email: '***@***',  // Mask email in logs
        phone: '***'       // Mask phone in logs
      });

      const { error } = await supabase
        .from('property_leads')
        .insert(sanitizedData);

      if (error) {
        console.error('❌ Supabase error response:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ Lead submitted successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error in submitPropertyLead:', error);
      // Re-throw the original error so it can be caught in the UI
      throw error;
    }
  }

  // Helper methods
  private transformHyderabadProperties(data: any[]): HyderabadProperty[] {
    return data.map(item => ({
      ...item,
      amenities: Array.isArray(item.amenities) ? item.amenities : [],
      unique_features: Array.isArray(item.unique_features) ? item.unique_features : [],
      image_gallery: Array.isArray(item.image_gallery) ? item.image_gallery : [],
      floor_plan_images: Array.isArray(item.floor_plan_images) ? item.floor_plan_images : [],
      main_image_url: item.main_image_url || '/placeholder.svg',
      // Ensure nearby_landmarks is always an object
      nearby_landmarks: typeof item.nearby_landmarks === 'string' 
        ? (item.nearby_landmarks ? JSON.parse(item.nearby_landmarks) : {})
        : (item.nearby_landmarks || {}),
    }));
  }

  private transformGoaProperties(data: any[]): GoaProperty[] {
    return data.map(item => ({
      ...item,
      // Map new schema to old field names for compatibility
      property_type: item.type || item.property_type,
      district: item.district || item.region,
      location_area: item.location_area || item.location,
      // Backwards compatibility
      region: item.district || item.region,
      location: item.location_area || item.location,
      main_image_url: item.hero_image_url || item.main_image_url || '/placeholder.svg',
      hero_image_url: item.hero_image_url || item.main_image_url || '/placeholder.svg',
      image_gallery: Array.isArray(item.images) ? item.images : (Array.isArray(item.image_gallery) ? item.image_gallery : []),
      images: Array.isArray(item.images) ? item.images : (Array.isArray(item.image_gallery) ? item.image_gallery : []),
      amenities: Array.isArray(item.amenities) ? item.amenities : [],
      unique_features: Array.isArray(item.unique_features) ? item.unique_features : [],
      nearby_places: Array.isArray(item.nearby_places) ? item.nearby_places : [],
      floor_plans: Array.isArray(item.floor_plans) ? item.floor_plans : [],
      floor_plan_images: Array.isArray(item.floor_plan_images) ? item.floor_plan_images : [],
      investment_highlights: Array.isArray(item.investment_highlights) ? item.investment_highlights : [],
      seo_keywords: Array.isArray(item.seo_keywords) ? item.seo_keywords : [],
    }));
  }

  private transformDubaiProperties(data: any[]): DubaiProperty[] {
    return data.map(item => ({
      ...item,
      amenities: Array.isArray(item.amenities) ? item.amenities : [],
      unique_features: Array.isArray(item.unique_features) ? item.unique_features : [],
      image_gallery: Array.isArray(item.image_gallery) ? item.image_gallery : [],
      floor_plan_images: Array.isArray(item.floor_plan_images) ? item.floor_plan_images : [],
      payment_plans: Array.isArray(item.payment_plans) ? item.payment_plans : [],
      main_image_url: item.main_image_url || '/placeholder.svg',
    }));
  }

  private parsePriceRange(priceRange: string): [number, number | null] {
    switch (priceRange) {
      case '0-50L':
        return [0, 5000000];
      case '50L-1Cr':
        return [5000000, 10000000];
      case '1-2Cr':
        return [10000000, 20000000];
      case '2-5Cr':
        return [20000000, 50000000];
      case '5Cr+':
        return [50000000, null];
      default:
        return [0, null];
    }
  }

  formatPrice(price: number): string {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(0)} L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  }

  // Admin methods
  async getAllPropertiesForAdmin(): Promise<Array<(HyderabadProperty | DubaiProperty) & { location: string }>> {
    try {
      // Only load Hyderabad and Dubai - Goa is now in goa_holiday_properties
      const [hydProperties, dubaiProperties] = await Promise.all([
        this.getHyderabadProperties(),
        this.getDubaiProperties()
      ]);

      const hydWithLocation = hydProperties.map(p => ({ ...p, location: 'hyderabad' }));
      const dubaiWithLocation = dubaiProperties.map(p => ({ ...p, location: 'dubai' }));

      return [...hydWithLocation, ...dubaiWithLocation]
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } catch (error) {
      console.error('Error fetching all properties for admin:', error);
      return [];
    }
  }

  getPropertyLocation(property: any): 'hyderabad' | 'goa' | 'dubai' {
    if ('micro_market' in property) return 'hyderabad';
    if ('region' in property) return 'goa';
    if ('emirate' in property) return 'dubai';
    return 'hyderabad';
  }

  async deleteProperty(id: string, location: 'hyderabad' | 'goa' | 'dubai'): Promise<boolean> {
    try {
      const tableName = location === 'hyderabad' ? 'hyderabad_properties' 
        : location === 'goa' ? 'goa_holiday_properties' 
        : 'dubai_properties';

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting property:', error);
      return false;
    }
  }

  async getSimilarProperties(
    propertyId: string,
    location: 'hyderabad' | 'goa' | 'dubai',
    bedrooms?: number,
    price?: number,
    limit = 4
  ): Promise<any[]> {
    try {
      let query;
      
      if (location === 'hyderabad') {
        query = supabase
          .from('hyderabad_properties')
          .select('*')
          .eq('status', 'active')
          .neq('id', propertyId);
        
        if (bedrooms) {
          query = query.eq('bedrooms', bedrooms);
        }
        
        if (price) {
          const minPrice = price * 0.8;
          const maxPrice = price * 1.2;
          query = query.gte('price', minPrice).lte('price', maxPrice);
        }
      } else if (location === 'goa') {
        query = supabase
          .from('goa_holiday_properties')
          .select('*')
          .eq('status', 'Active')
          .neq('id', propertyId);
        
        if (bedrooms) {
          query = query.eq('bedrooms', bedrooms);
        }
        
        if (price) {
          const minPrice = price * 0.8;
          const maxPrice = price * 1.2;
          query = query.gte('price', minPrice).lte('price', maxPrice);
        }
      } else {
        query = supabase
          .from('dubai_properties')
          .select('*')
          .eq('status', 'active')
          .neq('id', propertyId);
        
        if (bedrooms) {
          query = query.eq('bedrooms', bedrooms);
        }
        
        if (price) {
          const minPrice = price * 0.8;
          const maxPrice = price * 1.2;
          query = query.gte('price', minPrice).lte('price', maxPrice);
        }
      }
      
      const { data, error } = await query.limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching similar properties:', error);
      return [];
    }
  }
}

export const locationPropertyService = new LocationPropertyService();
