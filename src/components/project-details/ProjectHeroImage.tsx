"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ImageLightbox from "@/components/landing/ImageLightbox";

interface ProjectHeroImageProps {
  heroImageUrl?: string | null;
  galleryImages?: string[];
}

export default function ProjectHeroImage({ heroImageUrl, galleryImages }: ProjectHeroImageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Combine hero image with gallery if available
  const allImages = [
    ...(heroImageUrl ? [heroImageUrl] : []),
    ...(galleryImages || []).filter(img => img !== heroImageUrl)
  ];

  const displayImage = allImages[currentIndex] || heroImageUrl || "/agency_logo.png";
  const hasMultipleImages = allImages.length > 1;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted group">
        <Image
          src={displayImage}
          alt="Project hero"
          fill
          className="object-cover"
          priority
          onError={(e) => {
            const target = e.currentTarget;
            target.src = "/agency_logo.png";
          }}
        />
        
        {hasMultipleImages && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {allImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex ? "w-8 bg-white" : "w-2 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
        
        <button
          onClick={() => openLightbox(currentIndex)}
          className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors"
          aria-label="View full image"
        />
      </div>

      {allImages.length > 0 && (
        <ImageLightbox
          images={allImages}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          initialIndex={lightboxIndex}
        />
      )}
    </>
  );
}
