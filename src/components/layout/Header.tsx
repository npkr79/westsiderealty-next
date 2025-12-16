"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Menu, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteImagesService } from "@/services/adminService";
import MegaMenuProperties from "./MegaMenuProperties";
import DevelopersDropdown from "./DevelopersDropdown";
import MobileNavigationMenu from "./MobileNavigationMenu";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [headerLogo, setHeaderLogo] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const imgs = siteImagesService.getSiteImages();

    if (
      imgs.headerLogo &&
      imgs.headerLogo !== "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets//REMAX%20WR%20Logo%20with%20no%20background.jpg"
    ) {
      const defaults = siteImagesService.forceResetToDefaultImages();
      setHeaderLogo(defaults.headerLogo);
    } else {
      setHeaderLogo(imgs.headerLogo || "");
    }
  }, []);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const handleContactClick = () => {
    router.push("/contact");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container relative flex h-16 items-center justify-center lg:justify-between">
        {/* Logo, centered on mobile/tablet, left on desktop */}
        <Link
          href="/"
          className={cn(
            "flex items-end absolute left-1/2 -translate-x-1/2 lg:static lg:left-auto lg:translate-x-0",
            "h-16"
          )}
          style={{ width: "auto" }}
        >
          {!imgError && headerLogo ? (
            <Image
              src={headerLogo || "/placeholder.svg"}
              alt="REMAX WR Logo"
              className="h-16 w-96 object-contain"
              width={384}
              height={64}
              draggable={false}
              onError={() => setImgError(true)}
              data-testid="header-logo"
              priority
            />
          ) : (
            <span data-testid="header-logo-fallback" />
          )}
        </Link>

        {/* Desktop Navigation with Mega Menu */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="space-x-1">
            {/* Home */}
            <NavigationMenuItem>
              <Link href="/">
                <NavigationMenuLink
                  className={cn(
                    "text-base font-semibold px-4 py-2 rounded-md transition-colors hover:text-remax-red",
                    isActive("/") ? "text-remax-red" : "text-muted-foreground"
                  )}
                >
                  Home
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            {/* About Us */}
            <NavigationMenuItem>
              <Link href="/about">
                <NavigationMenuLink
                  className={cn(
                    "text-base font-semibold px-4 py-2 rounded-md transition-colors hover:text-remax-red",
                    isActive("/about") ? "text-remax-red" : "text-muted-foreground"
                  )}
                >
                  About Us
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            {/* What We Do */}
            <NavigationMenuItem>
              <Link href="/services">
                <NavigationMenuLink
                  className={cn(
                    "text-base font-semibold px-4 py-2 rounded-md transition-colors hover:text-remax-red",
                    isActive("/services") ? "text-remax-red" : "text-muted-foreground"
                  )}
                >
                  What We Do
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            {/* Properties Mega Menu */}
            <MegaMenuProperties />

            {/* Developers Dropdown */}
            <DevelopersDropdown />

            {/* Market Insights */}
            <NavigationMenuItem>
              <Link href="/blog">
                <NavigationMenuLink
                  className={cn(
                    "text-base font-semibold px-4 py-2 rounded-md transition-colors hover:text-remax-red",
                    isActive("/blog") ? "text-remax-red" : "text-muted-foreground"
                  )}
                >
                  Market Insights
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop Contact Button */}
        <div className="hidden lg:flex items-center">
          <Button
            className="bg-remax-red hover:bg-remax-red/90 ml-2"
            size="lg"
            onClick={handleContactClick}
          >
            <Phone className="h-4 w-4 mr-2" />
            Talk to Our Team
          </Button>
        </div>

        {/* Mobile/tablet hamburger menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2"
              aria-label="Open Menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 overflow-y-auto">
            <div className="flex flex-col mt-8">
              <MobileNavigationMenu
                onNavigate={() => setIsOpen(false)}
                isActive={isActive}
              />
              <div className="border-t pt-4 mt-4">
                <Button
                  className="w-full bg-remax-red hover:bg-remax-red/90"
                  size="lg"
                  onClick={() => {
                    setIsOpen(false);
                    handleContactClick();
                  }}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Talk to Our Team
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
