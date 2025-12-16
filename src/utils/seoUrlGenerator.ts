/**
 * SEO URL Generator Utility
 * Generates clean, SEO-friendly slugs for property listings
 * Format: [project-name]-[bhk]-[location]
 */

interface PropertySlugInput {
  title?: string;
  project_name?: string;
  developer_name?: string;
  bhk_config?: string;
  bedrooms?: number;
  location?: string;
  property_type?: string;
  region?: string;
  emirate?: string;
  community?: string;
  micro_location?: string;
  macro_location?: string;
  micro_market?: string; // Hyderabad-specific field
}

/**
 * Generates an SEO-friendly slug from property data
 * @param property - Property data
 * @param maxLength - Maximum slug length (default: 60)
 * @returns Clean, SEO-optimized slug
 */
export function generatePropertySlug(
  property: PropertySlugInput,
  maxLength: number = 60
): string {
  const parts: string[] = [];

  // 1. Add BHK configuration or bedrooms
  if (property.bhk_config) {
    parts.push(property.bhk_config.toLowerCase());
  } else if (property.bedrooms) {
    parts.push(`${property.bedrooms}bhk`);
  }

  // 2. Add property type
  if (property.property_type) {
    const type = property.property_type
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    if (type) parts.push(type);
  }

  // 3. Add project name or title
  const name = property.project_name || property.title || '';
  if (name) {
    const cleanName = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
    if (cleanName) parts.push(cleanName);
  }

  // 4. Add location (priority: micro_market > micro_location > community > region > emirate > location)
  // This ensures specific areas like "gopanapally" are included for better local SEO
  const location = 
    property.micro_market ||      // Hyderabad micro-markets (e.g., "gopanapally")
    property.micro_location ||     // Goa micro-locations (e.g., "morjim")
    property.community ||          // Dubai communities (e.g., "dubai-marina")
    property.region ||             // Goa regions (e.g., "north-goa")
    property.emirate ||            // Dubai emirates (e.g., "dubai")
    property.location ||           // General location fallback
    '';
  if (location) {
    const cleanLocation = location
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
    if (cleanLocation) parts.push(cleanLocation);
  }

  // Join parts and clean up
  let slug = parts
    .filter(part => part && part.length > 0)
    .join('-')
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  // Remove trailing UUID-like patterns (8, 12, or 36 hex chars)
  slug = slug.replace(/-[0-9a-f]{8}$/i, '');
  slug = slug.replace(/-[0-9a-f]{12}$/i, '');
  slug = slug.replace(/-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, '');

  // Remove redundant BHK mentions (e.g., "3bhk-apartment-3bhk" → "3bhk-apartment")
  slug = slug.replace(/^(\d+bhk)-(apartment|villa|house|flat)-\1-/i, '$1-$2-');
  slug = slug.replace(/^(\d+bhk)-(\d+bhk)-/i, '$1-');

  // DO NOT remove micro-markets or specific locations - they're crucial for local SEO
  // Only remove redundant city names IF they appear after more specific locations
  // Example: Keep "gopanapally" but avoid "gopanapally-hyderabad"
  slug = slug.replace(/-(hyderabad|goa|dubai)$/i, '');
  
  // Remove redundant "in" connectors
  slug = slug.replace(/-in-/g, '-');

  // Clean up again after removals
  slug = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');

  // Limit to 50 characters max for better SEO
  const targetLength = Math.min(maxLength, 50);
  if (slug.length > targetLength) {
    slug = slug.substring(0, targetLength);
    const lastHyphen = slug.lastIndexOf('-');
    if (lastHyphen > targetLength * 0.7) {
      slug = slug.substring(0, lastHyphen);
    }
  }

  return slug || 'property';
}

/**
 * Ensures slug uniqueness by appending a number if needed
 * @param baseSlug - Base slug
 * @param existingSlugs - Array of existing slugs to check against
 * @returns Unique slug
 */
export function ensureUniqueSlug(
  baseSlug: string,
  existingSlugs: string[]
): string {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Generates SEO-friendly slug specifically for Goa properties
 * Format: {micro-location}-{project-name}-{property-type}-{bhk}-goa
 * Example: morjim-veora-villa-4bhk-goa
 */
export function generateGoaPropertySlug(
  property: PropertySlugInput,
  maxLength: number = 60
): string {
  const parts: string[] = [];

  // 1. Micro-location (most specific location)
  if (property.micro_location) {
    parts.push(cleanSlugPart(property.micro_location));
  } else if (property.location) {
    parts.push(cleanSlugPart(property.location));
  }

  // 2. Project name
  if (property.project_name) {
    parts.push(cleanSlugPart(property.project_name));
  }

  // 3. Property type
  if (property.property_type) {
    parts.push(cleanSlugPart(property.property_type));
  }

  // 4. BHK config
  if (property.bhk_config) {
    parts.push(cleanSlugPart(property.bhk_config).toLowerCase());
  } else if (property.bedrooms) {
    parts.push(`${property.bedrooms}bhk`);
  }

  // 5. Always end with "goa" for location context
  parts.push('goa');

  const slug = parts
    .filter(Boolean)
    .join('-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug.substring(0, maxLength) || 'property-goa';
}

/**
 * Cleans a text part for use in slug
 */
function cleanSlugPart(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Validates if a slug is SEO-friendly
 * @param slug - Slug to validate
 * @returns true if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  // Check length
  if (slug.length < 3 || slug.length > 80) return false;

  // Check format: lowercase letters, numbers, hyphens only
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return false;

  // Check no consecutive hyphens
  if (/--/.test(slug)) return false;

  // Check no leading/trailing hyphens
  if (slug.startsWith('-') || slug.endsWith('-')) return false;

  return true;
}

/**
 * Generates a URL-safe slug from any string (preserves ALL meaningful words)
 * @param text - Text to slugify
 * @returns URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}
