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
  floorNumber: string;
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

// Match images from Google Drive files
function matchImages(
  property: ExcelPropertyRow,
  driveFiles: DriveFile[]
): { mainImage: string; galleryImages: string[] } {
  const sNo = property.sNo;
  
  // DEBUG: Show ALL file names on first property
  if (sNo === 1 && driveFiles.length > 0) {
    console.log('========================================');
    console.log('GOOGLE DRIVE FILE NAMES (ALL):');
    console.log('========================================');
    driveFiles.forEach((f, idx) => console.log(`${idx + 1}. "${f.name}"`));
    console.log('========================================');
  }
  
  console.log(`[Matching] Looking for images for Property #${sNo}`);
  
  const matchedImages: { num: number; url: string }[] = [];
  
  // Try multiple matching patterns
  for (const file of driveFiles) {
    const fileName = file.name;
    
    // Pattern 1: "1-ProjectName-Config-Floor-1.jpg" or "1_ProjectName_Config_Floor_1.jpg"
    const pattern1 = new RegExp(`^${sNo}[\\s_-].*?[\\s_-](\\d+)\\.(jpg|jpeg|png)$`, 'i');
    const match1 = fileName.match(pattern1);
    
    if (match1) {
      const imageNum = parseInt(match1[1]);
      matchedImages.push({ num: imageNum, url: file.url });
      console.log(`[Matching] ✓ Pattern1 Matched: "${file.name}" → Image #${imageNum}`);
      continue;
    }
    
    // Pattern 2: "1-1.jpg", "1-2.jpg" (simple S.No-ImageNo format)
    const pattern2 = new RegExp(`^${sNo}[\\s_-](\\d+)\\.(jpg|jpeg|png)$`, 'i');
    const match2 = fileName.match(pattern2);
    
    if (match2) {
      const imageNum = parseInt(match2[1]);
      matchedImages.push({ num: imageNum, url: file.url });
      console.log(`[Matching] ✓ Pattern2 Matched: "${file.name}" → Image #${imageNum}`);
      continue;
    }
    
    // Pattern 3: File contains "S.No X" or "Property X" and ends with number
    const pattern3 = new RegExp(`(?:s\\.?no\\.?|property)\\s*${sNo}.*?(\\d+)\\.(jpg|jpeg|png)$`, 'i');
    const match3 = fileName.match(pattern3);
    
    if (match3) {
      const imageNum = parseInt(match3[1]);
      matchedImages.push({ num: imageNum, url: file.url });
      console.log(`[Matching] ✓ Pattern3 Matched: "${file.name}" → Image #${imageNum}`);
    }
  }
  
  // Sort by image number
  matchedImages.sort((a, b) => a.num - b.num);
  
  const mainImage = matchedImages.find(img => img.num === 1)?.url || '/images/placeholder-property.png';
  const galleryImages = matchedImages.filter(img => img.num > 1).map(img => img.url);
  
  console.log(`[Matching] Property #${sNo}: Main=${mainImage !== '/images/placeholder-property.png' ? '✓ FOUND' : '✗ NOT FOUND'}, Gallery=${galleryImages.length} images`);
  
  if (matchedImages.length === 0 && sNo <= 3) {
    console.warn(`[Matching] ⚠️ NO MATCHES for Property #${sNo}. Sample file names:`, driveFiles.slice(0, 5).map(f => f.name));
  }
  
  return { mainImage, galleryImages };
}

export const bulkUpdatePropertiesWithGDrive = async (
  properties: ExcelPropertyRow[],
  gdriveFolderUrl: string
) => {
  let driveFiles: DriveFile[] = [];
  
  // Fetch images from Google Drive
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
      
      if (error) {
        console.error('[GDrive] Error response:', error);
        throw error;
      }
      
      driveFiles = data?.files || [];
      console.log(`[GDrive] ✓ Fetched ${driveFiles.length} files from Google Drive`);
      
      if (driveFiles.length > 0) {
        console.log('[GDrive] First 3 filenames:', driveFiles.slice(0, 3).map(f => f.name));
      }
    } catch (error) {
      console.error('[GDrive] Error fetching images:', error);
      throw new Error(`Failed to fetch images from Google Drive: ${error.message}`);
    }
  }
  
  let successCount = 0;
  let errorCount = 0;
  let notFoundCount = 0;
  const errors: any[] = [];
  
  for (const prop of properties) {
    const city = prop.city.toLowerCase();
    
    if (city !== 'hyderabad') {
      console.warn(`[Update] Skipping non-Hyderabad property: ${prop.sNo} (${city})`);
      continue;
    }
    
    // Match images from Google Drive
    const { mainImage, galleryImages } = matchImages(prop, driveFiles);
    
    // Build location advantages object
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
    
    // Find property by project_name, location, and bhk_config
    console.log(`[Update] Searching for property: Project="${prop.projectName}", Location="${prop.location}", Config="${prop.configuration}"`);
    
    const { data: existingProps, error: findError } = await supabase
      .from('hyderabad_properties')
      .select('id, main_image_url, project_name')
      .eq('project_name', prop.projectName)
      .eq('location', prop.location)
      .eq('bhk_config', prop.configuration)
      .eq('main_image_url', '/images/placeholder-property.png')
      .limit(1);
    
    if (findError) {
      console.error(`[Update] Error finding property #${prop.sNo}:`, findError);
      errorCount++;
      errors.push({ sNo: prop.sNo, error: findError });
      continue;
    }
    
    if (!existingProps || existingProps.length === 0) {
      console.warn(`[Update] ⚠️ Property #${prop.sNo} NOT FOUND with placeholder image (${prop.projectName}, ${prop.configuration})`);
      notFoundCount++;
      continue;
    }
    
    const propertyId = existingProps[0].id;
    console.log(`[Update] ✓ Found property: ID=${propertyId}, will update with ${galleryImages.length + 1} images`);
    
    // Update the property with images and location advantages
    const updateData: any = {
      main_image_url: mainImage,
      image_gallery: galleryImages,
    };
    
    // Only add nearby_landmarks if there's data
    if (Object.keys(nearbyLandmarks).length > 0) {
      updateData.nearby_landmarks = nearbyLandmarks;
      console.log(`[Update] Adding ${Object.keys(nearbyLandmarks).length} location landmarks`);
    }
    
    const { error: updateError } = await supabase
      .from('hyderabad_properties')
      .update(updateData)
      .eq('id', propertyId);
    
    if (updateError) {
      console.error(`[Update] ✗ Error updating property #${prop.sNo}:`, updateError);
      errorCount++;
      errors.push({ sNo: prop.sNo, error: updateError });
    } else {
      successCount++;
      console.log(`[Update] ✓✓✓ Successfully updated property #${prop.sNo} (${prop.projectName})`);
    }
  }
  
  console.log(`[Update] Complete: ${successCount} updated, ${notFoundCount} not found, ${errorCount} errors`);
  
  return {
    total: properties.length,
    successCount,
    notFoundCount,
    errorCount,
    errors,
  };
};
