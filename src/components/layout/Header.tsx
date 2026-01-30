"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  const intelligenceLinks = [
    {
      label: "Hyderabad Residential Intelligence",
      subtext: "Unified city residential model",
      href: "/residential-intelligence",
    },
    {
      label: "Apartment Intelligence",
      subtext: "Vertical residential systems",
      href: "/apartment-intelligence",
    },
    {
      label: "Villa Intelligence",
      subtext: "Horizontal residential ecosystems",
      href: "/villa-intelligence",
    },
  ];

  const comingSoon = ["Commercial Intelligence", "Plot & Land Intelligence"];

  const rightLinks = [
    { label: "About Westside", href: "/about-westside" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-gradient-to-r from-slate-950/95 via-slate-900/90 to-slate-950/95 backdrop-blur">
      <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-6">
        <Link href="/intelligence-home" className="group inline-flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-[0.45em] text-slate-300">
            WESTSIDE
          </span>
          <span className="text-[10px] uppercase tracking-[0.28em] text-slate-500 group-hover:text-slate-400">
            Residential Intelligence
          </span>
        </Link>

        <nav className="hidden items-center lg:flex">
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-semibold tracking-[0.16em] text-slate-200 transition-colors hover:text-white"
              aria-haspopup="true"
              aria-expanded="false"
            >
              Intelligence
              <span className="text-xs text-slate-400">▾</span>
            </button>
            <div className="pointer-events-none absolute left-1/2 top-10 z-50 w-80 -translate-x-1/2 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
              <div className="rounded-[20px] border border-white/10 bg-slate-950/95 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.45)] backdrop-blur">
                <div className="space-y-3">
                  <Link
                    href={intelligenceLinks[0].href}
                    className={cn(
                      "block text-[13px] font-semibold uppercase tracking-[0.18em] text-white",
                      isActive(intelligenceLinks[0].href) && "text-slate-100"
                    )}
                  >
                    {intelligenceLinks[0].label}
                    <span className="mt-2 block text-[11px] font-normal uppercase tracking-[0.22em] text-slate-300">
                      {intelligenceLinks[0].subtext}
                    </span>
                  </Link>
                </div>
                <div className="my-4 border-t border-white/10" />
                <div className="space-y-3">
                  {intelligenceLinks.slice(1).map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "block text-sm font-semibold text-slate-200 transition-colors hover:text-white",
                        isActive(link.href) && "text-white"
                      )}
                    >
                      {link.label}
                      <span className="mt-1 block text-xs font-normal text-slate-500">
                        {link.subtext}
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="my-4 border-t border-white/10" />
                <div className="space-y-2 text-xs uppercase tracking-[0.2em] text-slate-600">
                  {comingSoon.map((label) => (
                    <div
                      key={label}
                      className="flex items-center justify-between text-slate-600/70"
                    >
                      <span className="text-[11px] uppercase tracking-[0.22em]">
                        {label}
                      </span>
                      <span className="text-[10px] tracking-[0.2em] text-slate-600/70">
                        Soon
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-end gap-3">
          <nav className="hidden items-center gap-5 lg:flex">
            {rightLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium tracking-[0.08em] text-slate-300 transition-colors hover:text-white",
                  isActive(link.href) && "text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
            <span
              aria-disabled="true"
              className="flex items-center gap-2 text-sm font-medium tracking-[0.08em] text-slate-500"
            >
              Research
              <span className="rounded-full border border-slate-600/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Soon
              </span>
            </span>
          </nav>

          {isMounted ? (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-slate-200 hover:text-white"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-80 border-l border-slate-800 bg-slate-950 text-white"
              >
                <SheetTitle className="sr-only">Main navigation</SheetTitle>
                <div className="mt-10 flex flex-col gap-6">
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
                      Intelligence Systems
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Link
                          href={intelligenceLinks[0].href}
                          className={cn(
                            "block text-sm font-semibold uppercase tracking-[0.18em] text-white",
                            isActive(intelligenceLinks[0].href) && "text-slate-100"
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          {intelligenceLinks[0].label}
                        </Link>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                          {intelligenceLinks[0].subtext}
                        </p>
                      </div>
                      <div className="border-t border-slate-800/80 pt-4">
                        {intelligenceLinks.slice(1).map((link) => (
                          <div key={link.href} className="mb-4 last:mb-0">
                            <Link
                              href={link.href}
                              className={cn(
                                "block text-base font-semibold text-slate-200 transition-colors hover:text-white",
                                isActive(link.href) && "text-white"
                              )}
                              onClick={() => setIsOpen(false)}
                            >
                              {link.label}
                            </Link>
                            <p className="mt-1 text-xs text-slate-500">{link.subtext}</p>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-slate-800/80 pt-4 text-xs uppercase tracking-[0.2em] text-slate-600">
                        {comingSoon.map((label) => (
                          <div
                            key={label}
                            className="mb-3 flex items-center justify-between text-slate-600/70 last:mb-0"
                          >
                            <span className="text-[11px] uppercase tracking-[0.22em]">
                              {label}
                            </span>
                            <span className="text-[10px] tracking-[0.2em] text-slate-600/70">
                              Soon
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 border-t border-slate-800/80 pt-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
                      Platform
                    </p>
                    {rightLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "block text-base font-semibold text-slate-200 transition-colors hover:text-white",
                          isActive(link.href) && "text-white"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      Research
                      <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                        Soon
                      </span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Header;
