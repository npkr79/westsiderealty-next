"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, Building, ArrowRight } from "lucide-react";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { navigationService, NavMicroMarket, NavDeveloper } from "@/services/navigationService";

const ExploreDropdown = () => {
  const [microMarkets, setMicroMarkets] = useState<NavMicroMarket[]>([]);
  const [developers, setDevelopers] = useState<NavDeveloper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [mmData, devsData] = await Promise.all([
        navigationService.getFeaturedMicroMarkets(),
        navigationService.getFeaturedDevelopers(),
      ]);
      setMicroMarkets(mmData);
      setDevelopers(devsData.slice(0, 4)); // Top 4 developers
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="text-base font-semibold bg-transparent hover:bg-transparent hover:text-blue-700 data-[state=open]:bg-transparent text-gray-700">
        Explore
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid gap-6 p-6 w-[500px] lg:w-[600px] lg:grid-cols-2">
          {/* Micro-Markets Section */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <MapPin className="h-4 w-4 text-remax-red" />
              <h3 className="font-semibold text-sm text-gray-900">Micro-Markets</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Explore by neighborhood</p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/hyderabad/areas"
                  className="flex items-center justify-between py-2 px-3 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-remax-red transition-colors group"
                >
                  <span>Hyderabad Areas</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              {isLoading ? (
                <li className="text-sm text-muted-foreground">Loading...</li>
              ) : microMarkets.length > 0 ? (
                microMarkets.slice(0, 4).map((mm) => (
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
          </div>

          {/* Developers Section */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <Building className="h-4 w-4 text-remax-red" />
              <h3 className="font-semibold text-sm text-gray-900">Developers</h3>
            </div>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/developers"
                  className="flex items-center justify-between py-2 px-3 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-remax-red transition-colors group"
                >
                  <span>All Developers</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              {isLoading ? (
                <li className="text-sm text-muted-foreground">Loading...</li>
              ) : developers.length > 0 ? (
                developers.map((dev) => (
                  <li key={dev.url_slug}>
                    <Link
                      href={`/developers/${dev.url_slug}`}
                      className="block py-2 px-3 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-remax-red transition-colors"
                    >
                      {dev.developer_name}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">No developers available</li>
              )}
            </ul>
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};

export default ExploreDropdown;

