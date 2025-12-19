"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Home, TrendingUp, ArrowRight } from "lucide-react";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { navigationService, NavCity } from "@/services/navigationService";
import { Badge } from "@/components/ui/badge";

const BuyDropdown = () => {
  const [cities, setCities] = useState<NavCity[]>([]);
  const [listingCounts, setListingCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const citiesData = await navigationService.getNavigationCities();
      setCities(citiesData);
      
      // Fetch listing counts for each city
      const counts: Record<string, number> = {};
      for (const city of citiesData) {
        const count = await navigationService.getResaleListingsCount(city.url_slug);
        counts[city.url_slug] = count;
      }
      setListingCounts(counts);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="text-base font-semibold bg-transparent hover:bg-transparent hover:text-blue-700 data-[state=open]:bg-transparent text-gray-700">
        Buy
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid gap-6 p-6 w-[500px] lg:w-[600px]">
          {/* Resale Properties Section */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <Home className="h-4 w-4 text-remax-red" />
              <h3 className="font-semibold text-sm text-gray-900">Resale Properties</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Ready-to-move homes</p>
            <ul className="space-y-1">
              {isLoading ? (
                <li className="text-sm text-muted-foreground">Loading...</li>
              ) : cities.length > 0 ? (
                cities.map((city) => (
                  <li key={city.url_slug}>
                    <Link
                      href={`/buy/${city.url_slug}`}
                      className="flex items-center justify-between py-2 px-3 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-remax-red transition-colors group"
                    >
                      <span>{city.city_name}</span>
                      {listingCounts[city.url_slug] > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {listingCounts[city.url_slug]} listings
                        </Badge>
                      )}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">No cities available</li>
              )}
            </ul>
          </div>

          {/* Landowner/Investor Share Section */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <TrendingUp className="h-4 w-4 text-remax-red" />
              <h3 className="font-semibold text-sm text-gray-900">Landowner/Investor Share</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Pre-launch opportunities</p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/buy/investor-share"
                  className="flex items-center justify-between py-2 px-3 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-remax-red transition-colors group"
                >
                  <span>Available Deals</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};

export default BuyDropdown;

