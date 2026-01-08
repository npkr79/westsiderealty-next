"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ImageLightbox from "@/components/landing/ImageLightbox";

interface FloorPlansGalleryProps {
  floorPlanImages?: string[] | null;
}

export default function FloorPlansGallery({ floorPlanImages }: FloorPlansGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!floorPlanImages || !Array.isArray(floorPlanImages) || floorPlanImages.length === 0) {
    return null;
  }

  const images = floorPlanImages.filter((img): img is string => typeof img === 'string' && img.trim() !== '');

  if (images.length === 0) return null;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Floor Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((imageUrl, idx) => (
              <button
                key={idx}
                onClick={() => openLightbox(idx)}
                className="relative aspect-[4/3] rounded-lg overflow-hidden border hover:ring-2 ring-primary transition-all group"
              >
                <Image
                  src={imageUrl}
                  alt={`Floor plan ${idx + 1}`}
                  fill
                  className="object-contain bg-muted group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <ImageLightbox
        images={images}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        initialIndex={lightboxIndex}
      />
    </>
  );
}
