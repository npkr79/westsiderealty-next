 "use client";

import { useEffect, useState } from "react";
 import Link from "next/link";
 import { useParams } from "next/navigation";
 import Head from "next/head";
 import { createClient } from "@/lib/supabase/client";
import { cityService, CityInfo } from "@/services/cityService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Award } from "lucide-react";
import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import FooterSection from "@/components/home/FooterSection";

interface Developer {
  id: string;
  developer_name: string;
  url_slug: string;
  logo_url: string | null;
  tagline: string | null;
  specialization: string | null;
  years_in_business: number | null;
  total_projects: number | null;
  location_focus: string[] | null;
  is_featured: boolean | null;
}

export default function CityDevelopersPage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const supabase = createClient();
  const [city, setCity] = useState<CityInfo | null>(null);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!citySlug) return;

      try {
        // Fetch city data
        const cityData = await cityService.getCityBySlug(citySlug);
        setCity(cityData);

        if (cityData) {
          // Fetch developers operating in this city
          const { data, error } = await supabase
            .from('city_developers')
            .select(`
              developer_id,
              developers (
                id,
                developer_name,
                url_slug,
                logo_url,
                tagline,
                specialization,
                years_in_business,
                total_projects,
                location_focus,
                is_featured
              )
            `)
            .eq('city_id', cityData.id)
            .order('display_order', { ascending: true });

          if (error) throw error;

          // Extract developer data from the nested structure
          const devs = data
            ?.map(item => (item.developers as any))
            .filter(Boolean) || [];
          
          setDevelopers(devs);
        }
      } catch (error) {
        console.error('Error loading developers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [citySlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!city) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>City not found</p>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: city.city_name, href: `/${citySlug}` },
    { label: "Developers" }
  ];

  const seoTitle = `Top Real Estate Developers in ${city.city_name} | Premium Property Builders`;
  const seoDescription = `Explore leading real estate developers in ${city.city_name}. Find trusted builders, their projects, and premium properties. Get expert insights on top developers.`;
  const canonicalUrl = `https://www.westsiderealty.in/${citySlug}/developers`;
  const ogImage = "https://www.westsiderealty.in/placeholder.svg";

  // JSON-LD Schemas
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.westsiderealty.in" },
      { "@type": "ListItem", "position": 2, "name": city.city_name, "item": `https://www.westsiderealty.in/${citySlug}` },
      { "@type": "ListItem", "position": 3, "name": "Developers", "item": canonicalUrl }
    ]
  };

  const organizationListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Real Estate Developers in ${city.city_name}`,
    "description": seoDescription,
    "numberOfItems": developers.length,
    "itemListElement": developers.map((dev, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "RealEstateAgent",
        "name": dev.developer_name,
        "url": `https://www.westsiderealty.in/${citySlug}/developers/${dev.url_slug}`,
        ...(dev.logo_url && { "logo": dev.logo_url }),
        ...(dev.tagline && { "description": dev.tagline })
      }
    }))
  };

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="RE/MAX Westside Realty" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={ogImage} />
        
        {/* JSON-LD Schemas */}
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(organizationListSchema)}
        </script>
      </Head>

      <div className="min-h-screen bg-background">
        {/* Header Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16 px-4">
          <div className="container mx-auto">
            <BreadcrumbNav items={breadcrumbItems} />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 mt-8">
              Top Developers in {city.city_name}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Discover the leading real estate developers shaping {city.city_name}'s skyline. 
              Explore their premium projects and find your perfect property.
            </p>
          </div>
        </section>

        {/* Developers Grid */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            {developers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No developers found for this city.</p>
                <Button asChild>
                  <Link href={`/${citySlug}`}>Back to {city.city_name}</Link>
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {developers.map((developer) => (
                  <Link
                    key={developer.id}
                    href={`/${citySlug}/developers/${developer.url_slug}`}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                      <CardContent className="p-6">
                        {/* Logo */}
                        {developer.logo_url && (
                          <div className="mb-4 h-20 flex items-center justify-center bg-muted rounded-lg p-4">
                            <img
                              src={developer.logo_url}
                              alt={`${developer.developer_name} logo`}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        )}

                        {/* Developer Name */}
                        <h3 className="text-xl font-bold text-foreground mb-2">
                          {developer.developer_name}
                        </h3>

                        {/* Tagline */}
                        {developer.tagline && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {developer.tagline}
                          </p>
                        )}

                        {/* Stats */}
                        <div className="space-y-2 mb-4">
                          {developer.years_in_business && (
                            <div className="flex items-center gap-2 text-sm">
                              <Award className="h-4 w-4 text-primary" />
                              <span>{developer.years_in_business}+ Years of Excellence</span>
                            </div>
                          )}
                          {developer.total_projects && (
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="h-4 w-4 text-primary" />
                              <span>{developer.total_projects}+ Projects Delivered</span>
                            </div>
                          )}
                          {developer.location_focus && developer.location_focus.length > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-primary" />
                              <span className="line-clamp-1">
                                {developer.location_focus.slice(0, 2).join(', ')}
                                {developer.location_focus.length > 2 && '...'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* View Profile Button */}
                        <Button variant="outline" className="w-full" asChild>
                          <span>View Developer Profile</span>
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <FooterSection />
      </div>
    </>
  );
}
