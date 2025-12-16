
interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[];
  unit?: string;
  placeholder?: string;
  section: 'basic' | 'specifications' | 'features' | 'location' | 'commercial';
}

interface PropertyTypeConfig {
  type: string;
  fields: FieldConfig[];
  sections: string[];
}

// Comprehensive micromarkets list for consistency across the application
const MICRO_MARKETS = [
  'Gachibowli', 'Kokapet', 'Financial District', 'Hitech City', 'Madhapur', 
  'Kondapur', 'Miyapur', 'Kukatpally', 'Begumpet', 'Banjara Hills', 
  'Narsingi', 'Gandipet', 'Nallagandla', 'Tellapur', 'Kollur', 'Mokila', 
  'Jubilee Hills', 'Manchirevula', 'Khajaguda', 'Manikonda', 'Neopolis', 
  'Rajendranagar', 'Kismatpur'
];

class PropertyTypeService {
  private configs: Record<string, PropertyTypeConfig> = {
    'Apartment': {
      type: 'Apartment',
      sections: ['basic', 'specifications', 'features', 'location'],
      fields: [
        // Basic Information
        { name: 'title', label: 'Property Title', type: 'text', required: true, section: 'basic', placeholder: 'e.g., 3BHK Apartment in Kokapet' },
        { name: 'communityName', label: 'Project/Community Name', type: 'text', required: false, section: 'basic', placeholder: 'e.g., Phoenix Heights' },
        { name: 'bedrooms', label: 'Configuration', type: 'select', required: true, section: 'basic', options: ['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK+'] },
        { name: 'price', label: 'Asking Price', type: 'number', required: true, section: 'basic', unit: '₹' },
        
        // Specifications
        { name: 'area', label: 'Super Built-up Area', type: 'number', required: true, section: 'specifications', unit: 'sq.ft' },
        { name: 'carpetArea', label: 'Carpet Area', type: 'number', required: false, section: 'specifications', unit: 'sq.ft' },
        { name: 'floorNumber', label: 'Floor Number', type: 'text', required: false, section: 'specifications' },
        { name: 'totalFloors', label: 'Total Floors in Building', type: 'text', required: false, section: 'specifications' },
        { name: 'bathrooms', label: 'Number of Bathrooms', type: 'number', required: true, section: 'specifications' },
        { name: 'balconies', label: 'Number of Balconies', type: 'number', required: false, section: 'specifications' },
        { name: 'facing', label: 'Facing', type: 'select', required: false, section: 'specifications', options: ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'] },
        
        // Features
        { name: 'furnishedStatus', label: 'Furnishing Status', type: 'select', required: false, section: 'features', options: ['Unfurnished', 'Semi-furnished', 'Fully Furnished'] },
        { name: 'carParkings', label: 'Parking Available', type: 'number', required: false, section: 'features' },
        { name: 'ageOfProperty', label: 'Age of Property', type: 'select', required: false, section: 'features', options: ['Under Construction', '0-1 years', '1-5 years', '5-10 years', '10+ years'] },
        { name: 'maintenanceCharges', label: 'Maintenance Charges', type: 'number', required: false, section: 'features', unit: '₹/month' },
        { name: 'reraNumber', label: 'RERA Number', type: 'text', required: false, section: 'features' },
        
        // Location
        { name: 'microMarket', label: 'Micro Market', type: 'select', required: true, section: 'location', options: MICRO_MARKETS },
        { name: 'location', label: 'Full Address', type: 'text', required: false, section: 'location' }
      ]
    },
    
    'Villa': {
      type: 'Villa',
      sections: ['basic', 'specifications', 'features', 'location'],
      fields: [
        // Basic Information
        { name: 'title', label: 'Property Title', type: 'text', required: true, section: 'basic', placeholder: 'e.g., 4BHK Villa in Gachibowli' },
        { name: 'communityName', label: 'Project/Community Name', type: 'text', required: false, section: 'basic' },
        { name: 'bedrooms', label: 'Configuration', type: 'select', required: true, section: 'basic', options: ['3BHK', '4BHK', '5BHK+'] },
        { name: 'price', label: 'Asking Price', type: 'number', required: true, section: 'basic', unit: '₹' },
        
        // Specifications
        { name: 'plotArea', label: 'Plot Area', type: 'number', required: true, section: 'specifications', unit: 'sq.yds' },
        { name: 'area', label: 'Built-up Area', type: 'number', required: true, section: 'specifications', unit: 'sq.ft' },
        { name: 'villaType', label: 'Type', type: 'select', required: false, section: 'specifications', options: ['Simplex', 'Duplex', 'Triplex'] },
        { name: 'totalFloors', label: 'Number of Floors Constructed', type: 'text', required: false, section: 'specifications' },
        { name: 'bathrooms', label: 'Number of Bathrooms', type: 'number', required: true, section: 'specifications' },
        { name: 'facing', label: 'Facing', type: 'select', required: false, section: 'specifications', options: ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'] },
        
        // Features
        { name: 'carParkings', label: 'Parking Space', type: 'select', required: false, section: 'features', options: ['Covered', 'Open'] },
        { name: 'hasGarden', label: 'Lawn/Garden', type: 'select', required: false, section: 'features', options: ['Yes', 'No'] },
        { name: 'furnishedStatus', label: 'Furnishing Status', type: 'select', required: false, section: 'features', options: ['Unfurnished', 'Semi-furnished', 'Fully Furnished'] },
        { name: 'isGatedCommunity', label: 'Gated Community', type: 'select', required: false, section: 'features', options: ['Yes', 'No'] },
        { name: 'ageOfProperty', label: 'Age of Property', type: 'select', required: false, section: 'features', options: ['Under Construction', '0-1 years', '1-5 years', '5-10 years', '10+ years'] },
        { name: 'reraNumber', label: 'RERA Number', type: 'text', required: false, section: 'features' },
        
        // Location
        { name: 'microMarket', label: 'Micro Market', type: 'select', required: true, section: 'location', options: MICRO_MARKETS },
        { name: 'location', label: 'Full Address', type: 'text', required: false, section: 'location' }
      ]
    },
    
    'Commercial Property': {
      type: 'Commercial Property',
      sections: ['basic', 'specifications', 'commercial', 'location'],
      fields: [
        // Basic Information
        { name: 'title', label: 'Property Title', type: 'text', required: true, section: 'basic', placeholder: 'e.g., Office Space in Financial District' },
        { name: 'commercialSubtype', label: 'Subtype', type: 'select', required: true, section: 'basic', options: ['Office', 'Retail', 'Showroom', 'Standalone Building'] },
        { name: 'price', label: 'Expected Sale Price', type: 'number', required: true, section: 'basic', unit: '₹' },
        
        // Specifications
        { name: 'area', label: 'Super Built-up Area', type: 'number', required: true, section: 'specifications', unit: 'sq.ft' },
        { name: 'carpetArea', label: 'Carpet Area', type: 'number', required: false, section: 'specifications', unit: 'sq.ft' },
        { name: 'floorNumber', label: 'Floor Number', type: 'text', required: false, section: 'specifications' },
        { name: 'totalFloors', label: 'Total Floors', type: 'text', required: false, section: 'specifications' },
        { name: 'carParkings', label: 'Parking Availability', type: 'number', required: false, section: 'specifications' },
        { name: 'furnishedStatus', label: 'Furnishing', type: 'select', required: false, section: 'specifications', options: ['Bare Shell', 'Semi-Furnished', 'Fully-Furnished'] },
        
        // Commercial Specific
        { name: 'hasCurrentTenant', label: 'Current Tenant', type: 'select', required: false, section: 'commercial', options: ['Yes', 'No'] },
        { name: 'monthlyRental', label: 'Monthly Rental Income', type: 'number', required: false, section: 'commercial', unit: '₹/month' },
        { name: 'rentalYield', label: 'Rental Yield %', type: 'number', required: false, section: 'commercial', unit: '%' },
        { name: 'leaseTerms', label: 'Lease Terms / Lock-in Period', type: 'text', required: false, section: 'commercial' },
        { name: 'usageType', label: 'Usage Type', type: 'select', required: false, section: 'commercial', options: ['Retail', 'F&B', 'Clinic', 'Warehouse', 'Coworking', 'Others'] },
        { name: 'ageOfProperty', label: 'Age of Property', type: 'select', required: false, section: 'commercial', options: ['Under Construction', '0-1 years', '1-5 years', '5-10 years', '10+ years'] },
        { name: 'reraNumber', label: 'RERA Number', type: 'text', required: false, section: 'commercial' },
        
        // Location
        { name: 'microMarket', label: 'Micro Market', type: 'select', required: true, section: 'location', options: MICRO_MARKETS },
        { name: 'location', label: 'Full Address', type: 'text', required: false, section: 'location' }
      ]
    },
    
    'Plot': {
      type: 'Plot',
      sections: ['basic', 'specifications', 'features', 'location'],
      fields: [
        // Basic Information
        { name: 'title', label: 'Property Title', type: 'text', required: true, section: 'basic', placeholder: 'e.g., Residential Plot in Financial District' },
        { name: 'price', label: 'Total Price', type: 'number', required: true, section: 'basic', unit: '₹' },
        { name: 'pricePerSqYd', label: 'Price per sq.yd', type: 'number', required: false, section: 'basic', unit: '₹/sq.yd' },
        
        // Specifications
        { name: 'area', label: 'Total Area', type: 'number', required: true, section: 'specifications', unit: 'sq.yds' },
        { name: 'dimensions', label: 'Dimensions (Length x Width)', type: 'text', required: false, section: 'specifications', placeholder: 'e.g., 40 x 60 ft' },
        { name: 'facing', label: 'Facing', type: 'select', required: false, section: 'specifications', options: ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'] },
        { name: 'roadWidth', label: 'Road Width in Front', type: 'number', required: false, section: 'specifications', unit: 'ft' },
        
        // Features
        { name: 'isGatedLayout', label: 'Gated Layout', type: 'select', required: false, section: 'features', options: ['Yes', 'No'] },
        { name: 'isCornerPlot', label: 'Corner Plot', type: 'select', required: false, section: 'features', options: ['Yes', 'No'] },
        { name: 'hasWaterConnection', label: 'Water Connection', type: 'select', required: false, section: 'features', options: ['Yes', 'No'] },
        { name: 'hasElectricity', label: 'Electricity Available', type: 'select', required: false, section: 'features', options: ['Yes', 'No'] },
        { name: 'approvalType', label: 'Approval Type', type: 'select', required: false, section: 'features', options: ['DTCP', 'HMDA', 'Panchayat', 'RERA'] },
        { name: 'nearbyLandmarks', label: 'Nearby Landmarks', type: 'text', required: false, section: 'features' },
        
        // Location
        { name: 'microMarket', label: 'Micro Market', type: 'select', required: true, section: 'location', options: MICRO_MARKETS },
        { name: 'location', label: 'Full Address', type: 'text', required: false, section: 'location' }
      ]
    },
    
    'Open Land': {
      type: 'Open Land',
      sections: ['basic', 'specifications', 'features', 'location'],
      fields: [
        // Basic Information
        { name: 'title', label: 'Property Title', type: 'text', required: true, section: 'basic', placeholder: 'e.g., Agricultural Land near Shamshabad' },
        { name: 'landType', label: 'Type', type: 'select', required: true, section: 'basic', options: ['Agricultural', 'Farmhouse', 'Development Land'] },
        { name: 'price', label: 'Total Price', type: 'number', required: true, section: 'basic', unit: '₹' },
        { name: 'pricePerAcre', label: 'Price per acre', type: 'number', required: false, section: 'basic', unit: '₹/acre' },
        
        // Specifications
        { name: 'area', label: 'Total Land Area', type: 'number', required: true, section: 'specifications', unit: 'acres' },
        { name: 'areaInSqYds', label: 'Area in sq.yds', type: 'number', required: false, section: 'specifications', unit: 'sq.yds' },
        
        // Features
        { name: 'hasFencing', label: 'Fencing', type: 'select', required: false, section: 'features', options: ['Yes', 'No'] },
        { name: 'hasBorewell', label: 'Borewell Available', type: 'select', required: false, section: 'features', options: ['Yes', 'No'] },
        { name: 'hasElectricity', label: 'Electricity Available', type: 'select', required: false, section: 'features', options: ['Yes', 'No'] },
        { name: 'hasRoadAccess', label: 'Road Access', type: 'select', required: false, section: 'features', options: ['Yes', 'No'] },
        { name: 'nearbyVillages', label: 'Nearby Villages / Roads', type: 'text', required: false, section: 'features' },
        { name: 'approvalStatus', label: 'RERA or Local Approval', type: 'text', required: false, section: 'features' },
        
        // Location
        { name: 'microMarket', label: 'Micro Market', type: 'select', required: true, section: 'location', options: [...MICRO_MARKETS, 'Shamshabad', 'Outer Ring Road'] },
        { name: 'location', label: 'Full Address', type: 'text', required: false, section: 'location' }
      ]
    }
  };

  getConfigForType(propertyType: string): PropertyTypeConfig | null {
    return this.configs[propertyType] || null;
  }

  getAllPropertyTypes(): string[] {
    return Object.keys(this.configs);
  }

  getFieldsForSection(propertyType: string, section: string): FieldConfig[] {
    const config = this.getConfigForType(propertyType);
    if (!config) return [];
    return config.fields.filter(field => field.section === section);
  }

  getSectionsForType(propertyType: string): string[] {
    const config = this.getConfigForType(propertyType);
    return config?.sections || [];
  }

  // Export micromarkets for use in other components
  getMicroMarkets(): string[] {
    return MICRO_MARKETS;
  }
}

export const propertyTypeService = new PropertyTypeService();
export type { FieldConfig, PropertyTypeConfig };
