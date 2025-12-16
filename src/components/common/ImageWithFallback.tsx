import Image from "next/image";
import React, { useState } from "react";

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  fallback?: string;
  className?: string;
  eager?: boolean; // For above-the-fold images (LCP optimization)
  width?: number;
  height?: number;
}

const SUPABASE_BASE_URL = "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public";

// Prefer Supabase public fallback if none given/exists
const defaultFallback = "/placeholder.svg";

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  fallback,
  className = "",
  eager = false,
  width = 1200,
  height = 600,
}) => {
  const [imgSrc, setImgSrc] = useState(src || fallback || defaultFallback);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (imgSrc !== fallback && fallback) {
      setImgSrc(fallback);
    } else if (imgSrc !== defaultFallback) {
      setImgSrc(defaultFallback);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className="flex items-center justify-center w-full h-96 rounded-lg bg-yellow-50 text-red-800 font-semibold">
        Failed to load image. Please check the image URL or upload again.
      </div>
    );
  }

  return (
    <Image
      src={imgSrc || defaultFallback}
      alt={alt}
      className={"rounded-lg shadow-lg w-full h-96 object-cover " + className}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      onError={handleError}
      data-testid="image-fallback"
      width={width}
      height={height}
      unoptimized
      priority={eager}
    />
  );
};

export default ImageWithFallback;
