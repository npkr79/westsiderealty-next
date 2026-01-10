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
}

export default function SafeImage({ src, alt, width, height, className, priority, loading, onError }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  if (hasError || !imageSrc) {
    return null;
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      loading={loading}
      onError={(e) => {
        setHasError(true);
        if (onError) {
          onError();
        }
      }}
    />
  );
}
