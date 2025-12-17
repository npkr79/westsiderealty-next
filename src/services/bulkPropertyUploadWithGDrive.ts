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
  floorNumber: string; // Column O - cleaner format (9, 12, 7, etc.)
  facing: string;
  parkings: number;
  price: number;
  priceDisplay: string;
  bedrooms: number;
  bathrooms: number;
  totalFloors: string;
  status: string;
  furnishingStatus: string;
  // Nearby landmarks
  school1Name: string;
  school1Distance: string;
  school2Name: string;
  school2Distance: string;
  hospital1Name: string;
  hospital1Distance: string;
  hospital2Name: string;
  hospital2Distance: string;
  mallName: string;
  mallDistance: string;
  itHubName: string;
  itHubDistance: string;
  orrExit: string;
  exitDistance: string;
  googleMapsUrl: string;
}

interface DriveFile {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
}

// Extract folder ID from Google Drive URL
function extractFolderId(url: string): string | null {
  const match = url.match(/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Clean project name for filename matching (remove spaces, special chars)
function cleanProjectName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

// Match images from Google Drive files - FLEXIBLE MATCHING
function matchImages(
  property: ExcelPropertyRow,
  driveFiles: DriveFile[]
): { mainImage: string; galleryImages: string[] } {
  const sNo = property.sNo;
  
  // DEBUG: Show ALL file names on first property
  if (sNo === 1 && driveFiles.length > 0) {
    console.log('========================================');
    console.log('GOOGLE DRIVE FILE NAMES (ALL FILES):');
    console.log('========================================');
    driveFiles.forEach((f, idx) => console.log(`${idx + 1}. ${f.name}`));
    console.log('========================================');
  }
  
  console.log(`[Matching] Looking for images for Property #${sNo}`);
  
  const matchedImages: { num: number; url: string }[] = [];
  
  // Try multiple matching strategies
  for (const file of driveFiles) {
    const fileName = file.name.toLowerCase();
    
    // Strategy 1: Match by S.No at the start (most flexible)
    // Pattern: "1-something-1.jpg", "1_something_1.jpg", "1 something 1.jpg"
    const sNoPattern = new RegExp(`^${sNo}[\\s_-].*?(\\d+)\\.(jpg|jpeg|png)$`, 'i');
    const match = fileName.match(sNoPattern);
    
    if (match) {
      const imageNum = parseInt(match[1]);
      matchedImages.push({ num: imageNum, url: file.url });
      console.log(`[Matching] ✓ Matched: ${file.name} → Image #${imageNum}`);
    }
  }
  
  // Sort by image number
  matchedImages.sort((a, b) => a.num - b.num);
  
  const mainImage = matchedImages.find(img => img.num === 1)?.url || '/images/placeholder-property.png';
  const galleryImages = matchedImages.filter(img => img.num > 1).map(img => img.url);
  
  console.log(`[Matching] Property #${sNo}: Main=${mainImage !== '/images/placeholder-property.png' ? '✓' : '✗'}, Gallery=${galleryImages.length}`);
  
  return { mainImage, galleryImages };
}

export const bulkUploadPropertiesWithGDrive = async (
  properties: ExcelPropertyRow[],
  gdriveFolderUrl: string
) => {
  let driveFiles: DriveFile[] = [];
  
  // Fetch images from Google Drive if URL provided
  if (gdriveFolderUrl) {
    try {
      const folderId = extractFolderId(gdriveFolderUrl);
      if (!folderId) {
        throw new Error("Invalid Google Drive folder URL");
      }
      
      console.log(`[GDrive] Fetching files from folder: ${folderId}`);
      
      const { data, error } = await supabase.functions.invoke('google-drive-list-files', {
        body: { folderId }
      });
      
      if (error) throw error;
      
      driveFiles = data.files || [];
      console.log(`[GDrive] Fetched ${driveFiles.length} files from Google Drive`);
    } catch (error) {
      console.error('[GDrive] Error fetching images:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch images from Google Drive: ${errorMessage}`);
    }
  }
  
  // Get default agent
  const { data: agents } = await supabase
    .from('agents')
    .select('id')
    .limit(1)
    .single();
  
  const defaultAgentId = agents?.id || '11111111-1111-1111-1111-111111111111';
  
  // Fetch existing slugs
  const { data: hydExisting } = await supabase.from('hyderabad_properties').select('seo_slug, slug');
  const existingSlugsHyd = hydExisting?.map(p => p.seo_slug || p.slug).filter(Boolean) || [];
  
  const hyderabadProperties = [];
  let imageMatchCount = 0;
  let noImageCount = 0;
  
  for (const prop of properties) {
    const city = prop.city.toLowerCase();
    
    if (city !== 'hyderabad') {
      console.warn(`[Upload] Skipping non-Hyderabad property: ${prop.sNo} (${city})`);
      continue;
    }
    
    // Match images from Google Drive
    const { mainImage, galleryImages } = matchImages(prop, driveFiles);
    
    if (mainImage !== '/images/placeholder-property.png') {
      imageMatchCount++;
    } else {
      noImageCount++;
    }
    
    // Determine property type
    let propertyType = 'Apartment';
    if (prop.propertyType.toLowerCase().includes('villa')) {
      propertyType = 'Villa';
    } else if (prop.propertyType.toLowerCase().includes('independent')) {
      propertyType = 'Independent House';
    }
    
    // Construct title
    const propertyTitle = `${prop.configuration} ${propertyType} for Sale in ${prop.projectName}, ${prop.location}`;
    
    // Generate unique slug
    let baseSlug = slugify(propertyTitle);
    const locationSlug = slugify(prop.location);
    if (!baseSlug.includes(locationSlug)) {
      baseSlug += `-${locationSlug}`;
    }
    const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugsHyd);
    existingSlugsHyd.push(uniqueSlug);
    
    // Build nearby landmarks object (NEW FORMAT for location advantages)
    const nearbyLandmarks: any = {};
    
    if (prop.school1Name) {
      nearbyLandmarks.school1_name = prop.school1Name;
      nearbyLandmarks.school1_distance = prop.school1Distance;
    }
    if (prop.school2Name) {
      nearbyLandmarks.school2_name = prop.school2Name;
      nearbyLandmarks.school2_distance = prop.school2Distance;
    }
    if (prop.hospital1Name) {
      nearbyLandmarks.hospital1_name = prop.hospital1Name;
      nearbyLandmarks.hospital1_distance = prop.hospital1Distance;
    }
    if (prop.hospital2Name) {
      nearbyLandmarks.hospital2_name = prop.hospital2Name;
      nearbyLandmarks.hospital2_distance = prop.hospital2Distance;
    }
    if (prop.mallName) {
      nearbyLandmarks.mall_name = prop.mallName;
      nearbyLandmarks.mall_distance = prop.mallDistance;
    }
    if (prop.itHubName) {
      nearbyLandmarks.it_hub_name = prop.itHubName;
      nearbyLandmarks.it_hub_distance = prop.itHubDistance;
    }
    if (prop.orrExit) {
      nearbyLandmarks.orr_exit_distance = prop.exitDistance;
    }
    
    hyderabadProperties.push({
      title: propertyTitle,
      slug: uniqueSlug,
      seo_slug: uniqueSlug,
      description: `${prop.configuration} ${propertyType} for sale in ${prop.projectName}, ${prop.location}. ${prop.sqft} sq.ft. on Floor ${prop.floorNumber} facing ${prop.facing} with ${prop.parkings} parking space(s). Total floors: ${prop.totalFloors}.`,
      price: Math.round(prop.price), // Already in rupees
      price_display: prop.priceDisplay,
      property_type: propertyType,
      location: prop.location,
      micro_market: prop.location,
      project_name: prop.projectName,
      bhk_config: prop.configuration,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      area_sqft: prop.sqft,
      floor_number: prop.floorNumber,
      total_floors: prop.totalFloors,
      facing: prop.facing,
      parking_spaces: prop.parkings,
      ownership_type: 'Resale',
      possession_status: 'Ready to Move',
      furnished_status: prop.furnishingStatus,
      main_image_url: mainImage,
      image_gallery: galleryImages,
      amenities: [
        'Swimming Pool', 'Gym', 'Clubhouse', 'Children Play Area', 
        'Landscaped Gardens', '24/7 Security', 'Power Backup', 
        'Covered Parking', 'Jogging Track', 'Indoor Games'
      ],
      unique_features: [],
      nearby_landmarks: nearbyLandmarks,
      google_maps_url: prop.googleMapsUrl,
      status: prop.status.toLowerCase(),
      agent_id: defaultAgentId,
    });
  }
  
  console.log(`[Upload] Prepared ${hyderabadProperties.length} properties`);
  console.log(`[Upload] Images matched: ${imageMatchCount}, No images: ${noImageCount}`);
  
  // Insert in batches of 20
  const batchSize = 20;
  let successCount = 0;
  let errorCount = 0;
  const errors: any[] = [];
  
  for (let i = 0; i < hyderabadProperties.length; i += batchSize) {
    const batch = hyderabadProperties.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('hyderabad_properties')
      .insert(batch)
      .select();
    
    if (error) {
      console.error(`[Upload] Batch ${i / batchSize + 1} error:`, error);
      errorCount += batch.length;
      errors.push({ batch: i / batchSize + 1, error });
    } else {
      successCount += data?.length || 0;
      console.log(`[Upload] Batch ${i / batchSize + 1} success: ${data?.length || 0} properties`);
    }
  }
  
  return {
    total: properties.length,
    hyderabadCount: hyderabadProperties.length,
    successCount,
    errorCount,
    errors,
    imageMatchCount,
    noImageCount,
  };
};
