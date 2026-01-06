/**
 * Helper to resolve hero image URLs for landing pages.
 * Landing pages may have hero_image_url as a full URL or hero_image_supabase_path as a storage path.
 * This helper ensures we always get a valid, accessible image URL.
 */

const SUPABASE_PROJECT_URL = "https://imqlfztriragzypplbqa.supabase.co";

/**
 * Normalizes HTTP/HTTPS URLs, fixing common issues like "https:/" (missing slash)
 */
function normalizeHttpUrl(url?: string | null): string | null {
  if (!url) return null;
  
  const trimmed = url.trim();
  if (!trimmed) return null;
  
  // Fix common bad values like "https:/" or "http:/" (missing slash)
  const fixed = trimmed
    .replace(/^https:\//, "https://")
    .replace(/^http:\//, "http://");
  
  // Upgrade HTTP to HTTPS for security
  if (fixed.startsWith("http://")) {
    return fixed.replace("http://", "https://");
  }
  
  if (fixed.startsWith("https://")) {
    return fixed;
  }
  
  return null; // non-absolute URL
}

/**
 * Constructs a Supabase public URL from a storage path.
 * Handles different path formats:
 * - Already a full storage URL: "https://.../storage/v1/object/public/..."
 * - Full path: "/storage/v1/object/public/bucket/path"
 * - Bucket + path: "bucket/path/to/file.jpg"
 * - Just path: "path/to/file.jpg" (assumes landing-pages bucket)
 */
function supabasePublicUrlFromPath(path?: string | null): string | null {
  if (!path) return null;

  const trimmed = path.trim();
  if (!trimmed) return null;

  // If it's already a storage public URL, normalize and return
  if (trimmed.includes("/storage/v1/object/public/")) {
    const normalized = normalizeHttpUrl(trimmed);
    if (normalized) return normalized;
    
    // If it's a relative path starting with /storage/...
    if (trimmed.startsWith("/storage/")) {
      return `${SUPABASE_PROJECT_URL}${trimmed}`;
    }
    
    // If it doesn't start with protocol, assume https
    if (!trimmed.startsWith("http")) {
      return `https://${trimmed.replace(/^\/+/, "")}`;
    }
  }

  // Remove leading slash if present
  let normalizedPath = trimmed.startsWith("/") ? trimmed.substring(1) : trimmed;
  
  // Normalize path: remove double slashes
  normalizedPath = normalizedPath.replace(/\/+/g, "/");
  
  // Check if path already includes bucket name (format: "bucket/path/to/file.jpg")
  const parts = normalizedPath.split("/");
  const bucket = "landing-pages"; // Landing pages use the 'landing-pages' bucket
  
  if (parts.length >= 2 && parts[0] === bucket) {
    // Path already has bucket: "landing-pages/hero/file.jpg"
    const objectPath = parts.slice(1).join("/");
    const encodedPath = encodeURIComponent(objectPath).replace(/%2F/g, "/");
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${bucket}/${encodedPath}`;
  }
  
  // Path doesn't include bucket, assume it's in landing-pages bucket
  const encodedPath = encodeURIComponent(normalizedPath).replace(/%2F/g, "/");
  return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

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
  // 1. Check if hero_image_url exists and is a valid absolute URL
  const absoluteHeroUrl = normalizeHttpUrl(item?.hero_image_url);
  if (absoluteHeroUrl) {
    return absoluteHeroUrl;
  }

  // 2. Construct public URL from hero_image_supabase_path
  const supabaseUrl = supabasePublicUrlFromPath(item?.hero_image_supabase_path);
  if (supabaseUrl) {
    return supabaseUrl;
  }

  // 3. Fallback to placeholder (default: /placeholder.svg)
  return placeholder;
}
