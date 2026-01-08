"use client";

import { useState } from "react";
import ImageWithFallback from "@/components/common/ImageWithFallback";

interface ImageCarouselProps {
  images: string[];
  mainImage?: string;
  title: string;
}

export default function ImageCarousel({ images, mainImage, title }: ImageCarouselProps) {
  const allImages = (Array.isArray(images) ? images : []).filter(Boolean);
  const initialIndex = mainImage && allImages.includes(mainImage) ? allImages.indexOf(mainImage) : 0;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrev = () => {
    if (allImages.length === 0) return;
    setCurrentIndex((idx) => (idx === 0 ? allImages.length - 1 : idx - 1));
  };

  const handleNext = () => {
    if (allImages.length === 0) return;
    setCurrentIndex((idx) => (idx === allImages.length - 1 ? 0 : idx + 1));
  };

  // Always render image area - use fallback if no images
  const current = allImages.length > 0 ? allImages[currentIndex] : null;

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted">
        <ImageWithFallback
          src={current}
          alt={title}
          fill
          className="object-cover"
        />
        {allImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-3 py-1 text-xs text-white"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-3 py-1 text-xs text-white"
            >
              Next
            </button>
          </>
        )}
      </div>
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-md border ${
                idx === currentIndex ? "border-primary" : "border-border"
              }`}
            >
              <ImageWithFallback
                src={img}
                alt={`${title} thumbnail ${idx + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


