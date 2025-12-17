
interface PropertyData {
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
  project_name?: string;
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

interface PropertyFilter {
  searchQuery?: string;
  location?: string;
  propertyType?: string;
  bedrooms?: string;
  priceRange?: string;
  agentId?: string;
  status?: string;
}

class PropertyService {
  private properties: PropertyData[] = [];
  private nextId = 1;

  // Initialize service and load existing data
  init() {
    // Load existing properties from localStorage
    const storedProperties = localStorage.getItem('properties');
    const storedNextId = localStorage.getItem('nextPropertyId');
    
    if (storedProperties) {
      try {
        this.properties = JSON.parse(storedProperties);
        console.log('PropertyService: Loaded existing properties:', this.properties.length);
      } catch (error) {
        console.error('PropertyService: Error loading properties from localStorage:', error);
        this.properties = [];
      }
    }
    
    if (storedNextId) {
      this.nextId = parseInt(storedNextId, 10) || 1;
    }
    
    console.log('PropertyService: Initialized with', this.properties.length, 'properties, nextId:', this.nextId);
  }

  // Get all properties with optional filtering
  async getProperties(filters: PropertyFilter = {}): Promise<PropertyData[]> {
    let filteredProperties = [...this.properties];

    // Apply search query filter with improved logic
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filteredProperties = filteredProperties.filter(
        p => p.title.toLowerCase().includes(query) || 
             p.location.toLowerCase().includes(query) ||
             p.microMarket.toLowerCase().includes(query) ||
             p.description.toLowerCase().includes(query) ||
             p.bedrooms.toLowerCase().includes(query)
      );
    }

    // Apply location filter with exact microMarket matching
    if (filters.location && filters.location !== 'all') {
      const locationFilter = filters.location;
      filteredProperties = filteredProperties.filter(
        p => p.microMarket === locationFilter || (p.location && p.location.includes(locationFilter))
      );
    }

    if (filters.propertyType && filters.propertyType !== 'all') {
      filteredProperties = filteredProperties.filter(
        p => p.propertyType === filters.propertyType
      );
    }

    if (filters.bedrooms && filters.bedrooms !== 'all') {
      filteredProperties = filteredProperties.filter(
        p => p.bedrooms === filters.bedrooms
      );
    }

    if (filters.priceRange && filters.priceRange !== 'all') {
      filteredProperties = filteredProperties.filter(p => {
        const price = p.price / 100000; // Convert to lakhs
        switch (filters.priceRange) {
          case '0-50':
            return price < 50;
          case '50-100':
            return price >= 50 && price < 100;
          case '100-200':
            return price >= 100 && price < 200;
          case '200+':
            return price >= 200;
          default:
            return true;
        }
      });
    }

    if (filters.agentId) {
      filteredProperties = filteredProperties.filter(
        p => p.agentId === filters.agentId
      );
    }

    if (filters.status) {
      filteredProperties = filteredProperties.filter(
        p => p.status === filters.status
      );
    }

    console.log('PropertyService: getProperties called with filters:', filters);
    console.log('PropertyService: returning', filteredProperties.length, 'properties');
    return filteredProperties;
  }

  // Get featured properties
  async getFeaturedProperties(): Promise<PropertyData[]> {
    const featuredProperties = this.properties.filter(p => p.isFeatured && p.status === 'published');
    console.log('PropertyService: getFeaturedProperties returning', featuredProperties.length, 'properties');
    return featuredProperties;
  }

  // Get property by ID
  async getPropertyById(id: string): Promise<PropertyData | null> {
    const property = this.properties.find(p => p.id === id) || null;
    console.log('PropertyService: getPropertyById called for id:', id, 'returning:', property);
    return property;
  }

  // Add new property
  async addProperty(propertyData: Omit<PropertyData, 'id' | 'createdAt' | 'updatedAt'>): Promise<PropertyData> {
    const newProperty: PropertyData = {
      ...propertyData,
      // Set defaults for new fields if not provided
      floorNumber: propertyData.floorNumber || "",
      totalFloors: propertyData.totalFloors || "",
      carParkings: propertyData.carParkings || 1,
      facing: propertyData.facing || "",
      ageOfProperty: propertyData.ageOfProperty || "",
      uniqueUSPs: propertyData.uniqueUSPs || [],
      furnishedStatus: propertyData.furnishedStatus || "",
      communityName: propertyData.communityName || "",
      nearbyFacilities: propertyData.nearbyFacilities || [],
      accessibility: propertyData.accessibility || "",
      nearbyLandmarks: propertyData.nearbyLandmarks || "",
      isFeatured: propertyData.isFeatured || false,
      id: this.nextId.toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('PropertyService: Adding new property:', newProperty);
    
    this.properties.push(newProperty);
    this.nextId++;
    
    // Store in localStorage for persistence
    localStorage.setItem('properties', JSON.stringify(this.properties));
    localStorage.setItem('nextPropertyId', this.nextId.toString());
    
    console.log('PropertyService: Property added successfully. Total properties:', this.properties.length);
    return newProperty;
  }

  // Update property
  async updateProperty(id: string, updates: Partial<PropertyData>): Promise<PropertyData | null> {
    const index = this.properties.findIndex(p => p.id === id);
    if (index === -1) {
      console.log('PropertyService: Property not found for update, id:', id);
      return null;
    }

    this.properties[index] = {
      ...this.properties[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem('properties', JSON.stringify(this.properties));
    console.log('PropertyService: Property updated successfully:', this.properties[index]);
    return this.properties[index];
  }

  // Delete property
  async deleteProperty(id: string): Promise<boolean> {
    const index = this.properties.findIndex(p => p.id === id);
    if (index === -1) {
      console.log('PropertyService: Property not found for deletion, id:', id);
      return false;
    }

    this.properties.splice(index, 1);
    localStorage.setItem('properties', JSON.stringify(this.properties));
    console.log('PropertyService: Property deleted successfully. Total properties:', this.properties.length);
    return true;
  }
}

export const propertyService = new PropertyService();
export type { PropertyData, PropertyFilter };
