"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteImagesService } from "@/services/admin/siteImagesService";
const navLinks = [
  { label: "About Us", href: "/about" },
  { label: "What We Do", href: "/services" },
  {
    label: "Buy",
    href: "/hyderabad/properties",
    children: [
      { label: "Hyderabad Resale Properties", href: "/hyderabad/properties" },
      { label: "Landowner/Investor Share", href: "/hyderabad/landowner-investor-share-flats" },
    ],
  },
  {
    label: "New Projects",
    href: "/projects",
    children: [
      { label: "View All Projects", href: "/projects" },
      { label: "Hyderabad Projects", href: "/projects?city=hyderabad" },
      { label: "Goa Projects", href: "/projects?city=goa" },
      { label: "Dubai Projects", href: "/projects?city=dubai" },
    ],
  },
  {
    label: "Explore",
    href: "/hyderabad",
    children: [
      { label: "Hyderabad", href: "/hyderabad" },
      { label: "Goa", href: "/goa" },
      { label: "Dubai", href: "/dubai" },
      { label: "Hyderabad Areas", href: "/hyderabad/areas" },
      { label: "All Developers", href: "/developers" },
    ],
  },
  { label: "Insights", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [headerLogo, setHeaderLogo] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    const defaultLogo =
      "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets//REMAX%20WR%20Logo%20with%20no%20background.jpg";

    const loadLogo = async () => {
      try {
        const imgs = siteImagesService.getSiteImages();
        const logoUrl = imgs?.headerLogo || defaultLogo;
        setHeaderLogo(logoUrl);
      } catch (error) {
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

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="container relative flex h-16 items-center justify-center lg:justify-between">
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
            <span
              className="text-lg font-bold text-remax-red whitespace-nowrap"
              data-testid="header-logo-fallback"
            >
              RE/MAX Westside
            </span>
          )}
        </Link>

        {isMounted ? (
          <nav className="hidden lg:flex">
            <ul className="flex items-center space-x-1">
              {navLinks.map((link) => (
                <li
                  key={link.href}
                  className={cn(link.children?.length ? "has-dropdown nav-item" : "nav-item")}
                >
                  {link.children?.length ? (
                    <>
                      <span
                        className={cn(
                          "nav-link text-base font-semibold px-3 py-2 rounded-md transition-colors",
                          isActive(link.href)
                            ? "text-remax-red"
                            : "text-gray-700 hover:text-remax-red hover:bg-gray-50"
                        )}
                      >
                        {link.label}
                      </span>
                      <ul className="dropdown">
                        {link.children.map((child) => (
                          <li key={child.href}>
                            <Link href={child.href}>{child.label}</Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <Link
                      href={link.href}
                      className={cn(
                        "nav-link text-base font-semibold px-3 py-2 rounded-md transition-colors",
                        isActive(link.href)
                          ? "text-remax-red"
                          : "text-gray-700 hover:text-remax-red hover:bg-gray-50"
                      )}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="hidden lg:flex items-center gap-2">
          <Button
            className="rounded-full bg-[#003DA5] text-white hover:bg-[#00338a]"
            size="lg"
            variant="outline"
            asChild
          >
            <Link href="/join_us">Partner With Us</Link>
          </Button>
        </div>

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
            <div className="flex flex-col mt-8 space-y-2">
              {navLinks.map((link) => (
                <div key={link.href} className="space-y-2">
                  <Link
                    href={link.href}
                    className={cn(
                      "text-lg font-medium transition-colors hover:text-remax-red py-2",
                      isActive(link.href) ? "text-remax-red" : "text-muted-foreground"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                  {link.children?.length ? (
                    <div className="flex flex-col space-y-1 pl-4">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="text-sm text-muted-foreground hover:text-remax-red"
                          onClick={() => setIsOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              <div className="border-t pt-4 mt-4 space-y-2">
                <Button
                  className="w-full rounded-full bg-[#003DA5] text-white hover:bg-[#00338a]"
                  size="lg"
                  variant="outline"
                  asChild
                  onClick={() => setIsOpen(false)}
                >
                  <Link href="/join_us">Partner With Us</Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        </div>
      </header>
      <style jsx global>{`
        .has-dropdown {
          position: relative;
        }
        .dropdown {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          background: #0b1220;
          min-width: 220px;
          border-radius: 8px;
          padding: 8px 0;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          z-index: 1000;
        }
        .dropdown li {
          padding: 0;
        }
        .dropdown a {
          display: block;
          padding: 10px 16px;
          color: #ffffff;
          text-decoration: none;
          font-size: 14px;
        }
        .dropdown a:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .has-dropdown:hover .dropdown {
          display: block;
        }
      `}</style>
    </>
  );
};

export default Header;
