"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface SafeImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
  unoptimized?: boolean;
  hideOnError?: boolean;
  containerId?: string;
}

export default function SafeImage({ 
  src, 
  alt, 
  width, 
  height, 
  className, 
  priority, 
  loading, 
  unoptimized,
  hideOnError = false,
  containerId
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [imageSrc] = useState(src);

  useEffect(() => {
    if (hasError && hideOnError && containerId) {
      // Hide the container if image fails to load
      const container = document.getElementById(containerId);
      if (container) {
        container.style.display = 'none';
      }
    }
  }, [hasError, hideOnError, containerId]);

  if (hasError || !imageSrc) {
    return null;
  }

  // Check if URL has query parameters (which might conflict with Next.js optimization)
  const hasQueryParams = imageSrc.includes('?');
  const shouldUnoptimize = unoptimized !== undefined ? unoptimized : hasQueryParams;

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      loading={loading}
      unoptimized={shouldUnoptimize}
      onError={() => {
        setHasError(true);
      }}
    />
  );
}
