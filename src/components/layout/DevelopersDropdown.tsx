"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building, ArrowRight } from "lucide-react";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { navigationService, NavDeveloper } from "@/services/navigationService";

const DevelopersDropdown = () => {
  const [developers, setDevelopers] = useState<NavDeveloper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await navigationService.getFeaturedDevelopers();
      setDevelopers(data);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="text-base font-semibold bg-transparent hover:bg-transparent hover:text-blue-700 data-[state=open]:bg-transparent text-gray-700">
        Developers
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="p-4 w-[280px]">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b">
            <Building className="h-4 w-4 text-remax-red" />
            <h3 className="font-semibold text-sm text-gray-900">Top Developers</h3>
          </div>
          <ul className="space-y-1">
            {isLoading ? (
              <li className="text-sm text-muted-foreground">Loading...</li>
            ) : developers.length > 0 ? (
              developers.map((dev) => (
                <li key={dev.url_slug}>
                  <Link
                    href={`/developers/${dev.url_slug}`}
                    className="flex items-center justify-between py-2 px-3 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-remax-red transition-colors"
                  >
                    <span>{dev.developer_name}</span>
                    {dev.total_projects && (
                      <span className="text-xs text-muted-foreground/70">
                        {dev.total_projects} projects
                      </span>
                    )}
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-sm text-muted-foreground">No developers available</li>
            )}
          </ul>
          
          {/* View All Link */}
          <Link
            href="/developers"
            className="flex items-center gap-1 mt-4 pt-3 border-t text-sm font-medium text-remax-red hover:underline"
          >
            View All Developers
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};

export default DevelopersDropdown;
