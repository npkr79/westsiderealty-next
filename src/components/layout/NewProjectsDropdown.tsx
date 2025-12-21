"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, ArrowRight } from "lucide-react";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { navigationService, NavCity } from "@/services/navigationService";

const NewProjectsDropdown = () => {
  const [cities, setCities] = useState<NavCity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Get all cities including Dubai for projects
      // For now, use hardcoded list since we need client-side fetch
      const allCities: NavCity[] = [
        { city_name: "Dubai", url_slug: "dubai" },
        { city_name: "Goa", url_slug: "goa" },
        { city_name: "Hyderabad", url_slug: "hyderabad" }
      ];
      setCities(allCities);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="text-base font-semibold bg-transparent hover:bg-transparent hover:text-blue-700 data-[state=open]:bg-transparent text-gray-700">
        New Projects
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="p-6 w-[400px]">
          {/* Featured/Latest Projects Section - FIRST */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <ArrowRight className="h-4 w-4 text-remax-red" />
              <h3 className="font-semibold text-sm text-gray-900">Featured/Latest Projects</h3>
            </div>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/projects"
                  className="flex items-center justify-between py-2 px-3 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-remax-red transition-colors group"
                >
                  <span>All Projects</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-gray-200" />

          {/* Projects by City Section - SECOND */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <Building2 className="h-4 w-4 text-remax-red" />
              <h3 className="font-semibold text-sm text-gray-900">Projects by City</h3>
            </div>
            <ul className="space-y-1">
              {isLoading ? (
                <li className="text-sm text-muted-foreground">Loading...</li>
              ) : cities.length > 0 ? (
                cities.map((city) => (
                  <li key={city.url_slug}>
                    <Link
                      href={`/${city.url_slug}/projects`}
                      className="block py-2 px-3 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-remax-red transition-colors"
                    >
                      {city.city_name} Projects
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">No cities available</li>
              )}
            </ul>
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};

export default NewProjectsDropdown;

