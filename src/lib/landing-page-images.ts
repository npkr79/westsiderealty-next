/**
 * Helper to resolve hero image URLs for landing pages.
 * Landing pages may have hero_image_url as a full URL or hero_image_supabase_path as a storage path.
 * This helper ensures we always get a valid, accessible image URL.
 */

/**
 * Resolves the hero image URL for a landing page.
 * Priority:
 * 1. hero_image_url if it's a valid absolute URL (http/https)
 * 2. Construct public URL from hero_image_supabase_path if path exists
 * 3. Return placeholder if neither is available
 * 
 * @param item - Landing page item with hero_image_url and/or hero_image_supabase_path
 * @param placeholder - Placeholder image path (default: "/placeholder.svg")
 * @returns Resolved image URL string
 */
export function resolveLandingPageHeroImage(
  item: {
    hero_image_url?: string | null;
    hero_image_supabase_path?: string | null;
  },
  placeholder: string = "/placeholder.svg"
): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const bucket = "landing-pages"; // Landing pages use the 'landing-pages' bucket

  // 1. Check if hero_image_url exists and is a valid absolute URL
  if (item.hero_image_url) {
    const url = item.hero_image_url.trim();
    
    // If it's already a full HTTP/HTTPS URL, use it (with normalization)
    if (url.startsWith("http://") || url.startsWith("https://")) {
      // Normalize HTTP to HTTPS
      const normalized = url.startsWith("http://") ? url.replace("http://", "https://") : url;
      
      // If it's already a Supabase storage URL with /storage/v1/object/..., return as-is
      if (normalized.includes("/storage/v1/object/")) {
        return normalized;
      }
      
      // Otherwise, return the normalized URL
      return normalized;
    }
    
    // If hero_image_url is a storage path (not starting with http), fall through to path handling
  }

  // 2. Construct public URL from hero_image_supabase_path
  if (item.hero_image_supabase_path && supabaseUrl) {
    let path = item.hero_image_supabase_path.trim();
    
    // Remove leading slash if present
    if (path.startsWith("/")) {
      path = path.substring(1);
    }
    
    // Normalize path: remove double slashes, ensure proper encoding
    path = path.replace(/\/+/g, "/");
    
    // Construct the public URL
    // Format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
    
    return publicUrl;
  }

  // 3. Fallback to placeholder
  return placeholder;
}
