"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, Building2, ArrowRight } from "lucide-react";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { navigationService, NavCity, NavMicroMarket } from "@/services/navigationService";

const MegaMenuProperties = () => {
  const [cities, setCities] = useState<NavCity[]>([]);
  const [microMarkets, setMicroMarkets] = useState<NavMicroMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [citiesData, mmData] = await Promise.all([
        navigationService.getNavigationCities(),
        navigationService.getFeaturedMicroMarkets(),
      ]);
      setCities(citiesData);
      setMicroMarkets(mmData);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="text-base font-semibold bg-transparent hover:bg-transparent hover:text-remax-red data-[state=open]:bg-transparent">
        Properties
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid gap-4 p-6 w-[500px] lg:w-[600px] lg:grid-cols-2">
          {/* Cities Column */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <MapPin className="h-4 w-4 text-remax-red" />
              <h3 className="font-semibold text-sm text-foreground">Explore By City</h3>
            </div>
            <ul className="space-y-1">
              {isLoading ? (
                <li className="text-sm text-muted-foreground">Loading...</li>
              ) : cities.length > 0 ? (
                cities.map((city) => (
                  <li key={city.url_slug}>
                    <Link
                      href={`/${city.url_slug}`}
                      className="block py-2 px-3 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-remax-red transition-colors"
                    >
                      {city.city_name} Properties
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">No cities available</li>
              )}
            </ul>
          </div>

          {/* Micro Markets Column */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <Building2 className="h-4 w-4 text-remax-red" />
              <h3 className="font-semibold text-sm text-foreground">Popular Areas</h3>
            </div>
            <ul className="space-y-1">
              {isLoading ? (
                <li className="text-sm text-muted-foreground">Loading...</li>
              ) : microMarkets.length > 0 ? (
                microMarkets.map((mm) => (
                  <li key={mm.url_slug}>
                    <Link
                      href={`/${mm.city_slug}/${mm.url_slug}`}
                      className="block py-2 px-3 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-remax-red transition-colors"
                    >
                      {mm.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">No areas available</li>
              )}
            </ul>
            
            {/* View All Link */}
            <Link
              href="/hyderabad/micro-markets"
              className="flex items-center gap-1 mt-4 pt-3 border-t text-sm font-medium text-remax-red hover:underline"
            >
              View All Micro Markets
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};

export default MegaMenuProperties;
