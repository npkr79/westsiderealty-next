"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import type { UnifiedProperty } from "@/types/unifiedProperty";

interface GoaPropertyCardProps {
  property: UnifiedProperty;
  location?: string;
  viewMode?: "grid" | "list";
}

export default function GoaPropertyCard({
  property,
  location = "goa",
  viewMode = "grid",
}: GoaPropertyCardProps) {
  const href = `/${location}/buy/${property.slug}`;
  const image = property.main_image_url || (property.image_gallery && property.image_gallery[0]) || "/placeholder.svg";

  return (
    <Link href={href}>
      <Card className={viewMode === "list" ? "flex gap-4" : ""}>
        <div className={viewMode === "list" ? "relative h-40 w-52 flex-shrink-0" : "relative h-48 w-full"}>
          <Image
            src={image}
            alt={property.title}
            fill
            className="object-cover"
          />
        </div>
        <CardContent className="p-4 flex flex-col gap-2">
          <h3 className="text-base font-semibold text-foreground line-clamp-2">
            {property.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {property.location}
          </p>
          <p className="text-base font-semibold text-primary">
            {property.price_display || `₹${property.price.toLocaleString()}`}
          </p>
          {property.rental_yield_min && property.rental_yield_max && (
            <p className="text-xs text-emerald-600">
              Potential rental yield: {property.rental_yield_min}%–{property.rental_yield_max}%
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}


