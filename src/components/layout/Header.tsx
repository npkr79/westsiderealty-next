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
import type { NavMarketCity } from "@/lib/nav/getNavMarkets";

function badgeClass(badge: string) {
  if (badge === "HOT") return "bg-red-500/20 text-red-300 border border-red-400/30";
  if (badge === "NEW") return "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30";
  if (badge === "LIVE") return "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30";
  if (badge === "AI") return "bg-violet-500/20 text-violet-300 border border-violet-400/30";
  return "bg-white/10 text-white/70 border border-white/20";
}

type NavLink = { label: string; href: string; badge?: string };
type NavItem =
  | { label: string; href: string; isMegaMenu: true; cities: NavMarketCity[]; description?: never; links?: never; cta?: never }
  | { label: string; href: string; isMegaMenu?: never; description: string; links: NavLink[]; cta: { label: string; href: string } }
  | { label: string; href: string; isMegaMenu?: never; description?: never; links?: never; cta?: never };

const STATIC_NAV_ITEMS: NavItem[] = [
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
    label: "Portfolio",
    href: "/portfolio",
  },
  {
    label: "Opportunities",
    href: "/opportunities",
    description: "Curated redevelopment, JD, and land deals for builders, investors & family offices",
    links: [
      { label: "All Opportunities", href: "/opportunities", badge: "NEW" },
      { label: "Nepean Sea — Land + Development", href: "/opportunities/nepean-sea-mumbai-land-development", badge: "HOT" },
      { label: "Mazgaon Redevelopment", href: "/opportunities/mazgaon-mumbai-redevelopment" },
      { label: "All Mumbai Deals", href: "/opportunities?city=mumbai" },
      { label: "Have a project to monetise?", href: "https://wa.me/919502500068?text=Hi%2C%20I%20have%20a%20development%20opportunity%20to%20discuss" },
    ],
    cta: { label: "View all opportunities →", href: "/opportunities" },
  },
  {
    label: "Commercial",
    href: "/commercial-investments",
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
      { label: "Articles & Research", href: "/blog", badge: "NEW" },
    ],
    cta: { label: "View all insights →", href: "/insights" },
  },
];

interface TickerMarket {
  name: string;
  slug: string;
  pricePerSqft: number | null;
  maturity: string | null;
  entryTiming: string | null;
}

const KNOWN_CITY_SLUGS = new Set(["hyderabad", "goa"]);

const MATURITY_DOT: Record<string, string> = {
  Established: "#3b82f6",
  Growing: "#22c55e",
  Emerging: "#f59e0b",
  Peak: "#ef4444",
};

const ENTRY_BADGE: Record<string, { bg: string; color: string }> = {
  Optimal: { bg: "#dcfce7", color: "#15803d" },
  Good: { bg: "#dbeafe", color: "#1d4ed8" },
  Wait: { bg: "#fef3c7", color: "#92400e" },
  Late: { bg: "#fee2e2", color: "#991b1b" },
};

function getCityFromPathname(pathname: string): string {
  const first = pathname.split("/")[1] ?? "";
  return KNOWN_CITY_SLUGS.has(first) ? first : "hyderabad";
}

interface HeaderProps {
  navMarkets?: NavMarketCity[];
}

const Header = ({ navMarkets = [] }: HeaderProps) => {
  const marketsItem: NavItem = { label: "Markets", href: "#", isMegaMenu: true, cities: navMarkets };
  const NAV_ITEMS: NavItem[] = navMarkets.length > 0
    ? [marketsItem, ...STATIC_NAV_ITEMS]
    : STATIC_NAV_ITEMS;

  const [isOpen, setIsOpen] = useState(false);
  const [expandedMobileSection, setExpandedMobileSection] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [headerLogo, setHeaderLogo] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [tickerMarkets, setTickerMarkets] = useState<TickerMarket[]>([]);
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

  useEffect(() => {
    const citySlug = getCityFromPathname(pathname);
    fetch(`/api/ticker-markets?citySlug=${citySlug}`)
      .then((r) => r.json())
      .then((data: TickerMarket[]) => { if (Array.isArray(data) && data.length) setTickerMarkets(data); })
      .catch(() => {});
  }, [pathname]);

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
                      {(item.links || item.isMegaMenu) && (
                        <ChevronDown className="h-3 w-3 opacity-50 transition-transform duration-200 group-hover:rotate-180 group-hover:opacity-100" />
                      )}
                    </Link>

                    {/* Multi-city mega-menu */}
                    {item.isMegaMenu && item.cities.length > 0 && (() => {
                      const cols = Math.min(item.cities.length, 4);
                      const widthMap: Record<number, string> = { 1: "260px", 2: "520px", 3: "740px", 4: "940px" };
                      const gridCols: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };
                      return (
                        <div
                          className={`invisible absolute left-0 top-[calc(100%+6px)] z-50 rounded-2xl border border-white/10 bg-[#0d0d0d]/98 p-5 opacity-0 -translate-y-1 shadow-[0_24px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100`}
                          style={{ minWidth: widthMap[cols] }}
                        >
                          <div className={`grid ${gridCols[cols]} gap-x-6 gap-y-0 divide-x divide-white/8`}>
                            {item.cities.map((city) => (
                              <div key={city.citySlug} className="px-3 first:pl-0 last:pr-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-2">
                                  {city.citySlug.charAt(0).toUpperCase() + city.citySlug.slice(1)}
                                </p>
                                <ul className="space-y-0.5 mb-3">
                                  {city.markets.slice(0, 6).map((m) => (
                                    <li key={m.href}>
                                      <Link
                                        href={m.href}
                                        className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px] text-slate-300 hover:text-white hover:bg-white/8 transition-colors duration-150"
                                      >
                                        <span>{m.label}</span>
                                        {m.badge && (
                                          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide", badgeClass(m.badge))}>
                                            {m.badge}
                                          </span>
                                        )}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                                <Link
                                  href={city.href}
                                  className="block px-2 text-[11px] font-semibold transition-colors"
                                  style={{ color: "#c8a96e" }}
                                >
                                  {city.cta.label}
                                </Link>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Standard single-city dropdown */}
                    {item.links && (
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
                              {link.badge && (
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
                            href={item.cta!.href}
                            className="text-[12px] font-semibold transition-colors"
                            style={{ color: "#c8a96e" }}
                          >
                            {item.cta!.label}
                          </Link>
                        </div>
                      </div>
                    )}
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

                      // Multi-city mega-menu (mobile: expandable list of cities + their markets)
                      if (item.isMegaMenu) {
                        return (
                          <div key="markets-mega" className="rounded-lg border border-white/10 bg-white/[0.03]">
                            <button
                              type="button"
                              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold uppercase tracking-[0.14em] text-slate-300 hover:text-white transition-colors"
                              onClick={() => setExpandedMobileSection((prev) => prev === item.label ? null : item.label)}
                            >
                              <span>{item.label}</span>
                              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded ? "rotate-180" : "")} />
                            </button>
                            {isExpanded && (
                              <div className="px-2 pb-2 space-y-3">
                                {item.cities.map((city) => (
                                  <div key={city.citySlug}>
                                    <p className="px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                      {city.citySlug.charAt(0).toUpperCase() + city.citySlug.slice(1)}
                                    </p>
                                    {city.markets.slice(0, 6).map((m) => (
                                      <Link
                                        key={m.href}
                                        href={m.href}
                                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                                        onClick={() => setIsOpen(false)}
                                      >
                                        <span>{m.label}</span>
                                        {m.badge && (
                                          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase", badgeClass(m.badge))}>
                                            {m.badge}
                                          </span>
                                        )}
                                      </Link>
                                    ))}
                                    <Link
                                      href={city.href}
                                      className="block px-2 py-1.5 text-[11px] font-semibold"
                                      style={{ color: "#c8a96e" }}
                                      onClick={() => setIsOpen(false)}
                                    >
                                      {city.cta.label}
                                    </Link>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Direct link — no dropdown
                      if (!item.links) {
                        return (
                          <div key={item.href} className="rounded-lg border border-white/10 bg-white/[0.03]">
                            <Link
                              href={item.href}
                              className={cn(
                                "flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] transition-colors",
                                isActive(item.href) ? "bg-white/10 text-white" : "text-slate-300 hover:text-white"
                              )}
                              onClick={() => setIsOpen(false)}
                            >
                              {item.label}
                            </Link>
                          </div>
                        );
                      }

                      // Standard dropdown
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
                                  {link.badge && (
                                    <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase", badgeClass(link.badge))}>
                                      {link.badge}
                                    </span>
                                  )}
                                </Link>
                              ))}
                              <Link
                                href={item.cta!.href}
                                className="block px-2 py-2 text-[11px] font-semibold"
                                style={{ color: "#c8a96e" }}
                                onClick={() => setIsOpen(false)}
                              >
                                {item.cta!.label}
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
        {tickerMarkets.length > 0 && (
          <div className="w-full overflow-hidden border-t border-white/5" style={{ height: 28, background: "#070707" }}>
            <div className="flex items-center h-full px-2">
              <div className="flex gap-8 whitespace-nowrap" style={{ animation: "navTicker 40s linear infinite" }}>
                {[...tickerMarkets, ...tickerMarkets].map((m, i) => {
                  const dot = MATURITY_DOT[m.maturity ?? ""] ?? "#94a3b8";
                  const badge = m.entryTiming ? ENTRY_BADGE[m.entryTiming] : null;
                  return (
                    <span key={i} className="inline-flex items-center gap-2 text-[11px]">
                      <span className="rounded-full inline-block" style={{ width: 5, height: 5, background: dot, flexShrink: 0 }} />
                      <span className="text-slate-500 font-medium">{m.name}</span>
                      {m.pricePerSqft != null && (
                        <span className="text-slate-200 font-semibold">₹{m.pricePerSqft.toLocaleString("en-IN")}/sqft</span>
                      )}
                      {badge && m.entryTiming && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 100, background: badge.bg, color: badge.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {m.entryTiming}
                        </span>
                      )}
                      <span className="text-white/15 mx-1">·</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}
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
