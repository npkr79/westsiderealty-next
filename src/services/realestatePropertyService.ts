import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();


export interface RealEstateProperty {
  id: string;
  title: string;
  price: number;
  sq_ft: number;
  bedrooms: number;
  bathrooms: number;
  facing?: string;
  status: string;
  description: string;
  amenities: string[];
  location_map_url?: string;
  main_image_url: string;
  image_gallery_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface PropertyFilters {
  searchQuery?: string;
  location?: string;
  propertyType?: string;
  bedrooms?: number;
  priceRange?: string;
  status?: string;
}

class RealEstatePropertyService {
  async getProperties(filters: PropertyFilters = {}): Promise<RealEstateProperty[]> {
    try {
      let query = supabase
        .from('properties')
        .select('*');

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,area.ilike.%${filters.searchQuery}%`);
      }

      if (filters.bedrooms && filters.bedrooms > 0) {
        query = query.eq('bedrooms', filters.bedrooms);
      }

      if (filters.priceRange) {
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

      return this.transformToRealEstateProperty(data || []);
    } catch (error) {
      console.error('Error in getProperties:', error);
      return [];
    }
  }

  async getPropertyById(id: string): Promise<RealEstateProperty | null> {
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

      const transformed = this.transformToRealEstateProperty([data]);
      return transformed[0] || null;
    } catch (error) {
      console.error('Error in getPropertyById:', error);
      return null;
    }
  }

  async createProperty(propertyData: Partial<RealEstateProperty>): Promise<RealEstateProperty | null> {
    try {
      // Generate slug from title
      const slug = propertyData.title?.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() || 'property';

      const { data, error } = await supabase
        .from('properties')
        .insert({
          title: propertyData.title || '',
          slug: slug,
          price: propertyData.price || 0,
          square_feet: propertyData.sq_ft || 0,
          bedrooms: propertyData.bedrooms || 0,
          bathrooms: propertyData.bathrooms || 0,
          facing: propertyData.facing,
          status: propertyData.status || 'available',
          description: propertyData.description || '',
          amenities: propertyData.amenities || [],
          image_url: propertyData.main_image_url || '',
          images: propertyData.image_gallery_urls || [],
          location: 'Hyderabad', // Default location
          area: `${propertyData.sq_ft || 0} sq ft`,
          type: 'Apartment', // Default type
          price_display: this.formatPrice(propertyData.price || 0)
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating property:', error);
        return null;
      }

      const transformed = this.transformToRealEstateProperty([data]);
      return transformed[0] || null;
    } catch (error) {
      console.error('Error in createProperty:', error);
      return null;
    }
  }

  async updateProperty(id: string, propertyData: Partial<RealEstateProperty>): Promise<RealEstateProperty | null> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .update({
          title: propertyData.title,
          price: propertyData.price,
          square_feet: propertyData.sq_ft,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          facing: propertyData.facing,
          status: propertyData.status,
          description: propertyData.description,
          amenities: propertyData.amenities || [],
          image_url: propertyData.main_image_url,
          images: propertyData.image_gallery_urls || [],
          price_display: this.formatPrice(propertyData.price || 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating property:', error);
        return null;
      }

      const transformed = this.transformToRealEstateProperty([data]);
      return transformed[0] || null;
    } catch (error) {
      console.error('Error in updateProperty:', error);
      return null;
    }
  }

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

  private transformToRealEstateProperty(data: any[]): RealEstateProperty[] {
    return data.map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      sq_ft: item.square_feet || 0,
      bedrooms: item.bedrooms,
      bathrooms: item.bathrooms,
      facing: item.facing,
      status: item.status || 'available',
      description: item.description || '',
      amenities: Array.isArray(item.amenities) ? item.amenities : [],
      location_map_url: item.location_map_url,
      main_image_url: item.image_url || '/placeholder.svg',
      image_gallery_urls: Array.isArray(item.images) ? item.images : [],
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  }

  private parsePriceRange(priceRange: string): [number, number | null] {
    switch (priceRange) {
      case '0-1cr':
        return [0, 10000000]; // 0 to 1 crore
      case '1-2cr':
        return [10000000, 20000000]; // 1 to 2 crore
      case '2-5cr':
        return [20000000, 50000000]; // 2 to 5 crore
      case '5cr+':
        return [50000000, null]; // 5+ crore
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
}

export const realEstatePropertyService = new RealEstatePropertyService();
