import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp } from "lucide-react";

interface PageProps {
  params: Promise<{ citySlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { citySlug: citySlugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const supabase = await createClient();
  
  const { data: city } = await supabase
    .from("cities")
    .select("city_name, hero_hook")
    .eq("url_slug", citySlug)
    .maybeSingle();

  const cityName = city?.city_name || citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
  const canonicalUrl = `https://www.westsiderealty.in/${citySlug}/micro-markets`;

  return buildMetadata({
    title: `Investment Areas in ${cityName} | Real Estate Micro Markets`,
    description: `Explore top investment areas and micro-markets in ${cityName}. Compare prices, appreciation rates, and find the best locations for real estate investment.`,
    canonicalUrl,
  });
}

export async function generateStaticParams() {
  const supabase = await createClient();
  const { data: cities } = await supabase
    .from("cities")
    .select("url_slug")
    .eq("page_status", "published");

  return cities?.map((city) => ({ citySlug: city.url_slug })) || [];
}

interface MicroMarket {
  id: string;
  micro_market_name: string;
  url_slug: string;
  hero_image_url: string | null;
  annual_appreciation_max: number | null;
  h1_title: string | null;
  hero_hook: string | null;
}

interface City {
  city_name: string;
  hero_hook: string | null;
}

export default async function MicroMarketsHubPage({ params }: PageProps) {
  const { citySlug: citySlugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const supabase = await createClient();

  // Fetch city info
  const { data: cityData } = await supabase
    .from("cities")
    .select("id, city_name, hero_hook")
    .eq("url_slug", citySlug)
    .maybeSingle();

  if (!cityData) {
    notFound();
  }

  const city: City = {
    city_name: cityData.city_name,
    hero_hook: cityData.hero_hook,
  };

  // Fetch micro markets for this city using city_id
  const { data: mmData, error } = await supabase
    .from("micro_markets")
    .select("id, micro_market_name, url_slug, hero_image_url, annual_appreciation_max, h1_title, hero_hook, status")
    .eq("city_id", cityData.id)
    .eq("status", "published")
    .order("micro_market_name");

  if (error) {
    console.error("Error fetching micro markets:", error);
  }

  const microMarkets = (mmData || []) as MicroMarket[];
  const cityName = city.city_name || citySlug.charAt(0).toUpperCase() + citySlug.slice(1);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: cityName, href: `/${citySlug}` },
    { label: "Investment Areas" },
  ];

  const safeImageSrc = (src: string | null) => (src && src.trim() ? src : "/placeholder.svg");

  return (
    <>
      <JsonLd
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": `Investment Areas in ${cityName}`,
          "description": `Micro-markets and investment areas in ${cityName}`,
          "url": `https://www.westsiderealty.in/${citySlug}/micro-markets`,
          "numberOfItems": microMarkets.length,
        }}
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <BreadcrumbNav items={breadcrumbItems} />
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Explore Investment Areas in {cityName}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              {city.hero_hook || `Discover the most promising micro-markets and localities for real estate investment in ${cityName}.`}
            </p>
          </div>
        </section>

        {/* Micro Markets Grid */}
        <section className="container mx-auto px-4 py-12">
          {microMarkets.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No areas found</h3>
              <p className="text-muted-foreground">We're adding more locations soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {microMarkets.map((mm) => (
                <Card key={mm.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-40 bg-gradient-to-br from-primary/20 to-secondary/20">
                    {mm.hero_image_url ? (
                      <Image
                        src={safeImageSrc(mm.hero_image_url)}
                        alt={mm.micro_market_name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="h-12 w-12 text-primary/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white">
                      {mm.micro_market_name}
                    </h3>
                  </div>

                  <CardContent className="p-6">
                    {mm.hero_hook && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{mm.hero_hook}</p>
                    )}

                    <div className="flex gap-4 mb-4">
                      {mm.annual_appreciation_max && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          <span>{mm.annual_appreciation_max}% YoY</span>
                        </div>
                      )}
                    </div>

                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/${citySlug}/${mm.url_slug}`}>
                        Explore {mm.micro_market_name}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
