"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ImageLightbox from "@/components/landing/ImageLightbox";
import ImageWithFallback from "@/components/common/ImageWithFallback";

interface RawFloorPlan {
  label?: string;
  title?: string;
  name?: string;
  plan_name?: string;
  url?: string;
  image_url?: string;
  src?: string;
  image?: string;
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

  // Handle various input formats: array, object, string, or null/undefined
  const normalizeInput = (input: any): Array<string | RawFloorPlan> => {
    if (!input) return [];
    
    // If it's already an array, return it
    if (Array.isArray(input)) {
      return input;
    }
    
    // If it's a string, wrap it in an array
    if (typeof input === "string") {
      return [input];
    }
    
    // If it's an object, try to extract array from common property names
    if (typeof input === "object" && input !== null) {
      // Check for common array property names
      if (Array.isArray(input.plans)) return input.plans;
      if (Array.isArray(input.images)) return input.images;
      if (Array.isArray(input.floor_plans)) return input.floor_plans;
      if (Array.isArray(input.floorPlans)) return input.floorPlans;
      
      // If object has url/image_url/src, treat as single floor plan
      if (input.url || input.image_url || input.src) {
        return [input];
      }
    }
    
    return [];
  };

  const normalizedInput = normalizeInput(floorPlanImages);
  
  if (!normalizedInput || normalizedInput.length === 0) {
    return null;
  }

  const plans: NormalizedFloorPlan[] = (normalizedInput as Array<string | RawFloorPlan>)
    .map((item, idx) => {
      // Handle string URLs
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (!trimmed) return null;
        return {
          label: `Floor Plan ${idx + 1}`,
          url: trimmed,
        };
      }

      // Handle object format
      if (typeof item === "object" && item !== null) {
        const url = item.url || item.image_url || item.src || item.image || "";
        const label = item.label || item.title || item.name || item.plan_name || `Floor Plan ${idx + 1}`;
        const trimmedUrl = typeof url === "string" ? url.trim() : "";

        return trimmedUrl
          ? {
              label,
              url: trimmedUrl,
            }
          : null;
      }

      return null;
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
