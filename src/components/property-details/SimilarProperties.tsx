"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Maximize } from "lucide-react";
import { formatPriceWithCr } from "@/lib/priceFormatter";
import { createClient } from "@/lib/supabase/client";

interface SimilarPropertiesProps {
  currentPropertyId: string;
  citySlug: string;
  microMarket?: string;
  bedrooms?: number;
  price?: number;
}

export default function SimilarProperties({ 
  currentPropertyId, 
  citySlug, 
  microMarket,
  bedrooms,
  price 
}: SimilarPropertiesProps) {
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSimilarProperties() {
      try {
        const supabase = createClient();
        
        // Determine table name based on city
        const tableName = citySlug === 'hyderabad' 
          ? 'hyderabad_properties'
          : citySlug === 'goa'
          ? 'goa_holiday_properties'
          : citySlug === 'dubai'
          ? 'dubai_properties'
          : null;

        if (!tableName) {
          setIsLoading(false);
          return;
        }

        let query = supabase
          .from(tableName)
          .select('id, title, slug, seo_slug, main_image_url, price, price_display, micro_market, location, bedrooms, bathrooms, area_sqft, is_featured')
          .neq('id', currentPropertyId)
          .eq('status', citySlug === 'hyderabad' ? 'active' : citySlug === 'goa' ? 'Active' : 'published')
          .limit(6);

        // Prioritize same micro-market
        if (microMarket) {
          query = query.eq('micro_market', microMarket);
        }

        const { data, error } = await query;

        if (error) {
          console.error('[SimilarProperties] Error fetching:', error);
          setProperties([]);
        } else {
          setProperties(data || []);
        }
      } catch (error) {
        console.error('[SimilarProperties] Error:', error);
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSimilarProperties();
  }, [currentPropertyId, citySlug, microMarket, bedrooms, price]);

  if (isLoading) {
    return (
      <section className="py-8">
        <h2 className="text-2xl font-bold mb-6">Similar Properties</h2>
        <div className="text-center py-8 text-muted-foreground">Loading similar properties...</div>
      </section>
    );
  }

  if (!properties || properties.length === 0) return null;

  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold mb-6">Similar Properties</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.slice(0, 6).map((property: any) => (
          <Link 
            key={property.id} 
            href={`/${citySlug}/buy/${property.seo_slug || property.slug}`}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
              <div className="aspect-video relative">
                <Image
                  src={property.main_image_url || "/placeholder.svg"}
                  alt={property.title}
                  fill
                  className="object-cover"
                />
                {property.is_featured && (
                  <Badge className="absolute top-2 right-2">Featured</Badge>
                )}
              </div>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold line-clamp-1">{property.title}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">{property.micro_market || property.location}</span>
                </div>
                <p className="text-lg font-bold text-primary">
                  {property.price_display || `₹${formatPriceWithCr(property.price || 0)}`}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {property.bedrooms && (
                    <span className="flex items-center gap-1">
                      <Bed className="w-4 h-4" /> {property.bedrooms} BHK
                    </span>
                  )}
                  {property.bathrooms && (
                    <span className="flex items-center gap-1">
                      <Bath className="w-4 h-4" /> {property.bathrooms}
                    </span>
                  )}
                  {property.area_sqft && (
                    <span className="flex items-center gap-1">
                      <Maximize className="w-4 h-4" /> {property.area_sqft} sqft
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
