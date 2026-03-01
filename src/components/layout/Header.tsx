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
const primaryNavLinks = [
  {
    label: "Invest",
    href: "/investor-dashboard",
    dropdown: {
      title: "Institutional Opportunities",
      sections: [
        {
          label: "Institutional Opportunities",
          href: "/investor-dashboard",
          highlight: "Institutional deals",
        },
        { label: "Early Alpha", href: "/projects?signal=early-alpha", highlight: "Early alpha" },
        { label: "Core Allocation", href: "/projects?allocation=core" },
        { label: "Tactical Allocation", href: "/projects?allocation=tactical" },
      ],
      geographies: [
        { label: "Hyderabad", href: "/projects?city=hyderabad" },
        {
          label: "Goa",
          href: "/contact?intent=goa-investor-interest",
          comingSoon: true,
          tooltip: "Data layer launching soon",
        },
      ],
    },
  },
  {
    label: "Markets",
    href: "/hyderabad/micro-markets",
    dropdown: {
      title: "Market Intelligence",
      sections: [
        { label: "Hyderabad Corridors", href: "/hyderabad/micro-markets" },
        { label: "Capital Flow", href: "/investor-dashboard" },
        { label: "Wealth Zones", href: "/hyderabad/micro-markets?focus=wealth-zones" },
        { label: "Emerging Areas", href: "/hyderabad/micro-markets?focus=emerging-areas" },
        { label: "Corridor Rankings", href: "/hyderabad/micro-markets?focus=rankings" },
      ],
      geographies: [
        { label: "Hyderabad", href: "/hyderabad/micro-markets" },
        {
          label: "Goa",
          href: "/contact?intent=goa-market-intelligence-waitlist",
          comingSoon: true,
          tooltip: "Data layer launching soon",
        },
      ],
    },
  },
  {
    label: "Developers",
    href: "/developers",
    dropdown: {
      title: "Developer Underwriting",
      sections: [
        { label: "Institutional Developers", href: "/developers" },
        { label: "Emerging Sponsors", href: "/developers?segment=emerging" },
        { label: "Execution Rankings", href: "/developers?view=execution-rankings" },
        { label: "Capital Strategy", href: "/developers?view=capital-strategy" },
        { label: "Developer Intelligence", href: "/developers?view=intelligence" },
      ],
      geographies: [],
    },
  },
  {
    label: "Opportunities",
    href: "/projects",
    dropdown: {
      title: "Exclusive Deal Flow",
      sections: [
        { label: "New Launches", href: "/projects?stage=new-launches" },
        { label: "Off-market", href: "/projects?channel=off-market", highlight: "Exclusive" },
        { label: "Structured Deals", href: "/projects?deal=structured", highlight: "Institutional deals" },
        { label: "Land and JVs", href: "/projects?deal=land-jv" },
        { label: "Investor Club", href: "/investor-dashboard", highlight: "Members only" },
      ],
      geographies: [],
    },
  },
  {
    label: "Research",
    href: "/investor-research",
    dropdown: {
      title: "Institutional Research",
      sections: [
        { label: "Market Reports", href: "/investor-research?section=market-reports" },
        { label: "Corridor Outlook", href: "/investor-research?section=corridor-outlook" },
        { label: "Capital Trends", href: "/investor-research?section=capital-trends" },
        { label: "Sponsor Intelligence", href: "/investor-research?section=sponsor-intelligence" },
        { label: "Whitepapers", href: "/investor-research?section=whitepapers", highlight: "Institutional" },
      ],
      geographies: [],
    },
  },
] as const;

const rightNavLinks = [
  { label: "Insights", href: "/blog" },
  { label: "Contact", href: "/contact" },
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
  const mobilePrimaryLabels = new Set(["Invest", "Markets", "Developers", "Opportunities"]);
  const mobilePrimaryLinks = primaryNavLinks.filter((link) => mobilePrimaryLabels.has(link.label));
  const mobileSecondaryLinks = [
    { label: "Research", href: "/investor-research" },
    ...rightNavLinks,
  ];

  return (
    <>
      <header className="audit-hide-in-audit-mode sticky top-0 z-50 w-full border-b border-white/10 bg-gradient-to-b from-[#060f1f]/95 via-[#081429]/95 to-[#071325]/95 shadow-[0_12px_30px_rgba(2,6,23,0.45)] backdrop-blur-md">
        <div className="container relative flex h-16 items-center justify-between">
        <Link
          href="/"
          className={cn(
            "flex items-center",
            "h-16"
          )}
          style={{ width: "auto", maxWidth: "200px" }}
        >
          {!imgError && headerLogo ? (
            <Image
              src={headerLogo}
              alt="Westside Realty Intelligence"
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
              className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-100 whitespace-nowrap"
              data-testid="header-logo-fallback"
            >
              Westside Intelligence
            </span>
          )}
        </Link>

        {isMounted ? (
          <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2">
            <ul className="flex items-center gap-1">
              {primaryNavLinks.map((link) => (
                <li key={link.href} className={cn(link.dropdown ? "relative group" : undefined)}>
                  <Link
                    href={link.href}
                    className={cn(
                      "rounded-md px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] transition-all duration-300",
                      isActive(link.href)
                        ? "text-white bg-white/10"
                        : "text-slate-300 hover:-translate-y-0.5 hover:text-white hover:bg-white/8 hover:shadow-[0_8px_20px_rgba(15,23,42,0.45)]"
                    )}
                  >
                    {link.label}
                  </Link>
                  {link.dropdown ? (
                    <div className="invisible absolute left-0 top-[calc(100%+10px)] z-50 w-[360px] rounded-2xl border border-white/10 bg-gradient-to-br from-[#050f20]/95 via-[#0a1930]/95 to-[#091427]/95 p-4 opacity-0 shadow-[0_24px_50px_rgba(2,6,23,0.6)] backdrop-blur-md transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 -translate-y-1">
                      <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                        {link.dropdown.title}
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {link.dropdown.sections.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.1] hover:shadow-[0_12px_28px_rgba(15,23,42,0.5)]"
                          >
                            <span>{item.label}</span>
                            {item.highlight ? (
                              <span
                                className={cn(
                                  "rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]",
                                  item.highlight.toLowerCase().includes("early")
                                    ? "border-cyan-300/40 bg-cyan-400/20 text-cyan-100"
                                    : item.highlight.toLowerCase().includes("exclusive") ||
                                        item.highlight.toLowerCase().includes("members")
                                      ? "border-violet-300/40 bg-violet-400/20 text-violet-100"
                                    : "border-emerald-300/40 bg-emerald-400/20 text-emerald-100"
                                )}
                              >
                                {item.highlight}
                              </span>
                            ) : null}
                          </Link>
                        ))}
                      </div>
                      {link.dropdown.geographies.length > 0 ? (
                        <div className="mt-3 border-t border-white/10 pt-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Geographies</p>
                          <div className="mt-2 flex gap-2">
                            {link.dropdown.geographies.map((geo) => (
                              <Link
                                key={geo.label}
                                href={geo.href}
                                title={geo.tooltip}
                                className={cn(
                                  "rounded-full border px-3 py-1 text-[11px] font-medium transition-all duration-300",
                                  geo.comingSoon
                                    ? "border-slate-400/30 bg-slate-500/10 text-slate-300 hover:-translate-y-0.5 hover:border-slate-300/40 hover:bg-slate-400/15 hover:text-slate-100"
                                    : "border-white/15 text-slate-200 hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/12 hover:text-white"
                                )}
                              >
                                {geo.label}
                                {geo.comingSoon ? (
                                  <span className="ml-1.5 rounded-full border border-slate-300/30 bg-slate-400/15 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] text-slate-300">
                                    Coming Soon
                                  </span>
                                ) : null}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="hidden lg:flex items-center gap-1.5">
          {rightNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-[11px] font-medium uppercase tracking-[0.14em] transition-all duration-300",
                isActive(link.href)
                  ? "text-white bg-white/10"
                  : "text-slate-300 hover:-translate-y-0.5 hover:text-white hover:bg-white/8"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Button
            className="rounded-full border border-cyan-300/30 bg-cyan-400/20 text-cyan-100 shadow-[0_10px_24px_rgba(34,211,238,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-300/25"
            size="sm"
            variant="outline"
            asChild
          >
            <Link href="/join_us">Partner With Us</Link>
          </Button>
        </div>

        {isMounted ? (
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
            <SheetContent side="right" className="w-80 border-l-white/10 bg-gradient-to-b from-[#060f1f] via-[#081429] to-[#071325] p-0 text-white">
              <SheetTitle className="sr-only">Main navigation</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="mt-8 flex-1 overflow-y-auto px-4 pb-6">
                  <p className="px-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">Primary</p>
                  <div className="mt-2 space-y-2">
                    {mobilePrimaryLinks.map((link) => {
                      const isExpanded = expandedMobileSection === link.label;
                      return (
                        <div key={link.href} className="rounded-lg border border-white/10 bg-white/[0.03] shadow-[0_10px_22px_rgba(15,23,42,0.32)]">
                          <button
                            type="button"
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold uppercase tracking-[0.14em] transition-all duration-300",
                              isActive(link.href)
                                ? "bg-white/10 text-white"
                                : "text-slate-300 hover:bg-white/8 hover:text-white"
                            )}
                            onClick={() =>
                              setExpandedMobileSection((prev) =>
                                prev === link.label ? null : link.label
                              )
                            }
                          >
                            <span>{link.label}</span>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                isExpanded ? "rotate-180" : "rotate-0"
                              )}
                            />
                          </button>
                          {link.dropdown && isExpanded ? (
                            <div className="px-2 pb-2">
                              <div className="space-y-1">
                                {link.dropdown.sections.map((item) => (
                                  <Link
                                    key={item.label}
                                    href={item.href}
                                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-slate-300 transition-all duration-300 hover:bg-white/10 hover:text-white"
                                    onClick={() => setIsOpen(false)}
                                  >
                                    <span>{item.label}</span>
                                    {item.highlight ? (
                                      <span
                                        className={cn(
                                          "rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]",
                                          item.highlight.toLowerCase().includes("early")
                                            ? "border-cyan-300/40 bg-cyan-400/20 text-cyan-100"
                                            : item.highlight.toLowerCase().includes("exclusive") ||
                                                item.highlight.toLowerCase().includes("members")
                                              ? "border-violet-300/40 bg-violet-400/20 text-violet-100"
                                            : "border-emerald-300/40 bg-emerald-400/20 text-emerald-100"
                                        )}
                                      >
                                        {item.highlight}
                                      </span>
                                    ) : null}
                                  </Link>
                                ))}
                              </div>
                              {link.dropdown.geographies.length > 0 ? (
                                <div className="mt-2 border-t border-white/10 pt-2">
                                  <div className="flex flex-wrap gap-1.5 px-1">
                                    {link.dropdown.geographies.map((geo) => (
                                      <Link
                                        key={geo.label}
                                        href={geo.href}
                                        title={geo.tooltip}
                                        className={cn(
                                          "rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                                          geo.comingSoon
                                            ? "border-slate-400/30 bg-slate-500/10 text-slate-300 hover:bg-slate-400/20 hover:text-slate-100"
                                            : "border-white/15 text-slate-300 hover:bg-white/10 hover:text-white"
                                        )}
                                        onClick={() => setIsOpen(false)}
                                      >
                                        {geo.label}
                                        {geo.comingSoon ? " (Coming Soon)" : ""}
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 border-t border-white/10 pt-3">
                    <p className="px-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      Secondary
                    </p>
                    <div className="mt-2 space-y-1">
                      {mobileSecondaryLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                            "block rounded-md px-2 py-2 text-sm font-medium transition-all duration-300",
                            isActive(link.href)
                              ? "text-white bg-white/10"
                              : "text-slate-300 hover:bg-white/8 hover:text-white"
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 bg-[#060f1f]/95 p-4 shadow-[0_-10px_30px_rgba(2,6,23,0.45)]">
                  <Button
                    className="w-full rounded-full border border-cyan-300/30 bg-cyan-400/20 text-cyan-100 shadow-[0_10px_24px_rgba(34,211,238,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-300/25"
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
        ) : null}
        </div>
      </header>
    </>
  );
};

export default Header;
