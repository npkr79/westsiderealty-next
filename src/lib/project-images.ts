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
 */
export function getProjectImageUrls(project: ProjectImageSource): string[] {
  const hero = project.hero_image_url ? [project.hero_image_url] : [];
  
  // Try multiple possible gallery field names
  const gallery =
    extractGalleryFromUnknown(project.gallery_images_json) ||
    extractGalleryFromUnknown(project.gallery_images) ||
    extractGalleryFromUnknown(project.images) ||
    [];

  // Deduplicate: remove hero URL if it appears in gallery
  const heroUrl = project.hero_image_url ?? null;
  const rest = heroUrl ? gallery.filter((u) => u !== heroUrl) : gallery;

  return [...hero, ...rest].filter(Boolean);
}

/**
 * Gets a single primary image URL for a project (for cards, thumbnails, etc.)
 * Priority: hero_image_url > main_image_url > first gallery image > placeholder
 */
export function getProjectPrimaryImage(project: ProjectImageSource, placeholder: string = "/placeholder.svg"): string {
  if (project.hero_image_url) return project.hero_image_url;
  if (project.main_image_url) return project.main_image_url;
  
  const allImages = getProjectImageUrls(project);
  return allImages.length > 0 ? allImages[0] : placeholder;
}

