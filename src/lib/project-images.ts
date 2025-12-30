/**
 * Helper to safely extract image URLs from project objects.
 * Handles various field names and formats that may exist in the database.
 */

export type ProjectImageSource = {
  hero_image_url?: string | null;
  main_image_url?: string | null;
  gallery_images_json?: unknown;   // JSONB field that might contain gallery images
  gallery_images?: unknown;         // Alternative field name
  images?: unknown;                  // Direct images field (if exists in DB)
};

/**
 * Normalizes image URLs for proper display
 * Handles URL encoding, HTTP to HTTPS, and Supabase storage URLs
 */
function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // Trim whitespace
  url = url.trim();
  
  // Upgrade HTTP to HTTPS for security
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  }
  
  // If it's already a full HTTPS URL, return as-is (with proper encoding)
  if (url.startsWith('https://')) {
    // Ensure proper URL encoding for spaces and special characters
    try {
      const urlObj = new URL(url);
      // Reconstruct URL with proper encoding
      return urlObj.toString();
    } catch {
      // If URL parsing fails, return as-is
      return url;
    }
  }
  
  // If it's a Supabase storage URL path, ensure it's a full URL
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

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function extractGalleryFromUnknown(v: unknown): string[] {
  // supports:
  // 1) ["https://...", ...] - direct array of strings
  // 2) { images: ["https://...", ...] } - object with images property
  if (isStringArray(v)) return v;

  if (v && typeof v === "object" && "images" in v) {
    const images = (v as { images?: unknown }).images;
    if (isStringArray(images)) return images;
  }

  return [];
}

/**
 * Extracts all image URLs from a project object.
 * Returns an array with hero_image_url first (if present), followed by gallery images.
 * Deduplicates to avoid showing the same image twice.
 * All URLs are normalized for proper display.
 */
export function getProjectImageUrls(project: ProjectImageSource): string[] {
  // Normalize and prioritize hero_image_url
  const heroUrl = normalizeImageUrl(project.hero_image_url);
  const hero = heroUrl ? [heroUrl] : [];
  
  // Try multiple possible gallery field names
  const gallery =
    extractGalleryFromUnknown(project.gallery_images_json) ||
    extractGalleryFromUnknown(project.gallery_images) ||
    extractGalleryFromUnknown(project.images) ||
    [];

  // Normalize all gallery URLs
  const normalizedGallery = gallery.map(url => normalizeImageUrl(url)).filter(Boolean);

  // Deduplicate: remove hero URL if it appears in gallery
  const rest = heroUrl ? normalizedGallery.filter((u) => u !== heroUrl) : normalizedGallery;

  return [...hero, ...rest].filter(Boolean);
}

/**
 * Gets a single primary image URL for a project (for cards, thumbnails, etc.)
 * Priority: hero_image_url > main_image_url > first gallery image > placeholder
 * All URLs are normalized for proper display.
 */
export function getProjectPrimaryImage(project: ProjectImageSource, placeholder: string = "/placeholder.svg"): string {
  const heroUrl = normalizeImageUrl(project.hero_image_url);
  if (heroUrl) return heroUrl;
  
  const mainUrl = normalizeImageUrl(project.main_image_url);
  if (mainUrl) return mainUrl;
  
  const allImages = getProjectImageUrls(project);
  return allImages.length > 0 ? allImages[0] : placeholder;
}

