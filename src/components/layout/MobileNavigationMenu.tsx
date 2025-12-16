"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, MapPin, Building2, Building } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { navigationService, NavCity, NavMicroMarket, NavDeveloper } from "@/services/navigationService";

interface MobileNavigationMenuProps {
  onNavigate: () => void;
  isActive: (href: string) => boolean;
}

const MobileNavigationMenu = ({ onNavigate, isActive }: MobileNavigationMenuProps) => {
  const [cities, setCities] = useState<NavCity[]>([]);
  const [microMarkets, setMicroMarkets] = useState<NavMicroMarket[]>([]);
  const [developers, setDevelopers] = useState<NavDeveloper[]>([]);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [developersOpen, setDevelopersOpen] = useState(false);

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
    };
    fetchData();
  }, []);

  const simpleLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "What We Do", href: "/services" },
    { name: "Market Insights", href: "/blog" },
    { name: "Contact", href: "/contact" },
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

      {/* About Us Link */}
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

      {/* What We Do Link */}
      <Link
        href="/services"
        onClick={onNavigate}
        className={cn(
          "text-lg font-medium transition-colors hover:text-remax-red py-2",
          isActive("/services") ? "text-remax-red" : "text-muted-foreground"
        )}
      >
        What We Do
      </Link>

      {/* Properties Accordion */}
      <Collapsible open={propertiesOpen} onOpenChange={setPropertiesOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-lg font-medium text-muted-foreground hover:text-remax-red py-2">
          <span>Properties</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              propertiesOpen && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-4 space-y-3 pt-2">
          {/* Cities */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <MapPin className="h-3 w-3 text-remax-red" />
              <span>Cities</span>
            </div>
            <div className="space-y-1 pl-5">
              {cities.map((city) => (
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

          {/* Popular Areas */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Building2 className="h-3 w-3 text-remax-red" />
              <span>Popular Areas</span>
            </div>
            <div className="space-y-1 pl-5">
              {microMarkets.map((mm) => (
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

          {/* View All */}
          <Link
            href="/properties"
            onClick={onNavigate}
            className="block text-sm font-medium text-remax-red hover:underline pt-2"
          >
            View All Properties →
          </Link>
        </CollapsibleContent>
      </Collapsible>

      {/* Developers Accordion */}
      <Collapsible open={developersOpen} onOpenChange={setDevelopersOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-lg font-medium text-muted-foreground hover:text-remax-red py-2">
          <span>Developers</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              developersOpen && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-4 space-y-1 pt-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <Building className="h-3 w-3 text-remax-red" />
            <span>Top Developers</span>
          </div>
          <div className="space-y-1 pl-5">
            {developers.map((dev) => (
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
          <Link
            href="/developers"
            onClick={onNavigate}
            className="block text-sm font-medium text-remax-red hover:underline pt-2"
          >
            View All Developers →
          </Link>
        </CollapsibleContent>
      </Collapsible>

      {/* Market Insights Link */}
      <Link
        href="/blog"
        onClick={onNavigate}
        className={cn(
          "text-lg font-medium transition-colors hover:text-remax-red py-2",
          isActive("/blog") ? "text-remax-red" : "text-muted-foreground"
        )}
      >
        Market Insights
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
