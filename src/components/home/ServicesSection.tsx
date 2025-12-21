"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { LucideIcon } from "lucide-react";

interface ServiceItem {
  icon?: LucideIcon;
  title: string;
  description: string;
  areas?: string[];
  color?: string;
  image?: string;
}

interface ServicesSectionProps {
  services?: ServiceItem[];
}

const FALLBACK_IMAGE = "/placeholder.svg";
const SUPABASE_BASE_URL = "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public";

// Default service images from Supabase
const DEFAULT_SERVICE_IMAGES: Record<string, string> = {
  "Resale Properties - West Hyderabad": `${SUPABASE_BASE_URL}/service-images/hyderabad-view.jpg`,
  "Investment & Holiday Homes - Goa": `${SUPABASE_BASE_URL}/service-images/goa-view.jpg`,
  "Global Investment Properties - Dubai": `${SUPABASE_BASE_URL}/service-images/dubai-view.jpg`,
};

export default function ServicesSection({ services }: ServicesSectionProps = {}) {
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const defaultServices: ServiceItem[] = [
    {
      title: "Hyderabad Resale Advisory",
      description: "Expert guidance for buying and selling resale apartments and villas in West Hyderabad.",
    },
    {
      title: "Goa Holiday Homes",
      description: "Curated villas and apartments with strong rental potential in North & South Goa.",
    },
    {
      title: "Dubai Investments",
      description: "Global investment opportunities with high ROI in Dubai's prime communities.",
    },
  ];
  
  const displayServices = services || defaultServices;

  const getImageUrl = (service: ServiceItem, index: number): string => {
    // Priority: service.image > default image for title > fallback
    if (service.image && !imageErrors[index]) {
      return service.image;
    }
    // Try default image based on title
    const defaultImage = DEFAULT_SERVICE_IMAGES[service.title];
    if (defaultImage && !imageErrors[index]) {
      return defaultImage;
    }
    return FALLBACK_IMAGE;
  };

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <section className="py-10 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-blue-900">What We Do</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {displayServices.map((service: ServiceItem, index: number) => {
            const imageUrl = getImageUrl(service, index);
            const showImage = imageUrl !== FALLBACK_IMAGE || !imageErrors[index];

            return (
              <Card key={service.title || index} className="bg-white shadow-md">
                {showImage && (
                  <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-gray-100">
                    <Image
                      src={imageUrl}
                      alt={service.title}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="transition-transform duration-300 hover:scale-105"
                      onError={() => handleImageError(index)}
                      unoptimized={imageUrl.startsWith("http")}
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-gray-900">
                    {service.icon && <service.icon className="h-6 w-6 text-blue-600" />}
                    {service.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{service.description}</p>
                  {service.areas && service.areas.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {service.areas.map((area, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {area}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}


