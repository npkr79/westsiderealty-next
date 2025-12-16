"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

interface ProjectFloorPlansProps {
  floorPlanImages?: string[] | null;
}

export default function ProjectFloorPlans({ floorPlanImages }: ProjectFloorPlansProps) {
  const images = Array.isArray(floorPlanImages) ? floorPlanImages : [];

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
            />
          </div>
        </CardContent>
      </Card>

      {images.length > 1 && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {images.map((src, idx) => (
            <button
              key={src + idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative aspect-square rounded border overflow-hidden ${
                idx === selectedIndex ? "ring-2 ring-primary border-primary" : "border-border"
              }`}
            >
              <Image
                src={src}
                alt={`Floor plan ${idx + 1}`}
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


