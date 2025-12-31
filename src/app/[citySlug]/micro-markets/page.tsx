import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MapPin, TrendingUp, Building2, Zap, Home, ArrowRight, Award, Users, Briefcase } from "lucide-react";

interface PageProps {
  params: Promise<{ citySlug: string }>;
}

interface MicroMarket {
  id: string;
  micro_market_name: string;
  url_slug: string;
  hero_hook: string | null;
  price_per_sqft_min: number | null;
  price_per_sqft_max: number | null;
  annual_appreciation_min: number | null;
  rental_yield_min: number | null;
  status: string;
}

// Helper to strip HTML tags and clean text
const stripHtml = (html: string | null | undefined): string => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

// Helper to truncate text to 2 lines (~120 chars)
const truncateDescription = (text: string, maxLength = 120): string => {
  if (!text) return "";
  const cleaned = stripHtml(text);
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength - 1)}…` : cleaned;
};

// Calculate average price
const getAvgPrice = (market: MicroMarket): number | null => {
  if (market.price_per_sqft_min && market.price_per_sqft_max) {
    return (market.price_per_sqft_min + market.price_per_sqft_max) / 2;
  }
  return market.price_per_sqft_min || market.price_per_sqft_max || null;
};

// Categorize micro-markets with strict thresholds
const categorizeMarket = (market: MicroMarket): "high-growth" | "luxury" | "affordable" | null => {
  const avgPrice = getAvgPrice(market);
  
  // If price is missing, return null (only show in "All" tab)
  if (avgPrice === null) {
    return null;
  }

  // Strict thresholds
  if (avgPrice > 10000) return "luxury";
  if (avgPrice < 8000) return "affordable";
  // Between 8000-10000, check for high growth
  return "high-growth";
};

// Check if market is high growth (yoy_appreciation > 12%)
const isHighGrowth = (market: MicroMarket): boolean => {
  return (market.annual_appreciation_min || 0) > 12;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { citySlug: citySlugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const supabase = await createClient();
  
  const { data: city } = await supabase
    .from("cities")
    .select("city_name")
    .eq("url_slug", citySlug)
    .maybeSingle();

  const cityName = city?.city_name || citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
  const canonicalUrl = `https://www.westsiderealty.in/${citySlug}/micro-markets`;

  return buildMetadata({
    title: `${cityName} Real Estate Micro-Market Insights 2026 | Investment Dashboard`,
    description: `Comprehensive guide to property trends, prices, and investment potential in ${cityName}'s top localities. Compare micro-markets, analyze growth rates, and find the best investment opportunities.`,
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

export default async function MicroMarketsHubPage({ params }: PageProps) {
  const { citySlug: citySlugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const supabase = await createClient();

  // Fetch city info
  const { data: cityData } = await supabase
    .from("cities")
    .select("id, city_name")
    .eq("url_slug", citySlug)
    .maybeSingle();

  if (!cityData) {
    notFound();
  }

  // Fetch all micro-markets with required fields
  const { data: mmData, error } = await supabase
    .from("micro_markets")
    .select(`
      id,
      micro_market_name,
      url_slug,
      hero_hook,
      price_per_sqft_min,
      price_per_sqft_max,
      annual_appreciation_min,
      rental_yield_min,
      status
    `)
    .eq("city_id", cityData.id)
    .eq("status", "published")
    .order("annual_appreciation_min", { ascending: false });

  if (error) {
    console.error("Error fetching micro markets:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    // Return empty array instead of crashing
    return (
      <>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Error Loading Micro Markets</h1>
            <p className="text-muted-foreground">Please try again later.</p>
          </div>
        </div>
      </>
    );
  }

  const microMarkets = (mmData || []) as MicroMarket[];
  const cityName = cityData.city_name || citySlug.charAt(0).toUpperCase() + citySlug.slice(1);

  // Categorize markets with strict filtering logic
  const allMarkets = microMarkets;
  
  // High Growth: yoy_appreciation > 12%
  const highGrowthMarkets = microMarkets.filter(m => isHighGrowth(m));
  
  // Luxury: avg_price > 10,000
  const luxuryMarkets = microMarkets.filter(m => {
    const avgPrice = getAvgPrice(m);
    return avgPrice !== null && avgPrice > 10000;
  });
  
  // Affordable: avg_price < 8,000
  const affordableMarkets = microMarkets.filter(m => {
    const avgPrice = getAvgPrice(m);
    return avgPrice !== null && avgPrice < 8000;
  });

  // Helper to determine if market is "Top Pick" or "High Yield"
  const getMarketBadges = (market: MicroMarket) => {
    const badges: string[] = [];
    if ((market.annual_appreciation_min || 0) >= 15) {
      badges.push("Top Pick");
    }
    if ((market.rental_yield_min || 0) >= 4) {
      badges.push("High Yield");
    }
    return badges;
  };

  // FAQ Data for Schema
  const faqs = [
    {
      question: `Which micro-market in West ${cityName} offers the best ROI?`,
      answer: `Markets like Neopolis and Kokapet show the highest appreciation rates (15%+ YoY) due to infrastructure development and IT corridor proximity. However, ROI depends on your investment timeline and risk appetite.`,
    },
    {
      question: `What is the average price per sq.ft in West ${cityName} micro-markets?`,
      answer: `Prices range from ₹4,500/sqft in emerging areas to ₹12,000+/sqft in premium locations like Neopolis. The average for established micro-markets is ₹6,500-₹8,500/sqft.`,
    },
    {
      question: `How do I choose between luxury and affordable micro-markets?`,
      answer: `Luxury markets (₹8,000+/sqft) offer higher capital appreciation but require larger investment. Affordable markets (₹4,500-₹6,000/sqft) provide better rental yields and entry-level opportunities. Consider your budget and investment goals.`,
    },
    {
      question: `What infrastructure projects are driving growth in West ${cityName}?`,
      answer: `Key drivers include ORR connectivity, metro expansion, IT SEZ developments, and upcoming commercial hubs. These projects are creating employment centers and improving connectivity, directly impacting property values.`,
    },
    {
      question: `Is 2026 a good time to invest in ${cityName} real estate?`,
      answer: `Yes, 2026 presents strong opportunities with stable prices, infrastructure completion timelines, and growing rental demand. Early investment in emerging micro-markets can yield significant returns as infrastructure matures.`,
    },
  ];

  // FAQPage Schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  // ItemList Schema for SEO
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${cityName} Real Estate Micro-Market Insights 2026`,
    description: `Comprehensive guide to property trends, prices, and investment potential in ${cityName}'s top localities`,
    url: `https://www.westsiderealty.in/${citySlug}/micro-markets`,
    numberOfItems: microMarkets.length,
    itemListElement: microMarkets.map((market, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Place",
        name: market.micro_market_name,
        description: stripHtml(market.hero_hook) || `Real estate investment opportunities in ${market.micro_market_name}`,
        url: `https://www.westsiderealty.in/${citySlug}/${market.url_slug}`,
        ...(market.price_per_sqft_min && market.price_per_sqft_max && {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "INR",
            lowPrice: market.price_per_sqft_min,
            highPrice: market.price_per_sqft_max,
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              priceCurrency: "INR",
              unitText: "per sq.ft.",
            },
          },
        }),
      },
    })),
  };

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: cityName, href: `/${citySlug}` },
    { name: "Investment Areas", href: `/${citySlug}/micro-markets` },
  ];

  const safeImageSrc = (src: string | null) => (src && src.trim() ? src : "/placeholder.svg");

  // Market Comparison Data
  const comparisonData = microMarkets.map(market => ({
    name: market.micro_market_name,
    priceRange: market.price_per_sqft_min && market.price_per_sqft_max
      ? `₹${market.price_per_sqft_min.toLocaleString()} - ₹${market.price_per_sqft_max.toLocaleString()}/sqft`
      : market.price_per_sqft_min
      ? `₹${market.price_per_sqft_min.toLocaleString()}/sqft+`
      : "Price on request",
    growth: market.annual_appreciation_min
      ? `${market.annual_appreciation_min}%+`
      : "N/A",
    rentalYield: market.rental_yield_min
      ? `${market.rental_yield_min}%+`
      : "N/A",
    url: `/${citySlug}/${market.url_slug}`,
  }));

  return (
    <>
      <JsonLd jsonLd={itemListSchema} />
      <JsonLd jsonLd={faqSchema} />

      <div className="min-h-screen bg-background">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Hero Section */}
        <section className="relative py-20 px-4 bg-gradient-to-b from-slate-50 to-background border-b">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
                {cityName} Real Estate Micro-Market Insights 2026
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Comprehensive guide to property trends, prices, and investment potential in West {cityName}'s top localities.
              </p>
            </div>
          </div>
        </section>

        {/* Filterable Grid Section */}
        <section className="container mx-auto px-4 py-12">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-4 mb-8">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="high-growth">High Growth</TabsTrigger>
              <TabsTrigger value="luxury">Luxury</TabsTrigger>
              <TabsTrigger value="affordable">Affordable</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-8">
              <MarketGrid markets={allMarkets} citySlug={citySlug} safeImageSrc={safeImageSrc} getMarketBadges={getMarketBadges} truncateDescription={truncateDescription} />
            </TabsContent>

            <TabsContent value="high-growth" className="mt-8">
              <MarketGrid markets={highGrowthMarkets} citySlug={citySlug} safeImageSrc={safeImageSrc} getMarketBadges={getMarketBadges} truncateDescription={truncateDescription} />
            </TabsContent>

            <TabsContent value="luxury" className="mt-8">
              <MarketGrid markets={luxuryMarkets} citySlug={citySlug} safeImageSrc={safeImageSrc} getMarketBadges={getMarketBadges} truncateDescription={truncateDescription} />
            </TabsContent>

            <TabsContent value="affordable" className="mt-8">
              <MarketGrid markets={affordableMarkets} citySlug={citySlug} safeImageSrc={safeImageSrc} getMarketBadges={getMarketBadges} truncateDescription={truncateDescription} />
            </TabsContent>
          </Tabs>
        </section>

        {/* Market Comparison Table */}
        {comparisonData.length > 0 && (
          <section className="container mx-auto px-4 py-12 bg-slate-50/50">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
                Market Comparison
              </h2>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold">Micro-Market</TableHead>
                          <TableHead className="font-bold">Price Range</TableHead>
                          <TableHead className="font-bold">YoY Growth</TableHead>
                          <TableHead className="font-bold">Rental Yield</TableHead>
                          <TableHead className="font-bold">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparisonData.map((market, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-semibold">
                              <Link href={market.url} className="text-primary hover:underline">
                                {market.name}
                              </Link>
                            </TableCell>
                            <TableCell>{market.priceRange}</TableCell>
                            <TableCell>
                              <span className="text-green-600 font-semibold">{market.growth}</span>
                            </TableCell>
                            <TableCell>{market.rentalYield}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={market.url}>
                                  View Details <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Why Invest Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
              Why Invest in West {cityName}?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">World-Class Infrastructure</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Strategic connectivity with ORR, metro expansion, and upcoming infrastructure projects driving property values.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Briefcase className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">IT & Business Hubs</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Proximity to major IT corridors and business districts ensures strong rental demand and capital appreciation.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Home className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">Quality of Life</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Premium residential communities with top schools, hospitals, and lifestyle amenities for modern living.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16 bg-slate-50/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
              Investment FAQs
            </h2>
            <Card>
              <CardContent className="p-8">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-left font-semibold">
                      Which micro-market in West {cityName} offers the best ROI?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Markets like Neopolis and Kokapet show the highest appreciation rates (15%+ YoY) due to infrastructure development and IT corridor proximity. However, ROI depends on your investment timeline and risk appetite.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-left font-semibold">
                      What is the average price per sq.ft in West {cityName} micro-markets?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Prices range from ₹4,500/sqft in emerging areas to ₹12,000+/sqft in premium locations like Neopolis. The average for established micro-markets is ₹6,500-₹8,500/sqft.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-left font-semibold">
                      How do I choose between luxury and affordable micro-markets?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Luxury markets (₹8,000+/sqft) offer higher capital appreciation but require larger investment. Affordable markets (₹4,500-₹6,000/sqft) provide better rental yields and entry-level opportunities. Consider your budget and investment goals.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger className="text-left font-semibold">
                      What infrastructure projects are driving growth in West {cityName}?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Key drivers include ORR connectivity, metro expansion, IT SEZ developments, and upcoming commercial hubs. These projects are creating employment centers and improving connectivity, directly impacting property values.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5">
                    <AccordionTrigger className="text-left font-semibold">
                      Is 2026 a good time to invest in {cityName} real estate?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Yes, 2026 presents strong opportunities with stable prices, infrastructure completion timelines, and growing rental demand. Early investment in emerging micro-markets can yield significant returns as infrastructure matures.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}

// Market Grid Component
function MarketGrid({
  markets,
  citySlug,
  safeImageSrc,
  getMarketBadges,
  truncateDescription,
}: {
  markets: MicroMarket[];
  citySlug: string;
  safeImageSrc: (src: string | null) => string;
  getMarketBadges: (market: MicroMarket) => string[];
  truncateDescription: (text: string) => string;
}) {
  if (markets.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">No markets found in this category</h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {markets.map((market) => {
        const badges = getMarketBadges(market);
        const avgPrice = market.price_per_sqft_min && market.price_per_sqft_max
          ? Math.round((market.price_per_sqft_min + market.price_per_sqft_max) / 2)
          : market.price_per_sqft_min || market.price_per_sqft_max || 0;
        const appreciation = market.annual_appreciation_min
          ? `${market.annual_appreciation_min}%+`
          : "N/A";
        const rentalYield = market.rental_yield_min
          ? `${market.rental_yield_min}%+`
          : "N/A";

        return (
          <Card key={market.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary/50">
            {/* Image Section */}
            <div className="relative h-48 w-full overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <MapPin className="h-16 w-16 text-primary/50" />
              </div>
              {/* Overlay Badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {badges.map((badge, idx) => (
                  <Badge
                    key={idx}
                    className={`${
                      badge === "Top Pick"
                        ? "bg-amber-500 text-white"
                        : "bg-green-600 text-white"
                    } shadow-lg`}
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white drop-shadow-lg">
                {market.micro_market_name}
              </h3>
            </div>

            <CardContent className="p-6 space-y-4">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Avg Price/sqft</p>
                  <p className="text-sm font-bold text-foreground">
                    ₹{avgPrice.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">YoY Growth</p>
                  <p className="text-sm font-bold text-green-600">{appreciation}</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Rental Yield</p>
                  <p className="text-sm font-bold text-blue-600">{rentalYield}</p>
                </div>
              </div>

              {/* Description */}
              {market.hero_hook && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {truncateDescription(market.hero_hook)}
                </p>
              )}

              {/* CTA Button */}
              <Button asChild className="w-full" variant="default">
                <Link href={`/${citySlug}/${market.url_slug}`}>
                  Analyze Market <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
