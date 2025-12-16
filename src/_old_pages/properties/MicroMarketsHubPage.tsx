import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { MapPin, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import FooterSection from "@/components/home/FooterSection";
import { supabase } from "@/integrations/supabase/client";

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

const MicroMarketsHubPage = () => {
  const { citySlug } = useParams<{ citySlug: string }>();
  const [microMarkets, setMicroMarkets] = useState<MicroMarket[]>([]);
  const [city, setCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!citySlug) return;

      // Fetch city info
      const { data: cityData } = await supabase
        .from("cities")
        .select("id, city_name, hero_hook")
        .eq("url_slug", citySlug)
        .maybeSingle();

      setCity(cityData);

      if (!cityData?.id) {
        setLoading(false);
        return;
      }

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

      setMicroMarkets((mmData || []) as MicroMarket[]);
      setLoading(false);
    };

    fetchData();
  }, [citySlug]);

  const cityName = city?.city_name || citySlug?.charAt(0).toUpperCase() + citySlug?.slice(1);

  return (
    <>
      <Helmet>
        <title>Investment Areas in {cityName} | Real Estate Micro Markets</title>
        <meta name="description" content={`Explore top investment areas and micro-markets in ${cityName}. Compare prices, appreciation rates, and find the best locations for real estate investment.`} />
        <link rel="canonical" href={`${window.location.origin}/${citySlug}/micro-markets`} />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
          <div className="container mx-auto px-4">
            <nav className="text-sm text-muted-foreground mb-4">
              <Link to="/" className="hover:text-primary">Home</Link>
              <span className="mx-2">/</span>
              <Link to={`/${citySlug}`} className="hover:text-primary">{cityName}</Link>
              <span className="mx-2">/</span>
              <span>Investment Areas</span>
            </nav>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Explore Investment Areas in {cityName}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              {city?.hero_hook || `Discover the most promising micro-markets and localities for real estate investment in ${cityName}.`}
            </p>
          </div>
        </section>

        {/* Micro Markets Grid */}
        <section className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-40 bg-muted" />
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-full mb-4" />
                    <div className="flex gap-4">
                      <div className="h-10 bg-muted rounded w-20" />
                      <div className="h-10 bg-muted rounded w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : microMarkets.length === 0 ? (
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
                      <img
                        src={mm.hero_image_url}
                        alt={mm.micro_market_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                      <Link to={`/${citySlug}/${mm.url_slug}`}>
                        Explore {mm.micro_market_name}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <FooterSection />
    </>
  );
};

export default MicroMarketsHubPage;
