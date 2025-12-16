import { createClient } from '@/lib/supabase/server';


import { locationPropertyService } from "./locationPropertyService";
const supabase = await createClient();

interface ExcelPropertyRow {
  sNo: number;
  city: string;
  location: string;
  projectName: string;
  propertyType: string;
  configuration: string;
  sqft: number;
  floor: string;
  facing: string;
  parkings: number;
  priceDisplay: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  floorNumber: number | string;
  totalFloors: number | string;
  status: string;
  furnishingStatus: string;
  school1Name?: string;
  school1Distance?: string;
  school2Name?: string;
  school2Distance?: string;
  hospital1Name?: string;
  hospital1Distance?: string;
  hospital2Name?: string;
  hospital2Distance?: string;
  mallName?: string;
  mallDistance?: string;
  itHubName?: string;
  itHubDistance?: string;
  orrExitDistance?: string;
  exitDistance?: string;
  description: string;
  googleMapsUrl?: string;
}

// Default amenities to assign to all properties
const DEFAULT_AMENITIES = [
  "Gated Community",
  "Swimming Pool",
  "24x7 Water Supply",
  "Power Backup",
  "Clubhouse",
  "Covered Parking",
  "Gymnasium",
  "Yoga/Meditation Area",
  "Outdoor Seating Area",
  "Children Play Area",
  "24/7 Security",
  "Maintenance Staff",
  "Elevators/Lifts",
  "Service Lift"
];

export const bulkUploadUpdateProperties = async (properties: ExcelPropertyRow[], placeholderImageUrl: string) => {
  // Get the first agent to assign properties to
  const { data: agents } = await supabase
    .from('agents')
    .select('id')
    .limit(1)
    .single();
  
  const defaultAgentId = agents?.id || '11111111-1111-1111-1111-111111111111';
  
  const hyderabadProperties = [];
  const goaProperties = [];
  const dubaiProperties = [];
  
  let updateCount = 0;
  let insertCount = 0;
  let errorCount = 0;
  const errors: any[] = [];
  
  for (const prop of properties) {
    const city = prop.city.toLowerCase();
    
    // Generate Property_ID as unique identifier (S.No + Project + Config + Floor)
    const propertyId = `${prop.sNo}-${prop.projectName.replace(/\s+/g, '-')}-${prop.configuration}-${prop.floorNumber}`.toLowerCase();
    
    // Generate slug from project name, configuration, and location
    const slug = `${prop.projectName.toLowerCase()}-${prop.configuration.toLowerCase()}-${prop.location.toLowerCase()}-${prop.floorNumber}`
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    // Build nearby landmarks object with LocationDetails format
    const nearbyLandmarks: any = {};
    
    if (prop.school1Name && prop.school1Distance) {
      nearbyLandmarks.school1_name = prop.school1Name;
      nearbyLandmarks.school1_distance = prop.school1Distance;
    }
    if (prop.school2Name && prop.school2Distance) {
      nearbyLandmarks.school2_name = prop.school2Name;
      nearbyLandmarks.school2_distance = prop.school2Distance;
    }
    if (prop.hospital1Name && prop.hospital1Distance) {
      nearbyLandmarks.hospital1_name = prop.hospital1Name;
      nearbyLandmarks.hospital1_distance = prop.hospital1Distance;
    }
    if (prop.hospital2Name && prop.hospital2Distance) {
      nearbyLandmarks.hospital2_name = prop.hospital2Name;
      nearbyLandmarks.hospital2_distance = prop.hospital2Distance;
    }
    if (prop.mallName && prop.mallDistance) {
      nearbyLandmarks.mall_name = prop.mallName;
      nearbyLandmarks.mall_distance = prop.mallDistance;
    }
    if (prop.itHubName && prop.itHubDistance) {
      nearbyLandmarks.it_hub_name = prop.itHubName;
      nearbyLandmarks.it_hub_distance = prop.itHubDistance;
    }
    if (prop.orrExitDistance && prop.exitDistance) {
      nearbyLandmarks.orr_exit_distance = prop.exitDistance;
    }
    
    const basePropertyData = {
      title: `${prop.configuration} in ${prop.projectName}, ${prop.location}`,
      slug,
      description: prop.description || `${prop.configuration} ${prop.propertyType} for sale in ${prop.projectName}, ${prop.location}. ${prop.sqft} sq.ft. on ${prop.floor} facing ${prop.facing} with ${prop.parkings} parking space(s).`,
      price: prop.price,
      price_display: locationPropertyService.formatPrice(prop.price),
      property_type: prop.propertyType,
      location: prop.location,
      bhk_config: prop.configuration,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      area_sqft: prop.sqft,
      floor_number: String(prop.floorNumber),
      facing: prop.facing,
      parking_spaces: prop.parkings,
      main_image_url: placeholderImageUrl,
      image_gallery: [],
      amenities: DEFAULT_AMENITIES, // Assign default amenities
      unique_features: [],
      status: prop.status.toLowerCase() || 'active',
      agent_id: defaultAgentId,
      google_maps_url: prop.googleMapsUrl || '',
      nearby_landmarks: nearbyLandmarks,
      furnished_status: prop.furnishingStatus || 'Unfurnished',
      total_floors: String(prop.totalFloors),
    };

    if (city === 'hyderabad') {
      hyderabadProperties.push({
        ...basePropertyData,
        micro_market: prop.location,
        ownership_type: 'Resale',
        possession_status: 'Ready to Move',
        property_id: propertyId,
      });
    } else if (city === 'goa') {
      // Map to goa_holiday_properties structure
      goaProperties.push({
        title: basePropertyData.title,
        type: basePropertyData.property_type,
        listing_type: 'Sale',
        location_area: basePropertyData.location,
        district: prop.location,
        price: basePropertyData.price,
        price_display: basePropertyData.price_display,
        bedrooms: basePropertyData.bedrooms,
        bathrooms: basePropertyData.bathrooms,
        area_sqft: basePropertyData.area_sqft,
        description: basePropertyData.description,
        seo_slug: slug,
        images: basePropertyData.image_gallery,
        hero_image_url: basePropertyData.main_image_url,
        amenities: basePropertyData.amenities,
        unique_features: basePropertyData.unique_features,
        status: 'Active',
        google_maps_url: basePropertyData.google_maps_url,
        bhk_config: basePropertyData.bhk_config,
        property_id: propertyId,
      });
    } else if (city === 'dubai') {
      dubaiProperties.push({
        ...basePropertyData,
        emirate: 'Dubai',
        community: prop.location,
        property_id: propertyId,
      });
    }
  }
  
  // Process Hyderabad properties
  for (const prop of hyderabadProperties) {
    const propertyId = prop.property_id;
    delete prop.property_id; // Remove before insert/update
    
    try {
      // Check if property exists
      const { data: existing } = await supabase
        .from('hyderabad_properties')
        .select('id')
        .eq('slug', prop.slug)
        .maybeSingle();
      
      if (existing) {
        // Update existing property
        const { error } = await supabase
          .from('hyderabad_properties')
          .update(prop)
          .eq('id', existing.id);
        
        if (error) {
          console.error('Hyderabad update error:', error);
          errorCount++;
          errors.push({ city: 'Hyderabad', propertyId, action: 'update', error });
        } else {
          updateCount++;
        }
      } else {
        // Insert new property
        const { error } = await supabase
          .from('hyderabad_properties')
          .insert(prop);
        
        if (error) {
          console.error('Hyderabad insert error:', error);
          errorCount++;
          errors.push({ city: 'Hyderabad', propertyId, action: 'insert', error });
        } else {
          insertCount++;
        }
      }
    } catch (error) {
      console.error('Hyderabad processing error:', error);
      errorCount++;
      errors.push({ city: 'Hyderabad', propertyId, error });
    }
  }
  
  // Process Goa properties
  for (const prop of goaProperties) {
    const propertyId = prop.property_id;
    delete (prop as any).property_id;
    
    try {
      const { data: existing } = await supabase
        .from('goa_holiday_properties')
        .select('id')
        .eq('seo_slug', prop.seo_slug)
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from('goa_holiday_properties')
          .update(prop as any)
          .eq('id', existing.id);
        
        if (error) {
          console.error('Goa update error:', error);
          errorCount++;
          errors.push({ city: 'Goa', propertyId, action: 'update', error });
        } else {
          updateCount++;
        }
      } else {
        const { error } = await supabase
          .from('goa_holiday_properties')
          .insert(prop as any);
        
        if (error) {
          console.error('Goa insert error:', error);
          errorCount++;
          errors.push({ city: 'Goa', propertyId, action: 'insert', error });
        } else {
          insertCount++;
        }
      }
    } catch (error) {
      console.error('Goa processing error:', error);
      errorCount++;
      errors.push({ city: 'Goa', propertyId, error });
    }
  }
  
  // Process Dubai properties
  for (const prop of dubaiProperties) {
    const propertyId = prop.property_id;
    delete prop.property_id;
    
    try {
      const { data: existing } = await supabase
        .from('dubai_properties')
        .select('id')
        .eq('slug', prop.slug)
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from('dubai_properties')
          .update(prop)
          .eq('id', existing.id);
        
        if (error) {
          console.error('Dubai update error:', error);
          errorCount++;
          errors.push({ city: 'Dubai', propertyId, action: 'update', error });
        } else {
          updateCount++;
        }
      } else {
        const { error } = await supabase
          .from('dubai_properties')
          .insert(prop);
        
        if (error) {
          console.error('Dubai insert error:', error);
          errorCount++;
          errors.push({ city: 'Dubai', propertyId, action: 'insert', error });
        } else {
          insertCount++;
        }
      }
    } catch (error) {
      console.error('Dubai processing error:', error);
      errorCount++;
      errors.push({ city: 'Dubai', propertyId, error });
    }
  }
  
  return {
    total: properties.length,
    hyderabadCount: hyderabadProperties.length,
    goaCount: goaProperties.length,
    dubaiCount: dubaiProperties.length,
    updateCount,
    insertCount,
    errorCount,
    errors,
  };
};
