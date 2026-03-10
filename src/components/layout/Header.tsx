"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChevronDown, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteImagesService } from "@/services/admin/siteImagesService";

function badgeClass(badge: string) {
  if (badge === "HOT") return "bg-red-500/20 text-red-300 border border-red-400/30";
  if (badge === "NEW") return "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30";
  if (badge === "LIVE") return "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30";
  if (badge === "AI") return "bg-violet-500/20 text-violet-300 border border-violet-400/30";
  return "bg-white/10 text-white/70 border border-white/20";
}

const NAV_ITEMS = [
  {
    label: "Markets",
    href: "/hyderabad/markets",
    description: "Live price intelligence across Hyderabad's fastest-growing corridors",
    links: [
      { label: "Gachibowli", href: "/hyderabad/gachibowli", badge: "HOT" },
      { label: "Financial District", href: "/hyderabad/financial-district", badge: "HOT" },
      { label: "Kokapet", href: "/hyderabad/kokapet", badge: "NEW" },
      { label: "Narsingi", href: "/hyderabad/narsingi" },
      { label: "Kondapur", href: "/hyderabad/kondapur" },
      { label: "Tellapur", href: "/hyderabad/tellapur" },
      { label: "Puppalaguda", href: "/hyderabad/puppalaguda" },
      { label: "Kollur", href: "/hyderabad/kollur" },
    ],
    cta: { label: "View all 19 markets →", href: "/hyderabad/markets" },
  },
  {
    label: "Projects",
    href: "/hyderabad/projects",
    description: "Every RERA-registered project with pricing, possession dates, and AI insights",
    links: [
      { label: "New Launches", href: "/hyderabad/projects?status=new", badge: "LIVE" },
      { label: "Under Construction", href: "/hyderabad/projects?status=construction" },
      { label: "Ready to Move", href: "/hyderabad/projects?status=ready" },
      { label: "Luxury ₹2Cr+", href: "/hyderabad/projects?budget=luxury" },
      { label: "Investment Picks", href: "/hyderabad/projects?tag=investment", badge: "AI" },
    ],
    cta: { label: "View all projects →", href: "/hyderabad/projects" },
  },
  {
    label: "Developers",
    href: "/developers",
    description: "Track record, delivery history, and buyer ratings for every major builder",
    links: [
      { label: "My Home Group", href: "/developers/my-home-group" },
      { label: "Aparna Group", href: "/developers/aparna-group" },
      { label: "Prestige Group", href: "/developers/prestige-group" },
      { label: "Rajapushpa Group", href: "/developers/rajapushpa-group" },
      { label: "Godrej Properties", href: "/developers/godrej-properties" },
    ],
    cta: { label: "View all developers →", href: "/developers" },
  },
  {
    label: "Insights",
    href: "/insights",
    description: "Market analysis, price trends, and buyer guides updated weekly",
    links: [
      { label: "Kokapet & Gandipet Villa Market", href: "/kokapet-gandipet-luxury-villas" },
      { label: "Price Tracker", href: "/insights/price-tracker", badge: "LIVE" },
      { label: "Market Reports", href: "/insights/reports" },
      { label: "5-Year Outlook", href: "/insights/outlook", badge: "AI" },
      { label: "Buyer's Guide", href: "/insights/buyers-guide" },
      { label: "RERA Updates", href: "/insights/rera" },
    ],
    cta: { label: "View all insights →", href: "/insights" },
  },
] as const;

const TICKER_ITEMS = [
  { market: "Gachibowli", price: "₹12,400/sqft", change: "↑2.1%", up: true },
  { market: "Financial District", price: "₹13,800/sqft", change: "↑1.4%", up: true },
  { market: "Kokapet", price: "₹11,200/sqft", change: "↑3.2%", up: true },
  { market: "Narsingi", price: "₹9,800/sqft", change: "↓0.3%", up: false },
  { market: "Kondapur", price: "₹10,500/sqft", change: "↑0.8%", up: true },
  { market: "Tellapur", price: "₹8,900/sqft", change: "↑1.9%", up: true },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMobileSection, setExpandedMobileSection] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [headerLogo, setHeaderLogo] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    const defaultLogo = "/agency_logo.png";
    const loadLogo = async () => {
      try {
        const imgs = siteImagesService.getSiteImages();
        const logoUrl = imgs?.headerLogo || defaultLogo;
        setHeaderLogo(logoUrl);
      } catch {
        setHeaderLogo(defaultLogo);
      }
    };
    loadLogo();
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href.split("?")[0]);
  };

  return (
    <>
      <header className="audit-hide-in-audit-mode sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a0a0a]/95 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">

        {/* ── Main nav bar ───────────────────────────────────────── */}
        <div className="container relative flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center h-16" style={{ width: "auto", maxWidth: "200px" }}>
            {!imgError && headerLogo ? (
              <Image
                src={headerLogo}
                alt="Westside Realty Intelligence"
                className="w-auto object-contain"
                style={{ height: 40, width: "auto", display: "block" }}
                width={180}
                height={40}
                draggable={false}
                onError={() => setImgError(true)}
                data-testid="header-logo"
                priority
              />
            ) : (
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-100 whitespace-nowrap" data-testid="header-logo-fallback">
                Westside Intelligence
              </span>
            )}
          </Link>

          {/* Desktop nav — centered */}
          {isMounted && (
            <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2">
              <ul className="flex items-center gap-0.5">
                {NAV_ITEMS.map((item) => (
                  <li key={item.href} className="relative group">
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-1 rounded-md px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] transition-all duration-200",
                        isActive(item.href)
                          ? "text-white bg-white/10"
                          : "text-slate-300 hover:text-white hover:bg-white/8"
                      )}
                    >
                      {item.label}
                      <ChevronDown className="h-3 w-3 opacity-50 transition-transform duration-200 group-hover:rotate-180 group-hover:opacity-100" />
                    </Link>

                    {/* Mega menu */}
                    <div className="invisible absolute left-1/2 -translate-x-1/2 top-[calc(100%+6px)] z-50 w-[400px] rounded-2xl border border-white/10 bg-[#0d0d0d]/98 p-5 opacity-0 -translate-y-1 shadow-[0_24px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                      <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">{item.description}</p>

                      {/* 2-column link grid */}
                      <div className="grid grid-cols-2 gap-1 mb-4">
                        {item.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px] text-slate-300 hover:text-white hover:bg-white/8 transition-colors duration-150"
                          >
                            <span>{link.label}</span>
                            {"badge" in link && link.badge && (
                              <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide", badgeClass(link.badge))}>
                                {link.badge}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>

                      {/* CTA */}
                      <div className="border-t border-white/10 pt-3">
                        <Link
                          href={item.cta.href}
                          className="text-[12px] font-semibold transition-colors"
                          style={{ color: "#c8a96e" }}
                        >
                          {item.cta.label}
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-400">Live Data</span>
            </div>

            {/* Gold CTA */}
            <Link
              href="/contact"
              className="rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(200,169,110,0.4)]"
              style={{
                background: "linear-gradient(135deg, #c8a96e 0%, #a8843e 100%)",
                color: "#0a0a0a",
                boxShadow: "0 4px 14px rgba(200,169,110,0.25)",
              }}
            >
              Get Expert Advice
            </Link>
          </div>

          {/* Mobile hamburger */}
          {isMounted && (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-slate-200 hover:bg-white/10 hover:text-white"
                  aria-label="Open Menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 border-l-white/10 bg-[#0a0a0a] p-0 text-white">
                <SheetTitle className="sr-only">Main navigation</SheetTitle>
                <div className="flex h-full flex-col">
                  <div className="mt-8 flex-1 overflow-y-auto px-4 pb-6 space-y-2">
                    {NAV_ITEMS.map((item) => {
                      const isExpanded = expandedMobileSection === item.label;
                      return (
                        <div key={item.href} className="rounded-lg border border-white/10 bg-white/[0.03]">
                          <button
                            type="button"
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold uppercase tracking-[0.14em] transition-colors",
                              isActive(item.href) ? "bg-white/10 text-white" : "text-slate-300 hover:text-white"
                            )}
                            onClick={() => setExpandedMobileSection((prev) => prev === item.label ? null : item.label)}
                          >
                            <span>{item.label}</span>
                            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded ? "rotate-180" : "")} />
                          </button>
                          {isExpanded && (
                            <div className="px-2 pb-2 space-y-0.5">
                              {item.links.map((link) => (
                                <Link
                                  key={link.href}
                                  href={link.href}
                                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                                  onClick={() => setIsOpen(false)}
                                >
                                  <span>{link.label}</span>
                                  {"badge" in link && link.badge && (
                                    <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase", badgeClass(link.badge))}>
                                      {link.badge}
                                    </span>
                                  )}
                                </Link>
                              ))}
                              <Link
                                href={item.cta.href}
                                className="block px-2 py-2 text-[11px] font-semibold"
                                style={{ color: "#c8a96e" }}
                                onClick={() => setIsOpen(false)}
                              >
                                {item.cta.label}
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-white/10 bg-[#0a0a0a] p-4">
                    <Link
                      href="/contact"
                      className="block w-full rounded-full py-2.5 text-center text-sm font-bold uppercase tracking-[0.12em]"
                      style={{ background: "linear-gradient(135deg, #c8a96e, #a8843e)", color: "#0a0a0a" }}
                      onClick={() => setIsOpen(false)}
                    >
                      Get Expert Advice
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* ── Ticker strip ───────────────────────────────────────── */}
        <div className="w-full overflow-hidden border-t border-white/5" style={{ height: 28, background: "#070707" }}>
          <div className="flex items-center h-full px-2">
            <div className="flex gap-8 whitespace-nowrap" style={{ animation: "navTicker 40s linear infinite" }}>
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span key={i} className="inline-flex items-center gap-2 text-[11px]">
                  <span className="text-slate-500 font-medium">{item.market}</span>
                  <span className="text-slate-200 font-semibold">{item.price}</span>
                  <span className={item.up ? "text-emerald-400" : "text-red-400"}>{item.change}</span>
                  <span className="text-white/15 mx-1">·</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      <style>{`
        @keyframes navTicker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </>
  );
};

export default Header;
