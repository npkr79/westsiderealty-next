"use client";

import { useState } from "react";
import Image from "next/image";

interface SafeImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
  onError?: () => void;
  unoptimized?: boolean;
}

export default function SafeImage({ src, alt, width, height, className, priority, loading, onError, unoptimized }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

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
      onError={(e) => {
        setHasError(true);
        if (onError) {
          onError();
        }
      }}
    />
  );
}
