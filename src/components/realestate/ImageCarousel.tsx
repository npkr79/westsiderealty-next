"use client";

import Image from "next/image";
import { useState } from "react";

interface ImageCarouselProps {
  images: string[];
  mainImage?: string;
  title: string;
}

export default function ImageCarousel({ images, mainImage, title }: ImageCarouselProps) {
  const allImages = (Array.isArray(images) ? images : []).filter(Boolean);
  const initialIndex = mainImage && allImages.includes(mainImage) ? allImages.indexOf(mainImage) : 0;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (allImages.length === 0) {
    return (
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted flex items-center justify-center">
        <span className="text-sm text-muted-foreground">No images available</span>
      </div>
    );
  }

  const safeSrc = (src: string | undefined) => (src && src.trim() ? src : "/placeholder.svg");

  const handlePrev = () => {
    setCurrentIndex((idx) => (idx === 0 ? allImages.length - 1 : idx - 1));
  };

  const handleNext = () => {
    setCurrentIndex((idx) => (idx === allImages.length - 1 ? 0 : idx + 1));
  };

  const current = allImages[currentIndex];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted">
        <Image
          src={safeSrc(current)}
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
              <Image
                src={safeSrc(img)}
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


