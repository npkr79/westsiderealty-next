import { createClient } from '@/lib/supabase/server';


import { slugify, ensureUniqueSlug } from "@/utils/seoUrlGenerator";
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
  price: number;
}

export const bulkUploadProperties = async (properties: ExcelPropertyRow[], placeholderImageUrl: string) => {
  // Get the first agent to assign properties to
  const { data: agents } = await supabase
    .from('agents')
    .select('id')
    .limit(1)
    .single();
  
  const defaultAgentId = agents?.id || '11111111-1111-1111-1111-111111111111';
  
  // Fetch existing slugs for all tables upfront
  const { data: hydExisting } = await supabase.from('hyderabad_properties').select('seo_slug');
  const { data: goaExisting } = await supabase.from('goa_holiday_properties').select('seo_slug');
  const { data: dubaiExisting } = await supabase.from('dubai_properties').select('seo_slug');

  const existingSlugsHyd = hydExisting?.map(p => p.seo_slug).filter(Boolean) || [];
  const existingSlugsGoa = goaExisting?.map(p => p.seo_slug).filter(Boolean) || [];
  const existingSlugsDubai = dubaiExisting?.map(p => p.seo_slug).filter(Boolean) || [];
  
  const hyderabadProperties = [];
  const goaProperties = [];
  const dubaiProperties = [];
  
  for (const prop of properties) {
    const city = prop.city.toLowerCase();
    
    // Extract BHK from configuration (e.g., "3BHK" -> 3)
    const bhkMatch = prop.configuration.match(/(\d+)/);
    const bedrooms = bhkMatch ? parseInt(bhkMatch[1]) : 0;
    
    // Calculate bathrooms (typically bedrooms - 1 for smaller units, bedrooms for larger)
    const bathrooms = bedrooms <= 2 ? bedrooms : bedrooms - 1;
    
    // Determine property type
    let propertyType = 'Apartment';
    if (prop.propertyType.toLowerCase().includes('villa')) {
      propertyType = 'Villa';
    } else if (prop.propertyType.toLowerCase().includes('independent')) {
      propertyType = 'Independent House';
    }
    
    // Format price for display
    const priceInCr = prop.price;
    const priceDisplay = priceInCr >= 1 
      ? `₹${priceInCr.toFixed(2)} Cr`
      : `₹${(priceInCr * 100).toFixed(0)} L`;
    
    // Construct title from available data
    const propertyTitle = `${prop.configuration} in ${prop.projectName}, ${prop.location}`;
    
    // Determine which existing slugs array to use
    const relevantSlugs = city === 'hyderabad' ? existingSlugsHyd 
      : city === 'goa' ? existingSlugsGoa 
      : existingSlugsDubai;

    // Generate clean slug from title
    let baseSlug = slugify(propertyTitle);

    // Append location if not already in slug
    const locationSlug = slugify(prop.location);
    if (!baseSlug.includes(locationSlug)) {
      baseSlug += `-${locationSlug}`;
    }

    // Ensure uniqueness (only adds -1, -2 if collision, NOT timestamps)
    const uniqueSlug = ensureUniqueSlug(baseSlug, relevantSlugs);
    relevantSlugs.push(uniqueSlug); // Add to tracking array
    
    const basePropertyData = {
      title: propertyTitle,
      slug: uniqueSlug,
      seo_slug: uniqueSlug,
      description: `${prop.configuration} ${propertyType} for sale in ${prop.projectName}, ${prop.location}. ${prop.sqft} sq.ft. on ${prop.floor} facing ${prop.facing} with ${prop.parkings} parking space(s).`,
      price: Math.round(priceInCr * 10000000), // Convert Cr to rupees with rounding
      price_display: priceDisplay,
      property_type: propertyType,
      location: prop.location,
      bhk_config: prop.configuration,
      bedrooms,
      bathrooms,
      area_sqft: prop.sqft,
      floor_number: prop.floor,
      facing: prop.facing,
      parking_spaces: prop.parkings,
      main_image_url: placeholderImageUrl,
      image_gallery: [],
      amenities: [],
      unique_features: [],
      status: 'active',
      agent_id: defaultAgentId,
    };

    if (city === 'hyderabad') {
      hyderabadProperties.push({
        ...basePropertyData,
        micro_market: prop.location,
        ownership_type: 'Resale',
        possession_status: 'Ready to Move',
      });
    } else if (city === 'goa') {
      goaProperties.push({
        ...basePropertyData,
        region: prop.location,
      });
    } else if (city === 'dubai') {
      dubaiProperties.push({
        ...basePropertyData,
        emirate: 'Dubai',
        community: prop.location,
      });
    }
  }
  
  // Insert properties in batches of 20
  const batchSize = 20;
  let successCount = 0;
  let errorCount = 0;
  const errors: any[] = [];
  
  // Insert Hyderabad properties
  for (let i = 0; i < hyderabadProperties.length; i += batchSize) {
    const batch = hyderabadProperties.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('hyderabad_properties')
      .insert(batch)
      .select();
    
    if (error) {
      console.error('Hyderabad batch insert error:', error);
      errorCount += batch.length;
      errors.push({ city: 'Hyderabad', batch: i / batchSize + 1, error });
    } else {
      successCount += data?.length || 0;
    }
  }
  
  // Insert Goa properties
  for (let i = 0; i < goaProperties.length; i += batchSize) {
    const batch = goaProperties.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('goa_holiday_properties')
      .insert(batch)
      .select();
    
    if (error) {
      console.error('Goa batch insert error:', error);
      errorCount += batch.length;
      errors.push({ city: 'Goa', batch: i / batchSize + 1, error });
    } else {
      successCount += data?.length || 0;
    }
  }
  
  // Insert Dubai properties
  for (let i = 0; i < dubaiProperties.length; i += batchSize) {
    const batch = dubaiProperties.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('dubai_properties')
      .insert(batch)
      .select();
    
    if (error) {
      console.error('Dubai batch insert error:', error);
      errorCount += batch.length;
      errors.push({ city: 'Dubai', batch: i / batchSize + 1, error });
    } else {
      successCount += data?.length || 0;
    }
  }
  
  return {
    total: properties.length,
    hyderabadCount: hyderabadProperties.length,
    goaCount: goaProperties.length,
    dubaiCount: dubaiProperties.length,
    successCount,
    errorCount,
    errors,
  };
};
