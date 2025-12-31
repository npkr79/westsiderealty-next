"use client";

import { type MicroMarketInfo } from "@/services/microMarketService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MicroMarketHighlightsProps {
  marketData: MicroMarketInfo;
}

export default function MicroMarketHighlights({ marketData }: MicroMarketHighlightsProps) {
  if (!marketData) return null;

  const marketName = marketData.micro_market_name || marketData.h1_title || "Micro-Market Highlights";
  
  // Build price range text from min/max if available
  const priceRangeText = 
    marketData.price_per_sqft_min && marketData.price_per_sqft_max
      ? `₹${marketData.price_per_sqft_min.toLocaleString()} - ₹${marketData.price_per_sqft_max.toLocaleString()}/sq.ft`
      : marketData.price_per_sqft_min
      ? `Starting from ₹${marketData.price_per_sqft_min.toLocaleString()}/sq.ft`
      : null;

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{marketName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Growth Story */}
          {marketData.growth_story && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Growth Story</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {marketData.growth_story}
              </p>
            </div>
          )}

          {/* Connectivity Details */}
          {marketData.connectivity_details && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Connectivity</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {marketData.connectivity_details}
              </p>
            </div>
          )}

          {/* Infrastructure Details */}
          {marketData.infrastructure_details && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Infrastructure</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {marketData.infrastructure_details}
              </p>
            </div>
          )}

          {/* IT Corridor Influence */}
          {marketData.it_corridor_influence && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">IT Corridor Influence</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {marketData.it_corridor_influence}
              </p>
            </div>
          )}

          {/* Price Range & Investment Metrics */}
          {(priceRangeText || marketData.annual_appreciation_min || marketData.rental_yield_min) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              {priceRangeText && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Price Range
                  </p>
                  <p className="text-sm font-semibold text-foreground">{priceRangeText}</p>
                </div>
              )}
              {marketData.annual_appreciation_min && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Annual Appreciation
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {marketData.annual_appreciation_min}%+
                  </p>
                </div>
              )}
              {marketData.rental_yield_min && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Rental Yield
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {marketData.rental_yield_min}%+
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}


