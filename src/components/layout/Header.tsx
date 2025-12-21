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
import BuyDropdown from "./BuyDropdown";
import NewProjectsDropdown from "./NewProjectsDropdown";
import ExploreDropdown from "./ExploreDropdown";
import MobileNavigationMenu from "./MobileNavigationMenu";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [headerLogo, setHeaderLogo] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const defaultLogo = "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets//REMAX%20WR%20Logo%20with%20no%20background.jpg";
    
    const loadLogo = async () => {
      try {
        // First try to get from siteImagesService
        const imgs = siteImagesService.getSiteImages();
        const logoUrl = imgs?.headerLogo || defaultLogo;
        setHeaderLogo(logoUrl);
      } catch (error) {
        // If service fails, use default logo
        console.error("Error loading logo from service:", error);
        setHeaderLogo(defaultLogo);
      }
    };
    
    loadLogo();
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
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container relative flex h-16 items-center justify-center lg:justify-between">
        {/* Logo, centered on mobile/tablet, left on desktop */}
        <Link
          href="/"
          className={cn(
            "flex items-center absolute left-1/2 -translate-x-1/2 lg:static lg:left-auto lg:translate-x-0",
            "h-16"
          )}
          style={{ width: "auto", maxWidth: "200px" }}
        >
          {!imgError && headerLogo ? (
            <Image
              src={headerLogo}
              alt="REMAX WR Logo"
              className="h-12 w-auto object-contain max-w-[180px]"
              width={180}
              height={48}
              draggable={false}
              onError={() => setImgError(true)}
              data-testid="header-logo"
              priority
            />
          ) : (
            <span className="text-lg font-bold text-remax-red whitespace-nowrap" data-testid="header-logo-fallback">
              RE/MAX Westside
            </span>
          )}
        </Link>

        {/* Desktop Navigation with Mega Menu */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="space-x-1">
            {/* About Us - Direct Link */}
            <NavigationMenuItem>
              <Link
                href="/about"
                className={cn(
                  "text-base font-semibold px-3 py-2 rounded-md transition-colors",
                  isActive("/about") 
                    ? "text-remax-red" 
                    : "text-gray-700 hover:text-remax-red hover:bg-gray-50"
                )}
              >
                About Us
              </Link>
            </NavigationMenuItem>

            {/* What We Do - Direct Link */}
            <NavigationMenuItem>
              <Link
                href="/services"
                className={cn(
                  "text-base font-semibold px-3 py-2 rounded-md transition-colors",
                  isActive("/services") || isActive("/what-we-do")
                    ? "text-remax-red" 
                    : "text-gray-700 hover:text-remax-red hover:bg-gray-50"
                )}
              >
                What We Do
              </Link>
            </NavigationMenuItem>

            {/* Buy - Priority 1 */}
            <BuyDropdown />

            {/* New Projects - Priority 2 */}
            <NewProjectsDropdown />

            {/* Explore - Priority 3 */}
            <ExploreDropdown />

            {/* Insights - Direct Link */}
            <NavigationMenuItem>
              <Link
                href="/blog"
                className={cn(
                  "text-base font-semibold px-3 py-2 rounded-md transition-colors",
                  isActive("/blog") || isActive("/insights")
                    ? "text-remax-red" 
                    : "text-gray-700 hover:text-remax-red hover:bg-gray-50"
                )}
              >
                Insights
              </Link>
            </NavigationMenuItem>

            {/* Contact - Direct Link */}
            <NavigationMenuItem>
              <Link
                href="/contact"
                className={cn(
                  "text-base font-semibold px-3 py-2 rounded-md transition-colors",
                  isActive("/contact")
                    ? "text-remax-red" 
                    : "text-gray-700 hover:text-remax-red hover:bg-gray-50"
                )}
              >
                Contact
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop Contact Button */}
        <div className="hidden lg:flex items-center">
          <Button
            className="bg-blue-700 hover:bg-blue-800 text-white rounded-full ml-2"
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
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-full"
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
