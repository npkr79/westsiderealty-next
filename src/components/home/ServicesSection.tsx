"use client";

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

export default function ServicesSection({ services }: ServicesSectionProps = {}) {
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

  return (
    <section className="py-10 bg-muted/40">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">What We Help You With</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {displayServices.map((service: ServiceItem, index: number) => (
            <Card key={service.title || index}>
              {service.image && (
                <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="transition-transform duration-300 hover:scale-105"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {service.icon && <service.icon className="h-6 w-6 text-primary" />}
                  {service.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{service.description}</p>
                {service.areas && service.areas.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {service.areas.map((area, idx) => (
                      <span key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                        {area}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}


