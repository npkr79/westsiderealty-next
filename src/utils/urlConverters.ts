/**
 * Converts YouTube share URLs to embed format
 * Supports various YouTube URL formats
 */
export function convertYouTubeToEmbed(url: string): string {
  if (!url) return '';
  
  // Already an embed URL
  if (url.includes('/embed/')) return url;
  
  // Extract video ID from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    /youtube\.com\/watch\?v=([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtu\.be\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  
  return url; // Return original if no match
}

/**
 * Validates and normalizes zoom level for Google Maps
 * Google Maps zoom levels are valid from 0 to 21
 */
function validateAndNormalizeZoom(zoom: string | number): number {
  const zoomNum = typeof zoom === 'string' ? parseInt(zoom, 10) : zoom;
  
  // If zoom is invalid or NaN, default to 15
  if (isNaN(zoomNum)) return 15;
  
  // Cap zoom between 0 and 21 (Google Maps valid range)
  if (zoomNum < 0) return 0;
  if (zoomNum > 21) return 15; // Use reasonable default for invalid high values
  
  return zoomNum;
}

/**
 * Converts Google Maps share URLs to embed format
 * Handles various Google Maps URL formats and validates zoom levels
 */
export function convertGoogleMapsToEmbed(url: string): string {
  if (!url) return '';
  
  // Already an embed URL - validate zoom if present
  if (url.includes('/maps/embed')) {
    return validateMapEmbedUrl(url);
  }

  // Handle Google Maps short URLs (maps.app.goo.gl) - Cannot be resolved client-side
  if (url.includes('maps.app.goo.gl')) {
    console.warn('GoogleMapsConverter: Short URL detected but cannot be resolved client-side:', url);
    return ''; // Return empty string instead of original URL
  }
  
  try {
    // Handle direct coordinates (@lat,lng,zoom)
    const coordsMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),?(\d+\.?\d*)?z?/);
    if (coordsMatch) {
      const lat = coordsMatch[1];
      const lng = coordsMatch[2];
      const zoom = validateAndNormalizeZoom(coordsMatch[3] || '15');
      console.log('GoogleMapsConverter: Found coordinates with RED MARKER', { lat, lng, zoom });
      return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e1!3m2!1sen!2sin!4v${Date.now()}!5m2!1sen!2sin&markers=color:red%7C${lat},${lng}&z=${zoom}`;
    }
    
    // Handle place URLs with coordinates
    const placeWithCoordsMatch = url.match(/\/place\/([^\/]+)\/@(-?\d+\.?\d*),(-?\d+\.?\d*),(\d+\.?\d*)?z?/);
    if (placeWithCoordsMatch) {
      const placeName = decodeURIComponent(placeWithCoordsMatch[1].replace(/\+/g, ' '));
      const lat = placeWithCoordsMatch[2];
      const lng = placeWithCoordsMatch[3];
      const zoom = validateAndNormalizeZoom(placeWithCoordsMatch[4] || '15');
      console.log('GoogleMapsConverter: Found place with coordinates and RED MARKER', { placeName, lat, lng, zoom });
      return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${encodeURIComponent(placeName)}!5e1!3m2!1sen!2sin!4v${Date.now()}!5m2!1sen!2sin&markers=color:red%7C${lat},${lng}&z=${zoom}`;
    }
    
    // Handle place URLs without coordinates - extract place name for search
    const placeMatch = url.match(/\/place\/([^\/\?]+)/);
    if (placeMatch) {
      const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      console.log('GoogleMapsConverter: Found place name', { placeName });
      return `https://www.google.com/maps/embed/v1/place?key=&q=${encodeURIComponent(placeName)}`;
    }
    
    // Handle search URLs
    const searchMatch = url.match(/\/search\/([^\/\?]+)/);
    if (searchMatch) {
      const searchQuery = decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
      console.log('GoogleMapsConverter: Found search query', { searchQuery });
      return `https://www.google.com/maps/embed/v1/search?key=&q=${encodeURIComponent(searchQuery)}`;
    }
    
    // Handle query parameter extraction for complex URLs
    const urlObj = new URL(url);
    const query = urlObj.searchParams.get('q');
    if (query) {
      console.log('GoogleMapsConverter: Found query parameter', { query });
      return `https://www.google.com/maps/embed/v1/search?key=&q=${encodeURIComponent(query)}`;
    }
    
  } catch (error) {
    console.error('GoogleMapsConverter: Error parsing Google Maps URL:', error);
  }
  
  // If no conversion possible, return empty string
  console.warn('GoogleMapsConverter: Could not convert URL:', url);
  return '';
}

/**
 * Validates and fixes zoom levels in existing embed URLs
 */
function validateMapEmbedUrl(embedUrl: string): string {
  try {
    // Check for zoom parameter in embed URL
    const zoomMatch = embedUrl.match(/[&?]z=(\d+)/);
    if (zoomMatch) {
      const currentZoom = parseInt(zoomMatch[1], 10);
      const validZoom = validateAndNormalizeZoom(currentZoom);
      
      if (currentZoom !== validZoom) {
        console.log(`GoogleMapsConverter: Fixed invalid zoom level ${currentZoom} to ${validZoom}`);
        return embedUrl.replace(`z=${currentZoom}`, `z=${validZoom}`);
      }
    }
    
    return embedUrl;
  } catch (error) {
    console.error('GoogleMapsConverter: Error validating embed URL:', error);
    return embedUrl;
  }
}

/**
 * Validates if a URL can be converted to Google Maps embed format
 */
export function validateGoogleMapsUrl(url: string): { isValid: boolean; message: string } {
  if (!url) {
    return { isValid: false, message: 'URL is required' };
  }
  
  if (url.includes('/maps/embed')) {
    // Check for invalid zoom levels in embed URLs
    const zoomMatch = url.match(/[&?]z=(\d+)/);
    if (zoomMatch) {
      const zoom = parseInt(zoomMatch[1], 10);
      if (zoom > 21) {
        return { 
          isValid: false, 
          message: `Invalid zoom level (${zoom}). Google Maps zoom levels must be between 0-21. This will be automatically corrected to 15.` 
        };
      }
    }
    return { isValid: true, message: 'Valid embed URL' };
  }
  
  // Check for short URLs - these cannot be resolved
  if (url.includes('maps.app.goo.gl')) {
    return { 
      isValid: false, 
      message: 'Short URLs (maps.app.goo.gl) cannot be resolved. Please use the full Google Maps URL from your browser address bar.' 
    };
  }
  
  // Check for known patterns
  const patterns = [
    /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,  // Coordinates
    /\/place\/[^\/]+/,               // Place URLs
    /\/search\/[^\/]+/,              // Search URLs
    /[?&]q=[^&]+/                    // Query parameter
  ];
  
  const hasValidPattern = patterns.some(pattern => pattern.test(url));
  
  if (hasValidPattern) {
    // Check for potentially invalid zoom levels in coordinate URLs
    const coordsMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),?(\d+\.?\d*)?z?/);
    if (coordsMatch && coordsMatch[3]) {
      const zoom = parseInt(coordsMatch[3], 10);
      if (zoom > 21) {
        return { 
          isValid: true, 
          message: `URL can be converted (zoom level ${zoom} will be corrected to 15)` 
        };
      }
    }
    
    return { isValid: true, message: 'URL can be converted' };
  }
  
  return { 
    isValid: false, 
    message: 'URL format not supported. Please use a Google Maps URL with coordinates, place name, or search query.' 
  };
}

/**
 * Normalizes image URLs for proper display
 * Handles local uploads, Supabase storage, and external URLs
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return '';
  
  // Upgrade HTTP to HTTPS for security
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  }
  
  // If it's already a full HTTPS URL, return as-is
  if (url.startsWith('https://')) {
    return url;
  }
  
  // If it's a Supabase storage URL path
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }
  
  // If it's a local upload path, normalize it
  if (url.startsWith('public/lovable-uploads/')) {
    return url.replace('public/lovable-uploads/', '/lovable-uploads/');
  }
  
  // If it's already a proper path, return as-is
  if (url.startsWith('/')) {
    return url;
  }
  
  // Default case - assume it's a filename in lovable-uploads
  return `/lovable-uploads/${url}`;
}

/**
 * Gets the Supabase public URL for a storage path
 */
export function getSupabasePublicUrl(bucket: string, path: string): string {
  const supabaseUrl = 'https://imqlfztriragzypplbqa.supabase.co';
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
