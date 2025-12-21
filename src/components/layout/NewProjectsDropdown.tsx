"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, ArrowRight, Flame } from "lucide-react";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { navigationService, NavCity } from "@/services/navigationService";
import { createClient } from "@/lib/supabase/client";

interface LandingPage {
  id: string;
  uri: string;
  title: string;
  headline: string | null;
  template_type: string | null;
}

const NewProjectsDropdown = () => {
  const [cities, setCities] = useState<NavCity[]>([]);
  const [featuredLaunches, setFeaturedLaunches] = useState<LandingPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLaunches, setIsLoadingLaunches] = useState(true);

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

      // Fetch featured landing pages
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("landing_pages")
          .select("id, uri, title, headline, template_type")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(4);

        if (error) {
          console.error("Error fetching featured launches:", error);
        } else {
          setFeaturedLaunches((data || []) as LandingPage[]);
        }
      } catch (error) {
        console.error("Error fetching featured launches:", error);
      } finally {
        setIsLoadingLaunches(false);
      }
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
          {/* Featured Launches Section - FIRST */}
          {featuredLaunches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                <Flame className="h-4 w-4 text-remax-red" />
                <h3 className="font-semibold text-sm text-gray-900">Featured Launches</h3>
              </div>
              <ul className="space-y-1">
                {isLoadingLaunches ? (
                  <li className="text-sm text-muted-foreground py-2 px-3">Loading...</li>
                ) : (
                  featuredLaunches.map((launch) => (
                    <li key={launch.id}>
                      <Link
                        href={`/landing/${launch.uri}`}
                        className="flex items-center justify-between py-2 px-3 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-remax-red transition-colors group"
                      >
                        <span className="flex items-center gap-2">
                          {launch.headline || launch.title}
                          {launch.template_type === "ultra_luxury_duplex" && (
                            <Flame className="h-3 w-3 text-amber-500" />
                          )}
                        </span>
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          {/* Featured/Latest Projects Section */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <ArrowRight className="h-4 w-4 text-remax-red" />
              <h3 className="font-semibold text-sm text-gray-900">All Projects</h3>
            </div>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/projects"
                  className="flex items-center justify-between py-2 px-3 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-remax-red transition-colors group"
                >
                  <span>View All Projects</span>
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
                      href={`/projects?city=${city.url_slug}`}
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

