"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Home, TrendingUp, Building2, MapPin, Building, ArrowRight } from "lucide-react";
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
      const [mmData, devsData] = await Promise.all([
        navigationService.getFeaturedMicroMarkets(),
        navigationService.getFeaturedDevelopers(),
      ]);
      setMicroMarkets(mmData);
      setDevelopers(devsData);
      
      // Only fetch listing count for Hyderabad
      const count = await navigationService.getResaleListingsCount("hyderabad");
      setListingCounts({ hyderabad: count });
    };
    fetchData();
  }, []);

  const allCities: NavCity[] = [
    { city_name: "Dubai", url_slug: "dubai" },
    { city_name: "Goa", url_slug: "goa" },
    { city_name: "Hyderabad", url_slug: "hyderabad" }
  ];

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

      {/* About Us - Direct Link */}
      <Link
        href="/about"
        onClick={onNavigate}
        className={cn(
          "text-lg font-medium transition-colors hover:text-remax-red py-2",
          isActive("/about") ? "text-remax-red" : "text-muted-foreground"
        )}
      >
        About Us
      </Link>

      {/* What We Do - Direct Link */}
      <Link
        href="/services"
        onClick={onNavigate}
        className={cn(
          "text-lg font-medium transition-colors hover:text-remax-red py-2",
          isActive("/services") || isActive("/what-we-do") ? "text-remax-red" : "text-muted-foreground"
        )}
      >
        What We Do
      </Link>

      {/* Buy Accordion */}
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
          {/* Resale Properties - Only Hyderabad */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Home className="h-3 w-3 text-remax-red" />
              <span>Resale Properties</span>
            </div>
            <div className="space-y-1 pl-5">
              <Link
                href="/hyderabad/properties"
                onClick={onNavigate}
                className="flex items-center justify-between text-sm text-muted-foreground hover:text-remax-red py-1"
              >
                <span>Hyderabad Resale Properties</span>
                {listingCounts.hyderabad > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {listingCounts.hyderabad} listings
                  </Badge>
                )}
              </Link>
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
                href="/hyderabad/landowner-investor-share-flats"
                onClick={onNavigate}
                className="block text-sm text-muted-foreground hover:text-remax-red py-1"
              >
                Available Deals
              </Link>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* New Projects Accordion */}
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
          {/* Projects by City */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Building2 className="h-3 w-3 text-remax-red" />
              <span>Projects by City</span>
            </div>
            <div className="space-y-1 pl-5">
              {allCities.map((city) => (
                <Link
                  key={city.url_slug}
                  href={`/${city.url_slug}`}
                  onClick={onNavigate}
                  className="block text-sm text-muted-foreground hover:text-remax-red py-1"
                >
                  {city.city_name} Projects
                </Link>
              ))}
            </div>
          </div>
          {/* Featured/Latest Projects */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <ArrowRight className="h-3 w-3 text-remax-red" />
              <span>Featured/Latest Projects</span>
            </div>
            <div className="space-y-1 pl-5">
              <Link
                href="/projects"
                onClick={onNavigate}
                className="block text-sm text-muted-foreground hover:text-remax-red py-1"
              >
                All Projects
              </Link>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Explore Accordion */}
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
          {/* By City */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <MapPin className="h-3 w-3 text-remax-red" />
              <span>By City</span>
            </div>
            <div className="space-y-1 pl-5">
              {allCities.map((city) => (
                <Link
                  key={city.url_slug}
                  href={`/${city.url_slug}`}
                  onClick={onNavigate}
                  className="block text-sm text-muted-foreground hover:text-remax-red py-1"
                >
                  {city.city_name}
                </Link>
              ))}
            </div>
          </div>
          {/* By Micro-Market */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <MapPin className="h-3 w-3 text-remax-red" />
              <span>By Micro-Market</span>
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
          {/* By Developer */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Building className="h-3 w-3 text-remax-red" />
              <span>By Developer</span>
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

      {/* Insights - Direct Link */}
      <Link
        href="/blog"
        onClick={onNavigate}
        className={cn(
          "text-lg font-medium transition-colors hover:text-remax-red py-2",
          isActive("/blog") || isActive("/insights") ? "text-remax-red" : "text-muted-foreground"
        )}
      >
        Insights
      </Link>

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
