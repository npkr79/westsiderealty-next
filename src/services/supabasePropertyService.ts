
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();


export interface PropertyData {
  id?: string;
  title: string;
  description: string;
  propertyType: string;
  price: number;
  area: number;
  bedrooms: string;
  bathrooms: string;
  floorNumber?: string;
  totalFloors?: string;
  carParkings?: number;
  facing?: string;
  ageOfProperty?: string;
  uniqueUSPs?: string[];
  furnishedStatus?: string;
  communityName?: string;
  location: string;
  microMarket: string;
  nearbyFacilities?: string[];
  accessibility?: string;
  nearbyLandmarks?: string;
  amenities: string[];
  status: 'draft' | 'published' | 'inactive';
  agentId: string;
  images: string[];
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PropertyFilter {
  searchQuery?: string;
  location?: string;
  propertyType?: string;
  bedrooms?: string;
  priceRange?: string;
  agentId?: string;
  status?: string;
}

class SupabasePropertyService {
  // Get all properties with optional filtering
  async getProperties(filters: PropertyFilter = {}): Promise<PropertyData[]> {
    try {
      let query = supabase.from('properties').select('*');

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      } else {
        // Default to published for public viewing
        query = query.eq('status', 'published');
      }

      if (filters.agentId) {
        query = query.eq('agent_id', filters.agentId);
      }

      if (filters.propertyType && filters.propertyType !== 'all') {
        query = query.eq('type', filters.propertyType);
      }

      if (filters.bedrooms && filters.bedrooms !== 'all') {
        query = query.eq('bedrooms', parseInt(filters.bedrooms));
      }

      if (filters.location && filters.location !== 'all') {
        query = query.or(`location.ilike.%${filters.location}%,micro_market.ilike.%${filters.location}%`);
      }

      if (filters.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,location.ilike.%${filters.searchQuery}%`);
      }

      if (filters.priceRange && filters.priceRange !== 'all') {
        const [min, max] = this.parsePriceRange(filters.priceRange);
        if (max) {
          query = query.gte('price', min).lte('price', max);
        } else {
          query = query.gte('price', min);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching properties:', error);
        return [];
      }

      return this.transformSupabaseToPropertyData(data || []);
    } catch (error) {
      console.error('Error in getProperties:', error);
      return [];
    }
  }

  // Get featured properties
  async getFeaturedProperties(): Promise<PropertyData[]> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_featured', true)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching featured properties:', error);
        return [];
      }

      return this.transformSupabaseToPropertyData(data || []);
    } catch (error) {
      console.error('Error in getFeaturedProperties:', error);
      return [];
    }
  }

  // Get property by ID
  async getPropertyById(id: string): Promise<PropertyData | null> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching property by ID:', error);
        return null;
      }

      const transformed = this.transformSupabaseToPropertyData([data]);
      return transformed[0] || null;
    } catch (error) {
      console.error('Error in getPropertyById:', error);
      return null;
    }
  }

  // Add new property
  async addProperty(propertyData: Omit<PropertyData, 'id' | 'createdAt' | 'updatedAt'>): Promise<PropertyData> {
    try {
      const supabaseData = this.transformPropertyDataToSupabase(propertyData);
      
      const { data, error } = await supabase
        .from('properties')
        .insert([supabaseData])
        .select()
        .single();

      if (error) {
        console.error('Error adding property:', error);
        throw error;
      }

      const transformed = this.transformSupabaseToPropertyData([data]);
      return transformed[0];
    } catch (error) {
      console.error('Error in addProperty:', error);
      throw error;
    }
  }

  // Update property
  async updateProperty(id: string, updates: Partial<PropertyData>): Promise<PropertyData | null> {
    try {
      const supabaseUpdates = this.transformPropertyDataToSupabase(updates);
      
      const { data, error } = await supabase
        .from('properties')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating property:', error);
        return null;
      }

      const transformed = this.transformSupabaseToPropertyData([data]);
      return transformed[0];
    } catch (error) {
      console.error('Error in updateProperty:', error);
      return null;
    }
  }

  // Delete property
  async deleteProperty(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting property:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteProperty:', error);
      return false;
    }
  }

  // Transform Supabase data to PropertyData format
  private transformSupabaseToPropertyData(supabaseData: any[]): PropertyData[] {
    return supabaseData.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      propertyType: item.type,
      price: item.price,
      area: item.square_feet,
      bedrooms: item.bedrooms.toString(),
      bathrooms: item.bathrooms.toString(),
      floorNumber: item.floor_number,
      totalFloors: item.total_floors,
      carParkings: item.car_parkings || 1,
      facing: item.facing,
      ageOfProperty: item.age_of_property,
      uniqueUSPs: item.unique_usps || [],
      furnishedStatus: item.furnished_status,
      communityName: item.community_name,
      location: item.location,
      microMarket: item.micro_market || item.area,
      nearbyFacilities: item.nearby_facilities || [],
      accessibility: item.accessibility,
      nearbyLandmarks: item.nearby_landmarks,
      amenities: item.amenities || [],
      status: item.status || 'published',
      agentId: item.agent_id,
      images: item.images || [item.image_url].filter(Boolean),
      isFeatured: item.is_featured,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  }

  // Transform PropertyData to Supabase format
  private transformPropertyDataToSupabase(propertyData: Partial<PropertyData>): any {
    const supabaseData: any = {};

    if (propertyData.title) supabaseData.title = propertyData.title;
    if (propertyData.description) supabaseData.description = propertyData.description;
    if (propertyData.propertyType) supabaseData.type = propertyData.propertyType;
    if (propertyData.price !== undefined) supabaseData.price = propertyData.price;
    if (propertyData.area !== undefined) supabaseData.square_feet = propertyData.area;
    if (propertyData.bedrooms) supabaseData.bedrooms = parseInt(propertyData.bedrooms);
    if (propertyData.bathrooms) supabaseData.bathrooms = parseInt(propertyData.bathrooms);
    if (propertyData.location) supabaseData.location = propertyData.location;
    if (propertyData.microMarket) supabaseData.micro_market = propertyData.microMarket;
    if (propertyData.status) supabaseData.status = propertyData.status;
    if (propertyData.agentId) supabaseData.agent_id = propertyData.agentId;
    if (propertyData.isFeatured !== undefined) supabaseData.is_featured = propertyData.isFeatured;
    
    // Handle optional fields
    if (propertyData.floorNumber) supabaseData.floor_number = propertyData.floorNumber;
    if (propertyData.totalFloors) supabaseData.total_floors = propertyData.totalFloors;
    if (propertyData.carParkings) supabaseData.car_parkings = propertyData.carParkings;
    if (propertyData.facing) supabaseData.facing = propertyData.facing;
    if (propertyData.ageOfProperty) supabaseData.age_of_property = propertyData.ageOfProperty;
    if (propertyData.furnishedStatus) supabaseData.furnished_status = propertyData.furnishedStatus;
    if (propertyData.communityName) supabaseData.community_name = propertyData.communityName;
    if (propertyData.accessibility) supabaseData.accessibility = propertyData.accessibility;
    if (propertyData.nearbyLandmarks) supabaseData.nearby_landmarks = propertyData.nearbyLandmarks;
    
    // Handle JSON fields
    if (propertyData.uniqueUSPs) supabaseData.unique_usps = propertyData.uniqueUSPs;
    if (propertyData.nearbyFacilities) supabaseData.nearby_facilities = propertyData.nearbyFacilities;
    if (propertyData.amenities) supabaseData.amenities = propertyData.amenities;
    if (propertyData.images) {
      supabaseData.images = propertyData.images;
      // Also set the main image_url for backward compatibility
      if (propertyData.images.length > 0) {
        supabaseData.image_url = propertyData.images[0];
      }
    }

    return supabaseData;
  }

  // Parse price range filter
  private parsePriceRange(priceRange: string): [number, number | null] {
    switch (priceRange) {
      case '0-50':
        return [0, 5000000]; // 0 to 50 lakhs
      case '50-100':
        return [5000000, 10000000]; // 50 to 100 lakhs
      case '100-200':
        return [10000000, 20000000]; // 100 to 200 lakhs
      case '200+':
        return [20000000, null]; // 200+ lakhs
      default:
        return [0, null];
    }
  }
}

export const supabasePropertyService = new SupabasePropertyService();
export type { PropertyData as SupabasePropertyData, PropertyFilter as SupabasePropertyFilter };
