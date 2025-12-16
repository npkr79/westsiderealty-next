"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import type { UnifiedProperty, CitySlug } from "@/types/unifiedProperty";

interface PropertyCardProps {
  property: UnifiedProperty;
  location: CitySlug;
  viewMode?: "grid" | "list";
}

export default function PropertyCard({ property, location, viewMode = "grid" }: PropertyCardProps) {
  const href = `/${location}/buy/${property.slug}`;
  const safeImage = property.main_image_url || (property.image_gallery && property.image_gallery[0]) || "/placeholder.svg";

  return (
    <Link href={href}>
      <Card className={viewMode === "list" ? "flex gap-4" : ""}>
        <div className={viewMode === "list" ? "relative h-40 w-52 flex-shrink-0" : "relative h-48 w-full"}>
          <Image
            src={safeImage}
            alt={property.title}
            fill
            className="object-cover rounded-t-lg"
          />
        </div>
        <CardContent className="p-4 flex flex-col gap-2">
          <h3 className="text-base font-semibold text-foreground line-clamp-2">{property.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {property.location}
          </p>
          <p className="text-base font-semibold text-primary">
            {property.price_display || `₹${property.price.toLocaleString()}`}
          </p>
          {property.bedrooms && (
            <p className="text-xs text-muted-foreground">
              {property.bedrooms} • {property.area_sqft ? `${property.area_sqft} sq.ft` : "Size on request"}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}


