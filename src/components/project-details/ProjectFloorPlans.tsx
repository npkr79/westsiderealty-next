"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

interface ProjectFloorPlansProps {
  floorPlanImages?: string[] | null;
}

// Helper to validate and normalize image URL
const normalizeImageUrl = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== 'string' || url.trim() === '') return null;
  
  // If it's already an absolute URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's a relative path starting with /, return as-is (Next.js will handle it)
  if (url.startsWith('/')) {
    return url;
  }
  
  // Otherwise, assume it's a Supabase storage path and prepend the base URL if needed
  // You may need to adjust this based on your Supabase configuration
  return url;
};

export default function ProjectFloorPlans({ floorPlanImages }: ProjectFloorPlansProps) {
  const images = Array.isArray(floorPlanImages) 
    ? floorPlanImages.map(normalizeImageUrl).filter((url): url is string => url !== null)
    : [];

  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images.length) return null;

  const selected = images[selectedIndex] ?? images[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-0">
          <div className="relative w-full aspect-[16/9]">
            <Image
              src={selected}
              alt="Floor plan"
              fill
              className="object-contain bg-muted"
              onError={(e) => {
                // Hide broken images
                const target = e.currentTarget;
                target.style.display = 'none';
              }}
            />
          </div>
        </CardContent>
      </Card>

      {images.length > 1 && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {images.map((src, idx) => {
            const normalizedSrc = normalizeImageUrl(src);
            if (!normalizedSrc) return null;
            
            return (
              <button
                key={normalizedSrc + idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative aspect-square rounded border overflow-hidden ${
                  idx === selectedIndex ? "ring-2 ring-primary border-primary" : "border-border"
                }`}
              >
                <Image
                  src={normalizedSrc}
                  alt={`Floor plan ${idx + 1}`}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    // Hide broken images
                    const target = e.currentTarget;
                    target.style.display = 'none';
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
