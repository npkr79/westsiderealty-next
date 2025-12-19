import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import type { MicroMarketGridItem } from "@/services/microMarketService";

interface MicroMarketGridProps {
  microMarkets: MicroMarketGridItem[];
  citySlug: string;
}

export default function MicroMarketGrid({ microMarkets, citySlug }: MicroMarketGridProps) {
  if (!microMarkets || microMarkets.length === 0) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-[hsl(var(--heading-blue))]">
          Prime Micro-Markets in {citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {microMarkets.map((mm, index) => {
            // Extract growth percentage from annual_appreciation_min
            const growthPct = mm.annual_appreciation_min;
            
            // Get price range
            const priceMin = mm.price_per_sqft_min;
            const priceMax = mm.price_per_sqft_max;
            const priceRange = priceMin && priceMax 
              ? `₹${priceMin.toLocaleString()}-${priceMax.toLocaleString()}/sqft`
              : priceMin 
                ? `₹${priceMin.toLocaleString()}/sqft`
                : null;

            // Get rental yield
            const rentalYield = mm.rental_yield_min;

            return (
              <Card key={mm.url_slug || index} className="hover:shadow-lg transition-shadow h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-xl">{mm.micro_market_name}</CardTitle>
                    {growthPct && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +{growthPct}% Growth
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground flex-grow">
                  {mm.hero_hook && (
                    <p className="line-clamp-2">{mm.hero_hook}</p>
                  )}
                  
                  <div className="space-y-2 pt-2 border-t border-border">
                    {priceRange && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Price Range:</span>
                        <span className="font-semibold text-foreground">{priceRange}</span>
                      </div>
                    )}
                    {rentalYield && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Rental Yield:</span>
                        <span className="font-semibold text-foreground">{rentalYield}%</span>
                      </div>
                    )}
                  </div>
                  
                  <Link
                    href={`/${citySlug}/${mm.url_slug}`}
                    className="inline-block text-primary font-medium hover:underline mt-4"
                  >
                    View {mm.micro_market_name} Market Trends →
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}


