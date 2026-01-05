/**
 * Extract clean Google Maps URL from google_maps_embed_url field.
 * The database may contain either:
 * 1. A clean URL (e.g., "https://www.google.com/maps/embed?pb=...")
 * 2. Full iframe HTML markup (e.g., "<iframe src='https://...'></iframe>")
 * 
 * This function extracts the actual URL in both cases.
 */
export function extractMapUrl(embedValue: string | null | undefined): string | null {
  if (!embedValue) return null;
  
  // Trim whitespace
  const trimmed = embedValue.trim();
  if (!trimmed) return null;
  
  // If it's already a clean URL starting with http, return it
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // If it contains iframe HTML markup, extract the src attribute
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (srcMatch?.[1]) {
    let url = srcMatch[1].trim();
    // Ensure https:// if it doesn't start with http
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url;
  }
  
  // If no match found, return null (invalid format)
  return null;
}
