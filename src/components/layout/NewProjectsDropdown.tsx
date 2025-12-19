"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, Users, ArrowRight } from "lucide-react";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { navigationService, NavCity, NavDeveloper } from "@/services/navigationService";

const NewProjectsDropdown = () => {
  const [cities, setCities] = useState<NavCity[]>([]);
  const [developers, setDevelopers] = useState<NavDeveloper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [citiesData, devsData] = await Promise.all([
        navigationService.getNavigationCities(),
        navigationService.getFeaturedDevelopers(),
      ]);
      setCities(citiesData);
      setDevelopers(devsData.slice(0, 5)); // Top 5 developers
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
        <div className="grid gap-6 p-6 w-[500px] lg:w-[600px] lg:grid-cols-2">
          {/* Browse Projects Section */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <Building2 className="h-4 w-4 text-remax-red" />
              <h3 className="font-semibold text-sm text-gray-900">Browse Projects</h3>
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

          {/* By Developer Section */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <Users className="h-4 w-4 text-remax-red" />
              <h3 className="font-semibold text-sm text-gray-900">By Developer</h3>
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
                      {dev.total_projects && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({dev.total_projects} projects)
                        </span>
                      )}
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

export default NewProjectsDropdown;

