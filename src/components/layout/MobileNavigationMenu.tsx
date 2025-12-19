"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Home, TrendingUp, Building2, MapPin, Building, BarChart3, BookOpen, Info } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { navigationService, NavCity, NavMicroMarket, NavDeveloper } from "@/services/navigationService";
import { Badge } from "@/components/ui/badge";

interface MobileNavigationMenuProps {
  onNavigate: () => void;
  isActive: (href: string) => boolean;
}

const MobileNavigationMenu = ({ onNavigate, isActive }: MobileNavigationMenuProps) => {
  const [cities, setCities] = useState<NavCity[]>([]);
  const [microMarkets, setMicroMarkets] = useState<NavMicroMarket[]>([]);
  const [developers, setDevelopers] = useState<NavDeveloper[]>([]);
  const [listingCounts, setListingCounts] = useState<Record<string, number>>({});
  const [buyOpen, setBuyOpen] = useState(false);
  const [newProjectsOpen, setNewProjectsOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [citiesData, mmData, devsData] = await Promise.all([
        navigationService.getNavigationCities(),
        navigationService.getFeaturedMicroMarkets(),
        navigationService.getFeaturedDevelopers(),
      ]);
      setCities(citiesData);
      setMicroMarkets(mmData);
      setDevelopers(devsData);
      
      // Fetch listing counts
      const counts: Record<string, number> = {};
      for (const city of citiesData) {
        const count = await navigationService.getResaleListingsCount(city.url_slug);
        counts[city.url_slug] = count;
      }
      setListingCounts(counts);
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col space-y-2">
      {/* Home Link */}
      <Link
        href="/"
        onClick={onNavigate}
        className={cn(
          "text-lg font-medium transition-colors hover:text-remax-red py-2",
          isActive("/") ? "text-remax-red" : "text-muted-foreground"
        )}
      >
        Home
      </Link>

      {/* Buy Accordion - Priority 1 */}
      <Collapsible open={buyOpen} onOpenChange={setBuyOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-lg font-medium text-muted-foreground hover:text-remax-red py-2">
          <span>Buy</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              buyOpen && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-4 space-y-3 pt-2">
          {/* Resale Properties */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Home className="h-3 w-3 text-remax-red" />
              <span>Resale Properties</span>
            </div>
            <div className="space-y-1 pl-5">
              {cities.map((city) => (
                <Link
                  key={city.url_slug}
                  href={`/buy/${city.url_slug}`}
                  onClick={onNavigate}
                  className="flex items-center justify-between text-sm text-muted-foreground hover:text-remax-red py-1"
                >
                  <span>{city.city_name}</span>
                  {listingCounts[city.url_slug] > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {listingCounts[city.url_slug]}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          </div>
          {/* Investor Share */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <TrendingUp className="h-3 w-3 text-remax-red" />
              <span>Landowner/Investor Share</span>
            </div>
            <div className="space-y-1 pl-5">
              <Link
                href="/buy/investor-share"
                onClick={onNavigate}
                className="block text-sm text-muted-foreground hover:text-remax-red py-1"
              >
                Available Deals
              </Link>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* New Projects Accordion - Priority 2 */}
      <Collapsible open={newProjectsOpen} onOpenChange={setNewProjectsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-lg font-medium text-muted-foreground hover:text-remax-red py-2">
          <span>New Projects</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              newProjectsOpen && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-4 space-y-3 pt-2">
          <Link
            href="/projects"
            onClick={onNavigate}
            className="block text-sm font-medium text-remax-red hover:underline py-1"
          >
            All Projects
          </Link>
          <div className="space-y-1 pl-2">
            {cities.map((city) => (
              <Link
                key={city.url_slug}
                href={`/${city.url_slug}/projects`}
                onClick={onNavigate}
                className="block text-sm text-muted-foreground hover:text-remax-red py-1"
              >
                {city.city_name} Projects
              </Link>
            ))}
          </div>
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Building className="h-3 w-3 text-remax-red" />
              <span>By Developer</span>
            </div>
            <div className="space-y-1 pl-5">
              {developers.slice(0, 5).map((dev) => (
                <Link
                  key={dev.url_slug}
                  href={`/developers/${dev.url_slug}`}
                  onClick={onNavigate}
                  className="block text-sm text-muted-foreground hover:text-remax-red py-1"
                >
                  {dev.developer_name}
                </Link>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Explore Accordion - Priority 3 */}
      <Collapsible open={exploreOpen} onOpenChange={setExploreOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-lg font-medium text-muted-foreground hover:text-remax-red py-2">
          <span>Explore</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              exploreOpen && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-4 space-y-3 pt-2">
          {/* Micro-Markets */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <MapPin className="h-3 w-3 text-remax-red" />
              <span>Micro-Markets</span>
            </div>
            <Link
              href="/hyderabad/areas"
              onClick={onNavigate}
              className="block text-sm font-medium text-remax-red hover:underline mb-2 pl-5"
            >
              Hyderabad Areas
            </Link>
            <div className="space-y-1 pl-5">
              {microMarkets.slice(0, 4).map((mm) => (
                <Link
                  key={mm.url_slug}
                  href={`/${mm.city_slug}/${mm.url_slug}`}
                  onClick={onNavigate}
                  className="block text-sm text-muted-foreground hover:text-remax-red py-1"
                >
                  {mm.name}
                </Link>
              ))}
            </div>
          </div>
          {/* Developers */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Building className="h-3 w-3 text-remax-red" />
              <span>Developers</span>
            </div>
            <Link
              href="/developers"
              onClick={onNavigate}
              className="block text-sm font-medium text-remax-red hover:underline mb-2 pl-5"
            >
              All Developers
            </Link>
            <div className="space-y-1 pl-5">
              {developers.slice(0, 4).map((dev) => (
                <Link
                  key={dev.url_slug}
                  href={`/developers/${dev.url_slug}`}
                  onClick={onNavigate}
                  className="block text-sm text-muted-foreground hover:text-remax-red py-1"
                >
                  {dev.developer_name}
                </Link>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Insights Accordion - Priority 4 */}
      <Collapsible open={insightsOpen} onOpenChange={setInsightsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-lg font-medium text-muted-foreground hover:text-remax-red py-2">
          <span>Insights</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              insightsOpen && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-4 space-y-1 pt-2">
          <Link
            href="/insights"
            onClick={onNavigate}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-remax-red py-1"
          >
            <BarChart3 className="h-3 w-3" />
            <span>Market Insights</span>
          </Link>
          <Link
            href="/blog"
            onClick={onNavigate}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-remax-red py-1"
          >
            <BookOpen className="h-3 w-3" />
            <span>Blog</span>
          </Link>
          <Link
            href="/about"
            onClick={onNavigate}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-remax-red py-1"
          >
            <Info className="h-3 w-3" />
            <span>About Us</span>
          </Link>
        </CollapsibleContent>
      </Collapsible>

      {/* Contact Link */}
      <Link
        href="/contact"
        onClick={onNavigate}
        className={cn(
          "text-lg font-medium transition-colors hover:text-remax-red py-2",
          isActive("/contact") ? "text-remax-red" : "text-muted-foreground"
        )}
      >
        Contact
      </Link>
    </div>
  );
};

export default MobileNavigationMenu;
