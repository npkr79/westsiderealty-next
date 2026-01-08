"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ImageLightbox from "@/components/landing/ImageLightbox";
import ImageWithFallback from "@/components/common/ImageWithFallback";

interface RawFloorPlan {
  label?: string;
  title?: string;
  name?: string;
  url?: string;
  image_url?: string;
  src?: string;
}

interface NormalizedFloorPlan {
  label: string;
  url: string;
}

interface FloorPlansGalleryProps {
  // Can be an array of strings or objects from JSONB
  floorPlanImages?: any;
}

export default function FloorPlansGallery({ floorPlanImages }: FloorPlansGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!floorPlanImages || !Array.isArray(floorPlanImages) || floorPlanImages.length === 0) {
    return null;
  }

  const plans: NormalizedFloorPlan[] = (floorPlanImages as Array<string | RawFloorPlan>)
    .map((item, idx) => {
      if (typeof item === "string") {
        return {
          label: `Floor Plan ${idx + 1}`,
          url: item,
        };
      }

      const url = item.url || item.image_url || item.src || "";
      const label = item.label || item.title || item.name || `Floor Plan ${idx + 1}`;

      return url
        ? {
            label,
            url,
          }
        : null;
    })
    .filter((p): p is NormalizedFloorPlan => !!p && typeof p.url === "string" && p.url.trim() !== "");

  if (plans.length === 0) return null;

  const images = plans.map((p) => p.url);

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
            {plans.map((plan, idx) => (
              <button
                key={plan.url + idx}
                onClick={() => openLightbox(idx)}
                className="relative aspect-[4/3] rounded-lg overflow-hidden border hover:ring-2 ring-primary transition-all group"
              >
                <ImageWithFallback
                  src={plan.url}
                  alt={plan.label || `Floor plan ${idx + 1}`}
                  fill
                  className="object-contain bg-muted group-hover:scale-105 transition-transform"
                />
                {plan.label && (
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs px-2 py-1 text-center">
                    {plan.label}
                  </div>
                )}
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
