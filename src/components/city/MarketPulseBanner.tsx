import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp } from "lucide-react";

import type { MicroMarketGridItem } from "@/services/microMarketService";

interface MarketPulseBannerProps {
  microMarkets: MicroMarketGridItem[];
  totalListings: number;
}

export default function MarketPulseBanner({
  microMarkets,
  totalListings,
}: MarketPulseBannerProps) {
  if (!microMarkets || microMarkets.length === 0) return null;

  return (
    <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-6 border-b border-border">
      <div className="container mx-auto px-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-2">
            Market Pulse
          </p>
          <p className="text-sm text-muted-foreground">
            {totalListings}+ active listings across{" "}
            <span className="font-semibold">
              {microMarkets.length} key micro-markets
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {microMarkets.slice(0, 4).map((mm, index) => (
            <Badge key={mm.url_slug || index} variant="outline" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {mm.micro_market_name}
            </Badge>
          ))}
          <Badge variant="secondary" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            High demand zone
          </Badge>
        </div>
      </div>
    </section>
  );
}


