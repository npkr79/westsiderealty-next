/**
 * Image optimization utilities for property images
 * Adds Supabase transformation parameters for faster loading
 */

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Optimize Supabase storage URLs with transformation parameters
 */
export const optimizeSupabaseImage = (
  imageUrl: string,
  options: ImageOptimizationOptions = {}
): string => {
  const {
    width,
    height,
    quality = 80,
    format = 'webp'
  } = options;

  // Only optimize Supabase storage URLs
  if (!imageUrl || !imageUrl.includes('supabase.co/storage')) {
    return imageUrl;
  }

  // Build transformation parameters
  const params = new URLSearchParams();
  
  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  params.append('quality', quality.toString());
  params.append('format', format);
  params.append('resize', 'contain');

  const separator = imageUrl.includes('?') ? '&' : '?';
  return `${imageUrl}${separator}${params.toString()}`;
};

/**
 * Generate responsive image srcset for different screen sizes
 */
export const generateImageSrcSet = (imageUrl: string): string => {
  if (!imageUrl || !imageUrl.includes('supabase.co/storage')) {
    return imageUrl;
  }

  const sizes = [640, 768, 1024, 1280, 1920];
  const srcSet = sizes
    .map(size => `${optimizeSupabaseImage(imageUrl, { width: size, quality: 80 })} ${size}w`)
    .join(', ');

  return srcSet;
};

/**
 * Get optimized thumbnail URL
 */
export const getThumbnailUrl = (imageUrl: string): string => {
  return optimizeSupabaseImage(imageUrl, {
    width: 300,
    quality: 70
  });
};

/**
 * Get optimized card image URL
 */
export const getCardImageUrl = (imageUrl: string): string => {
  return optimizeSupabaseImage(imageUrl, {
    width: 800,
    quality: 75
  });
};

/**
 * Get optimized hero/main image URL
 */
export const getHeroImageUrl = (imageUrl: string): string => {
  return optimizeSupabaseImage(imageUrl, {
    width: 1920,
    quality: 85
  });
};
