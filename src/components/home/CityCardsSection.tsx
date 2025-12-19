"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { navigationService, NavCity } from "@/services/navigationService";
import { cityService } from "@/services/cityService";

interface CityCardProps {
  city: NavCity;
  stats?: {
    projects: number;
    listings: number;
  };
}

const CityCard = ({ city, stats }: CityCardProps) => {
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCityData = async () => {
      try {
        const cityData = await cityService.getCityBySlug(city.url_slug);
        if (cityData?.hero_image_url) {
          setHeroImage(cityData.hero_image_url);
        }
      } catch (error) {
        console.error("Error fetching city data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCityData();
  }, [city.url_slug]);

  return (
    <Card className="group hover:shadow-xl transition-all overflow-hidden h-full">
      <div className="relative h-48 w-full">
        {loading ? (
          <div className="w-full h-full bg-muted animate-pulse" />
        ) : heroImage ? (
          <Image
            src={heroImage}
            alt={`${city.city_name} Real Estate`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Building2 className="h-16 w-16 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-2xl font-bold text-white mb-2">{city.city_name}</h3>
        </div>
      </div>
      <CardContent className="p-6">
        {stats && (
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">{stats.projects}</p>
                <p className="text-xs text-muted-foreground">Projects</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">{stats.listings}</p>
                <p className="text-xs text-muted-foreground">Listings</p>
              </div>
            </div>
          </div>
        )}
        <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
          <Link href={`/${city.url_slug}`}>
            Explore {city.city_name}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default function CityCardsSection() {
  const [cities, setCities] = useState<NavCity[]>([]);
  const [cityStats, setCityStats] = useState<Record<string, { projects: number; listings: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const citiesData = await navigationService.getNavigationCities();
        setCities(citiesData);

        // Fetch stats for each city
        const stats: Record<string, { projects: number; listings: number }> = {};
        for (const city of citiesData) {
          const listings = await navigationService.getResaleListingsCount(city.url_slug);
          // For projects count, we'd need to fetch from projects table
          // For now, using placeholder or fetching from cityService
          const cityData = await cityService.getCityBySlug(city.url_slug);
          const projects = 0; // You can add a method to count projects per city
          stats[city.url_slug] = { projects, listings };
        }
        setCityStats(stats);
      } catch (error) {
        console.error("Error fetching cities:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || cities.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-[hsl(var(--heading-blue))]">
          Explore Real Estate by City
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Discover premium properties and investment opportunities in India's most dynamic real estate markets.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {cities.map((city) => (
            <CityCard
              key={city.url_slug}
              city={city}
              stats={cityStats[city.url_slug]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

