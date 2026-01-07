"use client";

import Image, { ImageProps } from "next/image";
import React, { useState, useCallback } from "react";

// Default agency logo fallback
const DEFAULT_FALLBACK = "/company-logo.png";

interface ImageWithFallbackProps extends Omit<ImageProps, "src" | "onError"> {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
}

/**
 * Enhanced Image component with automatic fallback to agency logo
 * 
 * Features:
 * - Accepts all Next.js Image props
 * - Automatically falls back to agency logo if src is null/undefined or fails to load
 * - Prevents infinite loop if fallback also fails
 * - Customizable fallback via fallbackSrc prop
 * 
 * @example
 * ```tsx
 * <ImageWithFallback 
 *   src={project.imageUrl} 
 *   alt={project.title} 
 *   width={400} 
 *   height={300} 
 * />
 * ```
 */
const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  ...imageProps
}) => {
  // Determine initial src: use provided src, or fallback if src is null/undefined
  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (!src || src.trim() === "") {
      return fallbackSrc;
    }
    return src;
  });
  
  const [hasErrored, setHasErrored] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  /**
   * Handle image load errors
   * Prevents infinite loop by tracking if we've already tried the fallback
   */
  const handleError = useCallback(() => {
    // If we're not already showing the fallback, switch to it
    if (!hasErrored && imgSrc !== fallbackSrc) {
      setHasErrored(true);
      setImgSrc(fallbackSrc);
      return;
    }
    
    // If fallback also fails, mark it but don't try again (prevents infinite loop)
    if (imgSrc === fallbackSrc && !fallbackFailed) {
      setFallbackFailed(true);
      console.warn("[ImageWithFallback] Fallback image also failed to load:", fallbackSrc);
    }
  }, [imgSrc, fallbackSrc, hasErrored, fallbackFailed]);

  // Update src if prop changes (e.g., dynamic loading)
  React.useEffect(() => {
    if (src && src.trim() !== "" && src !== imgSrc) {
      setImgSrc(src);
      setHasErrored(false);
      setFallbackFailed(false);
    } else if (!src || src.trim() === "") {
      // If src becomes empty, switch to fallback
      if (imgSrc !== fallbackSrc) {
        setImgSrc(fallbackSrc);
        setHasErrored(false);
        setFallbackFailed(false);
      }
    }
  }, [src, imgSrc, fallbackSrc]);

  // If fallback also failed, show a placeholder div
  if (fallbackFailed) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 text-gray-400"
        style={{
          width: imageProps.width || 400,
          height: imageProps.height || 300,
          ...imageProps.style,
        }}
        role="img"
        aria-label={alt}
      >
        <span className="text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <Image
      {...imageProps}
      src={imgSrc}
      alt={alt}
      onError={handleError}
    />
  );
};

export default ImageWithFallback;
